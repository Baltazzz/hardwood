import { G } from './state.js';
import { ATTRS, POSITIONS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LIFESTYLES } from '../data/lifestyles.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { LEAGUES } from '../data/leagues.js';
import { NATIONS } from '../data/nations.js';
import { ovr, salaryFor, arrivalCoachTrust, playCountry, roleOf } from './player.js';
import { EVENTS, careerPhase } from './events.js';
import { pickClubName, clubInfo } from './clubs.js';
import { generateAcademyOffers } from './academies.js';
import { rnd, ri, pick, clamp, round, jit, capitalize, money } from './utils.js';
import { applyTagEffects } from './tags.js';
import { simulateStandings, simulatePlayoffs, checkClubMovement, clubPercentile } from './competition.js';
import { renderEvent, showDeltaFlash, renderSeasonResult, renderMoveScreen, renderAcademyChoice, renderNationalResult, endCareer } from '../ui/screens.js';

// Tournoi de zone continentale de la sélection nationale, par continent réel (p.nation.continent
// -- voir data/nations.js). L'Océanie rejoint la zone Asie (FIBA Asia Cup, comme dans la réalité
// depuis le rattachement de l'Australie/Nouvelle-Zélande à cette zone).
const ZONE_TOURN = { europe:'EuroBasket', namerica:'Coupe des Amériques', samerica:'Coupe des Amériques',
  africa:'Coupe d\'Afrique', asia:'Coupe d\'Asie', oceania:'Coupe d\'Asie' };

/* ============================================================
   DÉMARRAGE DE CARRIÈRE
============================================================ */
// Ne fixe plus le point de départ directement : présente d'abord les offres d'académies (voir
// engine/academies.js) -- la nationalité n'y joue plus aucun rôle mécanique, seulement
// l'identité et l'éligibilité en sélection (voir chooseAcademy() ci-dessous).
export function startCareer(){
  const p=G;
  p.age=16; p.year=1;
  const offers = generateAcademyOffers(p.nation);
  renderAcademyChoice(offers);
}
// Finalise le début de carrière une fois une académie choisie : p.playNation (pays de JEU) part
// du pays de l'académie choisie, pas de p.nation (origine, fixe, réservé à la sélection) -- deux
// joueurs de même nationalité peuvent tout à fait démarrer dans des pays différents.
export function chooseAcademy(academyNation){
  const p=G;
  p.playNation = academyNation.id;
  p.startPath = academyNation.path;
  p.league = p.startPath==='us' ? 'college' : 'academy';
  p.club = pickClubName(p.league, playCountry(p));
  p.contractY = 2; p.salary = p.league==='college'?0:ri(20,60);
  const abroad = academyNation.id !== p.nation.id;
  pushTL(abroad
    ? `Quitte ${p.nation.name} pour l'académie de <b>${p.club}</b> (${academyNation.name}, ${LEAGUES[p.league].short}).`
    : `Débuts à <b>${p.club}</b> (${LEAGUES[p.league].short}).`);
  beginSeason();
}
export function pushTL(html){ G.timeline.push({age:G.age, html}); }

/* ============================================================
   BOUCLE DE SAISON
============================================================ */
export function beginSeason(){
  const p=G;
  p.seasonMods={ tir:0,adr3:0,dribble:0,passe:0,def:0,reb:0,ath:0,qi:0,
                 reputation:0,morale:0,coach:0,media:0,popularity:0,money:0,fitness:0,
                 perfBonus:0, injuryGames:0, forceMove:null, forceFinals:null, clubMovement:null,
                 natBonus:0 };
  // Fenêtre de sélection nationale : fixée une fois pour toutes ici, en tête de saison (même
  // condition que le tournoi lui-même, calculé plus bas dans simulateSeason()) -- sert à thémer
  // TOUTE la saison (HUD en mode "nation", voir renderEvent()/renderSeasonResult()), pas
  // seulement l'écran de résultat final. Figée dès le départ pour éviter qu'un petit
  // mouvement de réputation en cours de saison ne fasse changer le thème en plein milieu.
  p.seasonMods.natWindow = p.reputation>=45 && p.year%2===0;
  // recharge de forme en intersaison : de moins en moins efficace avec l'âge, la forme
  // s'use sur la durée d'une carrière plutôt que de repartir à l'identique chaque année
  const ageWear = clamp((p.age-27)*0.6, 0, 10);
  p.fitness = clamp(p.fitness + clamp(ri(8,20)-ageWear, 3, 20), 30, 100);
  // 2 événements narratifs par saison : moins de choix, mais plus de poids
  const n = 2;
  p.curEvents = drawEvents(n);
  p.riskMod = 1 + ((p.riskMod||1)-1)*0.5; // le risque accumulé (fêtes, etc.) s'estompe avec le temps
  p.evIndex=0;
  nextEventOrSim();
}
export function nextEventOrSim(){
  if(G.evIndex < G.curEvents.length){ renderEvent(G.curEvents[G.evIndex]); }
  else { simulateSeason(); }
}

