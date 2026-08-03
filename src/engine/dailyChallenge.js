/* ============================================================
   DÉFI DU JOUR — distinct du défi entre amis (voir engine/challenges.js) :
   un seul profil de départ par jour, DÉRIVÉ DE LA DATE, identique pour
   tout le monde sans aucun serveur. Le tirage normal (nation/poste/
   style/attributs/potentiel/offres d'académie) utilise Math.random()
   partout dans le moteur (utils.js/clubs.js/academies.js...) -- plutôt
   que de réinjecter un générateur dans chaque fonction (refactor large
   et risqué pour un seul usage ponctuel), Math.random est substitué
   temporairement par un générateur PSEUDO-ALÉATOIRE DÉTERMINISTE
   dérivé de la date, le temps de l'appel, puis restauré -- toujours
   dans un try/finally pour ne JAMAIS laisser le jeu normal hériter
   d'un générateur déterministe par accident.

   Score du jour mémorisé localement (meilleur score du jour, historique
   des jours joués) -- même stockage robuste que le Panthéon/les badges.
============================================================ */
import { generateChallengeDef } from './challenges.js';
import { seedFromString } from './prng.js';

const DAILY_KEY = 'hardwood_daily_v1';
let mem = null;

// Identité propre du défi du jour (voir AGENDA.md lot rétention) : contrairement au défi entre
// amis (qui laisse le CHOIX de l'académie de départ), le défi du jour démarre "déjà engagé" --
// l'académie est choisie POUR le joueur (voir forcedAcademyIndex, lu par startCareer() dans
// engine/season.js, qui saute l'écran de choix pour p.dailyDate). Un thème du jour purement
// narratif (juste des ids ici, libellés en i18n -- voir i18n/fr.js/en.js clé `daily.themes`)
// habille cette contrainte pour qu'elle se sente comme un vrai rendez-vous quotidien, pas une
// simple variante du défi entre amis.
export const DAILY_THEMES = [
  'signature_surprise', 'sans_detour', 'contrat_impose', 'destin_scelle',
  'depart_minute', 'jour_sans_choix', 'billet_aller_simple', 'main_forcee',
];

function load() {
  if (mem !== null) return mem;
  try { const r = localStorage.getItem(DAILY_KEY); mem = r ? JSON.parse(r) : {}; } catch (e) { mem = {}; }
  if (!mem || typeof mem !== 'object') mem = {};
  return mem;
}
function save() { try { localStorage.setItem(DAILY_KEY, JSON.stringify(mem)); } catch (e) {} }

// Date du jour en UTC (YYYY-MM-DD) : volontairement PAS l'heure locale de l'appareil -- deux
// joueurs dans des fuseaux différents doivent voir le même jour au même instant réel, sinon le
// défi ne serait plus "le même pour tout le monde" au sens strict demandé.
export function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

// Génère le profil du jour (déterministe) -- ré-appelée à chaque fois plutôt que mise en cache
// en mémoire : reproductible à l'identique par construction (même date -> même graine -> mêmes
// tirages dans le même ordre), donc pas besoin de mémoriser quoi que ce soit pour la garantie de
// cohérence -- seul le RÉSULTAT DE CARRIÈRE (voir recordDailyResult) a besoin d'être mémorisé.
// Graine dérivée de la date passée directement à generateChallengeDef() (voir engine/challenges.js
// et engine/prng.js pour le mécanisme de substitution partagé, même principe que le défi entre
// amis compact -- seule la SOURCE de la graine diffère : la date ici, un entier aléatoire là-bas).
export function generateDailyDef(dateStr = getTodayDateStr()) {
  const seed = seedFromString(dateStr);
  const def = generateChallengeDef(seed);
  def.id = 'daily-' + dateStr; // jamais l'id dérivé de la graine (voir challenges.js) -- distinct de l'id d'un défi entre amis
  def.date = dateStr;
  // def.forcedAcademyIndex est déjà posé par generateChallengeDef() ci-dessus (voir AGENDA.md
  // AGD-58 -- centralisé là-bas pour profiter aussi au défi entre amis). Thème du jour dérivé de
  // la MÊME graine, base de modulo différente pour ne pas coïncider artificiellement avec l'index
  // d'académie d'un jour à l'autre.
  def.themeIdx = Math.floor(seed / 7) % DAILY_THEMES.length;
  return def;
}

// Meilleur score mémorisé pour une date donnée (ou null). Historique complet (pour le
// classement personnel) via allDailyResults().
export function getDailyBest(dateStr) { return load()[dateStr] || null; }
export function allDailyResults() {
  const all = load();
  return Object.keys(all).map(d => ({ date: d, ...all[d] })).sort((a, b) => b.date.localeCompare(a.date));
}

// N'écrase le score existant que si le nouveau est meilleur -- "son MEILLEUR score du jour",
// pas le dernier essai.
export function recordDailyResult(dateStr, result) {
  const all = load();
  const prev = all[dateStr];
  if (!prev || result.score > prev.score) { all[dateStr] = result; save(); }
  return all[dateStr];
}
export function clearDailyResults() { mem = {}; try { localStorage.removeItem(DAILY_KEY); } catch (e) {} }
