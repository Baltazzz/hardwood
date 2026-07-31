#!/usr/bin/env node
// Garde-fou de non-régression dédié au "lot rétention" (voir AGENDA.md) : message de rareté en
// fin de carrière, prochain(s) haut(s) fait(s) juste hors de portée, suggestion de défi personnel,
// refonte des badges (dont les seuils cumulés inter-carrières), et identité propre du défi du
// jour (académie déjà imposée + thème du jour, distincte du défi entre amis qui garde le choix).
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

function pickRandomEl(list) { const arr = Array.from(list); return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
function clickId(document, id) { const el = document.getElementById(id); if (!el) throw new Error(`#${id} introuvable`); el.click(); }

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  const { rarityPct, nextBadgeHints, suggestChallenge } = await import('../src/engine/retention.js');
  const { BADGES, evaluateBadges, badgesState, badgesClear } = await import('../src/engine/badges.js');
  const { generateDailyDef, DAILY_THEMES } = await import('../src/engine/dailyChallenge.js');

  // ---- 1. Message de rareté ----
  check('score médiocre (80) -> pas de message de rareté', rarityPct(80) === null);
  check('score juste sous le seuil "grande carrière" (149) -> pas de message', rarityPct(149) === null);
  check('score au seuil "top 25%" (150) -> 25', rarityPct(150) === 25);
  check('score élevé (230) -> palier "top 10%" (10)', rarityPct(230) === 10);
  check('score très élevé (335) -> palier le plus rare (1)', rarityPct(335) === 1);

  // ---- 2. Prochain(s) haut(s) fait(s) presque atteints ----
  {
    const state = { unlocked: {}, goldNations: [], stylesHof: [], positionsHof: [], startPaths: [],
      totalCareers: 0, lifetimePts: 0, lifetimeTitles: 0, everPositions: [], everStartPaths: [], everNoHomeLeague: false };
    const pNearClutch = { clutch: 7, tripleDoubles: 0, accolades: {}, seasons: [], cardRec: { score: 0 } };
    const hints = nextBadgeHints(pNearClutch, state, 2);
    check('badge "presque atteint" détecté (7/8 moments clutch, à 1 du seuil)', hints.some(h => h.id === 'clutch_icon' && h.gap === 1));
    const pFar = { clutch: 1, tripleDoubles: 0, accolades: {}, seasons: [], cardRec: { score: 0 } };
    const hintsFar = nextBadgeHints(pFar, state, 2);
    check('badge trop loin du seuil (1/8, sous 50%) jamais suggéré comme "presque atteint"', !hintsFar.some(h => h.id === 'clutch_icon'));
    check('un badge déjà débloqué n\'est jamais suggéré à nouveau', (() => {
      const st2 = { ...state, unlocked: { clutch_icon: {} } };
      return !nextBadgeHints(pNearClutch, st2, 2).some(h => h.id === 'clutch_icon');
    })());
  }

  // ---- 3. Suggestion de défi personnel (ordre de priorité) ----
  {
    const base = { everPositions: ['PG', 'SG', 'SF', 'PF', 'C'], everStartPaths: ['us', 'eu', 'au'], everNoHomeLeague: true };
    const sPos = suggestChallenge({ ...base, everPositions: ['PG'] });
    check('poste jamais essayé -> suggestion de poste en priorité', sPos.kind === 'position');
    const sNoHome = suggestChallenge({ ...base, everNoHomeLeague: false });
    check('tous les postes essayés mais jamais de nation sans championnat local -> suggestion dédiée', sNoHome.kind === 'noHomeLeague');
    const sPath = suggestChallenge({ ...base, everStartPaths: ['us'] });
    check('postes + nations couverts mais voie de développement manquante -> suggestion de voie', sPath.kind === 'startPath' && ['eu', 'au'].includes(sPath.path));
    const sGeneric = suggestChallenge(base);
    check('tout déjà essayé -> repli générique', sGeneric.kind === 'generic');
  }

  // ---- 4. Badges recalibrés (trop faciles avant ce lot) ----
  {
    const marathon = BADGES.find(b => b.id === 'marathon_career');
    check('badge marathon_career trouvé', !!marathon);
    check('marathon_career NE se déclenche PLUS pour l\'ancien seuil (16 saisons, sans autre condition)',
      marathon.check({ seasons: Array.from({ length: 16 }, () => ({ injured: false })) }) === false);
    check('marathon_career refuse une longue carrière si UNE SEULE saison a été marquée par une blessure',
      marathon.check({ seasons: Array.from({ length: 22 }, (_, i) => ({ injured: i === 3 })) }) === false);
    check('marathon_career se déclenche pour 20+ saisons toutes saines',
      marathon.check({ seasons: Array.from({ length: 20 }, () => ({ injured: false })) }) === true);

    const explorer = BADGES.find(b => b.id === 'tier_explorer');
    check('tier_explorer NE se déclenche PLUS pour l\'ancien seuil (4 paliers distincts)',
      explorer.check({ seasons: ['a', 'b', 'c', 'd'].map(league => ({ league })) }) === false);
    check('tier_explorer se déclenche pour 6 paliers distincts',
      explorer.check({ seasons: ['a', 'b', 'c', 'd', 'e', 'f'].map(league => ({ league })) }) === true);

    const lastDance = BADGES.find(b => b.id === 'last_dance');
    check('last_dance NE se déclenche PLUS sur le seul âge (ancien seuil 37 ans, dernière saison anecdotique)',
      lastDance.check({ age: 38, seasons: [{ minutes: 5 }] }) === false);
    check('last_dance se déclenche à 38 ans en restant un vrai rotationnaire lors de la dernière saison',
      lastDance.check({ age: 38, seasons: [{ minutes: 25 }] }) === true);
  }

  // ---- 5. Nouveaux badges "carrière" ----
  {
    const scorer = BADGES.find(b => b.id === 'scoring_champion_dynasty');
    check('scoring_champion_dynasty se déclenche à 3 titres de meilleur marqueur', scorer.check({ accolades: { 'Meilleur marqueur': 3 } }) === true);
    check('scoring_champion_dynasty refuse en dessous du seuil', scorer.check({ accolades: { 'Meilleur marqueur': 2 } }) === false);
    const defender = BADGES.find(b => b.id === 'defensive_anchor');
    check('defensive_anchor se déclenche à 2 titres de meilleur défenseur', defender.check({ accolades: { 'Meilleur défenseur': 2 } }) === true);
    const rookie = BADGES.find(b => b.id === 'rookie_sensation');
    check('rookie_sensation se déclenche sur Rookie de l\'année', rookie.check({ accolades: { "Rookie de l'année": 1 } }) === true);
    const homecoming = BADGES.find(b => b.id === 'homecoming_retirement');
    check('homecoming_retirement se déclenche si 1er et dernier club identiques sur 8+ saisons',
      homecoming.check({ seasons: [{ club: 'Boston' }, { club: 'Miami' }, { club: 'Boston' }, { club: 'Boston' }, { club: 'Boston' }, { club: 'Boston' }, { club: 'Boston' }, { club: 'Boston' }] }) === true);
    check('homecoming_retirement refuse si le club final diffère du club de départ',
      homecoming.check({ seasons: Array.from({ length: 8 }, (_, i) => ({ club: i < 7 ? 'Boston' : 'Miami' })) }) === false);
    const phoenix = BADGES.find(b => b.id === 'phoenix_comeback');
    check('phoenix_comeback se déclenche si la saison suivant une blessure atteint 94+ OVR',
      phoenix.check({ seasons: [{ injured: true, ovr: 70 }, { injured: false, ovr: 94 }] }) === true);
    check('phoenix_comeback refuse si le rebond n\'atteint pas le niveau Superstar',
      phoenix.check({ seasons: [{ injured: true, ovr: 70 }, { injured: false, ovr: 85 }] }) === false);
  }

  // ---- 6. Badges à seuil cumulé inter-carrières (persistants, jamais remis à zéro par un reset de badges) ----
  {
    badgesClear();
    const synth = { name: 'Test', cardRec: { totalPts: 20000 }, accolades: { 'Champion NBA': 1 }, pos: 'PG', startPath: 'us', nation: { continent: 'europe' } };
    for (let i = 0; i < 3; i++) evaluateBadges(synth); // 3 x 20000 pts = 60000 (> seuil bronze 50000), 3 titres (< seuil bronze 5)
    let state = badgesState();
    check('lifetimePts cumule bien à travers plusieurs carrières (60000 attendu)', state.lifetimePts === 60000);
    check('lifetime_points_1 (50000 pts) débloqué après cumul suffisant', !!state.unlocked.lifetime_points_1);
    check('lifetime_points_2 (250000 pts) PAS encore débloqué (60000 < 250000)', !state.unlocked.lifetime_points_2);
    check('lifetime_titles_1 (5 titres) PAS encore débloqué (3 titres cumulés)', !state.unlocked.lifetime_titles_1);
    for (let i = 0; i < 2; i++) evaluateBadges(synth); // +2 titres = 5 titres cumulés
    state = badgesState();
    check('lifetime_titles_1 débloqué une fois le seuil de titres cumulés atteint', !!state.unlocked.lifetime_titles_1);
    check('totalCareers a bien compté les 5 évaluations', state.totalCareers === 5);
    const savedLifetimePts = state.lifetimePts, savedTotalCareers = state.totalCareers;
    badgesClear();
    const afterClear = badgesState();
    check('badgesClear() efface bien les badges débloqués', Object.keys(afterClear.unlocked).length === 0);
    check('badgesClear() PRÉSERVE lifetimePts (compteur de fond, pas un badge)', afterClear.lifetimePts === savedLifetimePts);
    check('badgesClear() PRÉSERVE totalCareers', afterClear.totalCareers === savedTotalCareers);
    check('badgesClear() PRÉSERVE everPositions/everStartPaths/everNoHomeLeague', afterClear.everPositions.includes('PG') && afterClear.everStartPaths.includes('us'));
  }

  // ---- 7. Défi du jour : identité propre (déterminisme + académie déjà imposée) ----
  {
    const defA = generateDailyDef('2026-08-15');
    const defB = generateDailyDef('2026-08-15');
    check('même date -> même index d\'académie imposée (déterministe)', defA.forcedAcademyIndex === defB.forcedAcademyIndex);
    check('même date -> même thème du jour (déterministe)', defA.themeIdx === defB.themeIdx);
    check('index d\'académie imposée dans les bornes des offres proposées', defA.forcedAcademyIndex >= 0 && defA.forcedAcademyIndex < defA.academyOffers.length);
    check('index de thème dans les bornes de DAILY_THEMES', defA.themeIdx >= 0 && defA.themeIdx < DAILY_THEMES.length);
    const defOtherDay = generateDailyDef('2026-08-16');
    check('deux dates différentes ne produisent pas systématiquement le même thème ni la même académie (variété réelle)',
      defOtherDay.themeIdx !== defA.themeIdx || defOtherDay.forcedAcademyIndex !== defA.forcedAcademyIndex);
  }

  // ---- 8. Parcours réel piloté : défi du jour saute l'écran de choix d'académie (contrairement au défi entre amis) ----
  {
    const screens = await import('../src/ui/screens.js');
    const challengeUi = await import('../src/ui/challenge.js');
    screens.screenTitle();
    challengeUi.startDailyChallenge();
    check('écran défi du jour affiche le badge "Thème du jour"', document.querySelector('.daily-theme-badge') != null);
    check('écran défi du jour affiche l\'académie déjà imposée', document.body.innerHTML.includes('Académie déjà signée'));
    clickId(document, 'playDaily');
    check('atterrissage défi du jour affiche aussi le thème', document.querySelector('.daily-theme-badge') != null);
    clickId(document, 'continueDaily');
    // Étape 3 (mode de vie, seule étape .opt restante) -> étape 4 (nom) -> nextC déclenche
    // startCareer() qui doit sauter DIRECTEMENT l'écran d'académie (académie déjà imposée).
    pickRandomEl(document.querySelectorAll('.opt')).click();
    clickId(document, 'nextC');
    clickId(document, 'nextC');
    check('défi du jour : AUCUN écran de choix d\'académie affiché (déjà engagé, contrairement au défi entre amis)',
      document.querySelectorAll('.academy-opt').length === 0);
    check('défi du jour : la carrière a bien démarré directement (écran de saison/événement affiché)',
      !!document.getElementById('afterSeason') || !!document.querySelector('.choice') || !!document.getElementById('natContinue'));

    // Défi entre amis, en comparaison : garde bien le choix d'académie (non régressé par ce lot).
    challengeUi.startChallengeCreation();
    clickId(document, 'startMyChallenge');
    clickId(document, 'continueJoin');
    pickRandomEl(document.querySelectorAll('.opt')).click();
    clickId(document, 'nextC');
    clickId(document, 'nextC');
    check('défi entre amis : l\'écran de choix d\'académie reste bien affiché (choix libre, pas "déjà engagé")',
      document.querySelectorAll('.academy-opt').length > 0);
  }

  // ---- 9. Écran de fin de carrière : les nouveaux blocs s'affichent sans crasher, sur une vraie carrière pilotée ----
  {
    const screens = await import('../src/ui/screens.js');
    const state = await import('../src/engine/state.js');
    const player = await import('../src/engine/player.js');
    state.setG(player.newPlayer());
    screens.screenTitle();
    clickId(document, 'go');
    for (let step = 0; step < 4; step++) { pickRandomEl(document.querySelectorAll('.opt')).click(); clickId(document, 'nextC'); }
    clickId(document, 'nextC');
    pickRandomEl(document.querySelectorAll('.academy-opt')).click();
    const errorsBefore = errors.length;
    for (let i = 0; i < 1000; i++) {
      if (document.getElementById('again')) break;
      if (document.getElementById('afterSeason')) clickId(document, 'afterSeason');
      else if (document.getElementById('natContinue')) clickId(document, 'natContinue');
      else if (document.getElementById('forcedEndContinue')) clickId(document, 'forcedEndContinue');
      else if (document.querySelector('.choice')) { pickRandomEl(document.querySelectorAll('.choice')).click(); const c = document.getElementById('contBtn'); if (c) c.click(); }
      else break;
    }
    check('carrière pilotée jusqu\'à la fin sans erreur JS (nouveaux blocs de fin de carrière inclus)', !!document.getElementById('again') && errors.length === errorsBefore);
    check('bloc "Nouveau défi personnel" toujours présent sur l\'écran de fin', document.body.innerHTML.includes('Nouveau défi personnel') || document.body.innerHTML.includes('New personal challenge'));
  }

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
