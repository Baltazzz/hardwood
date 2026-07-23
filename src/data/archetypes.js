// Trajectoires de développement : modulent la courbe d'âge (src/engine/season.js
// applyAging) pour produire des carrières non linéaires et crédibles plutôt qu'une
// progression identique pour tout le monde. weight = poids de tirage (somme = 100).
// *Mult multiplient la vitesse de progression/déclin de la bande d'âge correspondante ;
// peakAgeShift décale les bornes des bandes (jeune/dev/prime/déclin) en années.
export const ARCHETYPES = [
  {id:'normal',     name:'Régulier',   weight:50, youngMult:1.00, devMult:1.00, primeMult:1.00, declineMult:1.00, peakAgeShift:0},
  {id:'precocious', name:'Précoce',    weight:13, youngMult:1.65, devMult:1.15, primeMult:0.85, declineMult:1.30, peakAgeShift:-2},
  {id:'slowBurn',   name:'Tardif',     weight:15, youngMult:0.55, devMult:0.80, primeMult:1.55, declineMult:0.80, peakAgeShift:+3},
  {id:'stagnant',   name:'Plateau',    weight:13, youngMult:0.65, devMult:0.55, primeMult:0.55, declineMult:1.10, peakAgeShift:0},
  {id:'volatile',   name:'Irrégulier', weight:9,  youngMult:1.10, devMult:1.00, primeMult:0.85, declineMult:1.65, peakAgeShift:-1},
];
