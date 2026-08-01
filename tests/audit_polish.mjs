#!/usr/bin/env node
// Garde-fou de non-régression dédié au "lot de finitions avant diffusion" (voir AGENDA.md
// AGD-53) : trois points, chacun vérifié directement.
//   1. Hiérarchie des prix de la boutique -- trois paliers (commun/rare/prestige) nettement
//      séparés, plancher relevé, aucun chevauchement entre paliers.
//   2. Premier lancement -- écran de bienvenue = le tout premier écran vu par un nouveau joueur
//      (jamais un écran distinct), parcours complet (bienvenue -> passer OU terminer -> écran
//      titre -> geste principal -> création de personnage) sans erreur JS.
//   3. Carte de fin de carrière -- irréprochable dans des cas extrêmes (nom très court/très long,
//      carrière très riche/très pauvre), jamais de dépassement hors cadre, nom du jeu ET lien
//      du site tous deux présents dans les pixels de la carte ET dans le texte de partage
//      (fonctionne même quand l'image seule circule, sans le texte d'origine).
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

function pickRandomEl(list) { const arr = Array.from(list); return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
function clickId(document, id) { const el = document.getElementById(id); if (!el) throw new Error(`#${id} introuvable`); el.click(); }

// Contexte canvas instrumenté avec des métriques PROPORTIONNELLES au texte (contrairement au
// stub global de env.mjs, qui renvoie une largeur fixe de 40px pour toute chaîne -- suffisant
// pour piloter des carrières sans planter, mais incapable d'exercer les boucles de réduction de
// police/troncature de card.js, qui ne se déclenchent que si measureText() reflète vraiment la
// longueur du texte). Suffisamment fidèle (largeur ~ nb de caractères x taille de police) pour
// vérifier que les garde-fous de card.js s'activent réellement sur des cas extrêmes.
function makeInstrumentedCanvas() {
  const calls = { fillText: [] };
  let font = '16px sans-serif';
  const state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, textAlign: 'left', textBaseline: 'alphabetic' };
  function fontSizePx() { const m = /(\d+(?:\.\d+)?)px/.exec(font); return m ? parseFloat(m[1]) : 16; }
  const ctx = {
    get font() { return font; }, set font(v) { font = v; },
    get fillStyle() { return state.fillStyle; }, set fillStyle(v) { state.fillStyle = v; },
    get strokeStyle() { return state.strokeStyle; }, set strokeStyle(v) { state.strokeStyle = v; },
    get lineWidth() { return state.lineWidth; }, set lineWidth(v) { state.lineWidth = v; },
    get textAlign() { return state.textAlign; }, set textAlign(v) { state.textAlign = v; },
    get textBaseline() { return state.textBaseline; }, set textBaseline(v) { state.textBaseline = v; },
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, arcTo() {}, closePath() {},
    stroke() {}, fill() {}, fillRect() {}, strokeRect() {},
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    measureText(s) { return { width: [...String(s)].length * fontSizePx() * 0.56 }; },
    fillText(s, x, y) { calls.fillText.push({ s: String(s), x, y, font, fillStyle: state.fillStyle }); },
  };
  const canvas = { getContext: () => ctx, width: 0, height: 0 };
  return { canvas, calls };
}

