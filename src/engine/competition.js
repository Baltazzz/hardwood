// Contexte de compétition léger : classement de fin de saison, phase finale, montée/descente de
// club. Volontairement PAS une simulation match par match (poids nul sur le rythme du jeu) :
// une note de saison par club (force réelle + bruit), un classement qui en découle, une phase
// finale résumée en quelques tours probabilistes. S'appuie sur les vraies forces de clubs de
// src/data/clubData.js quand elles existent ; pour les paliers globaux NBA/EuroLeague (pas de
// force par club dans les données sources), une estimation grossière et assumée comme telle
// (pas une statistique réelle précise) ; à défaut, une teinte de force stable dérivée du nom,
// même logique que pour l'accent de couleur (voir engine/accent.js).
// Pas d'import de player.js ici (nationId est passé par l'appelant) : évite un cycle avec
// player.js, qui importe clubPercentile() ci-dessous pour l'attribution de rôle.
import { getClubPool } from './clubs.js';
import { clamp, rnd } from './utils.js';

// Estimation grossière de niveau relatif (0-100), PAS une donnée officielle : sert uniquement à
// donner un classement crédible aux clubs non couverts par clubData.js (paliers globaux
// NBA/EuroLeague au-delà du noyau curé, et clubs génériques de remplissage -- voir
// REAL_LEAGUE_SIZE ci-dessous).
const NBA_STRENGTH = { 'Boston':90, 'L.A. Lakers':79, 'Golden State':76, 'Denver':88, 'Milwaukee':83,
  'Miami':74, 'New York':82, 'Dallas':81, 'Phoenix':78, 'OKC':87, 'Philadelphie':80, 'Memphis':75 };
const EURO_STRENGTH = { 'Real Madrid':90, 'FC Barcelone':82, 'Panathinaïkos':85, 'Olympiakos':88,
  'Fenerbahçe':86, 'Monaco':84, 'Baskonia':74, 'Maccabi':78, 'Žalgiris':76 };

function hashStrength(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return 58 + (h % 38); // 58-95, stable pour un même nom
}
function clubStrength(tierKey, clubName, clubDataEntry) {
  if (clubDataEntry && typeof clubDataEntry.strength === 'number') return clubDataEntry.strength;
  if (tierKey === 'nba' && NBA_STRENGTH[clubName] != null) return NBA_STRENGTH[clubName];
  if (tierKey === 'euro' && EURO_STRENGTH[clubName] != null) return EURO_STRENGTH[clubName];
  return hashStrength(clubName);
}

// Certains paliers domestiques ont, en réalité, plus de clubs que ce qui est nommé et documenté
// individuellement dans clubData.js (faute de données fiables sur chacun) : Élite 2 (France,
// 2e division) compte 20 clubs réels pour 16 nommés en base, la SuperLiga (Serbie, élite) 8
// clubs réels pour 6 nommés -- vérifié séance tenante (recherche web, saison 2024-25). Le total
// réel sert de référence pour la position affichée et le nombre total du classement (voir
// paddedPool ci-dessous), complété par des clubs génériques pour la seule mécanique de rang :
// jamais sélectionnables comme club du joueur (getClubPool(), utilisé pour les vraies
// signatures, n'est pas modifié), et volontairement en dessous de la moyenne du vivier (peu
// probable qu'un club non individuellement documenté soit une référence du championnat).
const REAL_LEAGUE_SIZE = { FR: { second: 20 }, RS: { national: 8 } };
function paddedPool(tierKey, nationId, pool) {
  const target = REAL_LEAGUE_SIZE[nationId]?.[tierKey];
  if (!target || pool.length >= target) return pool;
  const extra = [];
  for (let i = pool.length; i < target; i++) {
    const name = `Club régional ${i - pool.length + 1}`;
    extra.push({ name, strength: 55 + (hashStrength(name) % 12) }); // 55-66 : réaliste pour un ventre mou non documenté
  }
  return [...pool, ...extra];
}

