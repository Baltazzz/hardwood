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
  // Compteurs cumulatifs "de fond" (voir AGENDA.md lot rétention) : contrairement à
  // stylesHof/positionsHof/startPaths ci-dessus (gagnés seulement au niveau Superstar+, réservés
  // aux badges "collection"), ceux-ci progressent à CHAQUE carrière sans condition de niveau --
  // servent à la fois aux nouveaux badges "à seuil cumulé" (lifetimePts/lifetimeTitles) et à la
  // suggestion de prochain défi personnel (everPositions/everStartPaths/everNoHomeLeague, voir
  // engine/retention.js) : ce que le joueur a déjà ESSAYÉ, pas seulement ce qu'il a réussi.
  mem.lifetimePts = mem.lifetimePts || 0;
  mem.lifetimeTitles = mem.lifetimeTitles || 0;
  mem.everPositions = mem.everPositions || [];
  mem.everStartPaths = mem.everStartPaths || [];
  mem.everNoHomeLeague = mem.everNoHomeLeague || false;
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
  const cur = load();
  // Même principe que totalCareers (voir commentaire au-dessus) : les compteurs/traces "de fond"
  // ne sont liés à AUCUN badge précis, ils décrivent le joueur lui-même à travers toutes ses
  // carrières -- ils survivent à une réinitialisation des badges, seuls `unlocked` et les
  // compteurs de progression PROPRES à des badges "collection" en repartent à zéro.
  const { totalCareers, lifetimePts, lifetimeTitles, everPositions, everStartPaths, everNoHomeLeague } = cur;
  mem = { unlocked: {}, goldNations: [], stylesHof: [], positionsHof: [], startPaths: [],
    totalCareers, lifetimePts, lifetimeTitles, everPositions, everStartPaths, everNoHomeLeague };
  save();
}