/* ---- Sélection d'événements selon le contexte ---- */
// Anti-répétition : chaque event a des métadonnées optionnelles `phase` (early/mid/late/null),
// `once` (max 1 fois par carrière) et `cooldown` (saisons avant de redevenir pleinement probable
// après avoir été tiré). Le poids final combine la pondération propre de l'event avec un multiplicateur
// de fraîcheur : un event vu récemment chute nettement, un event jamais vu remonte progressivement
// avec les saisons passées éligible-mais-pas-tiré (p.evStats[id].streak).
export function drawEvents(n){
  const p=G, lg=LEAGUES[p.league], pool=[];
  const phase = careerPhase(p);
  for(const ev of EVENTS){
    if(ev.phase && ev.phase!==phase) continue;
    if(ev.when && !ev.when(p,lg)) continue;
    if(ev.cat==='injury' && p.seasons.length && p.seasons[p.seasons.length-1].injured) continue; // jamais deux blessures de suite
    const st = p.evStats[ev.id];
    if(ev.once && st && st.count>=1) continue;
    let wgt = ev.weight?ev.weight(p,lg):1;
    if(wgt<=0) continue;
    wgt *= freshnessMult(ev, st, p.year);
    if(wgt<=0) continue;
    pool.push({ev,wgt});
  }
  const chosen=[];
  for(let i=0;i<n && pool.length;i++){
    const total=pool.reduce((s,x)=>s+x.wgt,0);
    let r=Math.random()*total, pickEv=null,idx=-1;
    for(let j=0;j<pool.length;j++){ r-=pool[j].wgt; if(r<=0){pickEv=pool[j].ev;idx=j;break;} }
    if(!pickEv){pickEv=pool[0].ev;idx=0;}
    chosen.push(pickEv);
    pool.splice(idx,1);
    // évite deux events de même catégorie unique
    for(let k=pool.length-1;k>=0;k--){ if(pool[k].ev.cat===pickEv.cat && pickEv.solo){ pool.splice(k,1); } }
  }
  // Bookkeeping fraîcheur : les tirés repartent à zéro, les éligibles-non-tirés voient leur
  // "envie de sortir" progresser d'un cran.
  const chosenIds = new Set(chosen.map(e=>e.id));
  for(const {ev} of pool){ bumpStreak(p, ev.id); } // éligibles restés dans le pool (non tirés)
  for(const ev of chosen){
    p.evStats[ev.id] = { count:((p.evStats[ev.id]?.count)||0)+1, lastYear:p.year, streak:0 };
    p.eventHistory.push(ev.id);
  }
  return chosen;
}
function bumpStreak(p, id){
  const st = p.evStats[id];
  if(st) st.streak=(st.streak||0)+1;
  else p.evStats[id] = { count:0, lastYear:null, streak:1 };
}
function freshnessMult(ev, st, year){
  const cd = ev.cooldown ?? 3;
  if(!st || st.count===0){
    return clamp(1 + ((st?st.streak:0))*0.12, 1, 2.5); // jamais vu : remonte progressivement
  }
  const sinceLast = year - st.lastYear;
  if(sinceLast>=cd) return 1;
  return clamp(0.06 + (sinceLast/cd)*0.94, 0.06, 1); // vu récemment : nettement moins probable
}

export function applyChoice(choice, ctx){
  const p=G;
  const eff = typeof choice.effect==='function'?choice.effect(ctx):choice.effect||{};
  const deltas=[];
  for(const k in eff){
    if(k==='forceMove'){ p.seasonMods.forceMove=eff[k]; continue; }
    // Cohérence enjeu -> résultat : quand un choix règle explicitement un enjeu de titre
    // ("tir de la gagne pour le titre"), son issue doit déterminer le vrai résultat de la
    // saison — pas une simple couleur narrative découplée du palmarès (voir simulateSeason).
    if(k==='forceFinals'){ p.seasonMods.forceFinals=eff[k]; continue; }
    // p.flagYear alimente le système d'étiquettes de joueur (voir engine/tags.js) : une
    // étiquette s'estompe si son flag n'a plus été nourri depuis plusieurs saisons. flag accepte
    // une chaîne (cas courant) ou un tableau, pour les choix qui nourrissent deux récits à la fois
    // (ex. devenir leader du vestiaire = à la fois mentorLegacy et leaderRep).
    if(k==='flag'){
      const names = Array.isArray(eff[k]) ? eff[k] : [eff[k]];
      p.flagYear=p.flagYear||{};
      names.forEach(name=>{ p.flags[name]=(p.flags[name]||0)+1; p.flagYear[name]=p.year; });
      continue;
    }
    if(k==='clutch'){ p.clutch=(p.clutch||0)+eff[k]; continue; }
    if(k==='riskUp'){ p.riskMod=clamp((p.riskMod||1)+eff[k],0.8,1.9); continue; }
    if(k==='pendingFA'){ p.pendingFA=true; continue; }
    if(k==='injuryGames'){ p.seasonMods.injuryGames+=eff[k]; deltas.push({k:'Blessure',v:-eff[k],raw:true}); continue; }
    if(k==='perfBonus'){ p.seasonMods.perfBonus+=eff[k]; continue; }
    // Contribution d'un choix pris pendant la fenêtre de sélection nationale au résultat du
    // tournoi (voir natPower dans simulateSeason() et events/shared.js nation_stakes).
    if(k==='natBonus'){ p.seasonMods.natBonus=(p.seasonMods.natBonus||0)+eff[k]; continue; }
    if(k==='money'){ p.money=Math.max(0,p.money+eff[k]); deltas.push({k:'Fortune',v:eff[k],money:true}); continue; }
    if(ATTRS.find(a=>a.id===k)){ const jv=jit(eff[k]); p.attrs[k]=clamp(p.attrs[k]+jv,1,99); deltas.push({k:ATTRS.find(a=>a.id===k).name,v:jv}); }
    else if(k in p){ const jv=jit(eff[k]); p[k]=clamp(p[k]+jv,0,100); deltas.push({k:capitalize(k),v:jv}); }
  }
  if(choice.tl) pushTL(typeof choice.tl==='function'?choice.tl(ctx):choice.tl);
  // petit retour visuel via bandeau
  showDeltaFlash(choice.outcome?(typeof choice.outcome==='function'?choice.outcome(ctx):choice.outcome):null, deltas);
  p.evIndex++;
}

// Estimation légère (pas une simulation de match) du nombre de triple-doubles de la saison :
// pour chaque match réellement joué, tire une variance réaliste autour des moyennes de saison
// pour chacune des 5 statistiques, et compte les soirs où 3 d'entre elles franchissent 10.
function estimateTripleDoubles(avgs, games){
  // Filtre de plausibilité : sans au moins 3 statistiques déjà proches de 10 en moyenne de
  // saison, aucune variance raisonnable ne justifie un triple-double — évite de faire
  // apparaître des triple-doubles chez des profils qui n'ont statistiquement rien à y faire.
  const near = [avgs.pts,avgs.reb,avgs.ast,avgs.stl,avgs.blk].filter(v=>v>=7).length;
  if(near<3) return 0;
  let count=0;
  for(let i=0;i<games;i++){
    const p = Math.max(0, avgs.pts + rnd(-avgs.pts*0.28-1.5, avgs.pts*0.28+1.5));
    const r = Math.max(0, avgs.reb + rnd(-avgs.reb*0.32-1, avgs.reb*0.32+1));
    const a = Math.max(0, avgs.ast + rnd(-avgs.ast*0.32-1, avgs.ast*0.32+1));
    const s = Math.max(0, avgs.stl + rnd(-avgs.stl*0.5-0.6, avgs.stl*0.5+0.6));
    const b = Math.max(0, avgs.blk + rnd(-avgs.blk*0.5-0.6, avgs.blk*0.5+0.6));
    const doubleDigits = [p,r,a,s,b].filter(v=>v>=10).length;
    if(doubleDigits>=3) count++;
  }
  return count;
}

