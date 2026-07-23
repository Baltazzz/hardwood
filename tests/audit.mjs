#!/usr/bin/env node
// Harnais de test headless permanent : joue N carrières HARDWOOD de bout en
// bout en pilotant les vrais boutons du DOM (jsdom), puis produit un rapport
// statistique. Sert de garde-fou de non-régression sur le comportement du jeu.
//
// Usage : npm run audit           (100 carrières par défaut)
//         node tests/audit.mjs 50 (nombre de carrières personnalisé)

import { setupEnvironment } from './env.mjs';
import { driveOneCareer } from './harness.mjs';

const N = Number(process.argv[2]) || 100;

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function main() {
  const { document, errors } = setupEnvironment();

  // Import des modules du jeu APRÈS la mise en place de l'environnement DOM,
  // car certains modules (ex. ui/dom.js) capturent `document` à l'évaluation.
  const screens = await import('../src/ui/screens.js');
  const state = await import('../src/engine/state.js');
  const player = await import('../src/engine/player.js');
  const { ATTRS } = await import('../src/data/positions.js');

  screens.screenTitle();
  document.getElementById('go').click(); // écran titre -> création (1re carrière seulement)

  let crashed = 0;
  const crashReasons = [];
  const pointsByLeague = new Map(); // league -> { sum, count }
  let totalSeasons = 0;
  let injuredSeasons = 0;
  let careersReachingNBA = 0;
  const firstNbaAges = [];
  const age22MaxAttrs = [];

  for (let i = 0; i < N; i++) {
    let result;
    try {
      result = driveOneCareer({ document, errors, state, ATTRS });
    } catch (e) {
      result = { crashed: true, reason: e };
    }

    if (result.crashed) {
      crashed++;
      crashReasons.push(result.reason);
      // Récupération : on repart d'un état propre pour ne pas gâcher le reste de l'audit.
      state.setG(player.newPlayer());
      screens.screenTitle();
      document.getElementById('go').click();
    } else {
      let reachedNBA = false;
      for (const s of result.seasons) {
        totalSeasons++;
        if (s.injured) injuredSeasons++;
        if (s.league === 'nba') reachedNBA = true;
        const entry = pointsByLeague.get(s.league) || { sum: 0, count: 0 };
        entry.sum += s.pts;
        entry.count++;
        pointsByLeague.set(s.league, entry);
      }
      if (reachedNBA) careersReachingNBA++;
      if (result.firstNbaAge != null) firstNbaAges.push(result.firstNbaAge);
      if (result.age22MaxAttr != null) age22MaxAttrs.push(result.age22MaxAttr);
    }

    if ((i + 1) % 10 === 0 || i === N - 1) {
      process.stdout.write(`\r  ${i + 1}/${N} carrières jouées…`);
    }
  }
  process.stdout.write('\n\n');

  const completed = N - crashed;
  const report = {
    date: new Date().toISOString(),
    careersPlayed: N,
    crashed,
    crashRatePct: round1((crashed / N) * 100),
    pointsPerLeague: Object.fromEntries(
      [...pointsByLeague.entries()].map(([lg, { sum, count }]) => [lg, round1(sum / count)])
    ),
    pctReachingNBA: completed ? round1((careersReachingNBA / completed) * 100) : null,
    pctSeasonsInjured: totalSeasons ? round1((injuredSeasons / totalSeasons) * 100) : null,
    medianFirstNbaAge: median(firstNbaAges),
    avgMaxAttrAt22: age22MaxAttrs.length
      ? round1(age22MaxAttrs.reduce((a, b) => a + b, 0) / age22MaxAttrs.length)
      : null,
  };

  printReport(report, { totalSeasons, careersReachingNBA, completed, firstNbaAges, age22MaxAttrs, crashReasons });

  if (crashed) process.exitCode = 1;
}

function round1(v) { return Math.round(v * 10) / 10; }

function printReport(r, extra) {
  console.log('=== Rapport d\'audit HARDWOOD ===');
  console.log(`Carrières jouées      : ${r.careersPlayed}`);
  console.log(`Taux de crash         : ${r.crashRatePct}% (${r.crashed}/${r.careersPlayed})`);
  console.log(`Carrières -> NBA      : ${r.pctReachingNBA}% (${extra.careersReachingNBA}/${extra.completed})`);
  console.log(`Saisons avec blessure : ${r.pctSeasonsInjured}% (sur ${extra.totalSeasons} saisons jouées)`);
  console.log(`Âge médian 1re saison NBA : ${r.medianFirstNbaAge ?? 'n/a'} ans (sur ${extra.firstNbaAges.length} carrières NBA)`);
  console.log(`Attribut max moyen à 22 ans : ${r.avgMaxAttrAt22 ?? 'n/a'} (sur ${extra.age22MaxAttrs.length} carrières)`);
  console.log('Points/match moyens par ligue :');
  for (const [lg, avg] of Object.entries(r.pointsPerLeague)) {
    console.log(`  - ${lg.padEnd(10)} : ${avg}`);
  }
  if (extra.crashReasons.length) {
    console.log('\nDétail des crashs :');
    extra.crashReasons.forEach((reason, i) => console.log(`  ${i + 1}. ${reason && reason.message ? reason.message : reason}`));
  }
}

main().catch(err => {
  console.error('AUDIT ÉCHOUÉ :', err);
  process.exitCode = 1;
});
