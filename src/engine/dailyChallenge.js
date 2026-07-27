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

const DAILY_KEY = 'hardwood_daily_v1';
let mem = null;

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

// mulberry32 : PRNG déterministe minuscule et rapide, qualité largement suffisante pour un
// tirage de profil (pas un usage cryptographique) -- fait maison, aucune dépendance.
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Hash de chaîne simple (djb2) : transforme la date en un entier stable, servant de graine.
function seedFromString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h;
}

// Génère le profil du jour (déterministe) -- ré-appelée à chaque fois plutôt que mise en cache
// en mémoire : reproductible à l'identique par construction (même date -> même graine -> mêmes
// tirages dans le même ordre), donc pas besoin de mémoriser quoi que ce soit pour la garantie de
// cohérence -- seul le RÉSULTAT DE CARRIÈRE (voir recordDailyResult) a besoin d'être mémorisé.
export function generateDailyDef(dateStr = getTodayDateStr()) {
  const rng = mulberry32(seedFromString(dateStr));
  const original = Math.random;
  Math.random = rng;
  let def;
  try {
    def = generateChallengeDef();
  } finally {
    Math.random = original; // TOUJOURS restauré, même si generateChallengeDef() lève
  }
  def.id = 'daily-' + dateStr; // jamais l'id aléatoire interne (dépendrait de Date.now())
  def.date = dateStr;
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
