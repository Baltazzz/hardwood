import { POSITIONS, ATTRS } from '../data/positions.js';
import { STYLES } from '../data/styles.js';
import { LEAGUES } from '../data/leagues.js';
import { ARCHETYPES } from '../data/archetypes.js';
import { clamp, ri, pick } from './utils.js';
import { clubPercentile } from './competition.js';

export function newPlayer(){
  return {
    step:0, nation:null, playNation:null, startPath:null, pos:null, style:null, life:null, name:'',
    age:16, year:1,
    attrs:{}, potential:0, hype:0, devArchetype:null,
    league:null, club:null, contractY:0, salary:0,
    reputation:8, morale:62, coach:55, media:50, popularity:12, fitness:100, money:0,
    peakOvr:0,
    seasons:[], timeline:[], accolades:{}, // accolades counts
    // season scaffolding
    curEvents:[], evIndex:0, seasonMods:{}, pendingOffers:null,
    natCap:0, retired:false, hof:false,
    nbaStruggle:0, draftPos:null, draftEntered:false, declined:{}, firstNbaAge:null,
    pendingFA:false, riskMod:1, swanOffered:false, earlyBet:false,
    flags:{}, flagYear:{}, clutch:0, lastActiveTagIds:[],
    // Bookkeeping de reprise (voir engine/savegame.js + resumeCareer() dans ui/screens.js) :
    // l'offre/le mouvement affiché à l'écran au moment d'une éventuelle sauvegarde, pour pouvoir
    // ré-afficher EXACTEMENT le même choix en attente plutôt qu'un tirage différent au retour.
    pendingMove:null, pendingAcademyOffers:null,
    // Anti-répétition des événements : evStats[id] = {count, lastYear, streak}. eventHistory
    // sert uniquement à l'audit de diversité (liste plate des ids tirés, dans l'ordre).
    evStats:{}, eventHistory:[], clubTenure:0,
    tripleDoubles:0
  };
}

// Pays où le joueur évolue actuellement (bassin de clubs consulté pour les paliers domestiques
// third/second/national/nbl1/nbl) -- distinct de p.nation (origine, fixe, sélection nationale).
// Change uniquement via une expatriation choisie (voir engine/season.js) ; p.nation ne change
// jamais. Repli sur p.nation.id tant qu'aucune expatriation n'a eu lieu.
export function playCountry(p){ return p.playNation || (p.nation && p.nation.id); }

// Voie de développement choisie via l'académie de départ ('us'=lycée->NCAA->draft,
// 'eu'=académie->pro->Europe->NBA, 'au'=académie->NBL1->NBL->passerelle NBA) -- voir
// engine/academies.js. Fixée une fois pour toutes au choix d'académie, juste après la création,
// et totalement DÉCOUPLÉE de p.nation.path (qui n'existe plus pour cet usage) : la nationalité
// ne détermine plus le point de départ sportif, seulement l'identité et l'éligibilité en
// sélection. p.playNation démarre sur le pays de l'académie choisie, pas sur celui de p.nation.

