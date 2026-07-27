/* ============================================================
   BADGES — hauts faits transversaux, débloqués À TRAVERS TOUTES LES
   CARRIÈRES (pas remis à zéro à chaque nouvelle partie), à la manière
   du Panthéon. Même stockage robuste que hof.js : localStorage quand
   disponible, repli mémoire sinon -- jamais d'erreur si le stockage
   est indisponible/plein/bloqué.

   Deux familles de critère :
   - "carrière" : entièrement déterminé par la carrière qui vient de
     se terminer (ex. fidélité à un club, longévité).
   - "cumulatif" : dépend d'un petit état persistant nourri au fil des
     carrières (ex. médaille d'or avec plusieurs nations différentes)
     -- cet état vit dans le même enregistrement que les badges eux-
     mêmes, jamais recalculé depuis l'historique complet (trop lourd,
     inutile : un compteur suffit).
============================================================ */
const BADGES_KEY = 'hardwood_badges_v1';
let mem = null;

function load() {
  if (mem !== null) return mem;
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    mem = raw ? JSON.parse(raw) : null;
  } catch (e) { mem = null; }
  if (!mem || typeof mem !== 'object') mem = { unlocked: {}, goldNations: [] };
  mem.unlocked = mem.unlocked || {};
  mem.goldNations = mem.goldNations || [];
  // Compteurs cumulatifs supplémentaires (voir badges "collection" plus bas) : mêmes principe
  // que goldNations -- un simple tableau d'ids déjà vus à travers toutes les carrières.
  mem.stylesHof = mem.stylesHof || [];
  mem.positionsHof = mem.positionsHof || [];
  mem.startPaths = mem.startPaths || [];
  // Nombre total de carrières menées à terme, toutes confondues (voir écran "Ma progression",
  // ui/card.js renderProgress()) -- le Panthéon ne garde que les 12 meilleures (hof.js), ce
  // compteur est le seul endroit qui connaît le vrai total joué.
  mem.totalCareers = mem.totalCareers || 0;
  return mem;
}
function save() { try { localStorage.setItem(BADGES_KEY, JSON.stringify(mem)); } catch (e) { /* stockage indisponible : on continue en mémoire */ } }

export function badgesState() { return load(); }
// BUG corrigé (voir AGENDA.md) : ce bouton s'appelle "Réinitialiser les BADGES" (écran Badges) --
// il remettait pourtant aussi à zéro `totalCareers`, un compteur de carrières jouées à VIE affiché
// sur un écran totalement différent ("Ma progression"). Quiconque cliquait ce bouton par curiosité
// après sa première carrière voyait ensuite le compteur "reste bloqué à 1" à chaque partie
// suivante -- pas parce que l'incrémentation/la persistance étaient cassées (vérifié : les deux
// fonctionnent, voir tests/audit_meta_progression.mjs), mais parce que ce total repartait de zéro
// à chaque reset de badges. `totalCareers` n'est lié à AUCUN badge précis, il doit survivre à une
// réinitialisation des badges -- seuls `unlocked` et les compteurs de progression PROPRES à des
// badges cumulatifs (goldNations/stylesHof/positionsHof/startPaths, qui doivent redevenir
// gagnables depuis zéro si on reset leur badge) sont concernés par ce bouton.
export function badgesClear() {
  const totalCareers = load().totalCareers || 0;
  mem = { unlocked: {}, goldNations: [], stylesHof: [], positionsHof: [], startPaths: [], totalCareers };
  save();
}

const TIER_RANK = ['Parcours de combattant', 'Joueur de rotation', 'All-Star', 'Superstar', 'Légende · Hall of Fame', 'G.O.A.T.'];

