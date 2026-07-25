import { CLUB_DATA } from '../data/clubData.js';
import { LEAGUES } from '../data/leagues.js';
import { NATIONS } from '../data/nations.js';

// euro/nba restent des paliers globaux, non liés à une nation (déjà de vrais
// clubs dans leagues.js) — tous les autres paliers sont nation-aware via CLUB_DATA.
const GLOBAL_TIERS = new Set(['euro', 'nba']);

// Nation de référence par voie (path), utilisée comme repli quand une nation n'a pas ses
// propres données de club pour un palier donné (ex. nations ajoutées sans clubData dédié) :
// le repli US pur cassait les paliers third/second/national (0 club côté US, uniquement
// gleague/college), d'où un repli par voie plutôt qu'un repli unique et aveugle.
const PATH_FALLBACK_NATION = { eu: 'DE', au: 'AU', us: 'US' };

export function getClubPool(tierKey, nationId) {
  if (GLOBAL_TIERS.has(tierKey)) {
    return (LEAGUES[tierKey]?.clubs || []).map(name => ({ name, prestige: null }));
  }
  const own = CLUB_DATA[nationId]?.[tierKey];
  if (own?.length) return own;
  const nation = NATIONS.find(n => n.id === nationId);
  const fallbackId = (nation && PATH_FALLBACK_NATION[nation.path]) || 'US';
  const fallback = CLUB_DATA[fallbackId]?.[tierKey];
  if (fallback?.length) return fallback;
  const usFallback = CLUB_DATA.US?.[tierKey];
  if (usFallback?.length) return usFallback;
  return [{ name: 'Club libre', strength: 50, potential: 50, prestige: 50, category: null, comment: null }];
}

// popBias (0-0.5) accentue encore la préférence pour les clubs à fort prestige : les grosses
// écuries se disputent les joueurs qui vendent (popularité), au-delà du seul niveau sportif.
function clubWeight(c, popBias) {
  const base = Math.max(1, c.prestige ?? 1);
  return popBias ? base * (1 + popBias * (base / 100)) : base;
}
function weightedPick(pool, popBias = 0) {
  const total = pool.reduce((s, c) => s + clubWeight(c, popBias), 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= clubWeight(c, popBias);
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}
function popBiasOf(popularity) {
  return popularity == null ? 0 : Math.max(0, Math.min(0.5, (popularity - 40) / 120));
}

function excludeNames(pool, exclude) {
  if (!exclude) return pool;
  const set = new Set(Array.isArray(exclude) ? exclude : [exclude]);
  const filtered = pool.filter(c => !set.has(c.name));
  return filtered.length ? filtered : pool; // tout exclu (pool à 1 club) : on retombe sur le pool complet
}

// Tirage pondéré par prestige réel (les grands clubs recrutent plus souvent),
// uniforme pour euro/nba (prestige=null, cf. getClubPool). opts.popularity (optionnel) :
// accentue la préférence pour les gros clubs — à ne passer que là où des clubs se
// disputent activement le joueur (marché des transferts), pas pour une promotion "objective".
export function pickClub(tierKey, nationId, opts = {}) {
  return weightedPick(excludeNames(getClubPool(tierKey, nationId), opts.exclude), popBiasOf(opts.popularity));
}
export function pickClubName(tierKey, nationId, opts = {}) {
  return pickClub(tierKey, nationId, opts).name;
}
// n tirages distincts (rivaux free agency, offres de transfert).
export function pickClubs(tierKey, nationId, n, opts = {}) {
  const popBias = popBiasOf(opts.popularity);
  let remaining = excludeNames(getClubPool(tierKey, nationId), opts.exclude);
  const picked = [];
  for (let i = 0; i < n && remaining.length; i++) {
    const club = weightedPick(remaining, popBias);
    picked.push(club);
    remaining = remaining.filter(c => c.name !== club.name);
  }
  return picked;
}
export function clubInfo(tierKey, nationId, clubName) {
  return getClubPool(tierKey, nationId).find(c => c.name === clubName) || null;
}
