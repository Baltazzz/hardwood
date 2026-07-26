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
  return mem;
}
function save() { try { localStorage.setItem(BADGES_KEY, JSON.stringify(mem)); } catch (e) { /* stockage indisponible : on continue en mémoire */ } }

export function badgesState() { return load(); }
export function badgesClear() { mem = { unlocked: {}, goldNations: [] }; try { localStorage.removeItem(BADGES_KEY); } catch (e) {} }

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
];

// Appelé une fois par carrière terminée (voir endCareer() dans screens.js). Retourne la liste
// des ids nouvellement débloqués par CETTE carrière (pour un éventuel message de félicitations),
// sans jamais lever si le check d'un badge plante sur des données inattendues.
export function evaluateBadges(p) {
  const state = load();
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