// Chaque badge : id stable, nom + description affichés, emoji + couleur d'accent pour la
// pastille, et check(p, state) -> booléen. `p` est le joueur complet en fin de carrière (voir
// endCareer() dans screens.js, appelé juste après la construction de p.cardRec/p.hof) ; `state`
// est l'état persistant cumulatif (mutable par les badges qui en ont besoin, ex. goldNations).
export const BADGES = [
  {id:'loyal_one_club', name:'Fidélité totale', emoji:'🏠', color:'var(--mint)',
    desc:'Terminer une carrière de 6 saisons ou plus dans un seul et même club.',
    check:(p)=>{ const clubs = new Set(p.seasons.map(s=>s.club).filter(Boolean)); return p.seasons.length>=6 && clubs.size===1; }},

  {id:'multi_nation_gold', name:'Ambassadeur', emoji:'🌍', color:'var(--orange)',
    desc:'Décrocher l\'or en sélection nationale avec au moins deux nations différentes, toutes carrières confondues.',
    check:(p, state)=>{
      const gold = Object.keys(p.accolades||{}).some(k=>k.startsWith('🥇'));
      if (gold && p.nation && p.nation.id && !state.goldNations.includes(p.nation.id)) state.goldNations.push(p.nation.id);
      return state.goldNations.length>=2;
    }},

  {id:'bust_redemption_badge', name:'Renaissance', emoji:'🔄', color:'var(--plum)',
    desc:'Effacer une étiquette de "bust" en début de carrière et atteindre malgré tout le niveau All-Star ou mieux.',
    check:(p)=>{ const busted=((p.flags&&p.flags.bust)||0)>=1; const idx=TIER_RANK.indexOf(p.cardRec?.tier); return busted && idx>=2; }},

  {id:'early_mvp', name:'Prodige précoce', emoji:'⚡', color:'var(--mint)',
    desc:'Être élu MVP (ligue majeure ou continentale) avant 23 ans.',
    check:(p)=> p.seasons.some(s=>s.age<23 && s.acc && s.acc.some(a=>a==='MVP'||a==='MVP EuroLeague'))},

  {id:'marathon_career', name:'Increvable', emoji:'⏳', color:'var(--orange)',
    desc:'Jouer 16 saisons ou plus sur une même carrière.',
    check:(p)=> p.seasons.length>=16},

  {id:'multi_tier_champion', name:'Champion à tous les étages', emoji:'🏆', color:'var(--mint)',
    desc:'Remporter un titre à au moins deux paliers de ligue différents dans la même carrière.',
    check:(p)=>{ const tiers=new Set(p.seasons.filter(s=>s.champion).map(s=>s.league)); return tiers.size>=2; }},

  {id:'clutch_icon', name:'Sang-froid légendaire', emoji:'🧊', color:'var(--plum)',
    desc:'Cumuler 8 moments clutch ou plus sur une carrière.',
    check:(p)=> (p.clutch||0)>=8},

  {id:'tier_explorer', name:'Globe-trotter', emoji:'🧭', color:'var(--orange)',
    desc:'Jouer dans au moins 4 paliers de ligue différents au cours d\'une même carrière.',
    check:(p)=>{ const tiers=new Set(p.seasons.map(s=>s.league)); return tiers.size>=4; }},

  {id:'hof_induction', name:'Intronisation au Panthéon', emoji:'🏛️', color:'var(--mint)',
    desc:'Terminer une carrière au niveau Hall of Fame.',
    check:(p)=> !!p.hof},

  {id:'triple_double_machine', name:'Monsieur Triple-double', emoji:'🎯', color:'var(--plum)',
    desc:'Cumuler 10 triple-doubles ou plus sur une carrière.',
    check:(p)=> (p.tripleDoubles||0)>=10},

  // ---- Lot d'extension (voir AGENDA.md) : ~20 badges supplémentaires, mêmes garanties
  // (persistant, robuste, jamais de crash sur des données inattendues) ----

  {id:'no_home_league_success', name:'Parti de rien', emoji:'🌱', color:'var(--mint)',
    desc:'Devenir Superstar ou plus en étant originaire d\'un continent sans championnat local dans le jeu (Afrique, Asie, Amérique du Sud).',
    check:(p)=>{ const cont=p.nation&&p.nation.continent; const noHome=['africa','asia','samerica'].includes(cont); const idx=TIER_RANK.indexOf(p.cardRec?.tier); return noHome && idx>=3; }},

  {id:'goat_status', name:'Statut ultime', emoji:'👑', color:'var(--orange)',
    desc:'Terminer une carrière au niveau G.O.A.T. -- le sommet absolu, presque jamais atteint.',
    check:(p)=> p.cardRec?.tier==='G.O.A.T.'},

  {id:'iron_man_career', name:'Increvable, jamais blessé', emoji:'🛡️', color:'var(--plum)',
    desc:'Jouer 10 saisons ou plus sans une seule saison marquée par une blessure.',
    check:(p)=> p.seasons.length>=10 && p.seasons.every(s=>!s.injured)},

  {id:'last_dance', name:'Dernière danse', emoji:'🌅', color:'var(--mint)',
    desc:'Jouer jusqu\'à 37 ans ou plus -- repousser sa carrière jusqu\'aux tout derniers instants.',
    check:(p)=> (p.age||0)>=37},

  {id:'world_champion', name:'Champion du monde', emoji:'🌐', color:'var(--orange)',
    desc:'Décrocher une médaille (or, argent ou bronze) à la Coupe du Monde avec sa sélection.',
    check:(p)=> Object.keys(p.accolades||{}).some(k=>k.endsWith('Coupe du Monde') && (k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')))},

  {id:'olympic_medalist', name:'Médaillé olympique', emoji:'🥇', color:'var(--plum)',
    desc:'Décrocher une médaille aux Jeux Olympiques avec sa sélection.',
    check:(p)=> Object.keys(p.accolades||{}).some(k=>k.endsWith('Jeux Olympiques') && (k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')))},

  {id:'grand_slam_nation', name:'Grand chelem international', emoji:'🏵️', color:'var(--mint)',
    desc:'Décrocher une médaille dans au moins 3 tournois différents au cours de la même carrière.',
    check:(p)=>{ const tourns=new Set(Object.keys(p.accolades||{}).filter(k=>k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')).map(k=>k.slice(k.indexOf(' ')+1))); return tourns.size>=3; }},

  {id:'style_collector', name:'Toutes les identités', emoji:'🎨', color:'var(--orange)',
    desc:'Atteindre Superstar ou plus avec chacun des 6 styles de jeu, toutes carrières confondues.',
    check:(p, state)=>{ const idx=TIER_RANK.indexOf(p.cardRec?.tier); if(idx>=3 && p.style && !state.stylesHof.includes(p.style)) state.stylesHof.push(p.style); return state.stylesHof.length>=6; }},

  {id:'position_collector', name:'Cinq de départ complet', emoji:'🧩', color:'var(--plum)',
    desc:'Atteindre Superstar ou plus à chacun des 5 postes, toutes carrières confondues.',
    check:(p, state)=>{ const idx=TIER_RANK.indexOf(p.cardRec?.tier); if(idx>=3 && p.pos && !state.positionsHof.includes(p.pos)) state.positionsHof.push(p.pos); return state.positionsHof.length>=5; }},

  {id:'path_collector', name:'Trois voies', emoji:'🛤️', color:'var(--mint)',
    desc:'Avoir débuté depuis les 3 voies de développement (US, Europe, Australie), toutes carrières confondues.',
    check:(p, state)=>{ if(p.startPath && !state.startPaths.includes(p.startPath)) state.startPaths.push(p.startPath); return state.startPaths.length>=3; }},

  {id:'late_bloomer', name:'Éclosion tardive', emoji:'🌻', color:'var(--orange)',
    desc:'Atteindre Superstar ou plus après une première saison en NBA à 27 ans ou plus.',
    check:(p)=>{ const idx=TIER_RANK.indexOf(p.cardRec?.tier); return p.firstNbaAge!=null && p.firstNbaAge>=27 && idx>=3; }},

  {id:'wonderkid_debut', name:'Débuts fracassants', emoji:'🚀', color:'var(--plum)',
    desc:'Disputer sa première saison en NBA à 19 ans ou moins.',
    check:(p)=> p.firstNbaAge!=null && p.firstNbaAge<=19},

  {id:'underdog_champion', name:'Exploit', emoji:'🍀', color:'var(--mint)',
    desc:'Remporter un titre avec un club parmi les plus faibles de son championnat.',
    check:(p)=> p.seasons.some(s=>s.champion && typeof s.clubStrengthPctile==='number' && s.clubStrengthPctile<0.34)},

  {id:'loyal_champion', name:'Loyauté couronnée', emoji:'🏰', color:'var(--orange)',
    desc:'Remporter un titre au sommet (NBA, EuroLeague ou NBL) après 6 saisons ou plus dans le même club.',
    check:(p)=>{ const clubs=new Set(p.seasons.map(s=>s.club).filter(Boolean)); const A=p.accolades||{}; const champsElite=(A['Champion NBA']||0)+(A['Champion EuroLeague']||0)+(A['Champion NBL']||0); return p.seasons.length>=6 && clubs.size===1 && champsElite>=1; }},

  {id:'media_icon', name:'Icône populaire', emoji:'📸', color:'var(--plum)',
    desc:'Terminer sa carrière avec une popularité de 90 ou plus.',
    check:(p)=> (p.popularity||0)>=90},

  {id:'redeemed_image', name:'Image rachetée', emoji:'🕊️', color:'var(--mint)',
    desc:'Traverser puis surmonter une polémique médiatique récurrente au cours de sa carrière.',
    check:(p)=> ((p.flags&&p.flags.reformed)||0)>=1},

  {id:'captain_legend', name:'Capitaine légendaire', emoji:'🎖️', color:'var(--orange)',
    desc:'Devenir une figure de leadership reconnue et terminer sa carrière au niveau Hall of Fame.',
    check:(p)=> ((p.flags&&p.flags.leaderRep)||0)>=2 && !!p.hof},

  {id:'bench_legend', name:'Impact depuis le banc', emoji:'🔋', color:'var(--plum)',
    desc:'Atteindre All-Star ou plus avec moins de 20 minutes de moyenne sur l\'ensemble de sa carrière.',
    check:(p)=>{ if(!p.seasons.length) return false; const avgMin=p.seasons.reduce((s,x)=>s+(x.minutes||0),0)/p.seasons.length; const idx=TIER_RANK.indexOf(p.cardRec?.tier); return avgMin<20 && idx>=2; }},

  {id:'nation_pillar', name:'Pilier de sélection', emoji:'🗿', color:'var(--mint)',
    desc:'Être devenu un leader reconnu de sa sélection nationale et y décrocher une médaille.',
    check:(p)=>{ const medal=Object.keys(p.accolades||{}).some(k=>k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')); return !!p.natCap && medal && ((p.flags&&p.flags.leaderRep)||0)>=1; }},

  {id:'multi_mvp', name:'Dynastie personnelle', emoji:'💎', color:'var(--orange)',
    desc:'Être élu MVP à 3 reprises ou plus au cours d\'une même carrière.',
    check:(p)=> ((p.accolades&&p.accolades['MVP'])||0)>=3},
];

// Appelé une fois par carrière terminée (voir endCareer() dans screens.js). Retourne la liste
// des ids nouvellement débloqués par CETTE carrière (pour un éventuel message de félicitations),
// sans jamais lever si le check d'un badge plante sur des données inattendues.
export function evaluateBadges(p) {
  const state = load();
  state.totalCareers = (state.totalCareers || 0) + 1;
  const unlockedNow = [];
  for (const b of BADGES) {
    if (state.unlocked[b.id]) continue;
    let ok = false;
    try { ok = !!b.check(p, state); } catch (e) { ok = false; }
    if (ok) { state.unlocked[b.id] = { date: Date.now(), player: p.name }; unlockedNow.push(b.id); }
  }
  save();
  return unlockedNow;
}