/* ============================================================
   SIMULATION DE SAISON
============================================================ */
export function simulateSeason(){
  const p=G;
  if(p.reputation>=42 && !p.natCap && p.year%2===0) p.natCap=true;
  const lg=LEAGUES[p.league], pos=POSITIONS.find(x=>x.id===p.pos);
  const o=ovr(p);
  // Force réelle de l'effectif du club (percentile dans son vrai vivier de ligue, voir
  // clubPercentile() dans engine/competition.js) : calculée UNE FOIS ici et réutilisée pour le
  // temps de jeu ci-dessous ET pour la note d'équipe du classement plus bas -- les deux doivent
  // juger le même effectif réel. roleOf() (engine/player.js) applique le même ajustement pour
  // que le rôle affiché (HUD, bilan de saison) ne contredise jamais les minutes réellement
  // distribuées cette saison.
  const nationId = playCountry(p);
  const clubCtx = clubPercentile(p, lg, nationId);
  const rosterAdj = (clubCtx.percentile - 0.5) * 12; // +/-6 autour des seuils de ligue
  // ----- TEMPS DE JEU : selon le niveau vs la concurrence RÉELLE du poste dans ce club -----
  // Arriver plus faible que l'effectif (effectif fort => rosterAdj>0 => barre relevée) place
  // logiquement sur le banc ; un effectif faible (rosterAdj<0) abaisse la barre et ouvre des
  // minutes plus tôt. Avant ce correctif, seul le seuil générique de la ligue comptait, identique
  // pour tous les clubs d'un même palier -- signer dans un club réel fort ou faible ne changeait
  // jamais la concurrence pour les minutes, seulement le classement (incohérence corrigée ici).
  const gap = o - (lg.starter + rosterAdj);
  const youngRun = p.age<=21 ? 1 : 0;              // les jeunes ont un peu de temps de jeu offert
  let minutes = clamp(21 + gap*1.35 + youngRun + (p.coach-50)/9, 6, 36); // la confiance du coach compte, et pèse fort
  // Drafté tard (ou en fin de tableau) : la confiance du staff n'est pas acquise, il faut
  // gratter chaque minute — pénalité qui s'estompe après une saison ou deux en NBA.
  if(p.league==='nba' && p.draftPos!=null){
    const nbaSeasonsSoFar = p.seasons.filter(s=>s.league==='nba').length;
    if(nbaSeasonsSoFar<2){
      const standing = clamp((p.draftPos-4)*0.28, 0, 13);
      minutes -= standing * (nbaSeasonsSoFar===0 ? 1 : 0.5);
    }
  }
  // Prodige précoce (potentiel élite + trajectoire précoce) : très rare, les clubs le
  // poussent plus tôt sur le terrain — ne concerne qu'une frange infime de la population.
  if(p.age<=20 && p.potential>=95 && p.devArchetype==='precocious'){ minutes += ri(4,7); }
  minutes = clamp(minutes, 3, 36);
  const form = clamp((p.fitness/100)*0.85 + 0.15 + (p.morale-50)/130, 0.6, 1.2); // le moral pèse nettement plus qu'avant
  // L'argent accumulé finance un meilleur suivi médical : réduit (dans une mesure raisonnable)
  // le temps perdu à cause des blessures de la saison.
  const medicalCare = clamp(1 - Math.min(p.money,3000)/3000*0.25, 0.75, 1);
  const leagueGames = lg.games || 82;
  // injuryGames (posé par les événements) est calibré sur une saison de référence à 82 matchs
  // (échelle NBA) : la pénalité de minutes qu'il inflige reste donc sur cette échelle fixe, quel
  // que soit le calendrier réel de la ligue jouée — une entorse ne devient pas plus grave parce
  // que la saison est plus courte. Seul l'affichage "matchs joués" (plus bas) convertit cette
  // même absence, proportionnellement, vers le nombre de matchs réel de la ligue.
  const injuryPenalty = clamp(p.seasonMods.injuryGames/82, 0, .6) * medicalCare;
  minutes = minutes*(1-injuryPenalty);
  const perf = clamp(form + p.seasonMods.perfBonus/100, .6, 1.25);

  // ----- PRODUCTION : calculée par 36 min, puis ramenée au temps de jeu réel -----
  // outclass = à quel point tu domines le niveau (une ligue plus faible = stats plus faciles)
  const outclass = clamp(o - lg.starter, -10, 15);
  const skill = (o - 40) * 0.22;
  const scoreUse = {PG:1.0, SG:1.12, SF:1.02, PF:0.90, C:0.92}[p.pos];
  const pts36 = clamp((5.5 + skill + outclass*0.36) * scoreUse, 3, 33);
  const ast36 = clamp(p.attrs.passe*0.085*({PG:1.6,SG:1.0,SF:0.8,PF:0.6,C:0.5}[p.pos]) + ({PG:2.6,SG:1.2,SF:1.0,PF:0.7,C:0.6}[p.pos]), 0.4, 11.5);
  const reb36 = clamp(p.attrs.reb*0.095*({C:1.5,PF:1.25,SF:0.9,SG:0.6,PG:0.5}[p.pos]) + ({C:2.6,PF:2.0,SF:1.2,SG:0.8,PG:0.6}[p.pos]), 0.4, 14);
  // Contres/interceptions : def (+QI pour les interceptions, anticipation) pondéré par poste —
  // les pivots contrent, les meneurs/arrières interceptent. Le niveau de ligue (outclass) donne
  // un léger bonus/malus, comme pour le scoring. Réaliste : pivot dominant ~2 ctr/match, joueur
  // de périmètre harceleur ~2 int/match, la plupart nettement en dessous.
  const levelFactor = clamp(1 + outclass*0.012, 0.8, 1.3);
  const blk36 = clamp((p.attrs.def*0.024*({C:1.0,PF:0.62,SF:0.30,SG:0.14,PG:0.10}[p.pos]) + ({C:0.15,PF:0.08,SF:0.03,SG:0.01,PG:0.01}[p.pos])) * levelFactor, 0.03, 3.2);
  const stl36 = clamp((p.attrs.def*0.013*({PG:1.05,SG:0.95,SF:0.80,PF:0.55,C:0.40}[p.pos]) + p.attrs.qi*0.0035 + ({PG:0.15,SG:0.12,SF:0.09,PF:0.06,C:0.05}[p.pos])) * levelFactor, 0.03, 3.0);
  const mFactor = minutes/36;
  let pts = clamp(pts36*mFactor*perf + rnd(-1.3,1.3), 0, 34);
  let ast = clamp(ast36*mFactor*perf + rnd(-0.7,0.7), 0, 13);
  let reb = clamp(reb36*mFactor*perf + rnd(-0.8,0.8), 0, 17);
  let blk = clamp(blk36*mFactor*perf + rnd(-0.25,0.25), 0, 4.5);
  let stl = clamp(stl36*mFactor*perf + rnd(-0.25,0.25), 0, 4.5);
  pts=round(pts,1); ast=round(ast,1); reb=round(reb,1); blk=round(blk,1); stl=round(stl,1);

  // succès collectif : force RÉELLE de l'effectif (clubCtx.percentile, même calcul que pour les
  // minutes ci-dessus et que pour les autres clubs du classement -- voir simulateStandings())
  // + apport individuel du joueur + hasard. Corrige une incohérence : avant ce lot, seule la
  // prestige générique de la ligue servait de base pour LE CLUB DU JOUEUR (les autres clubs du
  // classement utilisaient déjà leur vraie force) -- une superstar dans un club réel faible et
  // un role player dans un club réel fort avaient donc exactement la même note de départ, ce qui
  // écrasait le poids réel du niveau individuel sur le succès collectif. Coefficient individuel
  // recalé à 1.9 (vs 1.2 avant) : une superstar (o-lg.starter ~ +15-20) pèse désormais nettement
  // sur ses propres chances de titre, un role player dans un grand club reste porté par le
  // percentile de l'effectif, un club réellement faible ne gagne plus par le seul hasard du bruit
  // (audit de calibration : voir AGENDA.md, taux de titre élite maintenu dans la bande établie).
  // Le total de victoires est un pourcentage de victoires (comme en vrai) ramené au nombre de
  // matchs réels de la ligue -- une saison EuroLeague (~34 matchs) ne peut plus afficher un total
  // de victoires de saison NBA.
  const teamRating = clamp(lg.prestige*3 + (clubCtx.percentile-0.5)*24 + (o-lg.starter)*1.25 + rnd(-14,14), 5, 100);
  const winPct = clamp(0.30 + teamRating*0.005, 0.15, 0.80);
  const wins = Math.max(1, Math.round(winPct*leagueGames));

  // ----- MATCHS JOUÉS : la saison n'est pas toujours jouée en entier (blessures, temps de jeu
  // réduit qui vaut parfois une mise à l'écart côté coach) -----
  // injuryGames est sur l'échelle de référence 82 matchs (voir injuryPenalty ci-dessus) : on le
  // convertit ici, proportionnellement, vers le nombre de matchs réel de la ligue jouée — c'est
  // uniquement l'affichage "matchs joués" qui reflète le vrai calendrier, pas la pénalité de jeu.
  const missedInjury = Math.min(Math.round(p.seasonMods.injuryGames * leagueGames/82), leagueGames);
  const dnp = minutes<10 ? ri(0, Math.max(0, Math.round(leagueGames*0.08))) : 0;
  const gamesPlayed = clamp(leagueGames - missedInjury - dnp, 0, leagueGames);

  // accolades
  const acc=[]; const A=(k)=>{acc.push(k); p.accolades[k]=(p.accolades[k]||0)+1;};
  const isNBA = p.league==='nba', isEuro=p.league==='euro';
  const rookie = p.seasons.length===0 || (p.seasons.length>0 && p.seasons[p.seasons.length-1].league!==p.league && p.firstIn!==p.league);
  if(!p.firstIn) p.firstIn=p.league;

  const star = o>=lg.star;
  // Un joueur très populaire peut décrocher une place All-Star par le vote des fans, même
  // un cran sous la barre pure ovr — comme dans un vrai vote All-Star. Ne touche que cette
  // sélection précise (pas le statut "star" qui gouverne moral/réputation ci-dessous).
  const allStarPick = star || ((isNBA||isEuro) && o>=lg.star-2 && p.popularity>=78);
  if(allStarPick && minutes>24){
    if(isNBA){ A('All-Star'); }
    else if(isEuro){ A('All-EuroLeague'); }
    else { A('MVP '+lg.short); }
  }
  if(isNBA && pts>=26 && o>=87){ A('Meilleur marqueur'); }
  // Le clutch pèse dans les votes de fin de saison (MVP/titre) : un joueur au sang-froid
  // reconnu incline légèrement la balance en sa faveur.
  const clutchVoteBoost = clamp((p.clutch||0)*0.012, 0, 0.08);
  // Seuils de victoires recalés au même niveau de sélectivité qu'avant la correction du
  // pourcentage de victoires ci-dessus (même équivalent en teamRating, juste reconverti via
  // la nouvelle courbe teamRating -> % victoires) : la rareté du MVP/titre ne change pas,
  // seul l'affichage "victoires" redevient réaliste.
  if(isNBA && o>=lg.star && wins>=50 && Math.random()>(.67-clutchVoteBoost)){ A('MVP'); }
  // seuil EuroLeague ramené à l'échelle réelle de sa saison (34 matchs, pas 82)
  if(isEuro && o>=lg.star && wins>=Math.round(43*leagueGames/82) && Math.random()>(.67-clutchVoteBoost)){ A('MVP EuroLeague'); }
  if(p.attrs.def>=88 && (p.pos==='C'||p.pos==='PF'||p.pos==='SF') && Math.random()>.6 && minutes>26 && (isNBA||isEuro)){ A('Meilleur défenseur'); }

  // ----- Contexte de compétition : classement léger + phase finale résumée -----
  // Une note de saison par club (force réelle des données + bruit), le club du joueur reprenant
  // teamRating (déjà calculé plus haut, cohérent avec le reste de sa saison). Cohérence
  // enjeu -> résultat conservée : si l'événement narratif "match décisif" a tranché cette saison
  // (forceFinals), son issue EST la finale, jamais un second tirage qui pourrait la contredire.
  const standings = simulateStandings(p, lg, teamRating, nationId);
  const playoffs = simulatePlayoffs(teamRating, standings.playerRank, standings.poolSize, p.seasonMods.forceFinals);
  const champion = playoffs.champion;
  if(champion){
    A(isNBA?'Champion NBA':isEuro?'Champion EuroLeague':'Champion '+lg.short);
    // Un titre décidé par l'événement "match décisif" vient toujours d'une prestation
    // personnelle décisive dans ce money-time précis : c'est la définition d'un MVP des
    // finales, distinct du titre collectif lui-même. Un titre remporté par la seule force du
    // classement/phase finale (sans que l'événement narratif se soit présenté cette saison)
    // n'attribue pas ce trophée individuel spécifique.
    if(p.seasonMods.forceFinals!=null) A('MVP des finales');
  }
  // Montée/descente du CLUB (distincte de la progression individuelle du joueur, gérée plus
  // loin dans resolveMovement()) : uniquement pertinente pour les pyramides à divisions
  // domestiques/australiennes. Mémorisée pour être appliquée à l'intersaison.
  p.seasonMods.clubMovement = checkClubMovement(p.league, standings.playerRank, standings.poolSize);
  // rookie award
  if(rookie && (isNBA||isEuro) && o>=lg.star-3 && pts>14){ A(isNBA?'Rookie de l\'année':'Meilleur jeune'); }

  // Triple-doubles : pas de simulation match par match (le moteur ne modélise que des moyennes
  // de saison), mais une estimation légère et honnête — un tirage de variance réaliste autour
  // des moyennes déjà connues (pts/reb/ast/blk/stl), répété une fois par match réellement joué,
  // pour compter combien de fois 3 des 5 statistiques auraient dépassé 10 ce soir-là.
  const td = estimateTripleDoubles({pts,reb,ast,blk,stl}, gamesPlayed);
  p.tripleDoubles = (p.tripleDoubles||0) + td;

  // Contexte de classement condensé pour l'affichage (voir renderSeasonResult()) : le leader,
  // le joueur et 1 club juste au-dessus/en-dessous — pas le vivier complet, inutile à l'écran.
  const rank = standings.playerRank, rows = standings.rows;
  const standingsCtx = {
    poolSize: standings.poolSize, playerRank: rank,
    leader: rows[0],
    above: rank>=2 ? rows[rank-2] : null,
    below: rank<rows.length ? rows[rank] : null,
  };

  // rangement saison
  const season={year:p.year,age:p.age,league:p.league,club:p.club,pts,ast,reb,blk,stl,wins,
    gamesPlayed,leagueGames,td,ovr:o,minutes:round(minutes,0),acc:acc.slice(),champion,injured:p.seasonMods.injuryGames>0,
    standings:standingsCtx, playoffs};
  p.seasons.push(season);
  p.peakOvr=Math.max(p.peakOvr,o);

  // Sélection nationale (tournoi tous les 2 ans à partir de rep suffisante) : condition figée en
  // tête de saison (p.seasonMods.natWindow, voir beginSeason()), pas recalculée ici.
  let natLine=null;
  if(p.seasonMods.natWindow){
    // Zone continentale RÉELLE de la sélection (p.nation.continent, fixe) -- indépendante de la
    // voie de développement du joueur (p.startPath, qui vient de l'académie choisie) : un
    // prospect sénégalais formé en Europe joue la Coupe d'Afrique avec le Sénégal, pas
    // l'EuroBasket. ZONE_TOURN['asia'] couvre aussi l'Océanie (l'Australie concourt en FIBA Asia
    // Cup depuis son rattachement à la zone Asie-Océanie).
    const zoneTourn = ZONE_TOURN[p.nation.continent] || 'Coupe des Amériques';
    const tourn = pick(['Coupe du Monde','Jeux Olympiques', zoneTourn]);
    // Déjà construit sur le même principe que le club (force réelle de l'équipe -- ici
    // p.nation.strength, fixe par nation -- + apport individuel + bruit) : pas de bug de fond
    // symétrique à celui du club (qui utilisait un prestige générique au lieu de la vraie force
    // du club signé). Coefficient individuel légèrement relevé (0.6 -> 0.75) par cohérence avec
    // le renforcement du poids individuel côté club. + natBonus : contribution des choix
    // contextuels pris pendant la fenêtre de sélection (voir events/shared.js nation_stakes).
    const natPower = clamp(p.nation.strength + (o-70)*0.75 + (p.seasonMods.natBonus||0) + rnd(-16,16),20,105);
    let medal=null;
    if(natPower>96){ medal='Or'; A('🥇 '+tourn); }
    else if(natPower>88){ medal='Argent'; A('🥈 '+tourn); }
    else if(natPower>80){ medal='Bronze'; A('🥉 '+tourn); }
    natLine={tourn,medal, mvp:(o>=88 && natPower>90 && Math.random()>.6)};
    if(natLine.mvp){ A('MVP '+tourn); }
    if(medal) pushTL(`${medalEmoji(medal)} <b>${medal}</b> à ${tourn} avec ${p.nation.name}.`);
    else pushTL(`Éliminé en phase finale de ${tourn} avec ${p.nation.name}.`);
  }

  // effets moraux post-saison
  // Les médias pilotent l'exposition : plus t'es médiatisé, plus l'opinion publique amplifie
  // aussi bien tes bonnes que tes mauvaises saisons (plus à gagner, plus à perdre).
  const mediaAmp = clamp(0.55 + p.media/95, 0.55, 1.5);
  if(star){ p.morale=clamp(p.morale+6,0,100); p.reputation=clamp(p.reputation+ (isNBA?7:isEuro?5:4)*mediaAmp,0,100); p.popularity=clamp(p.popularity+(isNBA?6:3),0,100); }
  else if(minutes<12){ p.morale=clamp(p.morale-7,0,100); }
  if(champion){ p.morale=clamp(p.morale+10,0,100); p.reputation=clamp(p.reputation+6*mediaAmp,0,100); }
  p.reputation=clamp(p.reputation + ((pts-12)*0.25 + (o-lg.starter)*0.15)*mediaAmp, 0, 100);
  // La confiance du staff se regagne (ou s'effrite) avec les prestations réelles — plus vite
  // qu'elle ne s'est perdue à l'arrivée, pour qu'une période d'adaptation dure 1-2 saisons,
  // pas cinq. Une bonne saison à forte production/minutes restaure nettement la confiance.
  p.coach = clamp(p.coach + (pts-11)*0.9 + (minutes-16)*0.35 + (champion?6:0), 0, 100);
  // gains financiers approximatifs
  p.money += p.salary + (isNBA?p.popularity*4: p.popularity*1.2) + p.reputation*(isNBA?1.5:0.6);

  if(p.league==='nba'){ if(p.firstNbaAge===null) p.firstNbaAge=p.age; p.nbaStruggle = minutes<14 ? (p.nbaStruggle+1) : 0; }
  else { p.nbaStruggle=0; }

  // La sélection nationale se vit comme une parenthèse à part : quand un tournoi a eu lieu
  // cette saison, son résultat s'annonce sur son propre écran dédié (voir renderNationalResult()
  // dans screens.js -- rapide si l'issue est mauvaise, une vraie séquence de célébration en cas
  // de médaille), AVANT de revenir au bilan de saison classique du club.
  if(natLine){ renderNationalResult(natLine, () => renderSeasonResult(season, champion)); }
  else { renderSeasonResult(season, champion); }
}
function medalEmoji(m){return m==='Or'?'🥇':m==='Argent'?'🥈':'🥉';}
// Texte de bilan synchronisé sur roleOf(p) (source unique du rôle réel, voir engine/player.js) :
// avant ce correctif, ce verdict comparait l'OVR de la saison à des seuils propres (gap>=4 pour
// "titulaire", sinon "tu grappilles ta place dans la rotation" par défaut) qui pouvaient
// contredire le vrai rôle affiché ailleurs (HUD, étiquette de rôle) -- un titulaire net (roleOf
// = 'starter') pouvait par exemple entendre le message de rotation. Appelé juste après
// simulateSeason(), avant toute progression d'intersaison : p reflète encore exactement l'état
// de la saison s qu'on commente.
export function seasonVerdict(p,s,lg){
  const role = roleOf(p).key;
  if(role==='franchise') return `Saison référence. Tu es l'un des tout meilleurs de ${lg.name} : les projecteurs sont braqués sur toi.`;
  if(role==='star') return `Belle saison de star à ${s.club}. Tu t'affirmes parmi les meilleurs de ${lg.name}, la confiance grandit match après match.`;
  if(role==='starter') return `Bonne saison de titulaire à ${s.club}. Tu tiens ton rang et tu attires le regard.`;
  if(role==='rotation') return `Saison correcte, tu grappilles ta place dans la rotation. Le vrai palier reste à franchir.`;
  return `Saison compliquée : peu de temps de jeu, tu tournes surtout au bout du banc. Il faut hausser le ton ou changer d'air.`;
}

