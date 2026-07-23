import { G } from './state.js';
import { ATTRS, POSITIONS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LIFESTYLES } from '../data/lifestyles.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { LEAGUES } from '../data/leagues.js';
import { ovr, salaryFor } from './player.js';
import { EVENTS } from './events.js';
import { pickClubName } from './clubs.js';
import { rnd, ri, pick, clamp, round, jit, capitalize, money } from './utils.js';
import { renderEvent, showDeltaFlash, renderSeasonResult, renderMoveScreen, endCareer } from '../ui/screens.js';

/* ============================================================
   DÉMARRAGE DE CARRIÈRE
============================================================ */
export function startCareer(){
  const p=G;
  p.league = p.nation.path==='us' ? 'college' : 'academy';
  p.club = pickClubName(p.league, p.nation.id);
  p.contractY = 2; p.salary = p.league==='college'?0:ri(20,60);
  p.age=16; p.year=1;
  pushTL(`Débuts à <b>${p.club}</b> (${LEAGUES[p.league].short}).`);
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
                 perfBonus:0, injuryGames:0, forceMove:null };
  // recharge forme en intersaison
  p.fitness = clamp(p.fitness + ri(8,20), 40, 100);
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
export function drawEvents(n){
  const p=G, lg=LEAGUES[p.league], pool=[];
  for(const ev of EVENTS){
    if(ev.when && !ev.when(p,lg)) continue;
    if(ev.cat==='injury' && p.seasons.length && p.seasons[p.seasons.length-1].injured) continue; // jamais deux blessures de suite
    let wgt = ev.weight?ev.weight(p,lg):1;
    if(wgt<=0) continue;
    pool.push({ev,wgt});
  }
  const chosen=[]; const used=new Set();
  for(let i=0;i<n && pool.length;i++){
    const total=pool.reduce((s,x)=>s+x.wgt,0);
    let r=Math.random()*total, pickEv=null,idx=-1;
    for(let j=0;j<pool.length;j++){ r-=pool[j].wgt; if(r<=0){pickEv=pool[j].ev;idx=j;break;} }
    if(!pickEv){pickEv=pool[0].ev;idx=0;}
    chosen.push(pickEv); used.add(pickEv.id);
    pool.splice(idx,1);
    // évite deux events de même catégorie unique
    for(let k=pool.length-1;k>=0;k--){ if(pool[k].ev.cat===pickEv.cat && pickEv.solo){ pool.splice(k,1); } }
  }
  return chosen;
}

export function applyChoice(choice, ctx){
  const p=G;
  const eff = typeof choice.effect==='function'?choice.effect(ctx):choice.effect||{};
  const deltas=[];
  for(const k in eff){
    if(k==='forceMove'){ p.seasonMods.forceMove=eff[k]; continue; }
    if(k==='flag'){ p.flags[eff[k]]=(p.flags[eff[k]]||0)+1; continue; }
    if(k==='clutch'){ p.clutch=(p.clutch||0)+eff[k]; continue; }
    if(k==='riskUp'){ p.riskMod=clamp((p.riskMod||1)+eff[k],0.8,1.9); continue; }
    if(k==='pendingFA'){ p.pendingFA=true; continue; }
    if(k==='injuryGames'){ p.seasonMods.injuryGames+=eff[k]; deltas.push({k:'Blessure',v:-eff[k],raw:true}); continue; }
    if(k==='perfBonus'){ p.seasonMods.perfBonus+=eff[k]; continue; }
    if(k==='money'){ p.money=Math.max(0,p.money+eff[k]); deltas.push({k:'Fortune',v:eff[k],money:true}); continue; }
    if(ATTRS.find(a=>a.id===k)){ const jv=jit(eff[k]); p.attrs[k]=clamp(p.attrs[k]+jv,1,99); deltas.push({k:ATTRS.find(a=>a.id===k).name,v:jv}); }
    else if(k in p){ const jv=jit(eff[k]); p[k]=clamp(p[k]+jv,0,100); deltas.push({k:capitalize(k),v:jv}); }
  }
  if(choice.tl) pushTL(typeof choice.tl==='function'?choice.tl(ctx):choice.tl);
  // petit retour visuel via bandeau
  showDeltaFlash(choice.outcome?(typeof choice.outcome==='function'?choice.outcome(ctx):choice.outcome):null, deltas);
  p.evIndex++;
}

