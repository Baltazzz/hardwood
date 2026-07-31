/* ============================================================
   TRADUCTION (voir AGENDA.md, "réglages et langue anglaise") — structure pensée pour accueillir
   d'autres langues plus tard sans tout réécrire : chaque langue est un simple dictionnaire
   imbriqué (src/i18n/fr.js, src/i18n/en.js), `t(key, vars)` fait la résolution + l'interpolation.

   Portée de CE lot (voir AGENDA.md) : interface, menus, écrans, catalogues de données (postes,
   styles, mode de vie, nations, ligues, hauts faits, boutique, trophées) -- TOUT ce qui est une
   statistique ou un libellé passe par ce système. Les ~200 événements narratifs de carrière
   restent en français pour l'instant (chantier à part, trop volumineux pour cette session) :
   c'est pourquoi la résolution retombe TOUJOURS sur le français plutôt que d'afficher une clé
   brute ou un texte vide -- jamais de texte cassé, quelle que soit la couverture réelle d'une
   langue à un instant donné.

   Robustesse de stockage identique au reste du jeu (Panthéon/badges/cagnotte) : localStorage
   quand disponible, repli mémoire sinon.
============================================================ */
import { FR } from '../i18n/fr.js';
import { EN } from '../i18n/en.js';

export const LOCALES = [
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];
const DICTS = { fr: FR, en: EN };
const DEFAULT_LOCALE = 'fr'; // toujours le français tant que rien n'a été choisi explicitement (voir AGENDA.md)
const LOCALE_KEY = 'hardwood_locale_v1';

let mem = null;
function load() {
  if (mem !== null) return mem;
  try { mem = localStorage.getItem(LOCALE_KEY); } catch (e) { mem = null; }
  if (!mem || !DICTS[mem]) mem = DEFAULT_LOCALE;
  return mem;
}
export function getLocale() { return load(); }
export function setLocale(id) {
  if (!DICTS[id]) return;
  mem = id;
  try { localStorage.setItem(LOCALE_KEY, id); } catch (e) { /* repli mémoire pour la session en cours */ }
}

function resolve(dict, path) {
  const parts = path.split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}
function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Résolution : langue courante -> français (toujours complet, jamais de trou) -> la clé brute
// elle-même en tout dernier recours (ne devrait jamais arriver en pratique, mais préférable à
// une exception si une clé est mal orthographiée quelque part).
export function t(key, vars) {
  const loc = load();
  const str = resolve(DICTS[loc], key) ?? resolve(DICTS.fr, key) ?? key;
  return interpolate(str, vars);
}
