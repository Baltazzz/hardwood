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
import { newPlayer, rollTalent } from './player.js';
import { NATIONS } from '../data/nations.js';
import { POSITIONS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { generateAcademyOffers } from './academies.js';
import { withSeededRandom } from './prng.js';

const KEY = 'hardwood_challenges_v1';
let mem = null;

// Nettoyage automatique (voir AGENDA.md, ajustement du 2026-08-03 -- "clean automatiquement au
// bout d'un mois") : un défi ni créé ni retouché depuis plus de 30 jours (`updatedAt`, posé à la
// création et à chaque résultat ajouté) est purgé. Purement une question d'hygiène de stockage --
// aucune donnée "importante" ne dépend d'un défi entre amis au-delà de sa fenêtre d'usage naturelle
// (le temps que des amis se répondent les uns aux autres), jamais relu par la simulation.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
function pruneStale(all) {
  const cutoff = Date.now() - MAX_AGE_MS;
  let changed = false;
  for (const id of Object.keys(all)) {
    if ((all[id].updatedAt || 0) < cutoff) { delete all[id]; changed = true; }
  }
  return changed;
}

// Ne garde des offres d'académie que ce qui est réellement affiché/consommé (voir
// renderAcademyChoice()/chooseAcademy() dans screens.js/season.js) -- un lien de défi n'a pas
// besoin de porter les listes de prénoms de la nation ou les couleurs de club, inutiles ici et
// qui alourdiraient le lien pour rien.
function slimOffers(offers) {
  return offers.map(o => ({
    id: o.id, flag: o.flag, name: o.name, path: o.path,
    club: { name: o.club.name, linkedClub: o.club.linkedClub || null, category: o.club.category || null, comment: o.club.comment || null },
  }));
}

// Génère un profil de départ en réutilisant TELLES QUELLES les règles de génération normales
// (rollTalent()/generateAcademyOffers()) sur un joueur "brouillon" jetable -- un défi doit être un
// point de départ qu'une création de personnage normale aurait pu produire, jamais une distribution
// à part. Purement engine (aucun DOM) : réutilisable à la fois par le défi entre amis (ui/challenge.js)
// et le défi du jour (engine/dailyChallenge.js).
//
// `seed` (optionnel) : TOUTE la génération (nation/poste/style/attributs/potentiel/offres
// d'académie) tourne sous Math.random substitué par un générateur déterministe dérivé de cette
// graine (voir engine/prng.js) -- reproductible à l'identique pour la même graine. Sans `seed`
// fourni (création d'un nouveau défi entre amis), une graine fraîche est tirée au hasard.
//
// Compaction du lien de partage (voir AGENDA.md) : `id`/`seed` sont dérivés directement de la
// graine (jamais un id aléatoire séparé) -- un lien de défi entre amis n'a donc besoin d'encoder
// QUE cette graine (quelques caractères en base36, voir engine/challengeCodec.js), qui suffit à
// reconstruire tout le profil (attributs + offres d'académie inclus) côté destinataire sans
// jamais transmettre ces données elles-mêmes dans l'URL.
export function generateChallengeDef(seed) {
  const s = seed != null ? seed : Math.floor(Math.random() * 0x7FFFFFFF);
  return withSeededRandom(s, () => {
    const scratch = newPlayer();
    scratch.nation = NATIONS[Math.floor(Math.random() * NATIONS.length)];
    scratch.pos = POSITIONS[Math.floor(Math.random() * POSITIONS.length)].id;
    scratch.style = STYLES[Math.floor(Math.random() * STYLES.length)].id;
    rollTalent(scratch);
    const academyOffers = slimOffers(generateAcademyOffers(scratch.nation));
    return {
      id: 'c' + s.toString(36), seed: s,
      nationId: scratch.nation.id, pos: scratch.pos, style: scratch.style,
      attrs: { ...scratch.attrs }, potential: scratch.potential, hype: scratch.hype,
      academyOffers,
    };
  });
}

function load() {
  if (mem !== null) return mem;
  try { const r = localStorage.getItem(KEY); mem = r ? JSON.parse(r) : {}; } catch (e) { mem = {}; }
  if (!mem || typeof mem !== 'object') mem = {};
  if (pruneStale(mem)) save();
  return mem;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* repli mémoire pour la session en cours */ } }

// Enregistre (ou retrouve) la définition d'un défi -- idempotent : rejoindre deux fois le même
// lien, ou ouvrir le lien après l'avoir déjà créé sur cet appareil, ne l'écrase jamais.
export function ensureChallenge(def) {
  const all = load();
  if (!all[def.id]) { all[def.id] = { def, results: [], updatedAt: Date.now() }; save(); }
  return all[def.id];
}
export function getChallenge(id) { return load()[id] || null; }

// Tous les défis connus sur cet appareil (créés, rejoints, ou simplement reçus par un lien de
// résultat), triés du plus récemment actif au plus ancien -- voir AGENDA.md "correction
// prioritaire" : le classement d'un défi doit rester consultable en permanence via cette liste,
// pas seulement juste après avoir fini sa propre carrière.
export function listChallenges() {
  const all = load();
  return Object.keys(all).map(id => ({ id, ...all[id] })).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

// Ajoute un résultat REÇU d'un ami (lien de résultat) -- dédoublonné sur nom+score+date (un même
// lien de résultat ouvert deux fois ne crée pas deux lignes). Fonctionne même si le défi n'était
// pas encore connu localement (lien de résultat reçu avant le lien de défi original) : crée une
// entrée avec def:null, le classement reste consultable, seule l'invitation à "rejouer ce défi"
// restera indisponible tant que def n'est pas connu. Pour SON PROPRE résultat, voir
// recordMyChallengeResult() ci-dessous -- une règle différente s'applique (un seul appareil ne
// peut avoir qu'UN seul "soi", jamais plusieurs lignes qui s'accumulent à chaque tentative).
export function addResult(challengeId, result) {
  const all = load();
  if (!all[challengeId]) all[challengeId] = { def: null, results: [] };
  const dup = all[challengeId].results.some(r => r.name === result.name && r.score === result.score && r.date === result.date);
  if (!dup) all[challengeId].results.push(result);
  all[challengeId].results.sort((a, b) => b.score - a.score);
  all[challengeId].updatedAt = Date.now();
  save();
  return all[challengeId];
}

// Résultat du joueur LOCAL sur ce défi (voir AGENDA.md "correction prioritaire", point 2 --
// "rejouer le même défi pour retenter un meilleur score") : contrairement à addResult() ci-dessus
// (résultats reçus d'amis, potentiellement plusieurs personnes), un même appareil ne représente
// jamais qu'UNE seule personne -- une nouvelle tentative REMPLACE l'ancienne au lieu de s'empiler
// à côté, et seulement si elle est meilleure (même principe que recordDailyResult() dans
// engine/dailyChallenge.js). Le classement reste donc toujours "ton MEILLEUR score", jamais une
// liste de tes propres essais qui noierait les scores des autres participants.
export function recordMyChallengeResult(challengeId, result) {
  const all = load();
  if (!all[challengeId]) all[challengeId] = { def: null, results: [] };
  const results = all[challengeId].results;
  const existingIdx = results.findIndex(r => r.mine);
  if (existingIdx === -1) results.push({ ...result, mine: true });
  else if (result.score > results[existingIdx].score) results[existingIdx] = { ...result, mine: true };
  results.sort((a, b) => b.score - a.score);
  all[challengeId].updatedAt = Date.now();
  save();
  return all[challengeId];
}
export function clearChallenges() { mem = {}; try { localStorage.removeItem(KEY); } catch (e) {} }
