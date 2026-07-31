/* ============================================================
   PRNG déterministe partagé -- utilisé partout où le jeu a besoin d'un tirage REPRODUCTIBLE
   (défi du jour, voir dailyChallenge.js ; défi entre amis compact, voir challenges.js) sans
   jamais laisser un générateur déterministe fuiter vers le reste du jeu.
============================================================ */
// mulberry32 : PRNG déterministe minuscule et rapide, qualité largement suffisante pour un
// tirage de profil (pas un usage cryptographique) -- fait maison, aucune dépendance.
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Hash de chaîne simple (djb2) : transforme une chaîne (ex. une date) en un entier stable,
// servant de graine.
export function seedFromString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
// Exécute fn() avec Math.random substitué par un générateur déterministe dérivé de `seed` --
// restaure TOUJOURS Math.random dans un finally, même si fn() lève. Jamais de générateur
// déterministe qui fuiterait vers le reste du jeu.
export function withSeededRandom(seed, fn) {
  const rng = mulberry32(seed);
  const original = Math.random;
  Math.random = rng;
  try { return fn(); } finally { Math.random = original; }
}
