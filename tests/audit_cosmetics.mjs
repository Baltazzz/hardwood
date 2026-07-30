#!/usr/bin/env node
// Garde-fou de non-régression dédié à la cagnotte + boutique cosmétique (voir AGENDA.md AGD-41).
// Vérifie directement (pas seulement en lecture de code) :
//   1. La formule de conversion trésorerie -> jetons (exigeante, monotone, jamais négative).
//   2. Une vraie carrière pilotée (harnais partagé tests/harness.mjs) crédite bien la cagnotte, et
//      qu'un ré-appel d'endCareer() (retour depuis "Ma carte") ne compte JAMAIS les jetons deux fois.
//   3. Achat/possession/équipement pour les 4 familles du catalogue, y compris les refus attendus
//      (item déjà possédé, solde insuffisant, mauvaise famille, item non possédé).
//   4. Persistance robuste : l'état écrit dans localStorage (pas seulement en mémoire) reflète
//      exactement les achats/équipements effectués.
//   5. Les 6 styles de carte se dessinent sans exception sur un vrai contexte canvas (même stub
//      que le reste des tests headless, voir tests/env.mjs).
//   6. Aucune fuite dans les défis/classements : les modules défi entre amis/défi du jour/codec de
//      lien n'importent JAMAIS la cagnotte ou les cosmétiques (vérifié structurellement).
//   7. Un vrai parcours cliqué (écran titre -> boutique -> onglets -> achat -> équipement -> retour)
//      ne plante jamais et reflète l'état à l'écran.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupEnvironment } from './env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;
function check(label, cond) {
  if (cond) { console.log(`✓ ${label}`); }
  else { console.log(`✗ ${label}`); failures++; }
}

