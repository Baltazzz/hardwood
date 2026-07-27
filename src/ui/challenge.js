/* ============================================================
   DÉFI ENTRE AMIS — écrans + logique de bout en bout. Principe :
   un défi fige UNIQUEMENT le profil de départ (attributs, poste,
   style, nationalité, potentiel, offres d'académie proposées) --
   tout le reste (mode de vie, nom, choix d'académie retenu, et
   toute la carrière ensuite) reste libre et propre à chaque
   participant. Entièrement client : le lien encode tout l'état
   nécessaire (voir engine/challengeCodec.js), le classement vit en
   localStorage (voir engine/challenges.js), jamais de serveur.
============================================================ */
import { G, setG } from '../engine/state.js';
import { newPlayer, rollArchetypeAndName } from '../engine/player.js';
import { NATIONS } from '../data/nations.js';
import { POSITIONS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { encodeChallengeDef, decodeChallengeDef, decodeResult, buildChallengeUrl, buildResultUrl } from '../engine/challengeCodec.js';
import { ensureChallenge, getChallenge, addResult, generateChallengeDef } from '../engine/challenges.js';
import { generateDailyDef, getTodayDateStr, getDailyBest, allDailyResults } from '../engine/dailyChallenge.js';
import { trackEvent } from '../engine/analytics.js';
import { shareOrFallback } from './share.js';
import { stage } from './dom.js';
import { setInCareer } from './navbar.js';
import { screenTitle, screenCreate } from './screens.js';

export { generateChallengeDef };

function nationOf(def) { return NATIONS.find(n => n.id === def.nationId) || NATIONS[0]; }
function posOf(def) { return POSITIONS.find(x => x.id === def.pos) || POSITIONS[0]; }
function styleOf(def) { return STYLES.find(x => x.id === def.style) || STYLES[0]; }

function starStrInline(n) {
  let s = ''; for (let i = 1; i <= 5; i++) s += `<span style="color:${i <= n ? 'var(--mint)' : 'rgba(36,24,19,.16)'}">★</span>`;
  return s;
}

function profileSummary(def) {
  const nation = nationOf(def), pos = posOf(def), style = styleOf(def);
  return `<div class="challenge-profile">
    <div class="challenge-profile-row"><span class="flag">${nation.flag}</span><b>${nation.name}</b></div>
    <div class="challenge-profile-row">${pos.emoji} ${pos.name} · ${style.emoji} ${style.name}</div>
    <div class="challenge-profile-row">${starStrInline(def.hype)}</div>
  </div>`;
}

/* ---- Création d'un défi (depuis l'écran titre) ---- */
export function startChallengeCreation() {
  const def = generateChallengeDef();
  ensureChallenge(def);
  const url = buildChallengeUrl(def);
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">🔗 Défi entre amis</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Ton défi est prêt</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Chaque ami qui ouvre ce lien démarre avec EXACTEMENT le même profil. Ensuite, chacun vit sa propre carrière -- ses choix, son aléatoire.</p>
    ${profileSummary(def)}
    <div class="field" style="margin-top:18px"><label>Lien à partager</label>
      <input id="challengeLink" value="${url}" readonly autocomplete="off"></div>
    <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn ghost sm" id="copyChallengeLink">📤 Partager le lien</button>
    </div>
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="startMyChallenge">Commencer mon défi</button>
      <button class="btn ghost" id="challengeBack">Retour</button>
    </div>
    <p class="body" id="copyHint" style="text-align:center;color:var(--chalk-dim);font-size:12px;margin-top:10px;display:none">Lien copié !</p>
  </div>`;
  // Le partage natif est désormais le geste principal (voir AGENDA.md) : ouvre la feuille de
  // partage de l'appareil directement avec le lien, repli copie presse-papiers uniquement si
  // navigator.share est absent -- jamais les deux affichés en même temps.
  document.getElementById('copyChallengeLink').onclick = async () => {
    const hint = document.getElementById('copyHint');
    const result = await shareOrFallback({ title: 'Défi HARDWOOD', text: 'Rejoins mon défi sur HARDWOOD !', url }, () => { hint.style.display = 'block'; });
    if (result === 'unsupported') {
      const input = document.getElementById('challengeLink');
      input.select();
      try { document.execCommand('copy'); hint.style.display = 'block'; } catch (e) {}
    }
  };
  document.getElementById('startMyChallenge').onclick = () => joinChallenge(def);
  document.getElementById('challengeBack').onclick = () => screenTitle();
}

/* ---- Rejoindre un défi (lien ?challenge=...) ---- */
export function joinChallenge(def) {
  trackEvent('challenge_open');
  ensureChallenge(def);
  setG(newPlayer());
  const p = G;
  p.nation = nationOf(def);
  p.pos = def.pos;
  p.style = def.style;
  p.attrs = { ...def.attrs };
  p.potential = def.potential;
  p.hype = def.hype;
  p.challengeId = def.id;
  p.frozenAcademyOffers = def.academyOffers;
  // Posé dès maintenant (pas seulement au clic "Continuer") : l'autosauvegarde (voir main.js)
  // peut écrire l'état sur un simple changement de visibilité, avant tout clic -- si l'appareil
  // se ferme pile sur cet écran d'atterrissage, une reprise doit retomber directement sur l'étape
  // mode de vie (nation/poste/style déjà figés ci-dessus), jamais rejouer l'étape nation à 0.
  p.step = 3;
  renderChallengeJoinLanding(def);
}

function renderChallengeJoinLanding(def) {
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">🔗 Tu rejoins le défi d'un ami !</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Départ imposé, carrière libre</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Tu démarres avec exactement le même profil que les autres participants. À partir de là, tes choix et ton aléatoire n'appartiennent qu'à toi.</p>
    ${profileSummary(def)}
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="continueJoin">Continuer</button>
      <button class="btn ghost" id="declineJoin">Plutôt une carrière libre</button>
    </div>
  </div>`;
  document.getElementById('continueJoin').onclick = () => screenCreate();
  document.getElementById('declineJoin').onclick = () => { setG(newPlayer()); screenTitle(); };
}

/* ---- Classement d'un défi ---- */
export function renderChallengeLeaderboard(challengeId) {
  setInCareer(false);
  const entry = getChallenge(challengeId);
  const results = (entry && entry.results) || [];
  const rows = results.length ? results.map((r, i) => `
    <div class="hof-row${i === 0 ? ' top' : ''}">
      <span class="rk">${i + 1}</span>
      <span class="hof-main">
        <span class="hof-name">${r.name}${r.hof ? ' 🏛️' : ''}</span>
        <span class="hof-sub">${r.tier} · ${r.seasons} saisons</span>
      </span>
      <span class="hof-score"><b>${r.score}</b><small>score</small></span>
    </div>`).join('')
    : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:20px 0">Aucun résultat pour l'instant. Sois le premier à terminer ce défi !</p>`;
  const myResult = results.find(r => r.mine);
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">🔗 Classement du défi</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 14px">Qui s'en sort le mieux ?</h2>
    ${entry && entry.def ? profileSummary(entry.def) : ''}
    <div class="hof-list" style="max-width:560px;margin:18px auto 0">${rows}</div>
    <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      ${myResult ? `<button class="btn ghost sm" id="shareMyResult">📤 Partager mon score</button>` : ''}
      ${entry && entry.def ? `<button class="btn ghost sm" id="inviteMore">📤 Inviter d'autres amis</button>` : ''}
      <button class="btn" id="leaderboardBack">Retour à l'accueil</button>
    </div>
    <p class="body" id="challengeCopyHint" style="text-align:center;color:var(--chalk-dim);font-size:12px;margin-top:10px;display:none">Lien copié !</p>
  </div>`;
  const hint = document.getElementById('challengeCopyHint');
  const share = async (opts) => { await shareOrFallback(opts, () => { hint.style.display = 'block'; }); };
  const shareBtn = document.getElementById('shareMyResult');
  if (shareBtn) shareBtn.onclick = () => share({ title: 'Mon score HARDWOOD', text: `${myResult.name} · ${myResult.tier} · score ${myResult.score}`, url: buildResultUrl(myResult) });
  const inviteBtn = document.getElementById('inviteMore');
  if (inviteBtn) inviteBtn.onclick = () => share({ title: 'Défi HARDWOOD', text: 'Rejoins mon défi sur HARDWOOD !', url: buildChallengeUrl(entry.def) });
  document.getElementById('leaderboardBack').onclick = () => screenTitle();
}

/* ---- Point d'entrée : lien ouvert au chargement de l'app (voir main.js) ---- */
export function handleIncomingLink() {
  const params = new window.URLSearchParams(window.location.search);
  const challengeParam = params.get('challenge');
  const resultParam = params.get('result');
  if (!challengeParam && !resultParam) return false;
  // Nettoie l'URL tout de suite : un rechargement ultérieur (ou un retour arrière navigateur) ne
  // doit jamais redéclencher le même traitement une seconde fois.
  window.history.replaceState(null, '', window.location.pathname);
  if (challengeParam) {
    const def = decodeChallengeDef(challengeParam);
    if (!def) { screenTitle(); return true; } // lien corrompu -- repli silencieux, jamais d'erreur visible
    joinChallenge(def);
    return true;
  }
  const res = decodeResult(resultParam);
  if (!res) { screenTitle(); return true; }
  // mine:false forcé explicitement (jamais la valeur transmise, déjà exclue à l'encodage par
  // encodeResult() -- ceinture et bretelles) : un résultat reçu par lien n'est jamais "le mien".
  addResult(res.challengeId, { ...res, mine: false });
  renderChallengeLeaderboard(res.challengeId);
  return true;
}

/* ============================================================
   DÉFI DU JOUR — distinct du défi entre amis ci-dessus (voir
   engine/dailyChallenge.js pour le détail du tirage déterministe).
   Rendez-vous personnel : pas de lien à ouvrir, pas de classement
   partagé -- un profil du jour, un historique de SES propres scores.
============================================================ */
function joinDaily(def) {
  setG(newPlayer());
  const p = G;
  p.nation = nationOf(def);
  p.pos = def.pos;
  p.style = def.style;
  p.attrs = { ...def.attrs };
  p.potential = def.potential;
  p.hype = def.hype;
  p.dailyDate = def.date;
  p.frozenAcademyOffers = def.academyOffers;
  p.step = 3; // même raison qu'en défi entre amis : robuste à une sauvegarde pile sur l'atterrissage
  renderDailyLanding(def);
}

// Point d'entrée depuis l'écran titre.
export function startDailyChallenge() {
  const def = generateDailyDef();
  const best = getDailyBest(def.date);
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">📅 Défi du jour</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">${def.date}</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Le même profil de départ pour tout le monde aujourd'hui, sans exception -- calculé depuis la date, jamais deux fois pareil d'un jour à l'autre.</p>
    ${profileSummary(def)}
    ${best ? `<p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13px;margin-top:14px">Ton meilleur score aujourd'hui : <b style="color:var(--mint)">${best.score}</b> (${best.tier})</p>` : ''}
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="playDaily">${best ? 'Retenter le défi du jour' : 'Jouer le défi du jour'}</button>
      <button class="btn ghost" id="dailyHistory">📅 Mon historique</button>
      <button class="btn ghost" id="dailyBack">Retour</button>
    </div>
  </div>`;
  document.getElementById('playDaily').onclick = () => joinDaily(def);
  document.getElementById('dailyHistory').onclick = () => renderDailyLeaderboard();
  document.getElementById('dailyBack').onclick = () => screenTitle();
}

function renderDailyLanding(def) {
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">📅 Défi du jour -- ${def.date}</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Départ imposé, carrière libre</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Le profil est identique pour tout le monde aujourd'hui. À partir de là, tes choix et ton aléatoire n'appartiennent qu'à toi.</p>
    ${profileSummary(def)}
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="continueDaily">Continuer</button>
      <button class="btn ghost" id="declineDaily">Plutôt une carrière libre</button>
    </div>
  </div>`;
  document.getElementById('continueDaily').onclick = () => screenCreate();
  document.getElementById('declineDaily').onclick = () => { setG(newPlayer()); screenTitle(); };
}

// Classement PERSONNEL (pas de fusion multi-appareils, contrairement au défi entre amis) : ton
// historique de scores quotidiens, un par jour joué.
export function renderDailyLeaderboard() {
  setInCareer(false);
  const results = allDailyResults();
  const today = getTodayDateStr();
  const todayResult = results.find(r => r.date === today);
  const rows = results.length ? results.map((r, i) => `
    <div class="hof-row${i === 0 ? ' top' : ''}">
      <span class="rk">${r.date}</span>
      <span class="hof-main">
        <span class="hof-name">${r.name}${r.hof ? ' 🏛️' : ''}</span>
        <span class="hof-sub">${r.tier} · ${r.seasons} saisons</span>
      </span>
      <span class="hof-score"><b>${r.score}</b><small>score</small></span>
    </div>`).join('')
    : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:20px 0">Aucun défi du jour joué pour l'instant.</p>`;
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">📅 Mon historique quotidien</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 14px">${results.length} jour${results.length>1?'s':''} joué${results.length>1?'s':''}</h2>
    <div class="hof-list" style="max-width:560px;margin:0 auto">${rows}</div>
    <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      ${todayResult ? `<button class="btn ghost sm" id="shareDaily">📤 Partager mon score du jour</button>` : ''}
      <button class="btn" id="dailyLeaderboardBack">Retour à l'accueil</button>
    </div>
    <p class="body" id="dailyCopyHint" style="text-align:center;color:var(--chalk-dim);font-size:12px;margin-top:10px;display:none">Copié !</p>
  </div>`;
  const shareBtn = document.getElementById('shareDaily');
  if (shareBtn) shareBtn.onclick = async () => {
    const text = `🏀 Défi du jour HARDWOOD (${todayResult.date}) : ${todayResult.score} de score légende (${todayResult.tier}) avec ${todayResult.name} !`;
    const hint = document.getElementById('dailyCopyHint');
    await shareOrFallback({ title: 'Défi du jour HARDWOOD', text }, () => { hint.style.display = 'block'; });
  };
  document.getElementById('dailyLeaderboardBack').onclick = () => screenTitle();
}
