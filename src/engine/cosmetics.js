/* ============================================================
   BOUTIQUE COSMÉTIQUE (voir AGENDA.md AGD-41/AGD-47) — catalogue + état d'achat/équipement, payé
   directement en k€ de la cagnotte (engine/wallet.js -- la trésorerie de carrière cumulée, plus
   jetons abstraits). STRICTEMENT décoratif par construction : chaque
   famille ne touche que du rendu (variables CSS, palette de la carte canvas, classes CSS d'un
   cadre de profil, texte d'un titre honorifique) -- rien ici ne lit ni n'écrit jamais un champ du
   joueur `p` utilisé par la simulation (attrs/ovr/salaire/reputation/...), aucun de ces modules
   n'est importé par engine/season.js ou engine/challenges.js/dailyChallenge.js. Un item acheté
   est débloqué DÉFINITIVEMENT (jamais reperdu), équipable/changeable à volonté.

   Même stockage robuste que hof.js/badges.js/wallet.js : localStorage quand disponible, repli
   mémoire sinon.
============================================================ */
import { GLOBAL_CLUB_COLORS } from '../data/clubData.js';
import { hexToRgb, rgbToHsl, hslToHex, contrastRatio, ensureContrast, ensureVisible, deriveSecondary, hexToRgba } from './accent.js';
import { walletSpend } from './wallet.js';

const COSMETICS_KEY = 'hardwood_cosmetics_v1';
let mem = null;

// Trois familles, quatre emplacements équipables (un thème d'interface et un style de carte sont
// mutuellement exclusifs par nature -- un seul actif à la fois ; cadre et titre sont deux
// emplacements de profil INDÉPENDANTS, équipables ensemble).
const DEFAULT_EQUIPPED = { theme: 'terre_battue', card: 'classic', frame: null, title: null };

function load() {
  if (mem !== null) return mem;
  try {
    const raw = localStorage.getItem(COSMETICS_KEY);
    mem = raw ? JSON.parse(raw) : null;
  } catch (e) { mem = null; }
  if (!mem || typeof mem !== 'object') mem = { owned: {}, equipped: { ...DEFAULT_EQUIPPED } };
  mem.owned = mem.owned || {};
  mem.equipped = { ...DEFAULT_EQUIPPED, ...(mem.equipped || {}) };
  return mem;
}
function save() { try { localStorage.setItem(COSMETICS_KEY, JSON.stringify(mem)); } catch (e) { /* stockage indisponible : repli mémoire déjà fait */ } }

/* ------------------------------------------------------------
   Génération de palette de thème à partir d'une simple couleur de marque (club NBA réutilisé
   depuis data/clubData.js, ou teinte originale) -- réutilise les PRIMITIVES colorimétriques déjà
   éprouvées d'engine/accent.js (garantie de contraste sur le fond crème --court) plutôt que de
   dupliquer cette logique : un thème de boutique doit rester aussi lisible qu'une couleur de club
   pendant une carrière, jamais une exception moins vérifiée.
------------------------------------------------------------ */
function darken(hex, amount) {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(h, s, Math.max(0, l - amount));
}
const ON_ACCENT = '#FFF8EE'; // = --on-accent : texte clair posé sur un fond d'accent saturé (boutons pleins)
// Assombrit une couleur jusqu'à ce qu'elle offre un contraste suffisant DERRIÈRE le texte clair
// des boutons pleins -- même principe de boucle que ensureContrast()/ensureVisible() dans
// accent.js, mais la cible de contraste est le texte clair, pas le fond crème.
function darkUntilContrastWith(hex, fgHex, minRatio) {
  let candidate = hex, iter = 0;
  while (contrastRatio(candidate, fgHex) < minRatio && iter < 40) {
    candidate = darken(candidate, 0.025);
    iter++;
  }
  return candidate;
}