async function main() {
  const { document, errors } = setupEnvironment();

  // ---- 1. Hiérarchie des prix de la boutique ----
  {
    const { COSMETICS } = await import('../src/engine/cosmetics.js');
    const paid = COSMETICS.filter(c => c.tier === 'common' || c.tier === 'rare' || c.tier === 'prestige');
    check('36 items répartis sur les 3 paliers commun/rare/prestige', paid.length === 36);
    const byTier = { common: paid.filter(c => c.tier === 'common'), rare: paid.filter(c => c.tier === 'rare'), prestige: paid.filter(c => c.tier === 'prestige') };
    check('au moins un item dans chacun des 3 paliers', byTier.common.length > 0 && byTier.rare.length > 0 && byTier.prestige.length > 0);
    const maxCommon = Math.max(...byTier.common.map(c => c.price));
    const minRare = Math.min(...byTier.rare.map(c => c.price));
    const maxRare = Math.max(...byTier.rare.map(c => c.price));
    const minPrestige = Math.min(...byTier.prestige.map(c => c.price));
    check(`aucun chevauchement commun/rare (max commun ${maxCommon} < min rare ${minRare})`, maxCommon < minRare);
    check(`aucun chevauchement rare/prestige (max rare ${maxRare} < min prestige ${minPrestige})`, maxRare < minPrestige);
    check(`palier rare nettement plus cher que commun (min rare ${minRare} >= 2x max commun ${maxCommon})`, minRare >= maxCommon * 2);
    check(`palier prestige nettement plus cher que rare (min prestige ${minPrestige} >= 5x max rare ${maxRare})`, minPrestige >= maxRare * 5);
    const minCommon = Math.min(...byTier.common.map(c => c.price));
    check(`plancher de prix relevé (le moins cher du jeu coûte ${minCommon} k€, largement au-dessus de l'ancien plancher 1 500 k€)`, minCommon >= 10000);
    check('tous les prix sont des multiples de 1000 (lisibilité)', paid.every(c => c.price % 1000 === 0));
  }

  // ---- 2. Premier lancement : bienvenue = tout premier écran, parcours complet sans erreur ----
  {
    localStorage.removeItem('hw_welcome_seen');
    check('aucun choix de bienvenue mémorisé au tout premier lancement (état neuf)', localStorage.getItem('hw_welcome_seen') === null);
    const screens = await import('../src/ui/screens.js');
    screens.screenTitle(); // point d'entrée réel (voir main.js) pour un tout premier visiteur
    check('le tout premier écran affiché EST l\'écran de bienvenue (pas un écran distinct)', !!document.querySelector('.welcome-screen'));
    check('bouton "Passer" atteignable dès le premier écran (sortie rapide possible)', !!document.getElementById('wSkip'));
    check('geste principal ("Compris, on commence") présent sans avoir à chercher', !!document.getElementById('wGo'));
    clickId(document, 'wSkip');
    check('"Passer" mène directement à l\'écran titre', !!document.getElementById('go') || !!document.getElementById('resumeGo'));
    check('un choix de bienvenue est mémorisé après "Passer" (jamais réaffiché malgré lui)', localStorage.getItem('hw_welcome_seen') === '1');
    check('geste principal ("Commencer") immédiatement visible sur l\'écran titre', !!document.getElementById('go'));
    clickId(document, 'go');
    check('le geste principal lance directement la création de personnage', document.querySelectorAll('.opt').length > 0);
    check('aucune erreur JS pendant tout le parcours de première impression', errors.length === 0);

    // Chemin alternatif : terminer la bienvenue jusqu'au bout (pas seulement "Passer").
    localStorage.removeItem('hw_welcome_seen');
    screens.screenTitle();
    check('écran de bienvenue re-proposé pour un nouvel état neuf', !!document.querySelector('.welcome-screen'));
    clickId(document, 'wGo');
    check('"Compris, on commence" mène aussi à l\'écran titre', !!document.getElementById('go') || !!document.getElementById('resumeGo'));
  }

  // ---- 3. Carte de fin de carrière : cas extrêmes, jamais de dépassement, nom + lien visibles ----
  {
    const card = await import('../src/ui/card.js');
    const W = 1080, H = 1350;
    const baseRec = {
      posEmoji: '🧠', styleEmoji: '🎯', pos: 'PG', style: 'scorer', nationId: 'FR', flag: '🇫🇷',
      tier: 'Superstar', peak: 92, endAge: 34, bestPts: 28.4, nba: true, accolades: {}, tags: [],
    };

    // Cas 1 : nom TRÈS long + carrière TRÈS riche (déclenche troncature ET réduction de police).
    const richLongName = 'x'.repeat(60);
    const richRec = { ...baseRec, name: richLongName, score: 999999, champs: 12, mvps: 5, allstars: 18, clutch: 27,
      tripleDoubles: 41, seasons: 23, totalPts: 999999999, totalAst: 88888888, totalReb: 77777777, totalBlk: 12345, totalStl: 54321,
      ovrSeries: Array.from({ length: 23 }, (_, i) => 60 + i), hof: true,
      headline: 'Une phrase de presse absurdement longue conçue spécifiquement pour vérifier que le pied de carte -- nom du jeu et lien du site -- ne se retrouve jamais recouvert ni poussé hors du cadre, peu importe le volume de texte au-dessus.'.repeat(2) };
    const inst1 = makeInstrumentedCanvas();
    let threw1 = false;
    try { card.drawCard(inst1.canvas, richRec, 'legend_foil'); } catch (e) { threw1 = true; console.log('  ✗ exception:', e.message); }
    check('carrière EXTRÊMEMENT riche + nom de 60 caractères : drawCard() ne plante pas', !threw1);
    const allX1 = inst1.calls.fillText.map(c => c.x), allY1 = inst1.calls.fillText.map(c => c.y);
    check('cas riche : aucune coordonnée de texte hors des bornes du canvas (0..1080 / 0..1350)',
      allX1.every(x => x >= 0 && x <= W) && allY1.every(y => y >= 0 && y <= H));
    const nameCall1 = inst1.calls.fillText.find(c => c.font.includes('76px'));
    check('cas riche : le nom affiché est bien tronqué (plus court que les 60 caractères d\'origine)', !!nameCall1 && nameCall1.s.length < richLongName.length);
    check('cas riche : le nom tronqué se termine par une ellipse (jamais coupé net)', nameCall1.s.endsWith('…'));
    const footerCall1 = inst1.calls.fillText.find(c => c.s.includes('HARDWOOD'));
    check('cas riche : le pied de carte ("HARDWOOD") est bien dessiné malgré la citation de presse démesurée', !!footerCall1);
    check('cas riche : le pied de carte reste bien à sa position ancrée (jamais repoussé par le contenu au-dessus)', footerCall1 && footerCall1.y === H - 70);
    check('cas riche : le domaine du site figure dans le pied de carte (lien visible même sur l\'image seule)',
      footerCall1 && footerCall1.s.includes(window.location.host));
    // Toutes les lignes de citation de presse doivent rester AU-DESSUS du pied de carte (jamais de chevauchement).
    const headlineCalls1 = inst1.calls.fillText.filter(c => c.font.includes('Georgia'));
    check('cas riche : la citation de presse (même démesurée) ne chevauche jamais le pied de carte',
      headlineCalls1.every(c => c.y < H - 110));

    // Cas 2 : nom TRÈS court + carrière TRÈS pauvre (aucun total, aucune citation, jamais HOF).
    const poorRec = { ...baseRec, name: 'A', score: 0, champs: 0, mvps: 0, allstars: 0, clutch: 0,
      tripleDoubles: 0, seasons: 1, totalPts: null, ovrSeries: null, hof: false, headline: '' };
    const inst2 = makeInstrumentedCanvas();
    let threw2 = false;
    try { card.drawCard(inst2.canvas, poorRec, 'classic'); } catch (e) { threw2 = true; console.log('  ✗ exception:', e.message); }
    check('carrière la plus pauvre possible (1 saison, 0 partout) + nom d\'1 caractère : drawCard() ne plante pas', !threw2);
    const nameCall2 = inst2.calls.fillText.find(c => c.font.includes('76px'));
    check('cas pauvre : le nom court n\'est jamais tronqué inutilement', nameCall2 && nameCall2.s === 'A');
    const footerCall2 = inst2.calls.fillText.find(c => c.s.includes('HARDWOOD'));
    check('cas pauvre : le pied de carte (nom du jeu + lien) reste présent même sans aucune citation/statistiques cumulées', !!footerCall2 && footerCall2.s.includes(window.location.host));
    const allY2 = inst2.calls.fillText.map(c => c.y);
    check('cas pauvre : aucune coordonnée hors bornes non plus (contenu minimal, pas de débordement inverse)', allY2.every(y => y >= 0 && y <= H));

    // Les 6 styles de carte, sur le cas riche (le plus contraignant), toujours sans exception.
    const { CARD_STYLES } = card;
    let allStylesOk = true;
    for (const styleId of Object.keys(CARD_STYLES)) {
      const inst = makeInstrumentedCanvas();
      try { card.drawCard(inst.canvas, richRec, styleId); } catch (e) { allStylesOk = false; console.log(`  ✗ style "${styleId}" a levé sur le cas riche : ${e.message}`); }
    }
    check(`les ${Object.keys(CARD_STYLES).length} styles de carte tiennent tous le cas le plus riche sans exception`, allStylesOk);

    // Texte de partage (voir ui/share.js -- le champ `url` est ignoré dès que des fichiers sont
    // partagés, le lien doit donc être présent DANS le texte lui-même pour survivre à tous les
    // chemins : partage de fichier, partage texte+URL de repli, ET copie presse-papiers).
    const { t } = await import('../src/engine/i18n.js');
    const shareText = t('careerCard.shareText', { name: 'Test', tier: 'Superstar', score: 250, url: window.location.origin });
    check('le texte de partage de la carte contient bien le lien du site (survit même si l\'image seule circule)', shareText.includes(window.location.origin));
    check('le texte de partage de la carte contient bien "HARDWOOD" (nom du jeu)', shareText.includes('HARDWOOD'));
  }

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
