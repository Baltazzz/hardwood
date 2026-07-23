import { CLUB_DATA } from '../data/clubData.js';
import { LEAGUES } from '../data/leagues.js';

// euro/nba restent des paliers globaux, non liés à une nation (déjà de vrais
// clubs dans leagues.js) — tous les autres paliers sont nation-aware via CLUB_DATA.
const GLOBAL_TIERS = new Set(['euro', 'nba']);

export function getClubPool(tierKey, nationId) {
  if (GLOBAL_TIERS.has(tierKey)) {
    return (LEAGUES[tierKey]?.clubs || []).map(name => ({ name, prestige: null }));
  }
  const own = CLUB_DATA[nationId]?.[tierKey];
  if (own?.length) return own;
  const fallback = CLUB_DATA.US?.[tierKey]; // nation sans données propres (ex. Canada) : repli sur les pools US
  if (fallback?.length) return fallback;
  return [{ name: 'Club libre', strength: 50, potential: 50, prestige: 50, category: null, comment: null }];
}

function weightedPick(pool) {
  const total = pool.reduce((s, c) => s + Math.max(1, c.prestige ?? 1), 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= Math.max(1, c.prestige ?? 1);
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

function excludeNames(pool, exclude) {
  if (!exclude) return pool;
  const set = new Set(Array.isArray(exclude) ? exclude : [exclude]);
  const filtered = pool.filter(c => !set.has(c.name));
  return filtered.length ? filtered : pool; // tout exclu (pool à 1 club) : on retombe sur le pool complet
}

// Tirage pondéré par prestige réel (les grands clubs recrutent plus souvent),
// uniforme pour euro/nba (prestige=null, cf. getClubPool).
export function pickClub(tierKey, nationId, opts = {}) {
  return weightedPick(excludeNames(getClubPool(tierKey, nationId), opts.exclude));
}
export function pickClubName(tierKey, nationId, opts = {}) {
  return pickClub(tierKey, nationId, opts).name;
}
// n tirages distincts (rivaux free agency, offres de transfert).
export function pickClubs(tierKey, nationId, n, opts = {}) {
  let remaining = excludeNames(getClubPool(tierKey, nationId), opts.exclude);
  const picked = [];
  for (let i = 0; i < n && remaining.length; i++) {
    const club = weightedPick(remaining);
    picked.push(club);
    remaining = remaining.filter(c => c.name !== club.name);
  }
  return picked;
}
export function clubInfo(tierKey, nationId, clubName) {
  return getClubPool(tierKey, nationId).find(c => c.name === clubName) || null;
}