/* OVR pondéré par le poste */
export function ovr(p){
  const w = POSITIONS.find(x=>x.id===p.pos).w;
  let s=0; for(const k in w){ s += (p.attrs[k]||0)*w[k]; }
  return Math.round(s);
}
// Rôle dans l'équipe : évolue selon ton niveau vs la ligue, la force réelle de l'effectif du
// club où tu es, et ton temps de jeu récent.
export function roleOf(p){
  const lg=LEAGUES[p.league]; if(!lg) return {key:'espoir',label:'🌱 Espoir'};
  const o=ovr(p); const lastMin=p.seasons.length?p.seasons[p.seasons.length-1].minutes:0;
  // Concurrence réelle du poste : arriver dans un effectif fort (vs son propre vivier de ligue,
  // voir clubPercentile() dans engine/competition.js) relève la barre pour jouer/être titulaire,
  // un effectif faible l'abaisse -- le rôle dépend donc de ton niveau ET de la force réelle de
  // l'équipe où tu es, pas seulement d'un seuil générique identique pour tous les clubs d'une
  // même ligue. Purement déterministe (aucun bruit), donc strictement identique quel que soit le
  // point d'appel (HUD, bilan de saison, minutes de la saison en cours).
  const { percentile } = clubPercentile(p, lg, playCountry(p));
  const rosterAdj = (percentile - 0.5) * 12; // +/-6 autour des seuils de ligue
  const starter = lg.starter + rosterAdj, star = lg.star + rosterAdj;
  if(o>=star+2) return {key:'franchise',label:'👑 Franchise player'};
  if(o>=star-2) return {key:'star',label:'⭐ Star de l\'équipe'};
  // un coach qui te fait confiance t'ouvre le poste de titulaire même un cran en-dessous de la barre pure
  if(o>=starter || (o>=starter-3 && p.coach>=75)) return {key:'starter',label:'🏀 Titulaire'};
  if(o>=starter-6 || lastMin>=14) return {key:'rotation',label:'🔄 Rotation'};
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

// Catégories réelles (issues des données de clubs) qui accentuent ou adoucissent l'exigence
// au-delà du seul prestige numérique.
const DEMANDING_CATEGORIES = new Set(['Elite','Blue Blood','Historic Club','Historic Program','Modern Power','Historic G League','Talent Factory','G League Contender']);
const FORGIVING_CATEGORIES = new Set(['Rebuilding','New Project','Rising Project','Rising Program','G League Rebuilding','Average','G League Average','Promotion Candidate']);

// Confiance initiale du staff à la signature : dépend de ton statut d'arrivée (kind) et de
// l'exigence réelle du club (prestige + catégorie). Remplace l'ancien comportement qui
// conservait intégralement la confiance du club précédent, ce qui n'avait pas de sens.
export function arrivalCoachTrust(p, o, lg, prestige, category, kind){
  const span = Math.max(1, lg.star - lg.starter);
  const standing = clamp((o - (lg.starter-8)) / (span+8), 0, 1.15); // ta position relative au niveau attendu ici
  let base = 35 + standing*40;

  if(kind==='draft'){
    const posFactor = clamp(1 - (p.draftPos||30)/70, 0, 1); // le rang pèse plus que le niveau brut pour un rookie
    base = 32 + posFactor*30 + standing*14;
  } else if(kind==='demote'){
    base = Math.max(base, 74); // terrain conquis : on t'attend en sauveur, quel que soit l'écart brut
  } else if(kind==='nbaSwan'){
    base = Math.max(base, 68); // statut de légende déjà reconnu
  } else if(kind==='nbaReturn'){
    base = Math.min(base, 46); // retour d'un échec : la confiance ne se redonne pas d'emblée
  }

  let demand = prestige==null ? 55 : prestige;
  if(category && DEMANDING_CATEGORIES.has(category)) demand += 10;
  else if(category && FORGIVING_CATEGORIES.has(category)) demand -= 8;
  demand = clamp(demand, 10, 100);

  const demandPenalty = clamp((demand-50)*0.28, -14, 16) * clamp(1.25 - base/100, 0.35, 1.25);
  return clamp(Math.round(base - demandPenalty), 15, 92);
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
  // Flavor d'identité (pas de voie de développement -- décidée plus tard par l'académie) :
  // continents Amérique du Nord/Océanie légèrement plus athlétiques, à titre culturel.
  if(p.nation.continent==='namerica'||p.nation.continent==='oceania'){ p.attrs.ath=clamp(p.attrs.ath+ri(2,7),0,65); }
  // style de jeu : oriente le profil de départ
  const st=STYLES.find(x=>x.id===p.style);
  if(st){ for(const k in st.boost){ p.attrs[k]=clamp(p.attrs[k]+st.boost[k],0,66); } }
  // potentiel caché + hype (corrélation légère avec la trajectoire précoce : les prodiges
  // qu'on annonce déjà comme "précoces" sont plus souvent aussi ceux au potentiel élite —
  // ne change pas la distribution de potentiel des autres trajectoires)
  const potBoost = p.devArchetype==='precocious' ? 0.15 : 0;
  const roll=Math.random()+potBoost;
  p.potential = roll>.90?ri(95,99) : roll>.62?ri(89,95) : roll>.30?ri(82,90) : ri(75,83);
  p.hype = p.potential>=95?5 : p.potential>=89?4 : p.potential>=82?3 : p.potential>=77?2 : 1;
  if(!p.name){ p.name = pick(p.nation.names)+' '+pick(p.nation.last); }
}
export { rollTalent };
