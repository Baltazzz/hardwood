// Étiquettes de joueur : transforment les flags narratifs (déjà posés par les choix d'événements,
// voir applyChoice() dans season.js) en identité visible et vivante. Une étiquette s'active à
// partir d'un seuil de flag, puis s'ESTOMPE si elle n'est plus nourrie par de nouveaux choix
// pendant plusieurs saisons (p.flagYear, voir applyChoice()) : elle peut donc se perdre, pas
// seulement s'accumuler. Chaque étiquette porte un effet mesuré et volontairement modeste
// (appliqué une fois par saison dans postSeason()) : jamais de quoi peser sur les probabilités
// de récompense (MVP/titre/HOF), seulement une légère inflexion de trajectoire de stats molles,
// cohérente avec ce que l'étiquette raconte.
import { clamp } from './utils.js';

const DECAY_SEASONS = 5;

export const TAG_DEFS = [
  // ---- Jeu ----
  { id: 'clutch', label: 'Clutch', registry: 'jeu', flag: 'clutchHero', threshold: 2,
    pro: 'Sang-froid reconnu dans les money-times', con: 'La pression retombe toujours sur toi',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3.5 2',
    effect: (p) => { p.reputation = clamp(p.reputation + 1, 0, 100); } },
  { id: 'lockdown', label: 'Verrou défensif', registry: 'jeu', flag: 'lockdown', threshold: 2,
    pro: 'Le staff te confie les missions les plus dures', con: 'Toujours sur le pire attaquant adverse',
    icon: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5z',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); } },
  { id: 'fragile', label: 'Fragile', registry: 'jeu', flag: 'injuryProne', threshold: 2,
    pro: 'Le staff médical veille sur toi en priorité', con: 'Le corps qui lâche plus souvent qu\'à ton tour',
    icon: 'M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 9 1.5C21 13.5 17 17 12 21ZM9 12h2l1-2 2 4 1-2h2',
    effect: (p) => { p.fitness = clamp(p.fitness - 1, 0, 100); } },
  // ---- Mental / vestiaire ----
  { id: 'leader', label: 'Leader', registry: 'mental', flag: 'leaderRep', threshold: 2,
    pro: 'Le vestiaire se range naturellement derrière toi', con: 'Chaque défaite retombe un peu plus sur toi',
    icon: 'M12 3 14.5 8.5 20.5 9.3 16 13.3 17.2 19.3 12 16.2 6.8 19.3 8 13.3 3.5 9.3 9.5 8.5Z',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); p.morale = clamp(p.morale - 1, 0, 100); } },
  { id: 'hothead', label: 'Tête brûlée', registry: 'mental', flag: 'hothead', threshold: 2,
    pro: 'Une intensité que le public adore', con: 'Un sang qui monte vite, staff sur les nerfs',
    icon: 'M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-2-1-3-2-4 .3 2-1 3-2 2 1-3-1-6-2-9Z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.coach = clamp(p.coach - 1, 0, 100); } },
  // ---- Médiatique ----
  { id: 'mediaFriend', label: 'Chouchou des médias', registry: 'media', flag: 'mediaFriend', threshold: 2,
    pro: 'La presse te réserve toujours un traitement de faveur', con: 'On retient ton image avant ton jeu',
    icon: 'M20 8h-3.2L15 4H9L7.2 8H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1ZM12 18a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.reputation = clamp(p.reputation - 1, 0, 100); } },
  { id: 'controversial', label: 'Sulfureux', registry: 'media', flag: 'controversial', threshold: 2,
    pro: 'Ton nom fait vendre, ton aura est immense', con: 'Le staff marche sur des œufs autour de toi',
    icon: 'M13 2 4 14h6l-1 8 9-12h-6z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.coach = clamp(p.coach - 2, 0, 100); } },
  // ---- Finance ----
  { id: 'bling', label: 'Bling', registry: 'finance', flag: 'spender', threshold: 2,
    pro: 'Un train de vie qui fait rêver, image de star assumée', con: 'Les comptes fondent plus vite qu\'ils ne se remplissent',
    icon: 'M6 9 12 3l6 6-6 12z M6 9h12',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.money = Math.round(p.money * 0.98); } },
  { id: 'saver', label: 'Économe', registry: 'finance', flag: 'saver', threshold: 2,
    pro: 'Un patrimoine qui grandit saison après saison', con: 'Une image plus terne qu\'une star tape-à-l\'œil',
    icon: 'M5 12a7 7 0 0 1 12-5l2-1v4l-2 1M5 12v6h9v-3M5 12a7 7 0 0 0 4 6.3',
    effect: (p) => { p.money = p.money + 15; p.popularity = clamp(p.popularity - 1, 0, 100); } },
];

// Une étiquette est active si son flag a atteint le seuil ET a été nourri il y a moins de
// DECAY_SEASONS saisons -- silencieuse plus longtemps que ça, elle s'efface (peut donc bien
// "se perdre", pas seulement s'accumuler).
export function activeTags(p) {
  const flags = p.flags || {}, flagYear = p.flagYear || {}, year = p.year || 0;
  return TAG_DEFS.filter(t => {
    const count = flags[t.flag] || 0;
    if (count < t.threshold) return false;
    const lastYear = flagYear[t.flag] || 0;
    return (year - lastYear) <= DECAY_SEASONS;
  });
}

// Reconstitue les définitions complètes à partir d'une liste d'id sauvegardés (voir rec.tags
// dans endCareer()/hof.js) -- une carrière du Panthéon ne garde que les id, pas les objets.
export function tagsByIds(ids) {
  if (!ids || !ids.length) return [];
  return TAG_DEFS.filter(t => ids.includes(t.id));
}

// Effet de saison, appelé une fois par postSeason() pour chaque étiquette active. Volontairement
// petit et borné (voir commentaire d'en-tête) : jamais appliqué aux attributs ni aux probabilités
// de récompense, seulement à des jauges molles déjà sujettes à bien plus de variance via les
// choix d'événements eux-mêmes.
export function applyTagEffects(p) {
  activeTags(p).forEach(t => t.effect(p));
}

function tagIcon(t) {
  return `<svg viewBox="0 0 24 24" width="13" height="13"><path d="${t.icon}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const REGISTRY_COLOR = { jeu: 'var(--orange-soft)', mental: 'var(--plum)', media: 'var(--mint-soft)', finance: 'var(--chalk-dim)' };

// Puces d'étiquette, pour la fiche HUD en cours de carrière et le récap de fin de carrière.
export function renderTagChips(tags, extraClass = '') {
  if (!tags || !tags.length) return '';
  return `<div class="tag-chips${extraClass ? ' ' + extraClass : ''}">${tags.map(t => `<span class="tag-chip" style="color:${REGISTRY_COLOR[t.registry]};border-color:${REGISTRY_COLOR[t.registry]}" title="${t.pro} · ${t.con}">${tagIcon(t)}${t.label}</span>`).join('')}</div>`;
}