/* ============================================================
   INTERSAISON : progression, transferts, retraite
============================================================ */
export function postSeason(){
  const p=G, lg=LEAGUES[p.league], o=ovr(p);
  // Une saison de plus bouclée dans ce club : l'ancienneté avance (doMove la remet à 0 si un
  // transfert suit dans la foulée) — sert de garde-fou de cohérence pour les événements de statut
  // "acquis" (leader du vestiaire, etc.) qui ne doivent pas sortir dès la signature.
  p.clubTenure = (p.clubTenure||0) + 1;
  // Effets mesurés des étiquettes de joueur actives (voir engine/tags.js) : volontairement
  // petits, jamais sur les attributs ni les probabilités de récompense.
  applyTagEffects(p);
  // --- progression / déclin ---
  applyAging();
  // --- retraite ? ---
  if(p.age>=34){
    const oNow=ovr(p);
    if(p.age>=38 || (oNow < lg.starter-10) ){ return endCareer('forced'); }
  }
  // --- mouvement de club / promotion / draft ---
  const move = resolveMovement();
  // avance le temps
  p.year++; p.age++;
  p.contractY = Math.max(0,p.contractY-1);
  // build offer screen if a move happened, else continue
  if(move){ renderMoveScreen(move); }
  else { beginSeason(); }
}

