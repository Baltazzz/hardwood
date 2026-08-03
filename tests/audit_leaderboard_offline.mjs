#!/usr/bin/env node
// Garde-fou de non-régression dédié à la ROBUSTESSE du classement partagé (voir AGENDA.md, "lot
// backend Supabase", point 4 -- "impérative"). Ne dépend PAS de la table Supabase réelle (voir
// tests/audit_leaderboard_live.mjs pour la vérification de bout en bout contre le vrai serveur) :
// vérifie uniquement que le jeu absorbe silencieusement toute panne réseau/serveur, sans jamais
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
  const api = await import('../src/engine/leaderboardApi.js');

  let submitOk, submitThrew = false;
  try { submitOk = await api.submitChallengeScore('c_test1', { name: 'Test', score: 100, tier: 'All-Star', seasons: 10, hof: false }); }
  catch (e) { submitThrew = true; }
  check('submitChallengeScore() ne lève JAMAIS même si le réseau est totalement injoignable', !submitThrew);
  check('submitChallengeScore() retourne false (échec) quand le réseau est injoignable', submitOk === false);

  let fetchResult, fetchThrew = false;
  try { fetchResult = await api.fetchChallengeScores('c_test1'); }
  catch (e) { fetchThrew = true; }
  check('fetchChallengeScores() ne lève JAMAIS même si le réseau est totalement injoignable', !fetchThrew);
  check('fetchChallengeScores() retourne null (signal explicite "indisponible") hors ligne', fetchResult === null);

  // ---- 2. Un envoi échoué est mis en file, puis rattrapé au prochain succès ----
  const pendingRaw = JSON.parse(localStorage.getItem('hardwood_pending_scores_v1') || '[]');
  check('un envoi échoué est bien mis en file d\'attente locale (jamais perdu)', pendingRaw.some(p => p.challengeId === 'c_test1'));

  let flushCalls = 0;
  globalThis.fetch = (url, opts) => {
    flushCalls++;
    return Promise.resolve({ ok: true, json: async () => [] });
  };
  await api.flushPendingScores();
  check('flushPendingScores() renvoie bien la tentative en attente dès que le réseau revient', flushCalls >= 1);
  const pendingAfterFlush = JSON.parse(localStorage.getItem('hardwood_pending_scores_v1') || '[]');
  check('la file d\'attente est vidée une fois l\'envoi réussi (pas de doublon au prochain flush)', pendingAfterFlush.length === 0);

  // ---- 3. Timeout serveur (répond, mais très lentement) : jamais un blocage indéfini ----
  // Le mock doit respecter le signal d'annulation (comme le vrai fetch()) pour que le
  // AbortController de fetchWithTimeout() puisse effectivement le débloquer -- sans ça le test
  // resterait bloqué pour de vrai, ce n'est pas ce qu'on veut vérifier ici.
  globalThis.fetch = (url, opts) => new Promise((resolve, reject) => {
    if (opts && opts.signal) opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const start = Date.now();
  const timeoutResult = await api.fetchChallengeScores('c_test2');
  const elapsedMs = Date.now() - start;
  check('un serveur qui ne répond jamais finit par abandonner (timeout, pas un blocage infini)', elapsedMs < 8000);
  check('le résultat d\'un timeout est bien "indisponible" (null), pas une exception', timeoutResult === null);

  // ---- 4. Erreur HTTP explicite (ex. table absente, 404) : traité comme "indisponible", jamais une exception ----
  globalThis.fetch = () => Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
  const notFoundResult = await api.fetchChallengeScores('c_test3');
  check('une erreur HTTP (ex. 404) est traitée comme "indisponible" (null), sans exception', notFoundResult === null);

  // ---- 5. Écran de classement : rendu local immédiat, message clair (jamais une erreur brute) en cas d'échec réseau ----
  globalThis.fetch = () => Promise.reject(new Error('network down (simulé)'));
  const screens = await import('../src/ui/screens.js');
  const challengeUi = await import('../src/ui/challenge.js');
  const challengesEngine = await import('../src/engine/challenges.js');
  localStorage.setItem('hw_welcome_seen', '1');
  const def = challengesEngine.generateChallengeDef();
  challengesEngine.ensureChallenge(def);
  challengesEngine.recordMyChallengeResult(def.id, { challengeId: def.id, name: 'Hors-ligne Test', score: 123, tier: 'All-Star', seasons: 8, hof: false, date: Date.now(), mine: true });
  challengeUi.renderChallengeLeaderboard(def.id);
  check('classement local affiché IMMÉDIATEMENT, sans attendre le réseau', document.body.innerHTML.includes('123') && document.body.innerHTML.includes('Hors-ligne Test'));
  // Laisse le temps à la promesse rejetée de se propager (microtask) avant de vérifier le message.
  await new Promise((r) => setTimeout(r, 20));
  const statusText = document.getElementById('leaderboardStatus')?.textContent || '';
  check('message CLAIR affiché en cas d\'échec réseau (jamais une erreur brute illisible)', statusText.length > 0 && !/error|exception|undefined/i.test(statusText));
  check('le classement local reste affiché malgré l\'échec réseau (rien ne disparaît)', document.body.innerHTML.includes('123'));
  check('aucune erreur JS interceptée par le jeu suite à l\'échec réseau', errors.length === 0);

  globalThis.fetch = realFetch;
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
