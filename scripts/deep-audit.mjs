#!/usr/bin/env node
// Audit statistique approfondi (hors crash-rate/PPG déjà couverts par tests/audit.mjs) :
// distribution des récompenses, des paliers de fin, et de l'âge de 1re saison NBA par
// chemin d'arrivée (draft / fenêtre continentale / call-up / baroud d'honneur).
// Ne modifie rien au jeu — outil d'analyse en lecture seule, pilote les vrais boutons du DOM.
//
// Usage : node scripts/deep-audit.mjs [N]  (300 par défaut)

import { setupEnvironment } from '../tests/env.mjs';

const N = Number(process.argv[2]) || 300;

function pickRandomEl(list) {
  const arr = Array.from(list);
  return arr[Math.floor(Math.random() * arr.length)];
}
function clickId(document, id) { document.getElementById(id).click(); }

function driveOneCareer(document, errors, state) {
  const errorsBefore = errors.length;
  for (let step = 0; step < 4; step++) {
    pickRandomEl(document.querySelectorAll('.opt')).click();
    clickId(document, 'nextC');
  }
  clickId(document, 'nextC');

  let arrivalPath = null, reachedNBA = false;
  for (let i = 0; i < 1200; i++) {
    if (errors.length > errorsBefore) return { crashed: true };
    if (document.getElementById('again')) break;
    const stage = document.getElementById('stage');
    const html = stage.innerHTML;
    const isMoveScreen = html.includes('Marché des transferts');
    let candidate = null;
    if (isMoveScreen && !reachedNBA) {
      const h2 = stage.querySelector('h2')?.textContent || '';
      if (h2.startsWith('Draft NBA')) candidate = 'draft';
      else if (h2.includes('Call-up en NBA')) candidate = 'callup';
      else if (h2.includes('fenêtre') && h2.includes('NBA')) candidate = 'nbaWindow';
      else if (h2.includes("t'appelle")) candidate = 'nbaSwan';
    }
    if (document.getElementById('afterSeason')) clickId(document, 'afterSeason');
    else if (document.querySelector('.choice')) {
      pickRandomEl(document.querySelectorAll('.choice')).click();
      const cont = document.getElementById('contBtn');
      if (cont) cont.click();
    } else return { crashed: true };
    if (candidate && !reachedNBA && state.G.league === 'nba') { arrivalPath = candidate; reachedNBA = true; }
  }
  if (!document.getElementById('again')) return { crashed: true };

  const G = state.G, rec = G.cardRec || {};
  const A = G.accolades || {};
  const champsElite = (A['Champion NBA']||0) + (A['Champion EuroLeague']||0) + (A['Champion NBL']||0);
  // "jeune phénomène" : MVP (ligue majeure ou continentale) obtenu avant 22 ans, ou OVR >=90 avant 22 ans
  const youngMVP = G.seasons.some(s => s.age < 22 && s.acc.some(a => a === 'MVP' || a === 'MVP EuroLeague'));
  const youngElite = G.seasons.some(s => s.age < 22 && s.ovr >= 90);
  const result = {
    crashed: false,
    tier: rec.tier || null,
    hof: !!G.hof,
    champs: rec.champs || 0, champsElite, mvps: rec.mvps || 0, allstars: rec.allstars || 0,
    firstNbaAge: G.firstNbaAge,
    arrivalPath,
    phenom: youngMVP || youngElite,
  };
  clickId(document, 'again');
  return result;
}

function ageBracket(age) {
  if (age <= 20) return '≤20';
  if (age <= 22) return '21-22';
  if (age <= 24) return '23-24';
  if (age <= 26) return '25-26';
  if (age <= 28) return '27-28';
  if (age <= 30) return '29-30';
  return '31+';
}
const BRACKET_ORDER = ['≤20', '21-22', '23-24', '25-26', '27-28', '29-30', '31+'];
const TIER_ORDER = ['Parcours de combattant', 'Joueur de rotation', 'All-Star', 'Superstar', 'Légende — Hall of Fame', 'G.O.A.T.'];
const PATH_LABELS = { draft: 'Draft', nbaWindow: 'Fenêtre continentale', callup: 'Call-up G-League', nbaSwan: "Baroud d'honneur" };