// Classe le vivier RÉEL du palier (padding compris) par force réelle, et situe le club du
// joueur dedans (percentile 1 = meilleur du vivier, 0 = dernier). Purement déterministe (aucun
// tirage aléatoire) : calculé une fois par saison dans simulateSeason() et réutilisé tel quel à
// la fois pour l'attribution de rôle/minutes (engine/player.js roleOf()) et pour la note
// d'équipe du classement ci-dessous -- les deux doivent juger le même effectif réel, jamais deux
// évaluations indépendantes qui pourraient se contredire.
export function clubPercentile(p, lg, nationId) {
  const tierKey = p.league;
  const pool = paddedPool(tierKey, nationId, getClubPool(tierKey, nationId));
  const ranked = pool
    .map(c => ({ name: c.name, strength: clubStrength(tierKey, c.name, c), isPlayerClub: c.name === p.club }))
    .sort((a, b) => b.strength - a.strength);
  const idx = ranked.findIndex(c => c.isPlayerClub);
  const n = Math.max(1, ranked.length - 1);
  const percentile = idx >= 0 && ranked.length > 1 ? 1 - idx / n : 0.5;
  return { percentile, poolSize: ranked.length, ranked };
}

// Classement de fin de saison : une note par club (force réelle + bruit), sauf le club du joueur
// qui reprend teamRating (déjà calculé dans simulateSeason() à partir du MÊME percentile réel
// que clubPercentile() ci-dessus, plus l'apport individuel du joueur -- cohérent avec le reste
// de sa saison plutôt qu'un second tirage indépendant). Piège évité : le champ `strength` de
// clubData.js (0-100, "force absolue" du club dans ses propres données) et teamRating (baseline
// lg.prestige*3, souvent 20-70 en pratique) ne sont PAS sur la même échelle -- les comparer
// bruts aurait systématiquement enterré le joueur dans le classement, même excellent. On
// convertit donc la force de chaque club en RANG relatif au sein de son propre vivier (réel,
// padding compris), puis on reconstruit une note sur la même échelle que teamRating (même
// baseline, même amplitude de bruit) : la comparaison redevient cohérente quel que soit le palier.
export function simulateStandings(p, lg, teamRating, nationId) {
  const tierKey = p.league;
  const pool = paddedPool(tierKey, nationId, getClubPool(tierKey, nationId));
  const others = pool.filter(c => c.name !== p.club)
    .map(c => ({ name: c.name, strength: clubStrength(tierKey, c.name, c) }))
    .sort((a, b) => b.strength - a.strength);
  const n = Math.max(1, others.length - 1);
  const rows = others.map((c, i) => {
    const percentile = others.length > 1 ? 1 - i / n : 0.5; // 1 = meilleur du vivier, 0 = dernier
    const rating = clamp(lg.prestige * 3 + (percentile - 0.5) * 40 + rnd(-14, 14), 5, 100);
    return { name: c.name, rating, isPlayerClub: false };
  });
  rows.push({ name: p.club, rating: teamRating, isPlayerClub: true });
  rows.sort((a, b) => b.rating - a.rating);
  return { rows, playerRank: rows.findIndex(r => r.isPlayerClub) + 1, poolSize: rows.length };
}

// Conférence réelle de chaque club NBA (saison 2024-25 : Est = Atlantique/Central/Sud-Est,
// Ouest = Nord-Ouest/Pacifique/Sud-Ouest) -- sert uniquement au format de fin de saison NBA
// ci-dessous (classement + playoffs par conférence, avec Play-In), pas à l'estimation de force
// (déjà couverte par NBA_STRENGTH/hashStrength ci-dessus). Couvre les 30 noms réels de
// LEAGUES.nba.clubs (data/leagues.js) ; un repli 'Est' existe par sécurité si jamais un nom non
// mappé apparaissait, mais ne devrait jamais être exercé en pratique.
const NBA_CONFERENCE = {
  'Boston':'Est', 'Brooklyn':'Est', 'New York':'Est', 'Philadelphie':'Est', 'Toronto':'Est',
  'Chicago':'Est', 'Cleveland':'Est', 'Detroit':'Est', 'Indiana':'Est', 'Milwaukee':'Est',
  'Atlanta':'Est', 'Charlotte':'Est', 'Miami':'Est', 'Orlando':'Est', 'Washington':'Est',
  'Denver':'Ouest', 'Minnesota':'Ouest', 'OKC':'Ouest', 'Portland':'Ouest', 'Utah':'Ouest',
  'Golden State':'Ouest', 'LA Clippers':'Ouest', 'L.A. Lakers':'Ouest', 'Phoenix':'Ouest', 'Sacramento':'Ouest',
  'Dallas':'Ouest', 'Houston':'Ouest', 'Memphis':'Ouest', 'New Orleans':'Ouest', 'San Antonio':'Ouest',
};

