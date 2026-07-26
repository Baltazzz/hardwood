#!/usr/bin/env node
// Audit statistique approfondi (hors crash-rate/PPG déjà couverts par tests/audit.mjs) :
// distribution des récompenses, des paliers de fin, de l'âge de 1re saison NBA par
// chemin d'arrivée (draft / fenêtre continentale / call-up / baroud d'honneur), et diversité
// des événements vécus (nb distinct par carrière, fréquence des plus vus/plus rares, jamais-vus).
// Ne modifie rien au jeu — outil d'analyse en lecture seule, pilote les vrais boutons du DOM.
//
// Usage : node scripts/deep-audit.mjs [N]  (300 par défaut)

import { setupEnvironment } from '../tests/env.mjs';

const N = Number(process.argv[2]) || 300;

function round1(n) { return Math.round(n * 10) / 10; }
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
    eventHistory: (G.eventHistory || []).slice(),
    freeClubSeasons: G.seasons.filter(s => s.club === 'Club libre').length,
    tags: rec.tags || [],
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
const TIER_ORDER = ['Parcours de combattant', 'Joueur de rotation', 'All-Star', 'Superstar', 'Légende · Hall of Fame', 'G.O.A.T.'];
const PATH_LABELS = { draft: 'Draft', nbaWindow: 'Fenêtre continentale', callup: 'Call-up G-League', nbaSwan: "Baroud d'honneur" };

