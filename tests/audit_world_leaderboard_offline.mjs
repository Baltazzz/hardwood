#!/usr/bin/env node
// Garde-fou de non-régression dédié à la ROBUSTESSE des classements mondiaux (voir AGENDA.md
// AGD-59, point 5 -- "robustesse identique" au classement de défi entre amis). Ne dépend PAS des
// tables Supabase réelles (voir tests/audit_world_leaderboard_live.mjs pour la vérification de
// bout en bout contre le vrai serveur) : vérifie uniquement que le jeu absorbe silencieusement
// toute panne réseau/serveur, pour les DEUX classements (défi du jour + carrières), sans jamais
// planter ni bloquer, et rattrape un envoi manqué plus tard.
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

async function main() {
  const { errors } = setupEnvironment();
  const realFetch = globalThis.fetch;

  // ---- 1. Serveur injoignable (fetch rejette) : jamais d'exception, repli propre ----
  globalThis.fetch = () => Promise.reject(new Error('network down (simulé)'));
  const api = await import('../src/engine/worldLeaderboardApi.js');

  let careerSubmitOk, careerSubmitThrew = false;
  try { careerSubmitOk = await api.submitCareerWorldScore({ score: 150, tier: 'All-Star', seasons: 10, hof: false }); }
  catch (e) { careerSubmitThrew = true; }
  check('submitCareerWorldScore() ne lève JAMAIS même si le réseau est totalement injoignable', !careerSubmitThrew);
  check('submitCareerWorldScore() retourne false (échec) quand le réseau est injoignable', careerSubmitOk === false);

  let dailySubmitOk, dailySubmitThrew = false;
  try { dailySubmitOk = await api.submitDailyWorldScore('2026-01-01', { score: 90, tier: 'Joueur de rotation', seasons: 4, hof: false }); }
  catch (e) { dailySubmitThrew = true; }
  check('submitDailyWorldScore() ne lève JAMAIS même si le réseau est totalement injoignable', !dailySubmitThrew);
  check('submitDailyWorldScore() retourne false (échec) quand le réseau est injoignable', dailySubmitOk === false);

  let careerFetchThrew = false, careerFetchResult;
  try { careerFetchResult = await api.fetchCareerWorldPage({ offset: 0, limit: 20, orderBy: 'score' }); }
  catch (e) { careerFetchThrew = true; }
  check('fetchCareerWorldPage() ne lève JAMAIS même si le réseau est totalement injoignable', !careerFetchThrew);
  check('fetchCareerWorldPage() retourne null (signal explicite "indisponible") hors ligne', careerFetchResult === null);

  let dailyFetchThrew = false, dailyFetchResult;
  try { dailyFetchResult = await api.fetchDailyWorldPage({ date: '2026-01-01', offset: 0, limit: 20, orderBy: 'score' }); }
  catch (e) { dailyFetchThrew = true; }
  check('fetchDailyWorldPage() ne lève JAMAIS même si le réseau est totalement injoignable', !dailyFetchThrew);
  check('fetchDailyWorldPage() retourne null (signal explicite "indisponible") hors ligne', dailyFetchResult === null);

  let rankThrew = false, rankResult;
  try { rankResult = await api.fetchMyCareerWorldRank('score'); }
  catch (e) { rankThrew = true; }
  check('fetchMyCareerWorldRank() ne lève JAMAIS même si le réseau est totalement injoignable', !rankThrew);
  check('fetchMyCareerWorldRank() retourne null hors ligne', rankResult === null);

  // ---- 2. Un envoi échoué est mis en file, puis rattrapé au prochain succès ----
  const careerPendingRaw = JSON.parse(localStorage.getItem('hardwood_pending_career_world_v1') || '[]');
  check('un envoi de carrière échoué est bien mis en file d\'attente locale (jamais perdu)', careerPendingRaw.length === 1 && careerPendingRaw[0].result.score === 150);
  const dailyPendingRaw = JSON.parse(localStorage.getItem('hardwood_pending_daily_world_v1') || '[]');
  check('un envoi quotidien échoué est bien mis en file d\'attente locale (jamais perdu)', dailyPendingRaw.some((p) => p.date === '2026-01-01'));

  let flushCalls = 0;
  globalThis.fetch = () => { flushCalls++; return Promise.resolve({ ok: true, json: async () => [] }); };
  await api.flushPendingWorldScores();
  check('flushPendingWorldScores() rejoue bien les deux files dès que le réseau revient', flushCalls >= 2);
  const careerPendingAfter = JSON.parse(localStorage.getItem('hardwood_pending_career_world_v1') || '[]');
  const dailyPendingAfter = JSON.parse(localStorage.getItem('hardwood_pending_daily_world_v1') || '[]');
  check('la file d\'attente carrière est vidée une fois l\'envoi réussi (pas de doublon au prochain flush)', careerPendingAfter.length === 0);
  check('la file d\'attente quotidienne est vidée une fois l\'envoi réussi (pas de doublon au prochain flush)', dailyPendingAfter.length === 0);

  // ---- 3. Timeout serveur (répond, mais très lentement) : jamais un blocage indéfini ----
  globalThis.fetch = (url, opts) => new Promise((resolve, reject) => {
    if (opts && opts.signal) opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const start = Date.now();
  const timeoutResult = await api.fetchCareerWorldPage({ offset: 0, limit: 20, orderBy: 'score' });
  const elapsedMs = Date.now() - start;
  check('un serveur qui ne répond jamais finit par abandonner (timeout, pas un blocage infini)', elapsedMs < 8000);
  check('le résultat d\'un timeout est bien "indisponible" (null), pas une exception', timeoutResult === null);

  // ---- 4. Erreur HTTP explicite (ex. table absente, 404) : traité comme "indisponible" ----
  globalThis.fetch = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  const notFoundResult = await api.fetchDailyWorldPage({ date: '2026-01-01', offset: 0, limit: 20, orderBy: 'score' });
  check('une erreur HTTP (ex. 404) est traitée comme "indisponible" (null), sans exception', notFoundResult === null);

  // ---- 4b. Serveur joignable mais joueur pas encore classé : contrat à TROIS états (voir
  // fetchMyRank() dans engine/worldLeaderboardApi.js) -- ne doit JAMAIS être confondu avec "hors
  // ligne" (le cas ci-dessus), sans quoi l'écran "autour de moi" afficherait le mauvais message.
  globalThis.fetch = () => Promise.resolve({ ok: true, json: async () => [] });
  const notRankedResult = await api.fetchMyCareerWorldRank('score');
  check('joueur non classé mais serveur joignable -> {row:null,rank:null}, jamais confondu avec "hors ligne"',
    !!notRankedResult && notRankedResult.row === null && notRankedResult.rank === null);

  // ---- 5. Écrans : rendu sans crash + message clair (jamais une erreur brute) en cas d'échec réseau ----
  globalThis.fetch = () => Promise.reject(new Error('network down (simulé)'));
  localStorage.setItem('hw_welcome_seen', '1');
  const worldLbUi = await import('../src/ui/worldLeaderboard.js');
  worldLbUi.renderCareerWorldLeaderboard();
  await new Promise((r) => setTimeout(r, 20)); // laisse la promesse rejetée se propager
  const careerStatus = document.getElementById('wlStatus')?.textContent || '';
  check('écran carrières : message clair affiché en cas d\'échec réseau (jamais une erreur brute)', careerStatus.length > 0 && !/error|exception|undefined/i.test(careerStatus));
  check('écran carrières : le bouton "Retour" reste présent (écran jamais cassé)', !!document.getElementById('wlBack'));

  worldLbUi.renderDailyWorldLeaderboard();
  await new Promise((r) => setTimeout(r, 20));
  const dailyStatus = document.getElementById('wlStatus')?.textContent || '';
  check('écran défi du jour mondial : message clair affiché en cas d\'échec réseau', dailyStatus.length > 0 && !/error|exception|undefined/i.test(dailyStatus));
  check('écran défi du jour mondial : le bouton "Retour" reste présent (écran jamais cassé)', !!document.getElementById('wlBack'));
  // ---- 6. Lignes condensées (rang 4+) + mode "autour de moi" (voir AGENDA.md, "revoir la forme
  // des classements") : podium (rangs 1-3) garde le format plein, le reste bascule en .compact ;
  // le nouveau bouton bascule vers une fenêtre centrée sur mon propre rang.
  const profile = await import('../src/engine/profile.js');
  const pageRows = Array.from({ length: 8 }, (_, i) => ({
    nickname: `Joueur${i}`, score: 500 - i * 10, tier: 'All-Star', seasons: 5, hof: false, summary: null,
  }));
  profile.setNickname('CompactTester');
  globalThis.fetch = (url) => {
    if (url.includes('select=id&')) return Promise.resolve({ ok: true, headers: { get: (h) => (String(h).toLowerCase() === 'content-range' ? '0-0/8' : null) }, json: async () => [] });
    if (url.includes('nickname=eq.')) return Promise.resolve({ ok: true, json: async () => [] }); // pas encore classé
    return Promise.resolve({ ok: true, json: async () => pageRows });
  };
  worldLbUi.renderCareerWorldLeaderboard();
  await new Promise((r) => setTimeout(r, 20));
  const rows = Array.from(document.querySelectorAll('#wlRows .hof-row'));
  check('classement condensé : le podium (rangs 1-3) garde le format plein (pas de classe .compact)',
    rows.slice(0, 3).every((r) => !r.classList.contains('compact')));
  check('classement condensé : les rangs 4+ basculent bien en format condensé (.compact)',
    rows.length > 3 && rows.slice(3).every((r) => r.classList.contains('compact')));

  check('bouton de bascule "autour de moi" présent sur l\'écran', !!document.getElementById('wlViewToggle'));
  document.getElementById('wlViewToggle').click();
  await new Promise((r) => setTimeout(r, 20));
  const notRankedStatus = document.getElementById('wlStatus')?.textContent || '';
  check('mode "autour de moi", joueur pas encore classé : message d\'invitation clair (pas une erreur)',
    notRankedStatus.length > 0 && !/error|exception|undefined/i.test(notRankedStatus));

  // Même scénario, mais cette fois le joueur EST classé (rang 6) : la fenêtre "autour de moi"
  // doit se centrer sur sa ligne et l'afficher (surlignée .mine), sans bouton "Charger plus".
  const myRow = { nickname: 'CompactTester', score: 450, tier: 'All-Star', seasons: 5, hof: false, summary: null };
  const pageRowsWithMe = pageRows.slice(0, 5).concat([myRow]).concat(pageRows.slice(5));
  globalThis.fetch = (url) => {
    if (url.includes('select=id&')) return Promise.resolve({ ok: true, headers: { get: (h) => (String(h).toLowerCase() === 'content-range' ? '0-0/5' : null) }, json: async () => [] });
    if (url.includes('nickname=eq.')) return Promise.resolve({ ok: true, json: async () => [myRow] });
    return Promise.resolve({ ok: true, json: async () => pageRowsWithMe });
  };
  document.getElementById('wlViewToggle').click(); // revient en mode "top"
  await new Promise((r) => setTimeout(r, 20));
  document.getElementById('wlViewToggle').click(); // repasse en "autour de moi", avec ce nouveau mock
  await new Promise((r) => setTimeout(r, 20));
  check('mode "autour de moi", joueur classé : sa ligne apparaît bien dans la fenêtre affichée',
    !!document.querySelector('#wlRows .hof-row.mine'));
  check('mode "autour de moi" : pas de bouton "Charger plus" (fenêtre fixe, pas une page)',
    document.getElementById('wlLoadMore')?.style.display === 'none');

  check('aucune erreur JS interceptée par le jeu sur l\'ensemble du scénario', errors.length === 0);

  globalThis.fetch = realFetch;
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