function applyAging(){
  const p=G, life=LIFESTYLES.find(l=>l.id===p.life), pos=POSITIONS.find(x=>x.id===p.pos);
  const arch = ARCHETYPES.find(a=>a.id===p.devArchetype) || ARCHETYPES[0];
  const lastSeason = p.seasons.length ? p.seasons[p.seasons.length-1] : null;
  const lastMin = lastSeason ? lastSeason.minutes : 15;
  // Facteur de croissance composite : le temps de jeu reste le facteur dominant, à
  // l'identique d'avant (même formule/plafond). Le moral et la performance réelle de la
  // saison (vs ce qu'on attend à ce niveau) viennent moduler ce facteur EN PLUS, de façon
  // neutre autour de la moyenne — un joueur "dans la norme" n'est ni pénalisé ni avantagé
  // par ces deux ajouts, seuls les écarts (bien/mal jouer, moral haut/bas) comptent.
  let growthFactor = clamp(0.7 + lastMin/50, 0.7, 1.4);
  // référence à 58 (proche du moral de départ typique), pas 50, pour rester neutre en moyenne
  growthFactor *= clamp(1 + (p.morale-58)/560, 0.9, 1.08);
  if(lastSeason){
    const prodIndex = lastSeason.pts + lastSeason.ast*1.1 + lastSeason.reb*0.9;
    const expected = clamp((lastSeason.ovr-40)*0.65, 4, 32);
    const overperf = clamp((prodIndex-expected)/expected, -0.4, 0.5);
    // pourcentage de victoires plutôt que total brut : reste valable quel que soit le nombre
    // de matchs réels de la ligue jouée la saison passée (NBA 82, EuroLeague ~34, etc.)
    const lastGames = lastSeason.leagueGames || 82;
    const winFactor = clamp((lastSeason.wins/lastGames - 0.50)/2.68, -0.05, 0.05);
    growthFactor *= clamp(1 + overperf*0.14 + winFactor, 0.9, 1.1);
  }
  growthFactor = clamp(growthFactor, 0.6, 1.6);
  // Courbe d'âge décalée par trajectoire (precoce monte/plafonne plus tôt, tardif l'inverse)
  const shift = arch.peakAgeShift;
  const young = p.age<=24+shift, dev = p.age<=27+shift, prime = p.age<=31+shift, decline = p.age>=32+shift;
  const stB=(STYLES.find(x=>x.id===p.style)||{}).boost||{};
  ATTRS.forEach(a=>{
    // plafond PAR attribut : proche du potentiel pour tes points forts de poste, plus bas ailleurs ; bonus sur ton style
    const w = pos.w[a.id]||0;
    const styleBonus = stB[a.id]?5:0;
    const ceil = clamp(Math.round(p.potential - (w>=0.16?0 : w>=0.08?8 : 15) + styleBonus), 40, 99);
    const roomA = clamp(ceil - p.attrs[a.id], 0, 40); // marge propre à cet attribut
    let d=0;
    if(young){
      d = (clamp(roomA*0.16,0,4.2) * life.grow * growthFactor + rnd(-0.3,0.7)) * arch.youngMult;
    } else if(dev){
      d = (clamp(roomA*0.10,0,2.6) * life.grow * growthFactor + rnd(-0.4,0.5)) * arch.devMult;
    } else if(prime){
      d = ((roomA>2?clamp(roomA*0.05,0,1.1):0)*growthFactor + rnd(-0.4,0.5)*life.grow) * arch.primeMult;
    } else if(decline){
      const fast=['ath','dribble','def','reb']; const g=(p.age-(31+shift));
      d = (fast.includes(a.id)? -rnd(1.4,2.8+g*0.5) : -rnd(0.5,1.3+g*0.25)) * arch.declineMult;
    }
    p.attrs[a.id]=clamp(Math.round(p.attrs[a.id]+d),1,99);
  });
  // usure blessure : mode de vie risqué grignote l'athlé (rare)
  if(Math.random() < 0.05*life.injury){ p.attrs.ath=clamp(p.attrs.ath-ri(1,3),1,99); }
}