/* ============================================================
   SIMULATION DE SAISON
============================================================ */
export function simulateSeason(){
  const p=G;
  if(p.reputation>=42 && !p.natCap && p.year%2===0) p.natCap=true;
  const lg=LEAGUES[p.league], pos=POSITIONS.find(x=>x.id===p.pos);
  const o=ovr(p);
  // ----- TEMPS DE JEU : selon le niveau vs seuil de titulaire de la ligue -----
  const gap = o - lg.starter;
  const youngRun = p.age<=21 ? 1 : 0;              // les jeunes ont un peu de temps de jeu offert
  let minutes = clamp(21 + gap*1.35 + youngRun + (p.coach-50)/14, 6, 36); // la confiance du coach compte
  // Drafté tard (ou en fin de tableau) : la confiance du staff n'est pas acquise, il faut
  // gratter chaque minute — pénalité qui s'estompe après une saison ou deux en NBA.
  if(p.league==='nba' && p.draftPos!=null){
    const nbaSeasonsSoFar = p.seasons.filter(s=>s.league==='nba').length;
    if(nbaSeasonsSoFar<2){
      const standing = clamp((p.draftPos-4)*0.28, 0, 13);
      minutes -= standing * (nbaSeasonsSoFar===0 ? 1 : 0.5);
    }
  }
  minutes = clamp(minutes, 3, 36);
  const form = clamp((p.fitness/100)*0.85 + 0.15 + (p.morale-50)/240, 0.6, 1.2);
  const injuryPenalty = clamp(p.seasonMods.injuryGames/82, 0, .6);
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
  const mFactor = minutes/36;
  let pts = clamp(pts36*mFactor*perf + rnd(-1.3,1.3), 0, 34);
  let ast = clamp(ast36*mFactor*perf + rnd(-0.7,0.7), 0, 13);
  let reb = clamp(reb36*mFactor*perf + rnd(-0.8,0.8), 0, 17);
  pts=round(pts,1); ast=round(ast,1); reb=round(reb,1);

  // succès collectif : prestige club + ton niveau + hasard
  const teamRating = clamp(lg.prestige*3 + (o-lg.starter)*1.2 + rnd(-14,14), 5, 100);
  const wins = clamp(Math.round(teamRating*0.62), 6, 64);

  // accolades
  const acc=[]; const A=(k)=>{acc.push(k); p.accolades[k]=(p.accolades[k]||0)+1;};
  const isNBA = p.league==='nba', isEuro=p.league==='euro';
  const rookie = p.seasons.length===0 || (p.seasons.length>0 && p.seasons[p.seasons.length-1].league!==p.league && p.firstIn!==p.league);
  if(!p.firstIn) p.firstIn=p.league;

  const star = o>=lg.star;
  if(star && minutes>24){
    if(isNBA){ A('All-Star'); }
    else if(isEuro){ A('All-EuroLeague'); }
    else { A('MVP '+lg.short); }
  }
  if(isNBA && pts>=26 && o>=87){ A('Meilleur marqueur'); }
  if(isNBA && o>=lg.star && wins>=36 && Math.random()>.6){ A('MVP'); }
  if(isEuro && o>=lg.star && wins>=26 && Math.random()>.6){ A('MVP EuroLeague'); }
  if(p.attrs.def>=88 && (p.pos==='C'||p.pos==='PF'||p.pos==='SF') && Math.random()>.6 && minutes>26 && (isNBA||isEuro)){ A('Meilleur défenseur'); }
  // titre
  const championOdds = clamp((teamRating-58)/60,0,.7);
  let champion=false;
  if(wins>=Math.round(lg.prestige*3.2) && Math.random()<championOdds+ (o>=lg.star?.12:0)){ champion=true; A(isNBA?'Champion NBA':isEuro?'Champion EuroLeague':'Champion '+lg.short); }
  // rookie award
  if(rookie && (isNBA||isEuro) && o>=lg.star-3 && pts>14){ A(isNBA?'Rookie de l\'année':'Meilleur jeune'); }

  // rangement saison
  const season={year:p.year,age:p.age,league:p.league,club:p.club,pts,ast,reb,wins,ovr:o,minutes:round(minutes,0),acc:acc.slice(),champion,injured:p.seasonMods.injuryGames>0};
  p.seasons.push(season);
  p.peakOvr=Math.max(p.peakOvr,o);

  // sélection nationale (tournoi tous les 2 ans à partir de rep suffisante)
  let natLine=null;
  if(p.reputation>=45 && p.year%2===0){
    const zoneTourn = p.nation.path==='eu' ? 'EuroBasket' : p.nation.path==='au' ? 'Coupe d\'Asie' : 'Coupe des Amériques';
    const tourn = pick(['Coupe du Monde','Jeux Olympiques', zoneTourn]);
    const natPower = clamp(p.nation.strength + (o-70)*0.6 + rnd(-16,16),20,105);
    let medal=null;
    if(natPower>96){ medal='Or'; A('🥇 '+tourn); }
    else if(natPower>88){ medal='Argent'; A('🥈 '+tourn); }
    else if(natPower>80){ medal='Bronze'; A('🥉 '+tourn); }
    natLine={tourn,medal, mvp:(o>=88 && natPower>90 && Math.random()>.6)};
    if(natLine.mvp){ A('MVP '+tourn); }
    if(medal) pushTL(`${medalEmoji(medal)} <b>${medal}</b> à ${tourn} avec ${p.nation.name}.`);
  }

  // effets moraux post-saison
  if(star){ p.morale=clamp(p.morale+6,0,100); p.reputation=clamp(p.reputation+ (isNBA?7:isEuro?5:4),0,100); p.popularity=clamp(p.popularity+(isNBA?6:3),0,100); }
  else if(minutes<12){ p.morale=clamp(p.morale-7,0,100); }
  if(champion){ p.morale=clamp(p.morale+10,0,100); p.reputation=clamp(p.reputation+6,0,100); }
  p.reputation=clamp(p.reputation + (pts-12)*0.25 + (o-lg.starter)*0.15, 0, 100);
  // gains financiers approximatifs
  p.money += p.salary + (isNBA?p.popularity*4: p.popularity*1.2) + p.reputation*(isNBA?1.5:0.6);

  if(p.league==='nba'){ if(p.firstNbaAge===null) p.firstNbaAge=p.age; p.nbaStruggle = minutes<14 ? (p.nbaStruggle+1) : 0; }
  else { p.nbaStruggle=0; }

  renderSeasonResult(season, natLine, champion);
}
function medalEmoji(m){return m==='Or'?'🥇':m==='Argent'?'🥈':'🥉';}
export function seasonVerdict(s,lg){
  const gap=s.ovr-lg.starter;
  if(s.minutes<10) return `Saison compliquée : peu de temps de jeu, tu tournes surtout au bout du banc. Il faut hausser le ton ou changer d'air.`;
  if(s.ovr>=lg.star) return `Saison référence. Tu es l'un des tout meilleurs de ${lg.name} — les projecteurs sont braqués sur toi.`;
  if(gap>=4) return `Bonne saison de titulaire à ${s.club}. Tu tiens ton rang et tu attires le regard.`;
  return `Saison correcte, tu grappilles ta place dans la rotation. Le vrai palier reste à franchir.`;
}