// primaryRaw/secondaryRaw : couleurs de marque brutes (hex). secondaryRaw optionnel -- dérivée
// algorithmiquement de la primaire si absente (exactement comme emblemColors() le fait déjà pour
// les clubs sans secondaire officielle en base).
function buildThemeShades(primaryRaw, secondaryRaw) {
  const secondaryBase = secondaryRaw || deriveSecondary(primaryRaw);
  // Mêmes seuils de contraste que la palette Terre battue d'origine (voir commentaires --orange/
  // --orange-soft/--mint/--mint-soft dans styles.css) : gros texte/icônes à 3.3:1, petit texte
  // sûr à 4.5-4.8:1.
  const orange = ensureContrast(primaryRaw, 3.3);
  const orangeSoft = ensureContrast(primaryRaw, 4.8);
  // Base pour les nuances de bouton (deep/deepHover) : plancher de luminosité avant dérivation.
  // Sans lui, une couleur de marque proche du noir pur (ex. Brooklyn, #000000) donnerait
  // orangeDeep ET orangeDeepHover identiques (#000000 assombri reste #000000) -- le survol d'un
  // bouton plein n'aurait alors plus aucun effet visuel. Le contraste avec le texte clair
  // (--on-accent) reste vérifié après coup par darkUntilContrastWith, jamais juste supposé : pour
  // une couleur déjà sombre, le seuil est de toute façon atteint bien avant de retoucher le noir.
  const [oh, os, ol] = rgbToHsl(...hexToRgb(orange));
  const buttonBase = ol < 0.16 ? hslToHex(oh, os, 0.16) : orange;
  const orangeDeep = darkUntilContrastWith(darken(buttonBase, 0.06), ON_ACCENT, 5.3);
  const orangeDeepHover = darkUntilContrastWith(darken(buttonBase, 0.02), ON_ACCENT, 4.3);
  const mint = ensureContrast(secondaryBase, 3.2);
  const mintSoft = ensureContrast(secondaryBase, 4.5);
  return {
    '--orange': orange, '--orange-soft': orangeSoft,
    '--orange-deep': orangeDeep, '--orange-deep-hover': orangeDeepHover,
    '--mint': mint, '--mint-soft': mintSoft,
    '--btn-glow': hexToRgba(orange, 0.24),
  };
}

// Palettes originales (pas de secondaire officielle -- dérivée algorithmiquement, comme un club
// sans couleur de marque connue en base).
const ORIGINAL_PALETTES = {
  ocean: '#1D6FA5', forest: '#1F7A4D', royal: '#6A3FA0',
  brick: '#8C2F2F', slate: '#4A5568', amber: '#D9822B',
};
// Franchises NBA "de prestige" réutilisées telles quelles depuis data/clubData.js
// (GLOBAL_CLUB_COLORS, mêmes couleurs officielles que l'identité de club en jeu) -- aucun logo ni
// nom de marque affiché ailleurs que ce libellé texte, uniquement les couleurs.
const NBA_THEME_CLUBS = {
  boston: 'Boston', lakers: 'L.A. Lakers', warriors: 'Golden State', heat: 'Miami',
  bulls: 'Chicago', knicks: 'New York', nets: 'Brooklyn', spurs: 'San Antonio',
  sixers: 'Philadelphie', raptors: 'Toronto',
};

function themeShadesFor(id) {
  if (id === 'terre_battue' || !id) return null; // null = palette d'origine, aucune variable posée
  if (ORIGINAL_PALETTES[id]) return buildThemeShades(ORIGINAL_PALETTES[id]);
  if (NBA_THEME_CLUBS[id]) { const c = GLOBAL_CLUB_COLORS[NBA_THEME_CLUBS[id]]; return buildThemeShades(c.primary, c.secondary); }
  if (id === 'champion_gold') return buildThemeShades('#8A6A12', '#1C1C1C'); // or vieilli / noir profond, palette originale dédiée au prestige
  return null;
}

// Aperçu (orange/mint résultants) pour la vignette de la boutique (ui/shop.js) -- SANS jamais
// poser les variables CSS globales (à la différence d'applyEquippedTheme()), pour prévisualiser
// un thème non équipé sans changer le reste de l'interface pendant qu'on parcourt le catalogue.
export function themePreviewColors(id) {
  const shades = themeShadesFor(id);
  return shades ? { primary: shades['--orange'], secondary: shades['--mint'] } : { primary: '#E0562D', secondary: '#A1821F' };
}