function pickRandomEl(list) { const arr = Array.from(list); return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
function clickId(document, id) { const el = document.getElementById(id); if (!el) throw new Error(`Élément #${id} introuvable`); el.click(); }
// Même déroulé que tests/harness.mjs driveOneCareer(), MAIS sans le clic final sur "again" --
// celui-ci appelle setG(newPlayer()) et écraserait state.G AVANT qu'on ait pu lire p.money/
// p.walletEarned du joueur qui vient de terminer sa carrière (exactement ce qu'on veut vérifier
// ici : la cohérence entre la trésorerie de fin de carrière et les jetons crédités).
function driveCareerNoReset({ document, errors }) {
  for (let step = 0; step < 4; step++) { pickRandomEl(document.querySelectorAll('.opt')).click(); clickId(document, 'nextC'); }
  clickId(document, 'nextC');
  pickRandomEl(document.querySelectorAll('.academy-opt')).click();
  for (let i = 0; i < 1000; i++) {
    if (errors.length) return { crashed: true };
    if (document.getElementById('again')) return { crashed: false };
    if (document.getElementById('afterSeason')) clickId(document, 'afterSeason');
    else if (document.getElementById('natContinue')) clickId(document, 'natContinue');
    else if (document.getElementById('forcedEndContinue')) clickId(document, 'forcedEndContinue');
    else if (document.querySelector('.choice')) {
      pickRandomEl(document.querySelectorAll('.choice')).click();
      const cont = document.getElementById('contBtn'); if (cont) cont.click();
    } else throw new Error('État d\'écran non reconnu');
  }
  return { crashed: true, reason: 'plafond atteint' };
}

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  const wallet = await import('../src/engine/wallet.js');
  const cosmetics = await import('../src/engine/cosmetics.js');
  const card = await import('../src/ui/card.js');
  const screens = await import('../src/ui/screens.js');
  const state = await import('../src/engine/state.js');

  // ---- 1. Formule de conversion ----
  check('tokensFromMoney(0) === 0', wallet.tokensFromMoney(0) === 0);
  check('tokensFromMoney(négatif) === 0 (jamais négatif)', wallet.tokensFromMoney(-5000) === 0);
  const t1 = wallet.tokensFromMoney(6289), t2 = wallet.tokensFromMoney(41326), t3 = wallet.tokensFromMoney(89169);
  check(`courbe monotone et exigeante (médiane basse=${t1} < All-Star=${t2} < max observé=${t3})`, t1 < t2 && t2 < t3);
  check(`carrière médiocre rapporte peu (médiane "Parcours de combattant" -> ${t1} jetons, <10)`, t1 < 10);

  // ---- 2. Carrière réelle pilotée : crédite la cagnotte, jamais deux fois ----
  wallet.walletReset();
  screens.screenTitle();
  document.getElementById('go').click();
  const result = driveCareerNoReset({ document, errors });
  check('carrière pilotée sans crash', !result.crashed);
  const G = state.G;
  const earned = G.walletEarned || 0;
  check(`p.walletEarned posé et cohérent avec p.money (${earned} jetons pour ${Math.round(G.money)} k€)`, earned === wallet.tokensFromMoney(G.money));
  check(`solde de la cagnotte crédité (${wallet.walletBalance()} === ${earned})`, wallet.walletBalance() === earned);
  const balBefore = wallet.walletBalance();
  screens.endCareer(G.endReason); // simule un retour depuis "Ma carte" qui rappelle endCareer()
  check('ré-invocation endCareer() ne recrédite PAS la cagnotte (garde-fou p.savedWallet)', wallet.walletBalance() === balBefore);

  // ---- 3 + 4. Achat / possession / équipement, avec vérif directe du localStorage ----
  cosmetics.cosmeticsReset();
  wallet.walletReset();
  const themeItem = cosmetics.catalogByFamily('theme').find(c => c.tier === 'cheap');
  let r = cosmetics.purchase(themeItem.id);
  check(`achat refusé sans solde suffisant (${themeItem.id}, prix ${themeItem.price}, solde 0)`, r.ok === false && r.reason === 'insufficient');
  check('rien débité/possédé après un achat refusé', wallet.walletBalance() === 0 && !cosmetics.isOwned(themeItem.id));

  const earnedForShop = wallet.earnFromCareer({ money: 200000 }); // carrière synthétique très riche : de quoi tout tester
  check(`cagnotte largement créditée pour la suite du test (${earnedForShop} jetons, formule attendue = ${wallet.tokensFromMoney(200000)})`, earnedForShop === wallet.tokensFromMoney(200000) && earnedForShop > 500);

  r = cosmetics.purchase(themeItem.id);
  check(`achat accepté (${themeItem.id})`, r.ok === true);
  check('item possédé après achat', cosmetics.isOwned(themeItem.id));
  const balAfterBuy = wallet.walletBalance();
  r = cosmetics.purchase(themeItem.id);
  check('rachat du même item refusé (déjà possédé)', r.ok === false && r.reason === 'owned');
  check('rachat refusé ne débite pas une seconde fois', wallet.walletBalance() === balAfterBuy);

  check('equip() refuse une mauvaise famille (theme id équipé sur "card")', cosmetics.equip('card', themeItem.id) === false);
  const otherTheme = cosmetics.catalogByFamily('theme').find(c => c.tier === 'cheap' && c.id !== themeItem.id);
  check('equip() refuse un item non possédé', cosmetics.equip('theme', otherTheme.id) === false);
  check('equip() accepte un item possédé', cosmetics.equip('theme', themeItem.id) === true);
  check('equippedId reflète le nouvel équipement', cosmetics.equippedId('theme') === themeItem.id);
  check('equip() refuse null sur theme (toujours un défaut requis)', cosmetics.equip('theme', null) === false);
  check('equip() accepte null sur frame (emplacement optionnel)', cosmetics.equip('frame', null) === true);

  // Tous les items du catalogue achetables et équipables sans exception, avec assez de fonds.
  wallet.earnFromCareer({ money: 5_000_000 });
  let allOk = true;
  for (const item of cosmetics.COSMETICS) {
    if (item.price === 0) continue;
    const pr = cosmetics.purchase(item.id);
    if (!pr.ok && pr.reason !== 'owned') { allOk = false; console.log(`  ✗ achat impossible pour ${item.id} (${pr.reason})`); continue; }
    if (!cosmetics.equip(item.family, item.id)) { allOk = false; console.log(`  ✗ équipement impossible pour ${item.id}`); }
  }
  check(`les ${cosmetics.COSMETICS.filter(c => c.price > 0).length} items payants du catalogue s'achètent et s'équipent tous`, allOk);

  // localStorage inspecté directement (pas seulement l'état en mémoire du module).
  const rawCosmetics = JSON.parse(localStorage.getItem('hardwood_cosmetics_v1'));
  check('localStorage cosmétiques reflète bien les possessions', rawCosmetics.owned[themeItem.id] === true);
  check('localStorage cosmétiques reflète bien l\'équipement', rawCosmetics.equipped.theme === cosmetics.equippedId('theme'));
  const rawWallet = JSON.parse(localStorage.getItem('hardwood_wallet_v1'));
  check('localStorage cagnotte reflète le solde en mémoire', rawWallet.balance === wallet.walletBalance());

  // applyEquippedTheme() : pose bien les variables CSS attendues, sans jamais planter.
  cosmetics.applyEquippedTheme();
  const rootStyle = document.documentElement.style;
  check('applyEquippedTheme() pose --orange sur <html>', !!rootStyle.getPropertyValue('--orange'));
  cosmetics.equip('theme', 'terre_battue');
  cosmetics.applyEquippedTheme();
  check('retour au thème par défaut retire les variables CSS (palette d\'origine)', rootStyle.getPropertyValue('--orange') === '');

  // ---- 5. Les 6 styles de carte se dessinent sans exception ----
  const sampleRec = { name: 'Test Joueur', flag: '🇫🇷', posEmoji: '🏀', posName: 'Meneur', styleName: 'Scoreur', styleEmoji: '🎯',
    tier: 'Superstar', score: 250, champs: 2, mvps: 1, allstars: 4, peak: 92, seasons: 12, endAge: 34,
    bestPts: 28.4, nba: true, clutch: 5, ovrSeries: [60, 65, 72, 80, 88, 92, 90, 85],
    tripleDoubles: 3, accolades: { 'Champion NBA': 1, 'MVP': 1 }, tags: [], totalPts: 18234, totalAst: 4210,
    totalReb: 3120, totalBlk: 210, totalStl: 540, headline: 'Une carrière hors du commun, saluée par toute la presse spécialisée.',
    nation: 'France', hof: true, date: Date.now() };
  const canvas = document.createElement('canvas');
  let drawOk = true;
  for (const styleId of Object.keys(card.CARD_STYLES)) {
    try { card.drawCard(canvas, sampleRec, styleId); } catch (e) { drawOk = false; console.log(`  ✗ style "${styleId}" a levé : ${e.message}`); }
  }
  check(`les ${Object.keys(card.CARD_STYLES).length} styles de carte se dessinent sans exception`, drawOk);

  // ---- 6. Aucune fuite structurelle dans les défis/classements ----
  const leakFiles = ['engine/challengeCodec.js', 'engine/challenges.js', 'engine/dailyChallenge.js', 'engine/season.js', 'engine/player.js'];
  let noLeak = true;
  for (const f of leakFiles) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
    if (/wallet\.js|cosmetics\.js/.test(src)) { noLeak = false; console.log(`  ✗ ${f} référence wallet/cosmetics`); }
  }
  check('aucun module de défi/simulation n\'importe wallet.js ou cosmetics.js', noLeak);

  // ---- 7. Parcours cliqué réel : titre -> boutique -> onglets -> achat -> équipement -> retour ----
  cosmetics.cosmeticsReset();
  wallet.walletReset();
  wallet.earnFromCareer({ money: 200000 });
  screens.screenTitle();
  const shopBtn = document.getElementById('shop');
  check('bouton "Boutique" présent sur l\'écran titre', !!shopBtn);
  shopBtn.click();
  check('écran boutique rendu (bouton retour présent)', !!document.getElementById('shopBack'));
  const cardTab = document.querySelector('[data-tab="card"]');
  cardTab.click();
  check('onglet "Cartes" actif après clic', document.querySelector('[data-tab="card"]').classList.contains('active'));
  const buyBtn = document.querySelector('[data-act="buy"]:not([disabled])');
  check('au moins un item de carte achetable en un clic', !!buyBtn);
  const boughtId = buyBtn.dataset.id;
  buyBtn.click();
  check(`achat en un clic confirmé (${boughtId} possédé)`, cosmetics.isOwned(boughtId));
  const equipBtn = stageQuery(document, `[data-act="equip"][data-id="${boughtId}"]`);
  check('bouton "Équiper" apparaît après achat', !!equipBtn);
  equipBtn.click();
  check('équipement en un clic confirmé', cosmetics.equippedId('card') === boughtId);
  document.getElementById('shopBack').click();
  check('retour à l\'écran titre depuis la boutique sans crash', !!document.getElementById('shop'));
  check('aucune erreur JS levée pendant tout le parcours', errors.length === 0);

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
function stageQuery(document, sel) { return document.querySelector(sel); }
main();