/* Décide s'il faut proposer un transfert / promotion / draft cette intersaison */
function resolveMovement(){
  const p=G, lg=LEAGUES[p.league], o=ovr(p);
  const last=p.seasons[p.seasons.length-1];
  // dernier rung avant la NBA : EuroLeague pour les chemins eu/us, NBL pour l'Australie
  const continental = p.startPath==='au' ? 'nbl' : 'euro';

  // forceMove imposé par un choix d'événement
  if(p.seasonMods.forceMove){ return buildMove(p.seasonMods.forceMove); }

  // --- Montée/descente du CLUB (distincte de la progression individuelle ci-dessous) : le
  // classement de fin de saison a placé l'équipe en zone de relégation ou de promotion dans sa
  // pyramide domestique/australienne. Le club garde son nom, seul le palier change. ---
  if(p.seasonMods.clubMovement){
    const { direction, newLeague } = p.seasonMods.clubMovement;
    const club = p.club;
    if(direction==='relegated') return { type:'clubRelegated', to:newLeague, club };
    return { type:'clubPromoted', to:newLeague, club };
  }

  // --- Free agency : le joueur a refusé de prolonger → de vraies offres arrivent ---
  if(p.pendingFA){ p.pendingFA=false; return {type:'freeAgency'}; }

  // --- NBA : le pari a échoué (pas de temps de jeu) → renvoyé se relancer, en G-League côté US, sinon au rung continental ---
  if(p.league==='nba' && p.nbaStruggle>=2 && o<LEAGUES.nba.starter){
    const sendTo = p.startPath==='us' ? 'gleague' : continental;
    return {type:'nbaReturn', to:sendTo, club:pickClubName(sendTo, playCountry(p))};
  }

  // --- SCÉNARIO SPÉCIAL : légende continentale en fin de carrière, jamais passée par la NBA ---
  // Une franchise lui offre un contrat court "pour la beauté du geste" (31-34 ans)
  if((p.league==='euro'||p.league==='nbl') && p.age>=31 && p.age<=34 && p.firstNbaAge===null && !p.swanOffered
     && o>=LEAGUES[p.league].star-1 && p.reputation>=70 && Math.random()<0.5){
    p.swanOffered=true;
    return {type:'nbaSwan', to:'nba', club:pickClubName('nba', playCountry(p))};
  }

  // ================= VOIE US =================
  if(p.league==='college'){
    if(!p.draftEntered){
      if(p.age>=22) return {type:'draftDecl', origin:'college', forced:true}; // éligibilité automatique : dernière chance
      const yrs=p.seasons.length;
      if(p.age>=19 && (o>=60 || yrs>=3 || p.age>=21)){ return {type:'draftDecl', origin:'college'}; }
    }
    return null;
  }
  if(p.league==='gleague' && o>=LEAGUES.gleague.starter+2 && p.age<=28){
    return {type:'callup', to:'nba', club:pickClubName('nba', playCountry(p))};
  }

  // --- DÉCLARATION À LA DRAFT — fenêtre 19-22 ans, une seule vraie entrée par carrière ---
  // Accessible à tous les paliers (hors college/G-League/NBA, qui ont leur propre filière),
  // sans seuil de niveau/réputation. Au-delà de 22 ans on n'est plus draftable : éligibilité
  // automatique forcée cette dernière année si le joueur n'a encore jamais tenté sa chance.
  // La probabilité de se déclarer volontairement monte avec l'âge (on attend d'être prêt).
  if(!p.draftEntered){
    if(p.age>=22){
      return {type:'draftDecl', origin:'intl', forced:true};
    }
    if(p.age>=19){
      const declareChance = {19:0.30, 20:0.55, 21:0.8}[p.age] ?? 0.5;
      if(Math.random()<declareChance) return {type:'draftDecl', origin:'intl'};
    }
  }

  // ================= VOIE EUROPE (3 paliers domestiques) =================
  // La toute première signature pro (formation -> 3e division) reste dans le pays de formation :
  // ce n'est qu'un premier contrat, pas encore une expatriation (voir CLAUDE.md du lot). Les
  // promotions SUIVANTES, en revanche, sont l'occasion réaliste d'une offre venue d'un autre
  // pays : le joueur a déjà fait ses preuves en pro, le marché européen s'intéresse à lui au-delà
  // de ses frontières. Quitter son pays, découvrir un nouveau championnat -- un vrai tournant.
  if(p.league==='academy' && p.startPath==='eu' && (o>=LEAGUES.third.starter-2 || p.age>=19)){
    return {type:'promo', to:'third', club:pickClubName('third', playCountry(p))};
  }
  if(p.league==='third' && o>=LEAGUES.second.starter-3){
    if(p.startPath==='eu' && Math.random()<0.3){
      const destId = pickExpatNation(p);
      if(destId){
        const nc = pickClubName('second', destId, {exclude:p.club});
        if(nc) return {type:'expatriate', to:'second', club:nc, destNation:destId, fromNation:playCountry(p)};
      }
    }
    return {type:'promo', to:'second', club:pickClubName('second', playCountry(p))};
  }
  if(p.league==='second' && o>=LEAGUES.national.starter-3){
    if(p.startPath==='eu' && Math.random()<0.3){
      const destId = pickExpatNation(p);
      if(destId){
        const nc = pickClubName('national', destId, {exclude:p.club});
        if(nc) return {type:'expatriate', to:'national', club:nc, destNation:destId, fromNation:playCountry(p)};
      }
    }
    return {type:'promo', to:'national', club:pickClubName('national', playCountry(p))};
  }

  // ================= VOIE AUSTRALIE (formation -> NBL1 -> NBL) =================
  if(p.league==='academy' && p.startPath==='au' && (o>=LEAGUES.nbl1.starter-2 || p.age>=19)){
    return {type:'promo', to:'nbl1', club:pickClubName('nbl1', playCountry(p))};
  }
  if(p.league==='nbl1' && o>=LEAGUES.nbl.starter-3){
    return {type:'promo', to:'nbl', club:pickClubName('nbl', playCountry(p))};
  }

  if(p.league==='national' && o>=LEAGUES.euro.starter-3){
    return {type:'promo', to:'euro', club:pickClubName('euro', playCountry(p))};
  }
  // Star continentale confirmée : fenêtre NBA à un seuil atteignable, seulement dans la fenêtre de prime (≤29 ans)
  const declinedRecently = p.declined.nbaYear && (p.year - p.declined.nbaYear) < 3;
  if((p.league==='euro'||p.league==='nbl') && p.age<=29 && o>=LEAGUES[p.league].starter+1 && p.reputation>=52 && !declinedRecently && Math.random()<0.55){
    return {type:'nbaWindow', to:'nba', club:pickClubName('nba', playCountry(p))};
  }

  // Transferts latéraux une fois installé (varier les clubs)
  if(last && o>=lg.star-3 && p.contractY<=0 && Math.random()>0.45){
    const nc = pickClubName(p.league, playCountry(p), {exclude:p.club});
    if(nc && nc!==p.club) return {type:'transfer', to:p.league, club:nc};
  }

  // Relégation si trop faible. La G League et l'EuroLeague sont accessibles par des joueurs de
  // n'importe quel chemin (G League nativement en voie us, ou en voie eu/au via la case
  // "rejoindre la G League" après un échec à la draft ; EuroLeague nativement en voie eu, ou en
  // voie us via la case "signer un gros contrat en EuroLeague" après un échec à la draft
  // universitaire) : seul un profil venu d'Europe a une 2e division / élite nationale domestique
  // où redescendre depuis ces deux paliers. Pour un profil us/au sans équivalent domestique
  // modélisé sous ce palier, la relégation retombe en G League plutôt que vers une cible
  // nation-incompatible.
  if(o < lg.starter-9 && lg.tier<5){
    const down = p.league==='gleague'
      ? (p.startPath==='eu' ? 'second' : null)
      : p.league==='euro'
      ? (p.startPath==='eu' ? 'national' : 'gleague')
      : { nba:continental, nbl:'nbl1', national:'second',
          second:'third', third:'academy', nbl1:'academy' }[p.league];
    if(down) return {type:'demote', to:down, club:pickClubName(down, playCountry(p))};
  }
  return null;
}
function buildMove(fm){
  const to = fm.to || G.league;
  const club = fm.club || pickClubName(to, playCountry(G), {exclude:G.club});
  return {type:fm.type||'transfer', to, club};
}