/* ============================================================
   INTERSAISON : progression, transferts, retraite
============================================================ */
export function postSeason(){
  const p=G, lg=LEAGUES[p.league], o=ovr(p);
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
  const lastMin = p.seasons.length?p.seasons[p.seasons.length-1].minutes:15;
  // le temps de jeu réel (donc la performance/le rôle obtenu) pèse fort sur la vitesse de progression
  const minFactor = clamp(0.7 + lastMin/50, 0.7, 1.4);
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
      d = (clamp(roomA*0.16,0,4.2) * life.grow * minFactor + rnd(-0.3,0.7)) * arch.youngMult;
    } else if(dev){
      d = (clamp(roomA*0.10,0,2.6) * life.grow * minFactor + rnd(-0.4,0.5)) * arch.devMult;
    } else if(prime){
      d = ((roomA>2?clamp(roomA*0.05,0,1.1):0) + rnd(-0.4,0.5)*life.grow) * arch.primeMult;
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
  const continental = p.nation.path==='au' ? 'nbl' : 'euro';

  // forceMove imposé par un choix d'événement
  if(p.seasonMods.forceMove){ return buildMove(p.seasonMods.forceMove); }

  // --- Free agency : le joueur a refusé de prolonger → de vraies offres arrivent ---
  if(p.pendingFA){ p.pendingFA=false; return {type:'freeAgency'}; }

  // --- NBA : le pari a échoué (pas de temps de jeu) → renvoyé se relancer, en G-League côté US, sinon au rung continental ---
  if(p.league==='nba' && p.nbaStruggle>=2 && o<LEAGUES.nba.starter){
    const sendTo = p.nation.path==='us' ? 'gleague' : continental;
    return {type:'nbaReturn', to:sendTo, club:pickClubName(sendTo, p.nation.id)};
  }

  // --- SCÉNARIO SPÉCIAL : légende continentale en fin de carrière, jamais passée par la NBA ---
  // Une franchise lui offre un contrat court "pour la beauté du geste" (31-34 ans)
  if((p.league==='euro'||p.league==='nbl') && p.age>=31 && p.age<=34 && p.firstNbaAge===null && !p.swanOffered
     && o>=LEAGUES[p.league].star-1 && p.reputation>=70 && Math.random()<0.5){
    p.swanOffered=true;
    return {type:'nbaSwan', to:'nba', club:pickClubName('nba', p.nation.id)};
  }

  // ================= VOIE US =================
  if(p.league==='college'){
    const yrs=p.seasons.length;
    if(o>=60 || yrs>=3 || p.age>=21){ return {type:'draftDecl', origin:'college'}; }
    return null;
  }
  if(p.league==='gleague' && o>=LEAGUES.gleague.starter+2 && p.age<=28){
    return {type:'callup', to:'nba', club:pickClubName('nba', p.nation.id)};
  }

  // --- DÉCLARATION À LA DRAFT — accessible à tous dès 19 ans, quel que soit le palier ---
  // Plus aucun seuil de niveau/réputation à l'entrée : n'importe quel jeune joueur (hors
  // college/G-League/NBA, qui ont leur propre filière) peut tenter sa chance, avec un temps
  // de battement entre deux tentatives. Seul le résultat (draftProjection) reste dur et fidèle
  // au niveau réel — un joueur pas prêt tentera sa chance et repartira très probablement non drafté.
  if(p.age>=19 && p.age<=26 && (!p.lastDraftTry || p.year-p.lastDraftTry>=2) && Math.random()<0.65){
    p.lastDraftTry = p.year;
    return {type:'draftDecl', origin:'intl'};
  }

  // ================= VOIE EUROPE (3 paliers domestiques) =================
  if(p.league==='academy' && p.nation.path==='eu' && (o>=LEAGUES.third.starter-2 || p.age>=19)){
    return {type:'promo', to:'third', club:pickClubName('third', p.nation.id)};
  }
  if(p.league==='third' && o>=LEAGUES.second.starter-3){
    return {type:'promo', to:'second', club:pickClubName('second', p.nation.id)};
  }
  if(p.league==='second' && o>=LEAGUES.national.starter-3){
    return {type:'promo', to:'national', club:pickClubName('national', p.nation.id)};
  }

  // ================= VOIE AUSTRALIE (formation -> NBL1 -> NBL) =================
  if(p.league==='academy' && p.nation.path==='au' && (o>=LEAGUES.nbl1.starter-2 || p.age>=19)){
    return {type:'promo', to:'nbl1', club:pickClubName('nbl1', p.nation.id)};
  }
  if(p.league==='nbl1' && o>=LEAGUES.nbl.starter-3){
    return {type:'promo', to:'nbl', club:pickClubName('nbl', p.nation.id)};
  }

  if(p.league==='national' && o>=LEAGUES.euro.starter-3){
    return {type:'promo', to:'euro', club:pickClubName('euro', p.nation.id)};
  }
  // Star continentale confirmée : fenêtre NBA à un seuil atteignable, seulement dans la fenêtre de prime (≤29 ans)
  const declinedRecently = p.declined.nbaYear && (p.year - p.declined.nbaYear) < 3;
  if((p.league==='euro'||p.league==='nbl') && p.age<=29 && o>=LEAGUES[p.league].starter+1 && p.reputation>=52 && !declinedRecently && Math.random()<0.55){
    return {type:'nbaWindow', to:'nba', club:pickClubName('nba', p.nation.id)};
  }

  // Transferts latéraux une fois installé (varier les clubs)
  if(last && o>=lg.star-3 && p.contractY<=0 && Math.random()>0.45){
    const nc = pickClubName(p.league, p.nation.id, {exclude:p.club});
    if(nc && nc!==p.club) return {type:'transfer', to:p.league, club:nc};
  }

  // Relégation si trop faible
  if(o < lg.starter-9 && lg.tier<5){
    const down={ nba:continental, euro:'national', nbl:'nbl1', national:'second',
                 gleague:'second', second:'third', third:'academy', nbl1:'academy' }[p.league];
    if(down) return {type:'demote', to:down, club:pickClubName(down, p.nation.id)};
  }
  return null;
}
function buildMove(fm){
  const to = fm.to || G.league;
  const club = fm.club || pickClubName(to, G.nation.id, {exclude:G.club});
  return {type:fm.type||'transfer', to, club};
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

export function doMove(move,eff){
  const p=G;
  p.league=move.to; p.club=move.club;
  p.contractY = ri(2,4);
  let explicitSal=null;
  for(const k in (eff||{})){ if(k==='salary'){ explicitSal=eff[k]; } else { p[k]=clamp(p[k]+eff[k],0,100);} }
  p.salary = (explicitSal!=null) ? explicitSal : salaryFor(p.league, ovr(p), p.reputation);
  const lg=LEAGUES[p.league];
  pushTL(`Signe à <b>${p.club}</b> (${lg.short}) · 💰 ${money(p.salary)}/an.`);
  beginSeason();
}
export function beginSeasonKeep(){ // reste dans le club, mais renouvelle le contexte
  const p=G; if(p.contractY<=0) p.contractY=ri(1,3);
  beginSeason();
}