// Classement NBA fidèle au vrai système : deux conférences classées SÉPARÉMENT (15 clubs
// chacune), le club du joueur situé dans sa vraie conférence -- jamais un classement à 30 qui
// mélangerait les deux, comme en pratique. Même logique de conversion rang -> note que
// simulateStandings() ci-dessus (voir son commentaire), appliquée au sein de la seule conférence
// du joueur plutôt qu'au vivier entier.
export function simulateNbaStandings(p, lg, teamRating) {
  const pool = getClubPool('nba', null); // palier global : nationId ignoré (voir clubs.js)
  const conference = NBA_CONFERENCE[p.club] || 'Est';
  const confPool = pool.filter(c => (NBA_CONFERENCE[c.name] || 'Est') === conference);
  const others = confPool.filter(c => c.name !== p.club)
    .map(c => ({ name: c.name, strength: clubStrength('nba', c.name, c) }))
    .sort((a, b) => b.strength - a.strength);
  const n = Math.max(1, others.length - 1);
  const rows = others.map((c, i) => {
    const percentile = others.length > 1 ? 1 - i / n : 0.5;
    const rating = clamp(lg.prestige * 3 + (percentile - 0.5) * 40 + rnd(-14, 14), 5, 100);
    return { name: c.name, rating, isPlayerClub: false };
  });
  rows.push({ name: p.club, rating: teamRating, isPlayerClub: true });
  rows.sort((a, b) => b.rating - a.rating);
  return { conference, rows, playerRank: rows.findIndex(r => r.isPlayerClub) + 1, poolSize: rows.length };
}

// Playoffs NBA au vrai format actuel : dans chaque conférence (15 clubs), les 6 premiers sont
// qualifiés directement (têtes de série 1-6, entrée directe au 1er tour) ; les places 7 à 10
// disputent le Play-In pour les deux dernières places de playoffs (7e et 8e tête de série) --
// 7e/8e ont deux chances (un match, puis en cas de défaite un match d'élimination directe contre
// le vainqueur du 9e/10e), 9e/10e doivent enchaîner deux victoires pour arracher la 8e place ;
// au-delà de la 10e place, saison terminée sans playoffs. Une fois qualifiée (8 têtes de série),
// l'équipe traverse 4 tours jusqu'au titre : 1er tour, demi-finale de conférence, finale de
// conférence, puis une vraie Finale NBA contre le champion de l'AUTRE conférence -- jamais un
// simple prolongement du même vivier de 15 clubs. Cohérence avec le mécanisme narratif "match
// décisif" (forceFinals) conservée à l'identique de simulatePlayoffs() : si l'événement a déjà
// tranché la saison, son issue EST la Finale NBA, jamais un second tirage qui pourrait la
// contredire.
export function simulateNbaPlayoffs(teamRating, playerRank, forcedFinal) {
  const roundLabels = ['1er tour', 'Demi-finale de conférence', 'Finale de conférence', 'Finale NBA'];
  if (forcedFinal != null) {
    const rounds = roundLabels.map((label, i) => ({ label, won: i < roundLabels.length - 1 ? true : forcedFinal }));
    return { qualified: true, playIn: null, seed: null, rounds, reachedFinals: true, champion: forcedFinal };
  }
  if (playerRank > 10) {
    return { qualified: false, playIn: null, seed: null, rounds: [], reachedFinals: false, champion: false };
  }
  const winProb = (bonus = 0) => clamp(0.5 + (teamRating - 58) * 0.006 + bonus, 0.08, 0.85);
  let seed = playerRank, playIn = null;
  if (playerRank >= 7) {
    const isSeventhOrEighth = playerRank <= 8;
    if (isSeventhOrEighth) {
      const wonGame1 = Math.random() < winProb(0.03);
      if (wonGame1) { seed = 7; playIn = { result: 'seed7' }; }
      else {
        const wonElim = Math.random() < winProb(-0.03);
        if (!wonElim) return { qualified: false, playIn: { result: 'eliminated' }, seed: null, rounds: [], reachedFinals: false, champion: false };
        seed = 8; playIn = { result: 'seed8' };
      }
    } else {
      const wonGame1 = Math.random() < winProb(0);
      if (!wonGame1) return { qualified: false, playIn: { result: 'eliminated' }, seed: null, rounds: [], reachedFinals: false, champion: false };
      const wonElim = Math.random() < winProb(-0.05);
      if (!wonElim) return { qualified: false, playIn: { result: 'eliminated' }, seed: null, rounds: [], reachedFinals: false, champion: false };
      seed = 8; playIn = { result: 'seed8' };
    }
  }
  const rounds = [];
  let alive = true;
  for (let i = 0; i < roundLabels.length && alive; i++) {
    const isFinal = i === roundLabels.length - 1;
    const advanceProb = clamp(0.5 + (teamRating - 58) / 80 - i * 0.045 - (seed - 1) * 0.01, 0.08, isFinal ? 0.55 : 0.78);
    const won = Math.random() < advanceProb;
    rounds.push({ label: roundLabels[i], won });
    if (!won) alive = false;
  }
  const reachedFinals = rounds.length === roundLabels.length;
  return { qualified: true, playIn, seed, rounds, reachedFinals, champion: reachedFinals && rounds[rounds.length - 1].won };
}