// Exporté pour engine/challengeCodec.js (index de palier compact dans le lien de résultat de défi).
export const TIER_RANK = ['Parcours de combattant', 'Joueur de rotation', 'All-Star', 'Superstar', 'Légende · Hall of Fame', 'G.O.A.T.'];

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

  // Recalibré (voir AGENDA.md lot rétention) : sur 300 carrières pilotées, l'ancien seuil (16
  // saisons) se déclenchait sur 100% d'entre elles -- la longévité brute est quasi garantie par
  // le jeu dès qu'on évite une retraite forcée sur blessure (médiane observée 23 saisons, âge de
  // fin quasi toujours proche de 38 ans). Un simple seuil plus haut ne suffit pas à le rendre
  // rare (encore ~93% des carrières à 20 saisons) -- combiné à l'absence TOTALE de blessure sur
  // toute la carrière (déjà le critère différenciant d'iron_man_career, 37.3%), le double
  // critère redevient un vrai badge : jouer TRÈS longtemps ET ne jamais avoir été freiné.
  {id:'marathon_career', name:'Marathonien', emoji:'⏳', color:'var(--orange)',
    desc:'Jouer 20 saisons ou plus sur une même carrière, sans jamais connaître une seule saison marquée par une blessure.',
    check:(p)=> p.seasons.length>=20 && p.seasons.every(s=>!s.injured)},

  {id:'multi_tier_champion', name:'Champion à tous les étages', emoji:'🏆', color:'var(--mint)',
    desc:'Remporter un titre à au moins deux paliers de ligue différents dans la même carrière.',
    check:(p)=>{ const tiers=new Set(p.seasons.filter(s=>s.champion).map(s=>s.league)); return tiers.size>=2; },
    progress:(p)=>({ value:new Set(p.seasons.filter(s=>s.champion).map(s=>s.league)).size, target:2, unit:'leagueTiers' })},

  {id:'clutch_icon', name:'Sang-froid légendaire', emoji:'🧊', color:'var(--plum)',
    desc:'Cumuler 8 moments clutch ou plus sur une carrière.',
    check:(p)=> (p.clutch||0)>=8,
    progress:(p)=>({ value:p.clutch||0, target:8, unit:'clutchMoments' })},

  // Recalibré (voir AGENDA.md lot rétention) : 4 paliers distincts se déclenchait sur 79.3% des
  // carrières (médiane observée : 5 paliers distincts rien qu'en suivant un seul chemin de
  // développement -- lycée/fac/G League/NBA, ou académie/3e/2e div/EuroLeague). Relevé à 6 (max
  // observé sur l'échantillon : 7), ce qui exige de vraiment changer de VOIE en cours de carrière
  // (passer du système US au système européen ou inversement), pas seulement de monter les
  // échelons d'un même système -- plus fidèle à l'esprit "globe-trotter".
  {id:'tier_explorer', name:'Globe-trotter', emoji:'🧭', color:'var(--orange)',
    desc:'Jouer dans au moins 6 paliers de ligue différents au cours d\'une même carrière -- changer vraiment de système, pas seulement grimper les échelons d\'un seul.',
    check:(p)=>{ const tiers=new Set(p.seasons.map(s=>s.league)); return tiers.size>=6; }},

  {id:'hof_induction', name:'Intronisation au Panthéon', emoji:'🏛️', color:'var(--mint)',
    desc:'Terminer une carrière au niveau Hall of Fame.',
    check:(p)=> !!p.hof},

  {id:'triple_double_machine', name:'Monsieur Triple-double', emoji:'🎯', color:'var(--plum)',
    desc:'Cumuler 10 triple-doubles ou plus sur une carrière.',
    check:(p)=> (p.tripleDoubles||0)>=10,
    progress:(p)=>({ value:p.tripleDoubles||0, target:10, unit:'tripleDoubles' })},

  // ---- Lot d'extension (voir AGENDA.md) : ~20 badges supplémentaires, mêmes garanties
  // (persistant, robuste, jamais de crash sur des données inattendues) ----

  {id:'no_home_league_success', name:'Parti de rien', emoji:'🌱', color:'var(--mint)',
    desc:'Devenir Superstar ou plus en étant originaire d\'un continent sans championnat local dans le jeu (Afrique, Asie, Amérique du Sud).',
    check:(p)=>{ const cont=p.nation&&p.nation.continent; const noHome=['africa','asia','samerica'].includes(cont); const idx=TIER_RANK.indexOf(p.cardRec?.tier); return noHome && idx>=3; }},

  {id:'goat_status', name:'Statut ultime', emoji:'👑', color:'var(--orange)',
    desc:'Terminer une carrière au niveau G.O.A.T. -- le sommet absolu, presque jamais atteint.',
    check:(p)=> p.cardRec?.tier==='G.O.A.T.',
    progress:(p)=>({ value:p.cardRec?.score||0, target:365, unit:'legendScore' })},

  {id:'iron_man_career', name:'Increvable, jamais blessé', emoji:'🛡️', color:'var(--plum)',
    desc:'Jouer 10 saisons ou plus sans une seule saison marquée par une blessure.',
    check:(p)=> p.seasons.length>=10 && p.seasons.every(s=>!s.injured)},

  // Recalibré (voir AGENDA.md lot rétention) : le jeu retraite quasi tout le monde autour de 38
  // ans (61% des carrières observées finissent exactement à cet âge) -- un simple seuil d'âge ne
  // différencie donc presque rien. Ajout d'une exigence de PRODUCTION lors de cette toute
  // dernière saison (minutes >=20, encore un vrai rôle) : "danse" une dernière fois en étant
  // encore acteur du terrain, pas juste présent sur une feuille de match jusqu'au bout.
  {id:'last_dance', name:'Dernière danse', emoji:'🌅', color:'var(--mint)',
    desc:'Jouer jusqu\'à 38 ans en restant un vrai rotationnaire (20 minutes de moyenne ou plus) lors de ta toute dernière saison.',
    check:(p)=>{ const last=p.seasons[p.seasons.length-1]; return (p.age||0)>=38 && !!last && (last.minutes||0)>=20; }},

  {id:'world_champion', name:'Champion du monde', emoji:'🌐', color:'var(--orange)',
    desc:'Décrocher une médaille (or, argent ou bronze) à la Coupe du Monde avec sa sélection.',
    check:(p)=> Object.keys(p.accolades||{}).some(k=>k.endsWith('Coupe du Monde') && (k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')))},

  {id:'olympic_medalist', name:'Médaillé olympique', emoji:'🥇', color:'var(--plum)',
    desc:'Décrocher une médaille aux Jeux Olympiques avec sa sélection.',
    check:(p)=> Object.keys(p.accolades||{}).some(k=>k.endsWith('Jeux Olympiques') && (k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')))},

  {id:'grand_slam_nation', name:'Grand chelem international', emoji:'🏵️', color:'var(--mint)',
    desc:'Décrocher une médaille dans au moins 3 tournois différents au cours de la même carrière.',
    check:(p)=>{ const tourns=new Set(Object.keys(p.accolades||{}).filter(k=>k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')).map(k=>k.slice(k.indexOf(' ')+1))); return tourns.size>=3; },
    progress:(p)=>({ value:new Set(Object.keys(p.accolades||{}).filter(k=>k.startsWith('🥇')||k.startsWith('🥈')||k.startsWith('🥉')).map(k=>k.slice(k.indexOf(' ')+1))).size, target:3, unit:'tournaments' })},

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
    check:(p)=> ((p.accolades&&p.accolades['MVP'])||0)>=3,
    progress:(p)=>({ value:(p.accolades&&p.accolades['MVP'])||0, target:3, unit:'mvps' })},

  // ---- Lot rétention (voir AGENDA.md) : badges "carrière" plus variés, exploitant des données
  // déjà calculées mais jamais récompensées jusqu'ici (titres de meilleur marqueur/défenseur,
  // Rookie de l'année, rebond après blessure, fidélité d'un aller-retour) ----

  {id:'scoring_champion_dynasty', name:'Sniper attitré', emoji:'💫', color:'var(--plum)',
    desc:'Être élu meilleur marqueur de la ligue à 3 reprises ou plus au cours d\'une même carrière.',
    check:(p)=> ((p.accolades&&p.accolades['Meilleur marqueur'])||0)>=3,
    progress:(p)=>({ value:(p.accolades&&p.accolades['Meilleur marqueur'])||0, target:3, unit:'scorerTitles' })},

  {id:'defensive_anchor', name:'Verrou défensif', emoji:'🧱', color:'var(--mint)',
    desc:'Être élu meilleur défenseur de la ligue à 2 reprises ou plus au cours d\'une même carrière.',
    check:(p)=> ((p.accolades&&p.accolades['Meilleur défenseur'])||0)>=2,
    progress:(p)=>({ value:(p.accolades&&p.accolades['Meilleur défenseur'])||0, target:2, unit:'defenderTitles' })},

  {id:'rookie_sensation', name:'Sensation rookie', emoji:'🎬', color:'var(--orange)',
    desc:'Être élu Rookie de l\'année dès ta première saison en NBA.',
    check:(p)=> ((p.accolades&&p.accolades["Rookie de l'année"])||0)>=1},

  {id:'homecoming_retirement', name:'Retour aux sources', emoji:'🏡', color:'var(--plum)',
    desc:'Terminer sa carrière dans le club où tout a commencé, après un parcours d\'au moins 8 saisons.',
    check:(p)=>{ const s=p.seasons; return s.length>=8 && !!s[0].club && s[0].club===s[s.length-1].club; }},

  {id:'phoenix_comeback', name:'Phénix', emoji:'🔥', color:'var(--orange)',
    desc:'Revenir au niveau Superstar (94 OVR ou plus) dès la saison qui suit une saison marquée par une blessure.',
    check:(p)=>{ const s=p.seasons; for(let i=0;i<s.length-1;i++){ if(s[i].injured && s[i+1] && (s[i+1].ovr||0)>=94) return true; } return false; }},

  // ---- Lot rétention -- badges "à seuil cumulé", récompensent la fidélité AU JEU, pas une
  // seule carrière : progressent à chaque partie terminée, ne repartent jamais à zéro (voir
  // lifetimePts/lifetimeTitles/totalCareers dans load()/evaluateBadges() ci-dessous), même hors
  // d'une réinitialisation des badges. Deux paliers par catégorie (accessible puis très
  // long-terme), calibrés sur une distribution RÉELLE de 300 carrières pilotées (médiane ~11 800
  // points/carrière, ~0.2 titre/carrière en moyenne) : le premier palier de points se rapproche
  // de 4-5 carrières correctes, le second d'une vingtaine ; les titres, nettement plus rares par
  // construction, réclament un vrai investissement dans la durée pour les deux paliers. ----

  {id:'lifetime_points_1', name:'Scoreur de légende', emoji:'📈', color:'var(--mint)',
    desc:'Cumuler 50 000 points à travers toutes tes carrières.',
    check:(p,state)=> (state.lifetimePts||0)>=50000,
    progress:(p,state)=>({ value:state.lifetimePts||0, target:50000, unit:'points' })},

  {id:'lifetime_points_2', name:'Scoreur immortel', emoji:'♾️', color:'var(--orange)',
    desc:'Cumuler 250 000 points à travers toutes tes carrières.',
    check:(p,state)=> (state.lifetimePts||0)>=250000,
    progress:(p,state)=>({ value:state.lifetimePts||0, target:250000, unit:'points' })},

  {id:'lifetime_titles_1', name:'Collectionneur de bagues', emoji:'💍', color:'var(--plum)',
    desc:'Cumuler 5 titres à travers toutes tes carrières.',
    check:(p,state)=> (state.lifetimeTitles||0)>=5,
    progress:(p,state)=>({ value:state.lifetimeTitles||0, target:5, unit:'titles' })},

  {id:'lifetime_titles_2', name:'Dynastie sans fin', emoji:'🔱', color:'var(--mint)',
    desc:'Cumuler 15 titres à travers toutes tes carrières.',
    check:(p,state)=> (state.lifetimeTitles||0)>=15,
    progress:(p,state)=>({ value:state.lifetimeTitles||0, target:15, unit:'titles' })},

  {id:'lifetime_careers_1', name:'Pilier de la ligue', emoji:'🏟️', color:'var(--orange)',
    desc:'Mener 25 carrières à leur terme.',
    check:(p,state)=> (state.totalCareers||0)>=25,
    progress:(p,state)=>({ value:state.totalCareers||0, target:25, unit:'careers' })},

  {id:'lifetime_careers_2', name:'Une vie de basket', emoji:'🕰️', color:'var(--plum)',
    desc:'Mener 75 carrières à leur terme.',
    check:(p,state)=> (state.totalCareers||0)>=75,
    progress:(p,state)=>({ value:state.totalCareers||0, target:75, unit:'careers' })},
];

// Appelé une fois par carrière terminée (voir endCareer() dans screens.js). Retourne la liste
// des ids nouvellement débloqués par CETTE carrière (pour un éventuel message de félicitations),
// sans jamais lever si le check d'un badge plante sur des données inattendues.
export function evaluateBadges(p) {
  const state = load();
  state.totalCareers = (state.totalCareers || 0) + 1;
  // Compteurs/traces "de fond" (voir load() plus haut) : mis à jour AVANT la boucle de check, la
  // carrière qui vient de se terminer compte donc bien dans le badge qu'elle débloque elle-même
  // (même principe que totalCareers juste au-dessus).
  state.lifetimePts = (state.lifetimePts || 0) + (p.cardRec?.totalPts || 0);
  const champsThisCareer = Object.keys(p.accolades || {}).filter(k => k.startsWith('Champion')).reduce((s, k) => s + p.accolades[k], 0);
  state.lifetimeTitles = (state.lifetimeTitles || 0) + champsThisCareer;
  if (p.pos && !state.everPositions.includes(p.pos)) state.everPositions.push(p.pos);
  if (p.startPath && !state.everStartPaths.includes(p.startPath)) state.everStartPaths.push(p.startPath);
  if (p.nation && ['africa', 'asia', 'samerica'].includes(p.nation.continent)) state.everNoHomeLeague = true;
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
