// Armoire à trophées : chaque famille de récompense a sa vraie forme (bague / coupe / trophée
// individuel / distinction / médaille), sa couleur, jamais une icône générique répétée. Fait
// maison en SVG, cohérent avec la palette Terre battue (--mint = or, --orange = terracotta,
// --plum = prune). Sert à la fois l'écran de fin de carrière et la fiche Panthéon.
import { t } from '../engine/i18n.js';
// Les clés d'accolade (ex. "Champion NBA", "MVP") sont utilisées TELLES QUELLES comme identifiants
// partout dans le moteur (comptage, badges, Panthéon) -- seul le LIBELLÉ affiché est traduit ici
// (voir i18n/fr.js/en.js trophyLabels), jamais la clé elle-même.
function trophyLabel(key) { return t('trophyLabels.'+key) !== 'trophyLabels.'+key ? t('trophyLabels.'+key) : key; }

const STAR_PATH = 'M12 2 14.9 8.6 22 9.3 16.8 14.1 18.2 21.2 12 17.6 5.8 21.2 7.2 14.1 2 9.3 9.1 8.6Z';
const SILVER = '#A8A29A';
const BRONZE = '#A9673A';

// Tournois de sélection nationale (voir simulateSeason() dans season.js) : sert à distinguer
// "MVP <tournoi>" (honneur national) de "MVP <ligue>" (honneur club), qui partagent le même
// préfixe de chaîne.
const NAT_TOURNAMENTS = ['Coupe du Monde', 'Jeux Olympiques', 'EuroBasket', "Coupe d'Asie", 'Coupe des Amériques', "Coupe d'Afrique"];

export function classifyAccolade(key) {
  if (key.startsWith('🥇') || key.startsWith('🥈') || key.startsWith('🥉')) return 'national';
  if (key.startsWith('MVP ')) {
    const rest = key.slice(4);
    if (NAT_TOURNAMENTS.includes(rest)) return 'national';
  }
  return 'club';
}

function trophyShell(color, emblem, size) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">
    <path d="M7 4H17V8A5 5 0 0 1 7 8Z" fill="${color}"/>
    <path d="M7 5H3V7A4 4 0 0 0 7 10M17 5H21V7A4 4 0 0 1 17 10" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M12 8V17M9 20H15M9 20V18H15V20" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${emblem}
  </svg>`;
}
const CUP_EMBLEM = `<path d="M8 6.4A4.2 4.2 0 0 0 16 6.4" fill="none" stroke="var(--on-accent)" stroke-width="1" opacity=".75"/>`;
const STAR_EMBLEM = `<g transform="translate(12 6) scale(.16) translate(-12 -11.6)"><path d="${STAR_PATH}" fill="var(--on-accent)"/></g>`;
const SHIELD_EMBLEM = `<path d="M12 4.3 14.6 5.3 14.6 6.8 C14.6 8.2 13.4 9 12 9.3 C10.6 9 9.4 8.2 9.4 6.8 L9.4 5.3 Z" fill="var(--on-accent)"/>`;
const CHEVRON_EMBLEM = `<path d="M9 8.6 12 5.2 15 8.6M9.6 10.2 12 7.4 14.4 10.2" fill="none" stroke="var(--on-accent)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
const SASH_EMBLEM = `<rect x="7.3" y="5.2" width="9.4" height="2" fill="var(--on-accent)" opacity=".92" transform="rotate(-22 12 6.2)"/>`;

// Bague de champion (vue de dessus) : réservée au titre NBA, seule ligue où la bague — et non
// le trophée collectif — est le vrai symbole que le joueur garde.
function ringSvg(size) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">
    <ellipse cx="12" cy="15.3" rx="7.4" ry="4.6" fill="none" stroke="var(--mint)" stroke-width="2.6"/>
    <path d="M7.6 8.6 Q7.6 4 12 4 Q16.4 4 16.4 8.6 L16.4 11.4 L7.6 11.4 Z" fill="var(--mint)"/>
    <rect x="9.8" y="5.7" width="4.4" height="3.9" rx="1" fill="var(--plum)"/>
  </svg>`;
}
// Distinction (rosette à rubans) : All-Star, meilleur marqueur — une sélection/reconnaissance,
// pas un trophée qu'on soulève.
function ribbonSvg(color, size) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">
    <path d="M9 13.5 7 22 12 19 17 22 15 13.5" fill="${color}" opacity=".85"/>
    <circle cx="12" cy="8" r="6" fill="${color}"/>
    <path d="M12 4.6 13 7 15.4 7.3 13.7 9 14.1 11.4 12 10.2 9.9 11.4 10.3 9 8.6 7.3 11 7Z" fill="var(--on-accent)"/>
  </svg>`;
}
// Médaille (disque + ruban en V) : sélection nationale uniquement, couleur = métal du classement.
function medalSvg(color, size) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">
    <path d="M8 2 12 9 16 2" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".65"/>
    <circle cx="12" cy="15" r="7" fill="${color}"/>
    <path d="M12 11 13 14 16 14.3 13.7 16.2 14.4 19 12 17.5 9.6 19 10.3 16.2 8 14.3 11 14Z" fill="var(--on-accent)" opacity=".9"/>
  </svg>`;
}

// Couronne (1re place du Panthéon uniquement) : distincte de la médaille d'or déjà utilisée pour
// les accolades de sélection nationale (voir medalSvg ci-dessus), pour ne jamais confondre visuellement
// "meilleure carrière de tous les temps" (le classement lui-même) et "médaille d'or à un tournoi"
// (un accomplissement PARMI d'autres dans une carrière) -- même famille graphique (or, traits nets).
export function crownIcon(size = 28) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">
    <path d="M4 18 3 8 8.5 12.5 12 5 15.5 12.5 21 8 20 18Z" fill="var(--mint)" stroke="var(--mint-soft)" stroke-width="0.7" stroke-linejoin="round"/>
    <rect x="4.2" y="18" width="15.6" height="2.4" rx="1.1" fill="var(--mint)"/>
    <circle cx="4" cy="7.2" r="1.6" fill="var(--mint)"/><circle cx="12" cy="4.2" r="1.6" fill="var(--mint)"/><circle cx="20" cy="7.2" r="1.6" fill="var(--mint)"/>
  </svg>`;
}

