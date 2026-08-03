/* ============================================================
   DÉFI ENTRE AMIS — écrans + logique de bout en bout. Principe (voir AGENDA.md AGD-58, "équité du
   défi entre amis") : un défi fige TOTALEMENT le profil de départ -- attributs, poste, style,
   nationalité, potentiel, offres d'académie proposées, mode de vie, NOM du personnage, et
   l'académie retenue (imposée, comme le défi du jour). Aucune divergence de départ n'est possible
   entre deux participants d'un même défi : à partir de là, seule la carrière elle-même (choix
   d'événements, aléatoire de simulation) reste libre et propre à chaque participant. Le pseudo de
   COMPTE (engine/profile.js, distinct du nom du personnage) est ce qui distingue désormais chaque
   participant au classement, puisque le nom de personnage est identique pour tous. Entièrement
   client : le lien encode tout l'état nécessaire (voir engine/challengeCodec.js), le classement vit
   en localStorage (voir engine/challenges.js), jamais de serveur pour le lien lui-même.
============================================================ */
import { G, setG } from '../engine/state.js';
import { newPlayer, rollArchetypeAndName } from '../engine/player.js';
import { NATIONS } from '../data/nations.js';
import { POSITIONS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LIFESTYLES } from '../data/lifestyles.js';
import { encodeChallengeDef, decodeChallengeDef, decodeResult, buildChallengeUrl, buildResultUrl } from '../engine/challengeCodec.js';
import { ensureChallenge, getChallenge, listChallenges, addResult, clearChallenges, generateChallengeDef } from '../engine/challenges.js';
import { generateDailyDef, getTodayDateStr, getDailyBest, allDailyResults, DAILY_THEMES } from '../engine/dailyChallenge.js';
import { profileNickname, setNickname } from '../engine/profile.js';
import { trackEvent } from '../engine/analytics.js';
import { shareOrFallback } from './share.js';
import { stage } from './dom.js';
import { setInCareer } from './navbar.js';
import { screenTitle, screenCreate } from './screens.js';
import { hasSavedGame, clearSavedGame } from '../engine/savegame.js';
import { fetchChallengeScores } from '../engine/leaderboardApi.js';
import { t } from '../engine/i18n.js';
import { TIER_RANK } from '../engine/badges.js';
import { rankGlyph } from './card.js';
import { renderDailyWorldLeaderboard } from './worldLeaderboard.js';

// `tier` est stocké en français (voir endCareer() dans screens.js) -- traduit uniquement à
// l'affichage, jamais dans le stockage (même principe que ui/card.js).
function tierLabel(tier) { const i = TIER_RANK.indexOf(tier); return t('tierRank.'+(i>=0?i:0)); }

export { generateChallengeDef };

function nationOf(def) { return NATIONS.find(n => n.id === def.nationId) || NATIONS[0]; }
function posOf(def) { return POSITIONS.find(x => x.id === def.pos) || POSITIONS[0]; }
function styleOf(def) { return STYLES.find(x => x.id === def.style) || STYLES[0]; }

// Même garde-fou que l'écran titre (voir screenTitle() dans screens.js) pour toute action qui
// démarre une carrière -- rejouer un défi ou en lancer un nouveau depuis le podium (voir AGENDA.md
// "correction prioritaire", point 2) écrase la sauvegarde en cours exactement de la même façon,
// jamais silencieusement.
function guardOverwrite() {
  if (hasSavedGame() && !confirm(t('home.confirmOverwriteChallenge'))) return false;
  clearSavedGame();
  return true;
}

function starStrInline(n) {
  let s = ''; for (let i = 1; i <= 5; i++) s += `<span style="color:${i <= n ? 'var(--mint)' : 'rgba(36,24,19,.16)'}">★</span>`;
  return s;
}

function profileSummary(def) {
  const nation = nationOf(def), pos = posOf(def), style = styleOf(def);
  return `<div class="challenge-profile">
    <div class="challenge-profile-row"><span class="flag">${nation.flag}</span><b>${t('nations.'+nation.id)}</b></div>
    <div class="challenge-profile-row">${pos.emoji} ${t('positions.'+pos.id+'.name')} · ${style.emoji} ${t('styles.'+style.id+'.name')}</div>
    <div class="challenge-profile-row">${starStrInline(def.hype)}</div>
  </div>`;
}