// Phase finale résumée (2-3 tours selon la taille du vivier), jamais de match par match.
// Cohérence avec le mécanisme clutch déjà en place : si l'événement narratif "match décisif"
// (finals_moment) a tranché cette saison, son issue EST la finale -- pas de second tirage qui
// pourrait la contredire (l'événement ne se déclenche qu'à haut niveau, donc l'équipe est déjà
// considérée comme ayant rejoint la finale par construction).
export function simulatePlayoffs(teamRating, playerRank, poolSize, forcedFinal) {
  const numQualifiers = clamp(Math.ceil(poolSize * 0.4), 4, 8);
  if (forcedFinal == null && playerRank > numQualifiers) {
    return { qualified: false, rounds: [], reachedFinals: false, champion: false };
  }
  const roundLabels = numQualifiers <= 4 ? ['Demi-finale', 'Finale'] : ['Quart de finale', 'Demi-finale', 'Finale'];
  if (forcedFinal != null) {
    const rounds = roundLabels.map((label, i) => ({ label, won: i < roundLabels.length - 1 ? true : forcedFinal }));
    return { qualified: true, rounds, reachedFinals: true, champion: forcedFinal };
  }
  const rounds = [];
  let alive = true;
  for (let i = 0; i < roundLabels.length && alive; i++) {
    const isFinal = i === roundLabels.length - 1;
    const advanceProb = clamp(0.42 + (teamRating - 58) / 80 - i * 0.05, 0.08, isFinal ? 0.55 : 0.78);
    const won = Math.random() < advanceProb;
    rounds.push({ label: roundLabels[i], won });
    if (!won) alive = false;
  }
  const reachedFinals = rounds.length === roundLabels.length;
  return { qualified: true, rounds, reachedFinals, champion: reachedFinals && rounds[rounds.length - 1].won };
}

// Montée/descente du CLUB (distincte de la progression individuelle du joueur, qui existe déjà
// via resolveMovement()/promo/demote dans season.js) : uniquement pour les pyramides à divisions
// où ça a un sens narratif -- domestique européen (third/second/national) et australien
// (nbl1/nbl). Le club du joueur garde son nom en changeant de palier : une vraie relégation
// change le contexte de compétition, pas l'identité du club.
const PYRAMIDS = { third: ['third', 'second', 'national'], second: ['third', 'second', 'national'],
  national: ['third', 'second', 'national'], nbl1: ['nbl1', 'nbl'], nbl: ['nbl1', 'nbl'] };
export function checkClubMovement(tierKey, playerRank, poolSize) {
  const pyramid = PYRAMIDS[tierKey];
  if (!pyramid) return null;
  const idx = pyramid.indexOf(tierKey);
  const relegationCut = poolSize - Math.max(1, Math.round(poolSize * 0.18));
  const promotionCut = Math.max(1, Math.round(poolSize * 0.18));
  if (playerRank > relegationCut && idx > 0) return { direction: 'relegated', newLeague: pyramid[idx - 1] };
  if (playerRank <= promotionCut && idx < pyramid.length - 1) return { direction: 'promoted', newLeague: pyramid[idx + 1] };
  return null;
}
