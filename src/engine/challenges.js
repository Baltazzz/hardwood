/* ============================================================
   DÉFIS ENTRE AMIS — stockage local, même pattern robuste que le
   Panthéon/les badges (localStorage, repli mémoire si indisponible,
   jamais d'erreur levée). Purement local : aucun serveur ne fait
   autorité, chaque appareil accumule ce qu'il a lui-même joué et ce
   qu'on lui a partagé (voir engine/challengeCodec.js pour comment un
   résultat voyage d'un appareil à l'autre, via un lien).

   Forme : { [challengeId]: { def, results: [{name,score,tier,
   seasons,hof,date}, ...] } } -- results trié par score décroissant.
============================================================ */
const KEY = 'hardwood_challenges_v1';
let mem = null;

function load() {
  if (mem !== null) return mem;
  try { const r = localStorage.getItem(KEY); mem = r ? JSON.parse(r) : {}; } catch (e) { mem = {}; }
  if (!mem || typeof mem !== 'object') mem = {};
  return mem;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* repli mémoire pour la session en cours */ } }

// Enregistre (ou retrouve) la définition d'un défi -- idempotent : rejoindre deux fois le même
// lien, ou ouvrir le lien après l'avoir déjà créé sur cet appareil, ne l'écrase jamais.
export function ensureChallenge(def) {
  const all = load();
  if (!all[def.id]) { all[def.id] = { def, results: [] }; save(); }
  return all[def.id];
}
export function getChallenge(id) { return load()[id] || null; }

// Ajoute un résultat (le sien, ou celui d'un ami reçu par lien de résultat) -- dédoublonné sur
// nom+score+date (un même lien de résultat ouvert deux fois ne crée pas deux lignes). Fonctionne
// même si le défi n'était pas encore connu localement (lien de résultat reçu avant le lien de
// défi original) : crée une entrée avec def:null, le classement reste consultable, seule
// l'invitation à "rejouer ce défi" restera indisponible tant que def n'est pas connu.
export function addResult(challengeId, result) {
  const all = load();
  if (!all[challengeId]) all[challengeId] = { def: null, results: [] };
  const dup = all[challengeId].results.some(r => r.name === result.name && r.score === result.score && r.date === result.date);
  if (!dup) all[challengeId].results.push(result);
  all[challengeId].results.sort((a, b) => b.score - a.score);
  save();
  return all[challengeId];
}
export function clearChallenges() { mem = {}; try { localStorage.removeItem(KEY); } catch (e) {} }