// Identité IMPOSÉE (nom du personnage + mode de vie) -- voir AGENDA.md AGD-58, équité du défi
// entre amis. Affichée UNIQUEMENT sur les écrans du défi entre amis ci-dessous, JAMAIS dans
// profileSummary() ci-dessus (partagée avec le défi du jour, qui n'impose PAS ces deux champs --
// les y afficher mentirait sur ce qui est réellement figé pour ce mode-là).
function imposedIdentityHTML(def) {
  // def.name absent : un défi créé avant AGD-58 (ancien lien/ancienne entrée locale), le nom
  // n'était pas encore imposé -- repli silencieux plutôt qu'afficher "undefined".
  if (!def.name) return '';
  const life = LIFESTYLES.find(l => l.id === def.life);
  return `<div class="challenge-profile" style="margin-top:10px">
    <div class="challenge-profile-row">🪪 <b>${def.name}</b></div>
    ${life ? `<div class="challenge-profile-row">${life.emoji} ${t('lifestyles.'+life.id+'.name')}</div>` : ''}
  </div>`;
}

// Pseudo de COMPTE (voir engine/profile.js, distinct du nom du personnage ci-dessus) : modifiable
// directement sur ces écrans, au moment où il devient significatif -- il va apparaître au
// classement face aux amis. Jamais un écran séparé qui casserait le fil du geste en cours
// (créer/rejoindre un défi). Ne re-rend PAS l'écran appelant (certains, comme
// startChallengeCreation(), génèrent un NOUVEAU défi à chaque appel -- un re-rendu recréerait un
// défi différent) : reflète juste la valeur nettoyée/finale directement dans le champ.
function nicknameEditHTML() {
  return `<div class="nickname-edit">
    <span class="nickname-edit-label">${t('challenge.playingAs')}</span>
    <input id="nicknameInput" value="${profileNickname()}" maxlength="22" autocomplete="off">
    <button class="btn ghost sm" id="nicknameSave">${t('common.save')}</button>
  </div>`;
}
function wireNicknameEdit() {
  const btn = document.getElementById('nicknameSave');
  if (!btn) return;
  btn.onclick = () => {
    const input = document.getElementById('nicknameInput');
    input.value = setNickname(input.value);
  };
}

/* ---- Écran d'entrée du mode "Défi entre amis" (depuis la tuile de l'accueil) : deux choix nets,
   jamais confondus -- lancer un nouveau défi, ou consulter les classements des défis déjà joués
   (voir AGENDA.md, ajustement du 2026-08-03). ---- */
export function renderChallengeHub() {
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">🔗 Défi entre amis</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Même profil, chacun sa carrière</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Défie tes amis sur un profil de départ identique -- ensuite, chacun vit sa propre carrière, ses choix, son aléatoire.</p>
    ${nicknameEditHTML()}
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="challengeHubNew">🆕 Nouveau défi</button>
      <button class="btn ghost" id="challengeHubResults">🏆 Mes classements</button>
    </div>
    <div style="margin-top:16px;text-align:center">
      <button class="btn ghost sm" id="challengeHubBack">${t('common.back')}</button>
    </div>
  </div>`;
  wireNicknameEdit();
  document.getElementById('challengeHubNew').onclick = () => { if (!guardOverwrite()) return; startChallengeCreation(); };
  document.getElementById('challengeHubResults').onclick = () => renderMyChallenges();
  document.getElementById('challengeHubBack').onclick = () => screenTitle();
}

/* ---- Création d'un défi (depuis l'écran d'entrée ci-dessus) ---- */
export function startChallengeCreation() {
  const def = generateChallengeDef();
  ensureChallenge(def);
  const url = buildChallengeUrl(def);
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">🔗 Défi entre amis</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Ton défi est prêt</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Chaque ami qui ouvre ce lien démarre avec EXACTEMENT le même profil -- même nom de personnage, même mode de vie, même académie. Ensuite, chacun vit sa propre carrière -- ses choix, son aléatoire.</p>
    ${profileSummary(def)}
    ${imposedIdentityHTML(def)}
    ${forcedAcademyHTML(def)}
    ${nicknameEditHTML()}
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
  wireNicknameEdit();
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
  document.getElementById('challengeBack').onclick = () => renderChallengeHub();
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
  // Équité totale (voir AGENDA.md AGD-58) : mode de vie et nom du personnage sont désormais
  // imposés eux aussi, comme le reste du profil ci-dessus -- plus aucune divergence de départ
  // possible entre participants. `rollArchetypeAndName(p)` roule l'archétype de développement
  // (p.devArchetype, lit réellement la simulation -- voir engine/season.js) ; son garde-fou
  // interne `if(!p.name)` ne re-touche pas le nom, déjà posé juste au-dessus.
  p.life = def.life;
  p.name = def.name;
  rollArchetypeAndName(p);
  // Académie imposée elle aussi (même principe que le défi du jour, voir engine/season.js
  // startCareer()) -- plus un choix, un champ dédié pour ne jamais confondre les deux modes.
  p.challengeForcedAcademyIndex = def.forcedAcademyIndex;
  renderChallengeJoinLanding(def);
}

function renderChallengeJoinLanding(def) {
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">🔗 Tu rejoins le défi d'un ami !</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Départ imposé, carrière libre</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin-bottom:14px">Tu démarres avec exactement le même profil que les autres participants -- même nom de personnage, même mode de vie, même académie. À partir de là, tes choix et ton aléatoire n'appartiennent qu'à toi.</p>
    ${profileSummary(def)}
    ${imposedIdentityHTML(def)}
    ${forcedAcademyHTML(def)}
    ${nicknameEditHTML()}
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="continueJoin">Continuer</button>
      <button class="btn ghost" id="declineJoin">Plutôt une carrière libre</button>
    </div>
  </div>`;
  wireNicknameEdit();
  document.getElementById('continueJoin').onclick = () => screenCreate();
  document.getElementById('declineJoin').onclick = () => { setG(newPlayer()); screenTitle(); };
}

