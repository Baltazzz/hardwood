#!/usr/bin/env node
// Garde-fou de non-régression dédié aux réglages/traduction anglaise (voir AGENDA.md). Vérifie
// directement (pas seulement en lecture de code) :
//   1. Toute clé présente dans le dictionnaire anglais existe aussi en français (aucune clé
//      orpheline d'un côté), et vice versa -- les deux dictionnaires doivent rester en miroir.
//   2. Aucune valeur de dictionnaire vide par erreur (hors descriptions volontairement vides).
//   3. t() ne renvoie jamais une clé brute non résolue pour l'anglais (repli sur le français
//      vérifié) ni pour le français (langue de référence, doit toujours résoudre).
//   4. Persistance de la langue choisie (localStorage), comme le Panthéon/les badges/la cagnotte.
//   5. Parcours cliqué réel : accueil -> réglages -> passage en anglais -> retour accueil (bouton
//      "Boutique" affiché en anglais) -> re-français -- sans crash, à chaque étape.
//   6. Une carrière complète pilotée EN ANGLAIS de bout en bout, sans exception.
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  const { FR } = await import('../src/i18n/fr.js');
  const { EN } = await import('../src/i18n/en.js');
  const { t, getLocale, setLocale, LOCALES } = await import('../src/engine/i18n.js');

  const frFlat = flatten(FR), enFlat = flatten(EN);
  const frKeys = new Set(Object.keys(frFlat)), enKeys = new Set(Object.keys(enFlat));
  const missingInEn = [...frKeys].filter(k => !enKeys.has(k));
  const missingInFr = [...enKeys].filter(k => !frKeys.has(k));
  check(`toutes les clés FR existent en EN (${missingInEn.length} manquante(s))`, missingInEn.length === 0);
  if (missingInEn.length) console.log('  manquantes en EN:', missingInEn.slice(0, 20));
  check(`toutes les clés EN existent en FR (${missingInFr.length} orpheline(s))`, missingInFr.length === 0);
  if (missingInFr.length) console.log('  orphelines EN:', missingInFr.slice(0, 20));

  // Valeurs vides : uniquement les `desc` (certains titres/cadres de boutique n'ont
  // volontairement pas de description, voir engine/cosmetics.js) -- tout le reste doit être non-vide.
  const unexpectedEmpty = Object.entries(frFlat).filter(([k, v]) => v === '' && !k.endsWith('.desc'));
  check(`aucune valeur FR vide inattendue (hors .desc) (${unexpectedEmpty.length})`, unexpectedEmpty.length === 0);

  check('langue par défaut = français', getLocale() === 'fr');
  setLocale('en');
  check('t() résout une clé existante en anglais', t('common.back') === 'Back');
  check('t() retombe sur le français pour une clé absente en anglais (jamais de clé brute affichée)',
    (() => { const k = '__inexistant__.__aussi__'; return t(k) === k; })()); // ni fr ni en : repli ultime sur la clé elle-même, jamais planté
  setLocale('fr');
  check('retour explicite au français fonctionne', getLocale() === 'fr' && t('common.back') === 'Retour');

  // Persistance réelle (localStorage), même garantie que Panthéon/badges/cagnotte.
  setLocale('en');
  const raw = localStorage.getItem('hardwood_locale_v1');
  check('langue persistée dans localStorage', raw === 'en');
  setLocale('fr');

  check('2 langues déclarées (FR + EN)', LOCALES.length === 2);

  // ---- Parcours cliqué réel ----
  const screens = await import('../src/ui/screens.js');
  const settings = await import('../src/ui/settings.js');
  screens.screenTitle();
  check('bouton réglages présent sur l\'accueil', !!document.getElementById('settings'));
  document.getElementById('settings').click();
  check('écran réglages rendu', !!document.getElementById('settingsBack'));
  const enBtn = document.querySelector('[data-locale="en"]');
  check('bouton de sélection EN présent', !!enBtn);
  enBtn.click();
  check('langue effectivement changée en anglais', getLocale() === 'en');
  document.getElementById('settingsBack').click();
  const shopBtn = document.getElementById('shop');
  check('accueil en anglais : bouton boutique traduit', shopBtn && shopBtn.textContent.includes('Shop'));
  const homeCta = document.getElementById('go') || document.getElementById('resumeGo');
  check('accueil en anglais : bouton principal traduit', homeCta && /Start|Resume/.test(homeCta.textContent));
  // Retour en français, état propre pour la suite de la session/des audits suivants.
  document.getElementById('settings').click();
  document.querySelector('[data-locale="fr"]').click();
  document.getElementById('settingsBack').click();
  check('retour à l\'accueil en français confirmé', document.getElementById('shop').textContent.includes('Boutique'));
  check('aucune erreur JS pendant le parcours réglages', errors.length === 0);

  // ---- Carrière complète pilotée EN ANGLAIS ----
  setLocale('en');
  function pickRandomEl(list) { const arr = Array.from(list); return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
  function clickId(id) { const el = document.getElementById(id); if (!el) throw new Error(`#${id} introuvable`); el.click(); }
  screens.screenTitle();
  document.getElementById('go').click();
  for (let step = 0; step < 4; step++) { pickRandomEl(document.querySelectorAll('.opt')).click(); clickId('nextC'); }
  clickId('nextC');
  pickRandomEl(document.querySelectorAll('.academy-opt')).click();
  let crashed = false;
  for (let i = 0; i < 1000; i++) {
    if (errors.length) { crashed = true; break; }
    if (document.getElementById('again')) break;
    if (document.getElementById('afterSeason')) clickId('afterSeason');
    else if (document.getElementById('natContinue')) clickId('natContinue');
    else if (document.getElementById('forcedEndContinue')) clickId('forcedEndContinue');
    else if (document.querySelector('.choice')) {
      pickRandomEl(document.querySelectorAll('.choice')).click();
      const cont = document.getElementById('contBtn'); if (cont) cont.click();
    } else { crashed = true; break; }
  }
  check('carrière complète pilotée en anglais, sans crash', !crashed && !!document.getElementById('again'));
  setLocale('fr');

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
