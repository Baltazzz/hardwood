import { clamp } from '../../engine/utils.js';

// Poids d'exposition médiatique : plus le joueur est médiatisé, plus les événements liés
// aux médias/à la polémique reviennent souvent. Utilisé par les événements cat:'media'.
export const mediaWeight = (p) => clamp(0.5 + p.media/70, 0.4, 2.2);
// Poids "clutch" : un joueur au sang-froid reconnu se voit confier davantage de moments décisifs.
export const clutchWeight = (base) => (p) => clamp(base + (p.clutch||0)*0.14, base, base*2.2);

// Phase de carrière : gate dur utilisé par les métadonnées `phase` des événements et par
// drawEvents(). Calibré sur les seuils déjà en place dans applyAging()/la retraite forcée
// (season.js) : déclin dès 32+shift, retraite forcée dès 34-38.
export function careerPhase(p){
  const yrs = p.seasons.length;
  if(yrs<=2 && p.age<=24) return 'early';
  if(p.age>=32) return 'late';
  return 'mid';
}

export function lastSeason(p){ return p.seasons.length ? p.seasons[p.seasons.length-1] : null; }