const MEDAL_COLORS = { Or: 'var(--mint)', Argent: SILVER, Bronze: BRONZE };
// Icône de médaille isolée (même dessin que dans l'armoire à trophées), pour la cartouche de
// résultat de tournoi national sur le bilan de saison -- réutilise medalSvg() sans exiger une
// clé d'accolade complète (juste le libellé 'Or'/'Argent'/'Bronze').
export function medalIcon(medal, size = 40) {
  return medalSvg(MEDAL_COLORS[medal] || 'var(--mint)', size);
}

function trophyFor(key, size) {
  if (key === 'Champion NBA') return { svg: ringSvg(size), label: trophyLabel('Champion NBA'), family: 'ring' };
  if (key.startsWith('Champion ')) return { svg: trophyShell('var(--mint)', CUP_EMBLEM, size), label: trophyLabel(key), family: 'cup' };
  if (key === 'MVP des finales') return { svg: trophyShell('var(--mint)', SASH_EMBLEM, size), label: trophyLabel(key), family: 'trophy' };
  if (key === 'Meilleur défenseur') return { svg: trophyShell('var(--orange)', SHIELD_EMBLEM, size), label: trophyLabel(key), family: 'trophy' };
  if (key === "Rookie de l'année" || key === 'Meilleur jeune') return { svg: trophyShell('var(--plum)', CHEVRON_EMBLEM, size), label: trophyLabel(key), family: 'trophy' };
  if (key.startsWith('MVP')) return { svg: trophyShell('var(--mint)', STAR_EMBLEM, size), label: trophyLabel(key), family: 'trophy' };
  if (key === 'All-Star' || key === 'All-EuroLeague') return { svg: ribbonSvg('var(--mint)', size), label: trophyLabel(key), family: 'ribbon' };
  if (key === 'Meilleur marqueur') return { svg: ribbonSvg('var(--orange)', size), label: trophyLabel(key), family: 'ribbon' };
  if (key.startsWith('🥇')) return { svg: medalSvg('var(--mint)', size), label: trophyLabel(key.replace('🥇', '').trim()), family: 'medal' };
  if (key.startsWith('🥈')) return { svg: medalSvg(SILVER, size), label: trophyLabel(key.replace('🥈', '').trim()), family: 'medal' };
  if (key.startsWith('🥉')) return { svg: medalSvg(BRONZE, size), label: trophyLabel(key.replace('🥉', '').trim()), family: 'medal' };
  return { svg: ribbonSvg('var(--mint)', size), label: trophyLabel(key), family: 'ribbon' };
}

const FAMILY_RANK = { ring: 0, cup: 1, medal: 1, trophy: 2, ribbon: 3 };

// accolades : objet {libellé: nombre} (p.accolades en cours de carrière, ou rec.accolades
// sauvegardé au Panthéon). compact : grille plus dense pour les contextes resserrés (fiche HUD).
export function renderTrophyCabinet(accolades, opts = {}) {
  const size = opts.compact ? 30 : 38;
  const entries = Object.entries(accolades || {}).filter(([, v]) => v > 0);
  const club = entries.filter(([k]) => classifyAccolade(k) === 'club');
  const national = entries.filter(([k]) => classifyAccolade(k) === 'national');
  const sortFn = (a, b) => {
    const ra = FAMILY_RANK[trophyFor(a[0], size).family] ?? 4, rb = FAMILY_RANK[trophyFor(b[0], size).family] ?? 4;
    return ra !== rb ? ra - rb : b[1] - a[1];
  };
  club.sort(sortFn); national.sort(sortFn);
  const section = (list, title) => !list.length ? '' : `
    <div class="trophy-section">
      <div class="trophy-section-h">${title}</div>
      <div class="trophy-grid">${list.map(([k, v]) => {
        const t = trophyFor(k, size);
        return `<div class="trophy-item" title="${k}">${t.svg}<div class="trophy-label">${t.label}${v > 1 ? ` ×${v}` : ''}</div></div>`;
      }).join('')}</div>
    </div>`;
  const clubHtml = section(club, t('trophies.clubSection'));
  const natHtml = section(national, t('trophies.nationSection'));
  if (!clubHtml && !natHtml) return `<p class="trophy-empty">${t('trophies.empty')}</p>`;
  return `<div class="trophy-cabinet">${clubHtml}${natHtml}</div>`;
}