/* ------------------------------------------------------------
   Catalogue -- chaque item : id stable, family, name/desc affichés, price EN K€ (voir AGENDA.md
   AGD-47 -- la cagnotte est directement la trésorerie de carrière cumulée, plus jetons abstraits),
   tier ('cheap'|'prestige', purement indicatif pour le regroupement d'affichage).

   Calibrage (voir engine/wallet.js) : distribution RÉELLE de trésorerie de fin de carrière
   mesurée sur 300 carrières pilotées (médiane ~13 900 k€, p90 ~54 300 k€, max observé sur
   l'échantillon ~89 200 k€, sur UNE SEULE carrière). La cagnotte cumule cette trésorerie À TRAVERS
   toutes les carrières (jamais remise à zéro) : les prix "cheap" (1 500-8 000 k€) restent
   accessibles dès une carrière correcte à moyenne, les prix "prestige" (150 000-260 000 k€)
   réclament plusieurs grosses carrières cumulées, jamais une seule -- même la meilleure carrière
   observée sur l'échantillon (89 200 k€) n'y suffit pas seule.
------------------------------------------------------------ */
export const COSMETICS = [
  // ---- Thèmes de couleur d'interface ----
  { id: 'terre_battue', family: 'theme', name: 'Terre battue', desc: 'La palette d\'origine du jeu. Un classique ne se démode pas.', price: 0, tier: 'default' },
  { id: 'ocean', family: 'theme', name: 'Bleu Océan', desc: 'Le genre de bleu qui inspire confiance en interview, même après une défaite de 40 points.', price: 4000, tier: 'cheap' },
  { id: 'forest', family: 'theme', name: 'Vert Forêt', desc: 'Discret, efficace, jamais le sujet de la conversation -- comme ce pivot qui fait juste son travail.', price: 4000, tier: 'cheap' },
  { id: 'royal', family: 'theme', name: 'Violet Royal', desc: 'Pour te sentir en contrat max, même en G League.', price: 4000, tier: 'cheap' },
  { id: 'brick', family: 'theme', name: 'Rouge Brique', desc: 'Sérieux, presque menaçant. Le coach adverse s\'inquiète avant même le tip-off.', price: 4000, tier: 'cheap' },
  { id: 'slate', family: 'theme', name: 'Gris Ardoise', desc: 'Sobre et neutre, comme ce coéquipier qui ne parle jamais mais fait toujours le bon appel défensif.', price: 4000, tier: 'cheap' },
  { id: 'amber', family: 'theme', name: 'Ambre', desc: 'Moins m\'as-tu-vu que l\'or classique, tout aussi doré sur les bords.', price: 4000, tier: 'cheap' },
  { id: 'boston', family: 'theme', name: 'Vert Celtique', desc: 'Vert et or, l\'ADN d\'une grande franchise historique de Boston. Dix-sept banderoles ne rentrent pas dans cette description, mais l\'esprit y est.', price: 7000, tier: 'cheap' },
  { id: 'lakers', family: 'theme', name: 'Pourpre & Or', desc: 'Violet et or, showtime garanti même si tu joues en G League.', price: 7000, tier: 'cheap' },
  { id: 'warriors', family: 'theme', name: 'Baie Dorée', desc: 'Bleu et or de la Baie. Prévois de shooter à 3 points depuis le parking.', price: 7000, tier: 'cheap' },
  { id: 'heat', family: 'theme', name: 'Chaleur Tropicale', desc: 'Grenat et orange. Culture, intensité, et une irrépressible envie de jouer un match blanc en playoffs.', price: 7000, tier: 'cheap' },
  { id: 'bulls', family: 'theme', name: 'Rouge Taureau', desc: 'Rouge et noir. Six bagues d\'écart avec le reste du monde, ambiance comprise.', price: 7000, tier: 'cheap' },
  { id: 'knicks', family: 'theme', name: 'Bleu & Orange', desc: 'Le Madison Square Garden hurle dans ton interface, gratuitement.', price: 7000, tier: 'cheap' },
  { id: 'nets', family: 'theme', name: 'Noir & Blanc', desc: 'Minimaliste jusqu\'à l\'os, pour ceux qui trouvent que le reste du jeu a déjà trop de couleurs.', price: 7000, tier: 'cheap' },
  { id: 'spurs', family: 'theme', name: 'Argent Sobre', desc: 'Système, discipline, zéro esbroufe -- Pop approuverait.', price: 7000, tier: 'cheap' },
  { id: 'sixers', family: 'theme', name: 'Étoile de Philadelphie', desc: '"Trust the process", même pour choisir un thème d\'interface.', price: 7000, tier: 'cheap' },
  { id: 'raptors', family: 'theme', name: 'Griffe du Nord', desc: 'Le seul thème du jeu avec un passeport.', price: 7000, tier: 'cheap' },
  { id: 'champion_gold', family: 'theme', name: 'Or Champion', desc: 'Or vieilli, noir profond. Réservé à ceux qui ont vraiment gagné quelque chose -- littéralement, regarde le prix.', price: 220000, tier: 'prestige' },

  // ---- Styles de carte de fin de carrière ----
  { id: 'classic', family: 'card', name: 'Classique', desc: 'La carte telle qu\'elle a toujours été.', price: 0, tier: 'default' },
  { id: 'noir', family: 'card', name: 'Carte Nuit', desc: 'Fond noir, contraste inversé. Pour une carrière qu\'on prend très, très au sérieux.', price: 6000, tier: 'cheap' },
  { id: 'parquet', family: 'card', name: 'Fond Parquet', desc: 'Le parquet en fond, la maison. Rien de plus logique pour finir là où tout a commencé.', price: 5000, tier: 'cheap' },
  { id: 'vintage', family: 'card', name: 'Bandeau Vintage', desc: 'Cadre double liseré, esprit une du journal du lendemain matin. Ta carrière, imprimée comme en 1998.', price: 5000, tier: 'cheap' },
  { id: 'gold_frame', family: 'card', name: 'Cadre Or', desc: 'Un cadre or bien épais, cérémonie des retraités incluse.', price: 5000, tier: 'cheap' },
  { id: 'legend_foil', family: 'card', name: 'Édition Légende', desc: 'Bandeau or, ornements d\'angle, le tout. La carte que tu montres à tes petits-enfants.', price: 180000, tier: 'prestige' },

  // ---- Titres honorifiques (profil, "Ma progression") ----
  { id: 'title_hope', family: 'title', name: 'Espoir du parquet', desc: 'Un titre pour bien commencer. Techniquement, tu n\'as encore rien prouvé.', price: 1500, tier: 'cheap' },
  { id: 'title_vet', family: 'title', name: 'Vétéran respecté', desc: 'T\'as vu des choses. Beaucoup de choses. La plupart en G League, mais quand même.', price: 2000, tier: 'cheap' },
  { id: 'title_strategist', family: 'title', name: 'Stratège du jeu', desc: 'Tu lis le jeu avant qu\'il ne se joue. Ou alors tu as juste de la chance -- personne ne le saura jamais.', price: 2000, tier: 'cheap' },
  { id: 'title_wall', family: 'title', name: 'Mur défensif', desc: 'Rien ne passe. Enfin, presque rien. Disons "presque".', price: 2000, tier: 'cheap' },
  { id: 'title_showman', family: 'title', name: 'Showman', desc: 'Le jeu, c\'est bien. Le spectacle, c\'est mieux. Le collectif, on verra plus tard.', price: 2500, tier: 'cheap' },
  { id: 'title_clutch', family: 'title', name: 'Clutch Player', desc: 'Tu veux le ballon dans les 5 dernières secondes. Les stats de réussite restent entre nous.', price: 2500, tier: 'cheap' },
  { id: 'title_local_legend', family: 'title', name: 'Légende locale', desc: 'Une légende dans ta ville. Ailleurs, on te demande encore d\'épeler ton nom.', price: 3000, tier: 'cheap' },
  { id: 'title_icon', family: 'title', name: 'Icône populaire', desc: 'Même ceux qui détestent le basket connaissent ton nom. Allez savoir pourquoi.', price: 3000, tier: 'cheap' },

  // ---- Cadres de profil ("Ma progression") ----
  { id: 'frame_wood', family: 'frame', name: 'Cadre Bois', desc: 'Sobre, en bois véritable -- enfin, en pixels qui imitent le bois.', price: 2500, tier: 'cheap' },
  { id: 'frame_bronze', family: 'frame', name: 'Cadre Bronze', desc: 'La médaille qu\'on accepte avec le sourire, la troisième fois.', price: 3000, tier: 'cheap' },
  { id: 'frame_silver', family: 'frame', name: 'Cadre Argent', desc: 'Toujours deuxième, jamais oublié.', price: 4500, tier: 'cheap' },
  { id: 'frame_emerald', family: 'frame', name: 'Cadre Émeraude', desc: 'Personne ne sait pourquoi c\'est cher. Mais ça a l\'air cher.', price: 4500, tier: 'cheap' },
  { id: 'frame_amethyst', family: 'frame', name: 'Cadre Améthyste', desc: 'Un cadre qui en jette, sans jamais rien expliquer sur ton jeu réel.', price: 5000, tier: 'cheap' },
  { id: 'frame_legends', family: 'frame', name: 'Cadre des Légendes', desc: 'Or, émeraude, ornements d\'angle. Ce cadre coûte plus cher que ton premier contrat pro.', price: 260000, tier: 'prestige' },

  // ---- Collection (voir AGENDA.md AGD-47 point 5) : structure/emplacements préparés pour de
  // futurs visuels à collectionner (cartes, maillots) -- pas encore d'image finale, fournie plus
  // tard. `comingSoon:true` : jamais achetable/équipable pour l'instant, purement une vitrine
  // d'emplacements réservés avec un rendu propre (voir ui/shop.js collectionSlotHTML()). ----
  { id: 'collect_card_1', family: 'collection', sub: 'card', name: 'Carte à venir', desc: 'Un visuel collector arrive bientôt ici.', price: null, tier: 'comingSoon', comingSoon: true },
  { id: 'collect_card_2', family: 'collection', sub: 'card', name: 'Carte à venir', desc: 'Un visuel collector arrive bientôt ici.', price: null, tier: 'comingSoon', comingSoon: true },
  { id: 'collect_card_3', family: 'collection', sub: 'card', name: 'Carte à venir', desc: 'Un visuel collector arrive bientôt ici.', price: null, tier: 'comingSoon', comingSoon: true },
  { id: 'collect_card_4', family: 'collection', sub: 'card', name: 'Carte à venir', desc: 'Un visuel collector arrive bientôt ici.', price: null, tier: 'comingSoon', comingSoon: true },
  { id: 'collect_jersey_1', family: 'collection', sub: 'jersey', name: 'Maillot à venir', desc: 'Un maillot collector arrive bientôt ici.', price: null, tier: 'comingSoon', comingSoon: true },
  { id: 'collect_jersey_2', family: 'collection', sub: 'jersey', name: 'Maillot à venir', desc: 'Un maillot collector arrive bientôt ici.', price: null, tier: 'comingSoon', comingSoon: true },
];
const BY_ID = new Map(COSMETICS.map(c => [c.id, c]));
const DEFAULT_IDS = new Set(['terre_battue', 'classic']); // toujours "possédés", jamais achetables

