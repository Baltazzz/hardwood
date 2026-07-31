/* ============================================================
   RÉTENTION — trois leviers affichés en fin de carrière pour donner
   envie de relancer (voir AGENDA.md lot rétention) : un message de
   rareté crédible, le(s) prochain(s) haut fait(s) juste hors de
   portée, et une suggestion de défi personnel basée sur ce que le
   joueur n'a encore jamais essayé. Purement informatif -- ne touche
   à AUCUNE donnée de sauvegarde, ne fait AUCUN calcul de gameplay.
============================================================ */
import { BADGES } from './badges.js';
import { POSITIONS } from '../data/positions.js';

// Seuils de rareté calibrés sur une distribution RÉELLE de 300 carrières pilotées (pas une
// estimation) : p75~149, p90~227, p95~274, p99~331 de score légende observés. Volontairement
// arrondis à des seuils ronds légèrement AU-DESSUS du percentile mesuré (jamais en dessous) --
// mieux vaut sous-promettre une rareté ("seulement 10%") que la dépasser en pratique, un chiffre
// de rareté qui s'avère faux à l'usage ruinerait la crédibilité de tout le message. Ordre du
// plus rare au plus courant : la première correspondance (score suffisant) l'emporte.
const RARITY_TIERS = [
  { pct: 1, minScore: 330 },
  { pct: 5, minScore: 275 },
  { pct: 10, minScore: 225 },
  { pct: 25, minScore: 150 },
];

// Retourne le pourcentage de rareté (ex. 10 pour "seulement 10% des carrières atteignent ce
// niveau"), ou null si le score ne franchit même pas le palier le plus généreux -- pas de message
// de rareté pour une carrière ordinaire, réservé aux "grandes carrières" comme demandé.
export function rarityPct(score) {
  for (const tier of RARITY_TIERS) { if ((score || 0) >= tier.minScore) return tier.pct; }
  return null;
}

// Jusqu'à `max` hauts faits "juste hors de portée" : pas encore débloqués, mais déjà à 50% ou
// plus de leur seuil (voir champ `progress` sur certains badges d'engine/badges.js) -- triés par
// proximité (le plus proche du déblocage en premier). Ne renvoie que des badges dotés d'un
// `progress` explicite : tous n'en ont pas (certains critères booléens/multi-conditions ne se
// réduisent pas proprement à un simple "valeur/cible", mieux vaut n'en montrer AUCUN pour ceux-là
// qu'un chiffre trompeur).
export function nextBadgeHints(p, state, max = 2) {
  const candidates = [];
  for (const b of BADGES) {
    if (state.unlocked[b.id] || !b.progress) continue;
    let prog;
    try { prog = b.progress(p, state); } catch (e) { continue; }
    if (!prog || !(prog.target > 0)) continue;
    const value = Math.min(prog.value || 0, prog.target);
    const gap = prog.target - value;
    if (gap <= 0) continue;
    const ratio = value / prog.target;
    if (ratio < 0.5) continue; // pas assez proche pour être "juste hors de portée"
    candidates.push({ id: b.id, name: b.name, emoji: b.emoji, gap, unit: prog.unit, ratio });
  }
  candidates.sort((a, b) => b.ratio - a.ratio || a.gap - b.gap);
  return candidates.slice(0, max);
}

// Une piste de carrière différente, basée sur ce que le joueur n'a encore JAMAIS essayé (voir
// everPositions/everNoHomeLeague/everStartPaths dans engine/badges.js -- mis à jour à chaque
// carrière, sans condition de niveau atteint, contrairement aux compteurs "collection" réservés
// aux badges). Ordre de priorité fixe (poste, puis pays sans championnat local, puis voie de
// développement) : dès qu'une dimension entière reste inexplorée, elle prime sur les suivantes.
export function suggestChallenge(state) {
  const untriedPos = POSITIONS.map(x => x.id).find(id => !state.everPositions.includes(id));
  if (untriedPos) { const pos = POSITIONS.find(x => x.id === untriedPos); return { kind: 'position', posId: pos.id, emoji: pos.emoji }; }
  if (!state.everNoHomeLeague) return { kind: 'noHomeLeague' };
  const untriedPath = ['us', 'eu', 'au'].find(x => !state.everStartPaths.includes(x));
  if (untriedPath) return { kind: 'startPath', path: untriedPath };
  return { kind: 'generic' };
}