/* ---- Classement d'un défi ---- */
// Rendu des lignes seul (voir renderChallengeLeaderboard() ci-dessous) : réutilisé tel quel pour
// le premier affichage LOCAL (immédiat, jamais d'attente réseau) et pour le remplacement par le
// classement SERVEUR une fois reçu (voir AGENDA.md "lot backend Supabase") -- même structure
// visuelle dans les deux cas, `mine` est déjà correctement posé par la source (localStorage pour
// le local, correspondance client_id pour le serveur, voir engine/leaderboardApi.js).
function leaderboardRowsHTML(results) {
  return results.length ? results.map((r, i) => `
    <div class="hof-row${i === 0 ? ' top' : i < 3 ? ' podium' : ''}${r.mine ? ' mine' : ''}">
      ${rankGlyph(i)}
      <span class="hof-main">
        <span class="hof-name">${r.name}${r.hof ? ' 🏛️' : ''}${r.mine ? ' <small style="color:var(--mint)">(toi)</small>' : ''}</span>
        <span class="hof-sub">${tierLabel(r.tier)} · ${r.seasons} ${t('hof.seasons')}</span>
      </span>
      <span class="hof-score"><b>${r.score}</b><small>score</small></span>
    </div>`).join('')
    : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:20px 0">Aucun résultat pour l'instant. Sois le premier à terminer ce défi !</p>`;
}
// Invitation discrète au partage (voir AGENDA.md) : uniquement quand la ligne "mine" est
// effectivement en TÊTE d'un classement à plusieurs participants -- jamais affichée pour un
// classement encore à une seule ligne (rien à "gagner" tout seul), jamais un texte générique qui
// apparaîtrait à chaque visite. Réutilise le bandeau `.rarity-banner` déjà établi (même traitement
// visuel chaleureux que la rareté de fin de carrière) plutôt qu'un nouveau style.
function winNudgeHTML(results) {
  if (results.length < 2 || !results[0] || !results[0].mine) return '';
  return `<div class="rarity-banner">🏆 ${t('challenge.winNudge')}</div>`;
}