export function catalogByFamily(family) { return COSMETICS.filter(c => c.family === family); }
export function cosmeticById(id) { return BY_ID.get(id) || null; }

export function cosmeticsState() { return load(); }
export function isOwned(id) {
  if (!id || DEFAULT_IDS.has(id)) return true;
  return !!load().owned[id];
}
export function equippedId(family) { return load().equipped[family]; }

// Achète un item : refuse (avec raison) si déjà possédé, item inconnu, pas encore disponible
// (Collection, voir plus haut), ou solde insuffisant. Ne débite JAMAIS la cagnotte en cas
// d'échec (walletSpend() est lui-même atomique).
export function purchase(id) {
  const item = cosmeticById(id);
  if (!item) return { ok: false, reason: 'unknown' };
  if (item.comingSoon) return { ok: false, reason: 'coming_soon' };
  if (isOwned(id)) return { ok: false, reason: 'owned' };
  if (!walletSpend(item.price)) return { ok: false, reason: 'insufficient' };
  const state = load();
  state.owned[id] = true;
  save();
  return { ok: true };
}

// Équipe un item déjà possédé (ou un des deux defaults 'terre_battue'/'classic', ou `null` pour
// vider un cadre/titre) dans son emplacement. Refuse silencieusement (false) un id non possédé,
// pas encore disponible, ou d'une autre famille -- jamais d'état incohérent (ex. un thème non
// acheté appliqué quand même).
export function equip(family, id) {
  if (id !== null) {
    const item = cosmeticById(id);
    if (!item || item.family !== family || item.comingSoon) return false;
    if (!isOwned(id)) return false;
  } else if (family !== 'frame' && family !== 'title') {
    return false; // seuls cadre/titre acceptent "aucun équipé" -- thème/carte ont toujours un défaut
  }
  const state = load();
  state.equipped[family] = id;
  save();
  return true;
}

/* ------------------------------------------------------------
   Application du thème équipé sur les variables CSS globales -- appelée au chargement (main.js)
   et à chaque changement d'équipement (ui/shop.js). Purement visuel : ne pose que des variables
   CSS déjà consommées par styles.css, jamais un champ lu par la simulation.
------------------------------------------------------------ */
export function applyEquippedTheme() {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const shades = themeShadesFor(equippedId('theme'));
  const root = document.documentElement.style;
  const keys = ['--orange', '--orange-soft', '--orange-deep', '--orange-deep-hover', '--mint', '--mint-soft', '--btn-glow'];
  if (!shades) { keys.forEach(k => root.removeProperty(k)); return; }
  keys.forEach(k => root.setProperty(k, shades[k]));
}

// Palette de la carte canvas pour le style équipé (voir ui/card.js drawCard()) -- indépendante de
// applyEquippedTheme() : la carte est un <canvas>, elle ne lit jamais les variables CSS.
export function equippedCardStyleId() { return equippedId('card'); }
export function equippedFrameId() { return equippedId('frame'); }
export function equippedTitleId() { return equippedId('title'); }

export function cosmeticsReset() {
  mem = { owned: {}, equipped: { ...DEFAULT_EQUIPPED } };
  save();
}
