import { POSITIONS, ATTRS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LEAGUES } from '../data/leagues.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { clamp, ri, pick } from './utils.js';

export function newPlayer(){
  return {
    step:0, nation:null, pos:null, style:null, life:null, name:'',
    age:16, year:1,
    attrs:{}, potential:0, hype:0, devArchetype:null,
    league:null, club:null, contractY:0, salary:0,
    reputation:8, morale:62, coach:55, media:50, popularity:12, fitness:100, money:0,
    peakOvr:0,
    seasons:[], timeline:[], accolades:{}, // accolades counts
    // season scaffolding
    curEvents:[], evIndex:0, seasonMods:{}, pendingOffers:null,
    natCap:0, retired:false, hof:false,
    nbaStruggle:0, draftPos:null, lastDraftTry:null, declined:{}, firstNbaAge:null,
    pendingFA:false, riskMod:1, swanOffered:false, earlyBet:false,
    flags:{}, clutch:0
  };
}

/* OVR pondéré par le poste */
export function ovr(p){
  const w = POSITIONS.find(x=>x.id===p.pos).w;
  let s=0; for(const k in w){ s += (p.attrs[k]||0)*w[k]; }
  return Math.round(s);
}
// Rôle dans l'équipe : évolue selon ton niveau vs la ligue et ton temps de jeu récent
export function roleOf(p){
  const lg=LEAGUES[p.league]; if(!lg) return {key:'espoir',label:'🌱 Espoir'};
  const o=ovr(p); const lastMin=p.seasons.length?p.seasons[p.seasons.length-1].minutes:0;
  if(o>=lg.star+2) return {key:'franchise',label:'👑 Franchise player'};
  if(o>=lg.star-2) return {key:'star',label:'⭐ Star de l\'équipe'};
  if(o>=lg.starter) return {key:'starter',label:'🏀 Titulaire'};
  if(o>=lg.starter-6 || lastMin>=14) return {key:'rotation',label:'🔄 Rotation'};
  return {key:'bench',label:'🪑 Bout de banc'};
}
export function attrOf(p, key){ return p.attrs[key]||50; }
// Salaire annuel estimé (k€) : quadratique en prestige de ligue, boosté par ton niveau et ta réputation
export function salaryFor(lgKey, o, rep){
  const lg=LEAGUES[lgKey]; if(!lg) return 0;
  const over = clamp(o - lg.starter, -8, 22);
  const base = lg.prestige*lg.prestige*6;      // FORMATION ~6 → NBA ~864
  const perf = clamp(1 + over*0.14, 0.4, 4.2);
  const repB = 1 + rep/180;
  return Math.max(Math.round(base*perf*repB), lg.prestige*20);
}
// Modulateur de salaire lié au prestige réel d'un club précis (0-100). null = pas de donnée
// par club (euro/nba) : pas de modulation. Borné pour rester dans une fourchette raisonnable.
export function clubSalaryMod(prestige){
  if(prestige==null) return 1;
  return clamp(0.8 + (prestige/100)*0.5, 0.8, 1.3);
}

function pickArchetype(){
  const total = ARCHETYPES.reduce((s,a)=>s+a.weight,0);
  let r = Math.random()*total;
  for(const a of ARCHETYPES){ r -= a.weight; if(r<=0) return a; }
  return ARCHETYPES[0];
}

function rollTalent(p){
  const pos = POSITIONS.find(x=>x.id===p.pos);
  p.devArchetype = pickArchetype().id;
  // base 30-46, bumped on primary attrs of the position
  ATTRS.forEach(a=>{ p.attrs[a.id]=ri(28,44); });
  // boost les 3 attributs clés du poste
  const keys=Object.entries(pos.w).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  keys.forEach(k=>{ p.attrs[k]=clamp(p.attrs[k]+ri(6,14),0,60); });
  // nation US/Australie légèrement plus athlétique
  if(p.nation.path==='us'||p.nation.path==='au'){ p.attrs.ath=clamp(p.attrs.ath+ri(2,7),0,65); }
  // style de jeu : oriente le profil de départ
  const st=STYLES.find(x=>x.id===p.style);
  if(st){ for(const k in st.boost){ p.attrs[k]=clamp(p.attrs[k]+st.boost[k],0,66); } }
  // potentiel caché + hype
  const roll=Math.random();
  p.potential = roll>.90?ri(95,99) : roll>.62?ri(89,95) : roll>.30?ri(82,90) : ri(75,83);
  p.hype = p.potential>=95?5 : p.potential>=89?4 : p.potential>=82?3 : p.potential>=77?2 : 1;
  if(!p.name){ p.name = pick(p.nation.names)+' '+pick(p.nation.last); }
}
export { rollTalent };