async function main() {
  const { document, errors } = setupEnvironment();
  // L'audit teste la simulation de carrière, pas l'onboarding : on marque la tuile de
  // bienvenue comme déjà vue pour que screenTitle() affiche directement l'écran titre.
  localStorage.setItem('hw_welcome_seen', '1');
  const screens = await import('../src/ui/screens.js');
  const state = await import('../src/engine/state.js');
  const player = await import('../src/engine/player.js');
  const { EVENTS } = await import('../src/engine/events.js');

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

  const pathTotals = {};
  nbaResults.forEach(r => { const p = r.arrivalPath || 'inconnu'; pathTotals[p] = (pathTotals[p] || 0) + 1; });
  const pathPct = (n) => nbaResults.length ? Math.round((n / nbaResults.length) * 1000) / 10 : 0;

  // a) repli "Club libre" (pool de clubs vide -> nom générique de secours) : doit être à zéro.
  const freeClubCareers = results.filter(r => r.freeClubSeasons > 0).length;
  const freeClubSeasonsTotal = results.reduce((s, r) => s + r.freeClubSeasons, 0);

  console.log('=== Audit approfondi HARDWOOD ===');
  console.log(`Carrières jouées : ${N} (crashs : ${crashed})`);
  console.log(`\n-- a) Repli "Club libre" (objectif : zéro) --`);
  console.log(`Carrières touchées : ${pct(freeClubCareers)}% (${freeClubCareers}/${completed})`);
  console.log(`Saisons "Club libre" au total : ${freeClubSeasonsTotal}`);
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
  console.log('Chemin d\'arrivée (total) :');
  Object.entries(pathTotals).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${(PATH_LABELS[k] || k).padEnd(22)} : ${pathPct(v)}% (${v})`);
  });
  BRACKET_ORDER.forEach(b => {
    const d = byBracket[b];
    if (!d.total) { console.log(`  ${b.padEnd(6)} : 0`); return; }
    const paths = Object.entries(d.paths).map(([k, v]) => `${PATH_LABELS[k] || k} ${v}`).join(', ');
    console.log(`  ${b.padEnd(6)} : ${d.total.toString().padEnd(3)} — ${paths}`);
  });

  // d) diversité des événements
  const totalDefined = EVENTS.length;
  const freq = new Map(); // id -> nb de carrières où il apparaît au moins 1 fois
  let sumDistinct = 0, sumTotal = 0;
  results.forEach(r => {
    const hist = r.eventHistory || [];
    sumTotal += hist.length;
    const distinctInCareer = new Set(hist);
    sumDistinct += distinctInCareer.size;
    distinctInCareer.forEach(id => freq.set(id, (freq.get(id) || 0) + 1));
  });
  const avgDistinct = completed ? round1(sumDistinct / completed) : 0;
  const avgTotal = completed ? round1(sumTotal / completed) : 0;
  const seenIds = [...freq.keys()];
  const neverSeenCount = totalDefined - seenIds.length;
  const neverSeenPct = totalDefined ? round1((neverSeenCount / totalDefined) * 100) : 0;
  const sortedByFreq = seenIds.map(id => ({ id, pct: round1((freq.get(id) / completed) * 100) })).sort((a, b) => b.pct - a.pct);
  const top10 = sortedByFreq.slice(0, 10);
  const bottom10 = sortedByFreq.slice(-10).reverse();

  console.log(`\n-- d) Diversité des événements (${totalDefined} événements définis) --`);
  console.log(`Événements distincts vus par carrière : ${avgDistinct} en moyenne (${avgTotal} événements vus au total en moyenne)`);
  console.log(`Événements jamais vus sur l'ensemble du run : ${neverSeenPct}% (${neverSeenCount}/${totalDefined})`);
  console.log('Top 10 événements les plus fréquents (% de carrières où ils apparaissent) :');
  top10.forEach(e => console.log(`  ${e.id.padEnd(28)} : ${e.pct}%`));
  console.log('Top 10 événements les plus rares (parmi ceux vus au moins une fois) :');
  bottom10.forEach(e => console.log(`  ${e.id.padEnd(28)} : ${e.pct}%`));

  // e) étiquettes de joueur (voir engine/tags.js) : combien actives en fin de carrière, et
  // fréquence de chacune -- sert à vérifier qu'aucune étiquette ne devient omniprésente et que
  // le nombre actif reste sobre (conçu pour quelques-unes à la fois, jamais une collection).
  const tagFreq = new Map();
  let sumTagCount = 0;
  results.forEach(r => {
    const tags = r.tags || [];
    sumTagCount += tags.length;
    tags.forEach(id => tagFreq.set(id, (tagFreq.get(id) || 0) + 1));
  });
  const avgTagCount = completed ? round1(sumTagCount / completed) : 0;
  const tagFreqSorted = [...tagFreq.entries()].map(([id, n]) => ({ id, pct: round1((n / completed) * 100) })).sort((a, b) => b.pct - a.pct);
  console.log(`\n-- e) Étiquettes de joueur actives en fin de carrière --`);
  console.log(`Nombre moyen d'étiquettes actives à la retraite : ${avgTagCount}`);
  if (tagFreqSorted.length) {
    console.log('Fréquence par étiquette (% de carrières où elle est active à la fin) :');
    tagFreqSorted.forEach(t => console.log(`  ${t.id.padEnd(16)} : ${t.pct}%`));
  }

  // f) intégrité des événements marqués "once" (décisions structurantes/fondations/premières
  // fois : ne doivent JAMAIS se reproduire dans une même carrière). Détecté indépendamment de
  // eventHistory[dedup] ci-dessus (qui compte les DISTINCTS, pas les répétitions) : ici on
  // compte les occurrences brutes par id dans l'historique de chaque carrière, et on signale
  // tout id marqué `once` vu plus d'une fois dans la même carrière.
  const onceIds = new Set(EVENTS.filter(e => e.once).map(e => e.id));
  const onceViolations = new Map(); // id -> { careers, maxCount }
  let careersWithViolation = 0;
  results.forEach(r => {
    const counts = new Map();
    (r.eventHistory || []).forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    let violatedThisCareer = false;
    counts.forEach((count, id) => {
      if (onceIds.has(id) && count > 1) {
        violatedThisCareer = true;
        const cur = onceViolations.get(id) || { careers: 0, maxCount: 0 };
        cur.careers++;
        cur.maxCount = Math.max(cur.maxCount, count);
        onceViolations.set(id, cur);
      }
    });
    if (violatedThisCareer) careersWithViolation++;
  });
  const onceViolationsSorted = [...onceViolations.entries()].sort((a, b) => b[1].careers - a[1].careers);

  console.log(`\n-- f) Intégrité des événements uniques (${onceIds.size} événements marqués "once") --`);
  if (!onceViolationsSorted.length) {
    console.log(`OK : sur ${completed} carrières, aucun événement marqué unique n'est apparu plus d'une fois dans la même carrière.`);
  } else {
    console.log(`⚠️  ${careersWithViolation}/${completed} carrière(s) avec au moins un événement unique répété :`);
    onceViolationsSorted.forEach(([id, v]) => {
      console.log(`  ${id.padEnd(28)} : répété dans ${v.careers} carrière(s), jusqu'à ${v.maxCount}x dans une même carrière`);
    });
  }

  console.log('\nRÉSULTATS BRUTS (JSON) :');
  console.log(JSON.stringify({ N, crashed, completed, freeClubCareers, freeClubSeasonsTotal, withTitle, withEliteTitle, withMVP, withAllStar, withHOF, withPhenom, tierCounts, nbaCount: nbaResults.length, median, pathTotals, byBracket,
    tags: { avgTagCount, tagFreq: tagFreqSorted },
    diversity: { totalDefined, avgDistinct, avgTotal, neverSeenPct, neverSeenCount, top10, bottom10 },
    onceIntegrity: { onceCount: onceIds.size, careersWithViolation, violations: onceViolationsSorted.map(([id, v]) => ({ id, ...v })) } }, null, 0));
}

main().catch(err => { console.error('DEEP AUDIT ÉCHOUÉ :', err); process.exitCode = 1; });
