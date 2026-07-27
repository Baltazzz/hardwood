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

function driveOneCareer(document, errors, state, activeTags) {
  const errorsBefore = errors.length;
  for (let step = 0; step < 4; step++) {
    pickRandomEl(document.querySelectorAll('.opt')).click();
    clickId(document, 'nextC');
  }
  clickId(document, 'nextC'); // -> écran de choix d'académie (voir engine/academies.js)
  pickRandomEl(document.querySelectorAll('.academy-opt')).click();

  let arrivalPath = null, reachedNBA = false;
  // Instantané des stats molles (voir engine/vitals.js) + nombre de traits actifs (voir
  // engine/tags.js) à chaque fin de saison réellement vécue -- sert à vérifier que la forme
  // n'est plus collée à 100 et que les traits restent sobres (sections j/k plus bas).
  const vitals = [];
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
    if (document.getElementById('afterSeason')) {
      const p = state.G;
      // activeTraitIds (pas seulement le compte) : sert à calculer la fréquence de DÉBLOCAGE par
      // trait (% de carrières où il a été actif au moins une fois), demandée en plus de la
      // simple sobriété du nombre simultané (section k) -- voir agrégation plus bas.
      vitals.push({ fitness: p.fitness, morale: p.morale, popularity: p.popularity, media: p.media, activeTraits: activeTags(p).length, activeTraitIds: activeTags(p).map(t => t.id) });
      clickId(document, 'afterSeason');
    }
    else if (document.getElementById('natContinue')) clickId(document, 'natContinue');
    else if (document.getElementById('forcedEndContinue')) clickId(document, 'forcedEndContinue'); // fin subie (blessure grave)
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
  // Saisons NBA détaillées (format conférences + Play-In, voir engine/competition.js
  // simulateNbaStandings/simulateNbaPlayoffs) : sert au contrôle d'intégrité dédié NBA et à
  // l'audit de corrélation force d'équipe -> résultat (voir sections g/h ci-dessous).
  const nbaSeasons = G.seasons.filter(s => s.league === 'nba').map(s => ({
    ovr: s.ovr, clubStrengthPctile: s.clubStrengthPctile,
    conference: s.standings?.conference || null,
    playerRank: s.standings?.playerRank ?? null,
    poolSize: s.standings?.poolSize ?? null,
    playoffs: s.playoffs || null,
  }));
  // Toutes ligues confondues (pas seulement NBA) : sert à l'audit de corrélation force
  // d'équipe -> résultat général (section i ci-dessous, réponse au point 5 -- performance du
  // joueur vers résultat de l'équipe/sélection, pas seulement un cas NBA).
  const allSeasons = G.seasons.map(s => ({
    ovr: s.ovr, clubStrengthPctile: s.clubStrengthPctile, champion: !!s.champion,
  }));
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
    nbaSeasons,
    allSeasons,
    vitals,
    endReason: G.endReason || null,
    endAge: G.age,
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
  const { activeTags } = await import('../src/engine/tags.js');

  screens.screenTitle();
  document.getElementById('go').click();

  let crashed = 0;
  const results = [];

  for (let i = 0; i < N; i++) {
    let r;
    try { r = driveOneCareer(document, errors, state, activeTags); }
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
  const occurCount = new Map(); // id -> nb total d'occurrences brutes (toutes carrières confondues) -- sert à juger la vraie dominance dans le pool, pas seulement le taux de carrières touchées (un event vu 1x dans 90% des carrières est bien moins "dominant" qu'un event vu 4x dans 90% des carrières)
  let sumDistinct = 0, sumTotal = 0;
  results.forEach(r => {
    const hist = r.eventHistory || [];
    sumTotal += hist.length;
    const distinctInCareer = new Set(hist);
    sumDistinct += distinctInCareer.size;
    distinctInCareer.forEach(id => freq.set(id, (freq.get(id) || 0) + 1));
    hist.forEach(id => occurCount.set(id, (occurCount.get(id) || 0) + 1));
  });
  const avgDistinct = completed ? round1(sumDistinct / completed) : 0;
  const avgTotal = completed ? round1(sumTotal / completed) : 0;
  const seenIds = [...freq.keys()];
  const neverSeenCount = totalDefined - seenIds.length;
  const neverSeenPct = totalDefined ? round1((neverSeenCount / totalDefined) * 100) : 0;
  const sortedByFreq = seenIds.map(id => ({ id, pct: round1((freq.get(id) / completed) * 100), avgPerCareer: round1(occurCount.get(id) / completed) })).sort((a, b) => b.pct - a.pct);
  const top10 = sortedByFreq.slice(0, 10);
  const bottom10 = sortedByFreq.slice(-10).reverse();

  console.log(`\n-- d) Diversité des événements (${totalDefined} événements définis) --`);
  console.log(`Événements distincts vus par carrière : ${avgDistinct} en moyenne (${avgTotal} événements vus au total en moyenne)`);
  console.log(`Événements jamais vus sur l'ensemble du run : ${neverSeenPct}% (${neverSeenCount}/${totalDefined})`);
  console.log('Top 10 événements les plus fréquents (% de carrières où ils apparaissent, occurrences moyennes/carrière) :');
  top10.forEach(e => console.log(`  ${e.id.padEnd(28)} : ${e.pct}%  (×${e.avgPerCareer}/carrière)`));
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

  // g) Contrôle dédié NBA : cohérence de bout en bout du format conférences + Play-In
  // (engine/competition.js simulateNbaStandings/simulateNbaPlayoffs) -- classement, qualification,
  // parcours de playoffs et champion doivent rester cohérents entre eux à chaque saison NBA jouée.
  const allNba = [];
  results.forEach(r => (r.nbaSeasons || []).forEach(s => allNba.push(s)));
  let gViolations = 0;
  const gDetails = [];
  const flagG = (msg) => { gViolations++; if (gDetails.length < 12) gDetails.push(msg); };
  const confCount = { Est: 0, Ouest: 0, autre: 0 };
  let forcedFinalSeasons = 0;
  allNba.forEach((s, i) => {
    if (s.poolSize !== 15) flagG(`saison #${i} : poolSize=${s.poolSize} (attendu 15)`);
    if (s.conference === 'Est' || s.conference === 'Ouest') confCount[s.conference]++; else confCount.autre++;
    if (s.playerRank == null || s.playerRank < 1 || s.playerRank > 15) flagG(`saison #${i} : playerRank=${s.playerRank} hors 1-15`);
    const po = s.playoffs;
    if (!po) { flagG(`saison #${i} : aucune donnée playoffs`); return; }
    if (po.champion && !po.reachedFinals) flagG(`saison #${i} : champion sans reachedFinals`);
    if (po.reachedFinals && (!po.rounds || po.rounds.length !== 4)) flagG(`saison #${i} : reachedFinals avec ${po.rounds?.length ?? 0} tours (attendu 4)`);
    if (po.champion && po.rounds[po.rounds.length - 1]?.won !== true) flagG(`saison #${i} : champion mais dernier tour non gagné`);
    if (!po.qualified && (po.champion || po.reachedFinals)) flagG(`saison #${i} : non qualifié mais champion/finaliste`);
    if (s.playerRank <= 6 && po.playIn) flagG(`saison #${i} : tête de série directe (rang ${s.playerRank}) avec un Play-In`);
    if (s.playerRank <= 6 && !po.qualified) flagG(`saison #${i} : rang ${s.playerRank} (top 6) non qualifié`);
    // seed reflète le rang réel pour une tête de série directe (1-6, cohérent avec le rang) --
    // un Play-In qui ÉLIMINE laisse seed à null (pas de tête de série gagnée, cohérent) ; seul un
    // Play-In VALIDÉ (qualified) doit obligatoirement retomber sur 7 ou 8.
    if (po.playIn && po.qualified && po.seed !== 7 && po.seed !== 8) flagG(`saison #${i} : seed Play-In=${po.seed} (attendu 7 ou 8)`);
    // rang > 10 qualifié ou 7-10 qualifié sans Play-In : uniquement possible via l'événement
    // narratif "match décisif" (forceFinals, voir simulateNbaPlayoffs) -- pas une violation en soi,
    // juste compté à part pour rester transparent sur sa fréquence réelle.
    if ((s.playerRank > 10 && po.qualified) || (s.playerRank >= 7 && s.playerRank <= 10 && po.qualified && !po.playIn)) forcedFinalSeasons++;
  });
  const zoneStats = (lo, hi) => {
    const zone = allNba.filter(s => s.playerRank >= lo && s.playerRank <= hi);
    const qualified = zone.filter(s => s.playoffs?.qualified).length;
    const champ = zone.filter(s => s.playoffs?.champion).length;
    return { n: zone.length, qualifiedPct: zone.length ? round1(qualified / zone.length * 100) : 0, champPct: zone.length ? round1(champ / zone.length * 100) : 0 };
  };
  const zoneDirect = zoneStats(1, 6), zonePlayIn = zoneStats(7, 10), zoneOut = zoneStats(11, 15);

  console.log(`\n-- g) Cohérence du format NBA (conférences + Play-In) : ${allNba.length} saisons NBA jouées --`);
  console.log(`Répartition conférence : Est ${confCount.Est}, Ouest ${confCount.Ouest}${confCount.autre ? `, autre(!) ${confCount.autre}` : ''}`);
  console.log(`Saisons "forcées" par l'événement narratif match décisif (qualif hors zone normale) : ${forcedFinalSeasons}`);
  console.log(`Zone qualification directe (rang 1-6)  : ${zoneDirect.n} saisons, ${zoneDirect.qualifiedPct}% qualifiées, ${zoneDirect.champPct}% championnes`);
  console.log(`Zone Play-In (rang 7-10)               : ${zonePlayIn.n} saisons, ${zonePlayIn.qualifiedPct}% qualifiées (via Play-In), ${zonePlayIn.champPct}% championnes`);
  console.log(`Hors playoffs (rang 11-15)              : ${zoneOut.n} saisons, ${zoneOut.qualifiedPct}% qualifiées (devrait être ~0, sauf rares cas forcés), ${zoneOut.champPct}% championnes`);
  if (!gViolations) {
    console.log(`OK : aucune incohérence structurelle détectée (classement ↔ qualification ↔ parcours ↔ champion).`);
  } else {
    console.log(`⚠️  ${gViolations} incohérence(s) détectée(s) :`);
    gDetails.forEach(d => console.log(`  ${d}`));
  }

  // h) Corrélation force d'équipe -> résultat (NBA) : clubStrengthPctile est la force RÉELLE de
  // l'effectif (percentile dans son vrai vivier), indépendante de l'apport individuel du joueur
  // (voir season.js) -- sert à vérifier que les clubs forts gagnent bien plus souvent que les
  // faibles, et que le niveau du joueur module ce résultat sans l'effacer.
  const strengthTier = (pct) => pct == null ? null : pct < 0.34 ? 'Faible' : pct < 0.67 ? 'Moyen' : 'Fort';
  const STRENGTH_ORDER = ['Faible', 'Moyen', 'Fort'];
  const strengthStats = {};
  STRENGTH_ORDER.forEach(t => strengthStats[t] = { n: 0, qualified: 0, finals: 0, champ: 0 });
  allNba.forEach(s => {
    const t = strengthTier(s.clubStrengthPctile);
    if (!t) return;
    strengthStats[t].n++;
    if (s.playoffs?.qualified) strengthStats[t].qualified++;
    if (s.playoffs?.reachedFinals) strengthStats[t].finals++;
    if (s.playoffs?.champion) strengthStats[t].champ++;
  });

  const OVR_TIERS = [['Role player (<80)', o => o < 80], ['Confirmé (80-86)', o => o >= 80 && o < 87], ['Star (87-93)', o => o >= 87 && o < 94], ['Superstar (94+)', o => o >= 94]];
  const crossTab = {};
  STRENGTH_ORDER.forEach(t => { crossTab[t] = {}; OVR_TIERS.forEach(([label]) => crossTab[t][label] = { n: 0, champ: 0 }); });
  allNba.forEach(s => {
    const t = strengthTier(s.clubStrengthPctile);
    if (!t) return;
    const tierEntry = OVR_TIERS.find(([, test]) => test(s.ovr));
    if (!tierEntry) return;
    const cell = crossTab[t][tierEntry[0]];
    cell.n++;
    if (s.playoffs?.champion) cell.champ++;
  });

  console.log(`\n-- h) Corrélation force d'équipe réelle -> résultat (NBA, ${allNba.length} saisons) --`);
  console.log('Par tertile de force réelle de club (indépendante du joueur) :');
  STRENGTH_ORDER.forEach(t => {
    const d = strengthStats[t];
    const qp = d.n ? round1(d.qualified / d.n * 100) : 0, fp = d.n ? round1(d.finals / d.n * 100) : 0, cp = d.n ? round1(d.champ / d.n * 100) : 0;
    console.log(`  ${t.padEnd(7)} (n=${d.n}) : qualifiée ${qp}%, finale NBA ${fp}%, championne ${cp}%`);
  });
  console.log('\nCroisement force de club x niveau du joueur (% de saisons championnes) :');
  STRENGTH_ORDER.forEach(t => {
    const cells = OVR_TIERS.map(([label]) => {
      const c = crossTab[t][label];
      return `${label} ${c.n ? round1(c.champ / c.n * 100) : 0}%(n=${c.n})`;
    }).join(', ');
    console.log(`  Club ${t.padEnd(7)} : ${cells}`);
  });

  // i) Corrélation force d'équipe -> résultat, TOUTES LIGUES confondues (pas seulement NBA) :
  // même clubStrengthPctile (force réelle de l'effectif, indépendante de l'apport du joueur),
  // mais sur l'intégralité des saisons jouées (toute ligue) -- réponse générale au point
  // "performance du joueur vers résultat de l'équipe", au-delà du seul cas NBA détaillé en h).
  const allSeasonsFlat = [];
  results.forEach(r => (r.allSeasons || []).forEach(s => allSeasonsFlat.push(s)));
  const globalStrengthStats = {};
  STRENGTH_ORDER.forEach(t => globalStrengthStats[t] = { n: 0, champ: 0 });
  allSeasonsFlat.forEach(s => {
    const t = strengthTier(s.clubStrengthPctile);
    if (!t) return;
    globalStrengthStats[t].n++;
    if (s.champion) globalStrengthStats[t].champ++;
  });
  const globalCrossTab = {};
  STRENGTH_ORDER.forEach(t => { globalCrossTab[t] = {}; OVR_TIERS.forEach(([label]) => globalCrossTab[t][label] = { n: 0, champ: 0 }); });
  allSeasonsFlat.forEach(s => {
    const t = strengthTier(s.clubStrengthPctile);
    if (!t) return;
    const tierEntry = OVR_TIERS.find(([, test]) => test(s.ovr));
    if (!tierEntry) return;
    const cell = globalCrossTab[t][tierEntry[0]];
    cell.n++;
    if (s.champion) cell.champ++;
  });

  console.log(`\n-- i) Corrélation force d'équipe réelle -> résultat (toutes ligues, ${allSeasonsFlat.length} saisons) --`);
  console.log('Par tertile de force réelle de club (indépendante du joueur), % de saisons championnes :');
  STRENGTH_ORDER.forEach(t => {
    const d = globalStrengthStats[t];
    const cp = d.n ? round1(d.champ / d.n * 100) : 0;
    console.log(`  ${t.padEnd(7)} (n=${d.n}) : championne ${cp}%`);
  });
  console.log('Croisement force de club x niveau du joueur (% de saisons championnes) :');
  STRENGTH_ORDER.forEach(t => {
    const cells = OVR_TIERS.map(([label]) => {
      const c = globalCrossTab[t][label];
      return `${label} ${c.n ? round1(c.champ / c.n * 100) : 0}%(n=${c.n})`;
    }).join(', ');
    console.log(`  Club ${t.padEnd(7)} : ${cells}`);
  });

  // j) Vivacité des stats molles (voir engine/vitals.js) : la forme ne doit plus rester collée
  // à 100 -- moyenne, part des instantanés quasi au plafond (>=97), et écart-type comme mesure
  // directe de dispersion réelle sur la carrière plutôt qu'un simple minimum/maximum anecdotique.
  const allVitals = [];
  results.forEach(r => (r.vitals || []).forEach(v => allVitals.push(v)));
  function stats(key) {
    const vals = allVitals.map(v => v[key]);
    const n = vals.length;
    if (!n) return { avg: 0, stdev: 0, pctCapped: 0, min: 0, max: 0 };
    const avg = vals.reduce((s, v) => s + v, 0) / n;
    const variance = vals.reduce((s, v) => s + (v - avg) * (v - avg), 0) / n;
    const stdev = Math.sqrt(variance);
    const pctCapped = round1(vals.filter(v => v >= 97).length / n * 100);
    const pctFloored = round1(vals.filter(v => v <= 15).length / n * 100);
    return { avg: round1(avg), stdev: round1(stdev), pctCapped, pctFloored, min: Math.min(...vals), max: Math.max(...vals) };
  }
  const fitnessStats = stats('fitness'), moraleStats = stats('morale'), popularityStats = stats('popularity'), mediaStats = stats('media');
  console.log(`\n-- j) Vivacité des stats molles (${allVitals.length} instantanés de fin de saison) --`);
  console.log(`Forme       : moyenne ${fitnessStats.avg}, écart-type ${fitnessStats.stdev}, min ${fitnessStats.min}, max ${fitnessStats.max}, quasi-plafond (>=97) ${fitnessStats.pctCapped}%, quasi-plancher (<=15) ${fitnessStats.pctFloored}% des saisons`);
  console.log(`Moral       : moyenne ${moraleStats.avg}, écart-type ${moraleStats.stdev}, min ${moraleStats.min}, max ${moraleStats.max}`);
  console.log(`Popularité  : moyenne ${popularityStats.avg}, écart-type ${popularityStats.stdev}, min ${popularityStats.min}, max ${popularityStats.max}`);
  console.log(`Médias      : moyenne ${mediaStats.avg}, écart-type ${mediaStats.stdev}, min ${mediaStats.min}, max ${mediaStats.max}`);

  // k) Sobriété des traits actifs (voir engine/tags.js) : combien en simultané, en moyenne et au
  // maximum observé -- doit rester "quelques traits à la fois", jamais une accumulation.
  const traitCounts = allVitals.map(v => v.activeTraits || 0);
  const avgActiveTraits = traitCounts.length ? round1(traitCounts.reduce((s, v) => s + v, 0) / traitCounts.length) : 0;
  const maxActiveTraits = traitCounts.length ? Math.max(...traitCounts) : 0;
  const traitCountFreq = {};
  traitCounts.forEach(c => { traitCountFreq[c] = (traitCountFreq[c] || 0) + 1; });
  console.log(`\n-- k) Sobriété des traits actifs (mêmes ${allVitals.length} instantanés) --`);
  console.log(`Nombre moyen de traits actifs simultanés : ${avgActiveTraits} (maximum observé : ${maxActiveTraits})`);
  console.log('Répartition (% des instantanés par nombre de traits actifs) :');
  Object.keys(traitCountFreq).sort((a, b) => a - b).forEach(c => {
    console.log(`  ${c} trait(s) : ${round1(traitCountFreq[c] / traitCounts.length * 100)}%`);
  });

  // k-bis) Fréquence de DÉBLOCAGE par trait (% de carrières où le trait a été actif au moins une
  // fois à un instant donné, pas seulement "encore actif en fin de carrière" -- un trait peut se
  // débloquer puis s'estomper, section e) ne verrait alors rien). Calculé par carrière à partir
  // des instantanés de fin de saison (activeTraitIds), pas seulement le compte agrégé ci-dessus.
  const traitUnlockCareers = new Map(); // id -> nb de carrières où il a été actif au moins 1 fois
  results.forEach(r => {
    const everActive = new Set();
    (r.vitals || []).forEach(v => (v.activeTraitIds || []).forEach(id => everActive.add(id)));
    everActive.forEach(id => traitUnlockCareers.set(id, (traitUnlockCareers.get(id) || 0) + 1));
  });
  const traitUnlockSorted = [...traitUnlockCareers.entries()].map(([id, n]) => ({ id, pct: round1(n / completed * 100) })).sort((a, b) => b.pct - a.pct);
  console.log(`\n-- k-bis) Fréquence de déblocage par trait (% de carrières où il a été actif au moins une fois) --`);
  if (traitUnlockSorted.length) traitUnlockSorted.forEach(t => console.log(`  ${t.id.padEnd(16)} : ${t.pct}%`));
  else console.log('  Aucun trait débloqué sur ce run.');

  // l) Fréquence des fins de carrière SUBIES (blessure grave, voir le jet dans postSeason()) :
  // doit rester rare (le risque n'existe qu'à partir de p.age>=33, jamais sur un jeune) -- objectif
  // "rare mais possible", pas un mode de fin dominant. Comparé aux fins choisies/déclin/normales.
  const endReasonCounts = {};
  results.forEach(r => { const k = r.endReason || 'choice'; endReasonCounts[k] = (endReasonCounts[k] || 0) + 1; });
  const injuryEnds = endReasonCounts.injury || 0;
  const injuryAges = results.filter(r => r.endReason === 'injury').map(r => r.endAge);
  console.log(`\n-- l) Fréquence des fins de carrière subies (blessure grave) --`);
  console.log(`Fins subies sur blessure : ${pct(injuryEnds)}% (${injuryEnds}/${completed})`);
  if (injuryAges.length) console.log(`Âge à la fin subie : ${Math.min(...injuryAges)}-${Math.max(...injuryAges)} ans (moyenne ${round1(injuryAges.reduce((s,v)=>s+v,0)/injuryAges.length)})`);
  console.log('Répartition de toutes les raisons de fin :');
  Object.entries(endReasonCounts).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(10)} : ${pct(v)}% (${v})`));

  console.log('\nRÉSULTATS BRUTS (JSON) :');
  console.log(JSON.stringify({ N, crashed, completed, freeClubCareers, freeClubSeasonsTotal, withTitle, withEliteTitle, withMVP, withAllStar, withHOF, withPhenom, tierCounts, nbaCount: nbaResults.length, median, pathTotals, byBracket,
    endReasons: { counts: endReasonCounts, injuryPct: pct(injuryEnds), injuryAges },
    tags: { avgTagCount, tagFreq: tagFreqSorted },
    diversity: { totalDefined, avgDistinct, avgTotal, neverSeenPct, neverSeenCount, top10, bottom10 },
    onceIntegrity: { onceCount: onceIds.size, careersWithViolation, violations: onceViolationsSorted.map(([id, v]) => ({ id, ...v })) },
    nbaFormat: { totalSeasons: allNba.length, confCount, forcedFinalSeasons, violations: gViolations, zoneDirect, zonePlayIn, zoneOut },
    nbaStrengthCorrelation: { strengthStats, crossTab },
    globalStrengthCorrelation: { n: allSeasonsFlat.length, strengthStats: globalStrengthStats, crossTab: globalCrossTab },
    vitalsHealth: { n: allVitals.length, fitness: fitnessStats, morale: moraleStats, popularity: popularityStats, media: mediaStats },
    traitSobriety: { avgActiveTraits, maxActiveTraits, traitCountFreq, unlockFreq: traitUnlockSorted } }, null, 0));
}

main().catch(err => { console.error('DEEP AUDIT ÉCHOUÉ :', err); process.exitCode = 1; });