export function renderChallengeLeaderboard(challengeId) {
  setInCareer(false);
  const entry = getChallenge(challengeId);
  const results = (entry && entry.results) || [];
  const myResult = results.find(r => r.mine);
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">🔗 Classement du défi</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Qui s'en sort le mieux ?</h2>
    <p class="body" id="leaderboardStatus" style="text-align:center;color:var(--chalk-dim);font-size:12px;min-height:15px;margin:0 0 8px"></p>
    ${entry && entry.def ? profileSummary(entry.def) + imposedIdentityHTML(entry.def) + forcedAcademyHTML(entry.def) : ''}
    <div class="hof-list" id="leaderboardRows" style="max-width:560px;margin:18px auto 0">${leaderboardRowsHTML(results)}</div>
    <div style="margin-top:10px;text-align:center">
      <button class="btn ghost sm" id="refreshLeaderboard">🔄 Actualiser le classement</button>
    </div>
    <!-- Deux actions nettes et distinctes (voir AGENDA.md "correction prioritaire", point 2) :
         rejouer CE défi (même profil de départ, pour retenter un meilleur score) contre en lancer
         un TOUT NOUVEAU -- jamais la même action, jamais ambiguës l'une avec l'autre. -->
    <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      ${entry && entry.def ? `<button class="btn" id="replayChallenge">🔁 Rejouer ce défi</button>` : ''}
      <button class="btn ${entry && entry.def ? 'ghost' : ''}" id="newChallenge">🆕 Nouveau défi</button>
    </div>
    <div id="challengeWinNudge" style="margin-top:16px;max-width:420px;margin-left:auto;margin-right:auto">${winNudgeHTML(results)}</div>
    <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      ${myResult ? `<button class="btn ghost sm" id="shareMyResult">📤 Partager mon score</button>` : ''}
      ${entry && entry.def ? `<button class="btn ghost sm" id="inviteMore">📤 Inviter d'autres amis</button>` : ''}
      <button class="btn ghost sm" id="myChallengesLink">🏆 Mes classements</button>
      <button class="btn ghost sm" id="leaderboardBack">Retour à l'accueil</button>
    </div>
    <p class="body" id="challengeCopyHint" style="text-align:center;color:var(--chalk-dim);font-size:12px;margin-top:10px;display:none">Lien copié !</p>
  </div>`;
  const hint = document.getElementById('challengeCopyHint');
  const share = async (opts) => { await shareOrFallback(opts, () => { hint.style.display = 'block'; }); };
  const shareBtn = document.getElementById('shareMyResult');
  if (shareBtn) shareBtn.onclick = () => share({ title: 'Mon score HARDWOOD', text: `${myResult.name} · ${tierLabel(myResult.tier)} · score ${myResult.score}`, url: buildResultUrl(myResult) });
  const inviteBtn = document.getElementById('inviteMore');
  if (inviteBtn) inviteBtn.onclick = () => share({ title: 'Défi HARDWOOD', text: 'Rejoins mon défi sur HARDWOOD !', url: buildChallengeUrl(entry.def) });
  const replayBtn = document.getElementById('replayChallenge');
  if (replayBtn) replayBtn.onclick = () => { if (!guardOverwrite()) return; joinChallenge(entry.def); };
  document.getElementById('newChallenge').onclick = () => { if (!guardOverwrite()) return; startChallengeCreation(); };
  document.getElementById('myChallengesLink').onclick = () => renderMyChallenges();
  document.getElementById('leaderboardBack').onclick = () => screenTitle();

  // Classement PARTAGÉ (voir engine/leaderboardApi.js, AGENDA.md "lot backend Supabase") : le
  // local s'affiche IMMÉDIATEMENT ci-dessus (jamais d'attente réseau pour voir quelque chose),
  // puis remplacé par le classement serveur (tous les participants, plus besoin d'échanger un
  // lien de résultat) dès qu'il arrive. En cas d'échec (hors ligne, serveur injoignable) : message
  // clair à la place d'une erreur, le classement local reste affiché tel quel -- ROBUSTESSE
  // IMPÉRATIVE, jamais un écran cassé.
  async function loadRemote(manual) {
    const statusEl = document.getElementById('leaderboardStatus');
    if (manual && statusEl) statusEl.textContent = 'Actualisation du classement…';
    const remote = await fetchChallengeScores(challengeId);
    // L'écran a pu être quitté pendant l'attente réseau -- ne touche plus rien dans ce cas.
    const rowsEl = document.getElementById('leaderboardRows');
    const statusEl2 = document.getElementById('leaderboardStatus');
    if (!rowsEl || !statusEl2) return;
    if (remote) {
      const sorted = [...remote].sort((a, b) => b.score - a.score);
      rowsEl.innerHTML = leaderboardRowsHTML(sorted);
      statusEl2.textContent = '';
      const nudgeEl = document.getElementById('challengeWinNudge');
      if (nudgeEl) nudgeEl.innerHTML = winNudgeHTML(sorted);
    } else {
      statusEl2.textContent = '📡 Classement local uniquement -- hors ligne ou serveur injoignable pour l\'instant.';
    }
  }
  loadRemote(false);
  document.getElementById('refreshLeaderboard').onclick = () => loadRemote(true);
}

// ---- Accès permanent aux classements des défis déjà joués (voir AGENDA.md "correction
// prioritaire" + ajustement du 2026-08-03) : avant le premier correctif, une fois quitté l'écran
// de classement, il n'existait AUCUN moyen d'y revenir -- le classement restait pourtant bien en
// mémoire (localStorage). Désormais accessible en permanence depuis le "hub" du mode défi entre
// amis (voir renderChallengeHub() ci-dessus). Filtré aux défis RÉELLEMENT joués (résultat "mine"
// présent) -- un défi créé/reçu mais jamais mené à son terme n'a pas de score à montrer, il n'a
// pas sa place dans un CLASSEMENT (voir AGENDA.md). Purge automatique après un mois d'inactivité
// (voir engine/challenges.js pruneStale()) + bouton de purge manuelle ci-dessous.
export function renderMyChallenges() {
  setInCareer(false);
  const list = listChallenges().filter(entry => entry.results.some(r => r.mine));
  const rows = list.length ? list.map(entry => {
    const { id, def, results } = entry;
    const myResult = results.find(r => r.mine);
    const profileLabel = def
      ? `${nationOf(def).flag} ${posOf(def).emoji} ${t('positions.'+posOf(def).id+'.name')} · ${styleOf(def).emoji} ${t('styles.'+styleOf(def).id+'.name')}`
      : '🔗 Défi reçu par lien';
    return `<div class="hof-row" data-id="${id}" style="cursor:pointer">
      <span class="rk">🔗</span>
      <span class="hof-main">
        <span class="hof-name">${profileLabel}</span>
        <span class="hof-sub">${tierLabel(myResult.tier)} · score ${myResult.score} · ${results.length} participant${results.length>1?'s':''}</span>
      </span>
      <span class="hof-score"><b>${myResult.score}</b><small>score</small></span>
    </div>`;
  }).join('') : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:20px 0">Aucun défi joué pour l'instant -- lance-en un pour voir ton classement ici.</p>`;
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">🏆 Mes classements</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 14px">${list.length} défi${list.length>1?'s':''} joué${list.length>1?'s':''}</h2>
    <div class="hof-list" style="max-width:560px;margin:0 auto">${rows}</div>
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="myChallengesBack">${t('common.back')}</button>
      <button class="btn ghost" id="myChallengesNew">🆕 Nouveau défi</button>
      ${list.length ? `<button class="btn ghost sm" id="myChallengesClear">🗑️ Vider mes classements</button>` : ''}
    </div>
  </div>`;
  stage.querySelectorAll('[data-id]').forEach(el => { el.onclick = () => renderChallengeLeaderboard(el.dataset.id); });
  document.getElementById('myChallengesBack').onclick = () => renderChallengeHub();
  document.getElementById('myChallengesNew').onclick = () => { if (!guardOverwrite()) return; startChallengeCreation(); };
  const clearBtn = document.getElementById('myChallengesClear');
  if (clearBtn) clearBtn.onclick = () => {
    if (confirm('Effacer tous tes classements de défis entre amis ? Cette action est définitive.')) { clearChallenges(); renderMyChallenges(); }
  };
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
// Thème du jour : purement narratif, habille la contrainte mécanique réelle (académie déjà
// imposée, voir def.forcedAcademyIndex/engine/season.js startCareer()) -- l'id canonique vit
// dans engine/dailyChallenge.js (DAILY_THEMES), le libellé/la phrase d'ambiance restent ici (même
// séparation que tierLabel() ci-dessus). Écran encore non traduit (voir AGENDA.md, même périmètre
// que le reste de cette section défi du jour) -- français uniquement pour l'instant.
const DAILY_THEME_TEXT = {
  signature_surprise: { label: 'Signature surprise', desc: 'L\'agence a signé pour toi, sans même te consulter.' },
  sans_detour: { label: 'Sans détour', desc: 'Pas d\'hésitation permise aujourd\'hui -- la route est déjà tracée.' },
  contrat_impose: { label: 'Contrat imposé', desc: 'Le contrat est déjà sur la table. À toi de le rentabiliser.' },
  destin_scelle: { label: 'Destin scellé', desc: 'Le sort en est jeté avant même le premier match.' },
  depart_minute: { label: 'Départ minute', desc: 'Pas le temps de réfléchir -- embarquement immédiat.' },
  jour_sans_choix: { label: 'Jour sans choix', desc: 'Aujourd\'hui, une seule décision t\'appartient encore : bien jouer.' },
  billet_aller_simple: { label: 'Billet aller simple', desc: 'Une destination, pas de retour en arrière possible.' },
  main_forcee: { label: 'Main forcée', desc: 'Quelqu\'un d\'autre a décidé pour toi, cette fois.' },
};
function dailyThemeText(def) { return DAILY_THEME_TEXT[DAILY_THEMES[def.themeIdx]] || DAILY_THEME_TEXT.signature_surprise; }
function forcedAcademyHTML(def) {
  const n = def.academyOffers[def.forcedAcademyIndex];
  if (!n) return '';
  return `<div class="challenge-profile" style="margin-top:10px">
    <div class="challenge-profile-row">📌 Académie déjà signée : <b>${n.club.name}</b> ${n.flag}</div>
  </div>`;
}

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
  // Académie imposée (voir engine/season.js startCareer()) -- comme le défi entre amis désormais
  // (voir AGENDA.md AGD-58), mais champ dédié pour ne jamais confondre les deux modes.
  p.dailyForcedAcademyIndex = def.forcedAcademyIndex;
  // Contrairement au défi entre amis (dont l'assistant de création est désormais entièrement
  // court-circuité, voir joinChallenge()/screenCreate()), le défi du jour garde mode de vie et nom
  // LIBRES -- p.step=3 laisse donc réellement l'écran de création reprendre à l'étape mode de vie.
  // Posé dès maintenant (pas seulement au clic "Continuer") pour la même raison de robustesse à la
  // reprise de partie que documentée plus haut sur p.frozenAcademyOffers.
  p.step = 3;
  renderDailyLanding(def);
}

// Point d'entrée depuis l'écran titre.
export function startDailyChallenge() {
  const def = generateDailyDef();
  const best = getDailyBest(def.date);
  const theme = dailyThemeText(def);
  setInCareer(false);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">📅 Défi du jour</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">${def.date}</h2>
    <div class="daily-theme-badge">🔥 Thème du jour : ${theme.label}</div>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin:8px 0 14px">${theme.desc}</p>
    ${profileSummary(def)}
    ${forcedAcademyHTML(def)}
    ${best ? `<p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13px;margin-top:14px">Ton meilleur score aujourd'hui : <b style="color:var(--mint)">${best.score}</b> (${tierLabel(best.tier)})</p>` : ''}
    <div style="margin-top:22px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="playDaily">${best ? 'Retenter le défi du jour' : 'Jouer le défi du jour'}</button>
      <button class="btn ghost" id="dailyHistory">📅 Mon historique</button>
      <button class="btn ghost" id="dailyWorldLb">🌍 Classement mondial</button>
      <button class="btn ghost" id="dailyBack">Retour</button>
    </div>
  </div>`;
  document.getElementById('playDaily').onclick = () => joinDaily(def);
  document.getElementById('dailyHistory').onclick = () => renderDailyLeaderboard();
  document.getElementById('dailyWorldLb').onclick = () => renderDailyWorldLeaderboard();
  document.getElementById('dailyBack').onclick = () => screenTitle();
}

function renderDailyLanding(def) {
  setInCareer(false);
  const theme = dailyThemeText(def);
  stage.innerHTML = `<div class="end" style="max-width:520px">
    <div class="eyebrow" style="text-align:center">📅 Défi du jour -- ${def.date}</div>
    <h2 style="text-align:center;font-size:24px;margin:6px 0 4px">Départ imposé, carrière déjà engagée</h2>
    <div class="daily-theme-badge">🔥 Thème du jour : ${theme.label}</div>
    <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13.5px;margin:8px 0 14px">Le profil ET l'académie de départ sont identiques pour tout le monde aujourd'hui -- pas de choix à faire, direction le terrain. À partir de là, tes choix et ton aléatoire n'appartiennent qu'à toi.</p>
    ${profileSummary(def)}
    ${forcedAcademyHTML(def)}
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
        <span class="hof-sub">${tierLabel(r.tier)} · ${r.seasons} ${t('hof.seasons')}</span>
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
    const text = `🏀 Défi du jour HARDWOOD (${todayResult.date}) : ${todayResult.score} de score légende (${tierLabel(todayResult.tier)}) avec ${todayResult.name} !`;
    const hint = document.getElementById('dailyCopyHint');
    await shareOrFallback({ title: 'Défi du jour HARDWOOD', text }, () => { hint.style.display = 'block'; });
  };
  document.getElementById('dailyLeaderboardBack').onclick = () => screenTitle();
}
