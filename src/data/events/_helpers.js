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

/* ============================================================
   MÉMOIRE DE SITUATION DU JOUEUR (voir AGENDA.md, "cohérence de l'arborescence des choix") --
   dérivée de l'historique RÉEL des saisons (p.seasons), jamais d'un simple compteur/seuil qui
   peut être satisfait sans que la situation narrative correspondante ait vraiment eu lieu.
   Utilisée par les `when()` d'événements qui présupposent un passé précis (ancien club, rôle
   d'avant, etc.) -- pour filtrer ce qui peut être proposé selon ce qui s'est VRAIMENT passé,
   pas seulement selon des compteurs proxy comme clubTenure/seasons.length qui restent vrais même
   pour un joueur resté au même club depuis le début de sa carrière.
============================================================ */
// Un "ancien club" n'existe que si le joueur a RÉELLEMENT évolué ailleurs avant d'arriver à son
// club actuel -- clubTenure>=1 et seasons.length>=2 peuvent tous deux être vrais pour un joueur
// qui n'a JAMAIS quitté son tout premier club (bug reproduit et corrigé : voir revenge_game dans
// data/events/mid.js, "Retrouvailles avec ton ancien club" pouvait se déclencher sans qu'aucun
// ancien club n'ait jamais existé).
export function hasFormerClub(p){
  return p.seasons.some(s => s.club && s.club !== p.club);
}
