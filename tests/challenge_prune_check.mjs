// Vérifie la purge automatique des défis inactifs depuis plus d'un mois (voir engine/challenges.js
// pruneStale(), AGENDA.md ajustement du 2026-08-03). Process INDÉPENDANT et dédié -- nécessaire
// car `mem` (cache mémoire du module) n'est peuplé qu'UNE fois par process, au premier appel
// touchant le stockage : la donnée doit donc être écrite dans localStorage AVANT le tout premier
// appel à une fonction de engine/challenges.js pour que la purge s'exécute réellement dessus au
// chargement, exactement comme un vrai redémarrage de l'application le ferait.
import { setupEnvironment } from './env.mjs';

setupEnvironment();

const KEY = 'hardwood_challenges_v1';
const now = Date.now();
const raw = {
  stale1: { def: null, results: [], updatedAt: now - 40 * 24 * 60 * 60 * 1000 }, // 40 jours -- au-delà du mois
  fresh1: { def: null, results: [], updatedAt: now - 2 * 24 * 60 * 60 * 1000 }, // 2 jours -- doit survivre
};
localStorage.setItem(KEY, JSON.stringify(raw));

const challengesEngine = await import('../src/engine/challenges.js');
const list = challengesEngine.listChallenges(); // premier appel -> load() -> pruneStale() s'exécute ici
const afterRaw = JSON.parse(localStorage.getItem(KEY) || '{}');

console.log('RESULT:' + JSON.stringify({
  staleGoneFromList: !list.some(c => c.id === 'stale1'),
  freshKeptInList: list.some(c => c.id === 'fresh1'),
  staleGoneFromStorage: !('stale1' in afterRaw),
  freshKeptInStorage: 'fresh1' in afterRaw,
}));