async function main() {
  const { document, errors } = setupEnvironment();
  const screens = await import('../src/ui/screens.js');
  const state = await import('../src/engine/state.js');
  const player = await import('../src/engine/player.js');

  screens.screenTitle();
  document.getElementById('go').click();

  let crashed = 0;
  const results = [];

  for (let i = 0; i < N; i++) {
    let r;
    try { r = driveOneCareer(document, errors, state); }
    catch (e) { r = { crashed: true }; }
    if (r.crashed) {
      crashed++;
      state.setG(player.newPlayer());
      screens.screenTitle();
      document.getElementById('go').click();
    } else {
      results.push(r);
    }
    if ((i + 1) % 25 === 0 || i === N - 1) process.stdout.write(`\r  ${i + 1}/${N} carrières jouées…`);
  }
  process.stdout.write('\n\n');

  const completed = results.length;
  const pct = (n) => completed ? Math.round((n / completed) * 1000) / 10 : 0;

  // b) récompenses + paliers
  const withTitle = results.filter(r => r.champs > 0).length;
  const withEliteTitle = results.filter(r => r.champsElite > 0).length;
  const withMVP = results.filter(r => r.mvps > 0).length;
  const withAllStar = results.filter(r => r.allstars > 0).length;
  const withHOF = results.filter(r => r.hof).length;
  const withPhenom = results.filter(r => r.phenom).length;
  const tierCounts = {};
  TIER_ORDER.forEach(t => tierCounts[t] = 0);
  results.forEach(r => { if (r.tier) tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1; });

  // c) âges 1re saison NBA + chemin d'arrivée
  const nbaResults = results.filter(r => r.firstNbaAge != null);
  const byBracket = {};
  BRACKET_ORDER.forEach(b => byBracket[b] = { total: 0, paths: {} });
  nbaResults.forEach(r => {
    const b = ageBracket(r.firstNbaAge);
    byBracket[b].total++;
    const p = r.arrivalPath || 'inconnu';
    byBracket[b].paths[p] = (byBracket[b].paths[p] || 0) + 1;
  });
  const ages = nbaResults.map(r => r.firstNbaAge).sort((a, b) => a - b);
  const median = ages.length ? (ages.length % 2 ? ages[(ages.length - 1) / 2] : (ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2) : null;

  console.log('=== Audit approfondi HARDWOOD ===');
  console.log(`Carrières jouées : ${N} (crashs : ${crashed})`);
  console.log(`\n-- b) Récompenses (sur ${completed} carrières complètes) --`);
  console.log(`Au moins un titre (toute ligue) : ${pct(withTitle)}% (${withTitle})`);
  console.log(`  dont au moins un titre élite (NBA/EuroLeague/NBL) : ${pct(withEliteTitle)}% (${withEliteTitle})`);
  console.log(`Au moins un MVP       : ${pct(withMVP)}% (${withMVP})`);
  console.log(`Jeune phénomène (MVP ou OVR>=90 avant 22 ans) : ${pct(withPhenom)}% (${withPhenom})`);
  console.log(`Au moins un All-Star  : ${pct(withAllStar)}% (${withAllStar})`);
  console.log(`Hall of Fame          : ${pct(withHOF)}% (${withHOF})`);
  console.log(`\nPaliers de fin de carrière :`);
  TIER_ORDER.forEach(t => console.log(`  ${t.padEnd(26)} : ${pct(tierCounts[t])}% (${tierCounts[t]})`));

  console.log(`\n-- c) Âge de première saison NBA (${nbaResults.length}/${completed} carrières -> NBA, médiane ${median}) --`);
  BRACKET_ORDER.forEach(b => {
    const d = byBracket[b];
    if (!d.total) { console.log(`  ${b.padEnd(6)} : 0`); return; }
    const paths = Object.entries(d.paths).map(([k, v]) => `${PATH_LABELS[k] || k} ${v}`).join(', ');
    console.log(`  ${b.padEnd(6)} : ${d.total.toString().padEnd(3)} — ${paths}`);
  });

  console.log('\nRÉSULTATS BRUTS (JSON) :');
  console.log(JSON.stringify({ N, crashed, completed, withTitle, withEliteTitle, withMVP, withAllStar, withHOF, withPhenom, tierCounts, nbaCount: nbaResults.length, median, byBracket }, null, 0));
}

main().catch(err => { console.error('DEEP AUDIT ÉCHOUÉ :', err); process.exitCode = 1; });