// Tire un pays étranger candidat pour une offre d'expatriation : une autre nation de voie
// Europe que le pays où le joueur évolue actuellement (jamais son propre pays de jeu).
export function pickExpatNation(p){
  const cur = playCountry(p);
  const pool = NATIONS.filter(n=>n.path==='eu' && n.id!==cur);
  return pool.length ? pick(pool).id : null;
}

export function draftProjection(o,rep){
  // meilleur OVR/réputation => meilleur pick
  const score = o*1.3 + rep*0.7 + rnd(-18,18);
  if(score>150) return ri(1,5);
  if(score>135) return ri(4,14);
  if(score>120) return ri(12,30);
  if(score>108) return ri(28,45);
  if(score>98)  return ri(40,60);
  return ri(61,80); // non draftée
}

export function doMove(move,eff,kind){
  const p=G;
  // Expatriation : bascule le pays de JEU (bassin de clubs), jamais le pays d'ORIGINE (p.nation,
  // fixe, réservé à l'éligibilité en sélection nationale — voir playCountry() dans player.js).
  if(move.type==='expatriate' && move.destNation) p.playNation = move.destNation;
  p.league=move.to; p.club=move.club;
  p.contractY = ri(2,4);
  let explicitSal=null;
  for(const k in (eff||{})){ if(k==='salary'){ explicitSal=eff[k]; } else if(k!=='coach'){ p[k]=clamp(p[k]+eff[k],0,100);} }
  p.salary = (explicitSal!=null) ? explicitSal : salaryFor(p.league, ovr(p), p.reputation);
  const lg=LEAGUES[p.league];
  // Nouveau club, nouveau staff qui ne te connaît pas encore : la confiance du coach est
  // recalculée à partir de zéro selon ton statut d'arrivée et l'exigence réelle du club —
  // elle ne se transporte plus telle quelle depuis l'ancien club.
  const info = clubInfo(p.league, playCountry(p), p.club);
  p.coach = arrivalCoachTrust(p, ovr(p), lg, info?.prestige ?? null, info?.category ?? null, kind);
  p.clubTenure = 0; // nouveau club, nouveau staff : l'ancienneté repart de zéro (cf. cohérence contextuelle)
  if(move.type==='expatriate' && move.destNation){
    const fromName = NATIONS.find(n=>n.id===move.fromNation)?.name || p.nation.name;
    const destName = NATIONS.find(n=>n.id===move.destNation)?.name || '';
    pushTL(`✈️ Quitte ${fromName} pour <b>${p.club}</b> (${destName}, ${lg.short}) · 💰 ${money(p.salary)}/an.`);
  } else {
    pushTL(`Signe à <b>${p.club}</b> (${lg.short}) · 💰 ${money(p.salary)}/an.`);
  }
  beginSeason();
}
export function beginSeasonKeep(){ // reste dans le club, mais renouvelle le contexte
  const p=G; if(p.contractY<=0) p.contractY=ri(1,3);
  beginSeason();
}
