#!/usr/bin/env node
// Garde-fou de non-régression dédié au lot "cohérence et confort" (voir AGENDA.md). Vérifie
// directement (pas seulement en lecture de code) :
//   1. Cohérence contextuelle des événements : "Retrouvailles avec ton ancien club" ne peut plus
//      se déclencher pour un joueur qui n'a JAMAIS quitté son club actuel (aucun ancien club) ;
//      "Le coach te laisse sur le banc" ne peut plus se déclencher pour un joueur dont le rôle
//      structurel ACTUEL est titulaire ou mieux.
//   2. Zones de sécurité d'écran : les points d'ancrage fixes (bouton accueil, bandeau cookies)
//      et le conteneur principal réservent bien l'espace `env(safe-area-inset-*)`.
//   3. Écran de fin de carrière : bouton "retour au menu principal" présent et fonctionnel,
//      statistiques cumulées de carrière affichées (pas seulement depuis le Panthéon).
//   4. Matchs joués par saison : un joueur en bonne santé ne joue plus jamais 100% du calendrier
//      -- au moins un match manqué chaque saison, propagé aux statistiques cumulées.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupEnvironment } from './env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

  // ---- 1a. "Retrouvailles avec ton ancien club" : jamais sans ancien club réel ----
  const { EVENTS } = await import('../src/engine/events.js');
  const revengeGame = EVENTS.find(e => e.id === 'revenge_game');
  check('événement revenge_game trouvé', !!revengeGame);
  const loneClubPlayer = {
    club: 'Boston', league: 'nba', clubTenure: 3,
    seasons: [{ club: 'Boston', league: 'nba' }, { club: 'Boston', league: 'nba' }, { club: 'Boston', league: 'nba' }],
  };
  check('revenge_game NE se déclenche PAS pour un joueur resté à son seul club depuis le début',
    revengeGame.when(loneClubPlayer, { tier: 1 }) === false);
  const formerClubPlayer = {
    club: 'Boston', league: 'nba', clubTenure: 1,
    seasons: [{ club: 'Miami', league: 'nba' }, { club: 'Boston', league: 'nba' }],
  };
  check('revenge_game reste bien déclenchable pour un joueur ayant vraiment changé de club',
    formerClubPlayer.seasons.length >= 2 && revengeGame.when(formerClubPlayer, { tier: 1 }) === true);

  // ---- 1b. "Le coach te laisse sur le banc" : jamais pour un rôle actuel titulaire ou mieux ----
  const { newPlayer } = await import('../src/engine/player.js');
  const benched = EVENTS.find(e => e.id === 'benched');
  check('événement benched trouvé', !!benched);
  const starterNow = newPlayer();
  starterNow.age = 26; starterNow.league = 'nba'; starterNow.club = 'Boston';
  starterNow.pos = 'SG'; starterNow.playNation = 'US';
  starterNow.attrs = { tir: 92, adr3: 90, dribble: 90, passe: 85, def: 88, reb: 80, ath: 90, qi: 88 }; // OVR très élevé -> titulaire/star assuré
  starterNow.seasons = [{ club: 'Boston', league: 'nba', minutes: 10 }]; // signal "récent" bas, mais rôle ACTUEL nettement au-dessus
  check('benched NE se déclenche PAS pour un joueur dont le rôle actuel est titulaire ou mieux malgré un signal passé bas',
    benched.when(starterNow, { tier: 1 }) === false);

  // ---- 2. Zones de sécurité d'écran (voir styles.css) ----
  const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
  check('.wrap réserve la zone de sécurité en haut', /\.wrap\{[^}]*safe-area-inset-top/.test(css));
  check('.home-fab (bouton accueil, position fixe) réserve la zone de sécurité en haut', /\.home-fab\{[^}]*safe-area-inset-top/.test(css));
  check('.consent-banner réserve la zone de sécurité en bas', /\.consent-banner\{[^}]*safe-area-inset-bottom/.test(css));

  // ---- 3. Écran de fin de carrière : bouton retour menu + stats cumulées ----
  const screens = await import('../src/ui/screens.js');
  const state = await import('../src/engine/state.js');
  screens.screenTitle();
  document.getElementById('go').click();
  for (let step = 0; step < 4; step++) { pickRandomEl(document.querySelectorAll('.opt')).click(); clickId(document, 'nextC'); }
  clickId(document, 'nextC');
  pickRandomEl(document.querySelectorAll('.academy-opt')).click();
  const gamesPerSeason = [];
  for (let i = 0; i < 1000; i++) {
    if (errors.length) break;
    if (document.getElementById('again')) break;
    if (document.getElementById('afterSeason')) {
      const lastSeason = state.G.seasons[state.G.seasons.length - 1];
      if (lastSeason) gamesPerSeason.push(lastSeason);
      clickId(document, 'afterSeason');
    } else if (document.getElementById('natContinue')) clickId(document, 'natContinue');
    else if (document.getElementById('forcedEndContinue')) clickId(document, 'forcedEndContinue');
    else if (document.querySelector('.choice')) {
      pickRandomEl(document.querySelectorAll('.choice')).click();
      const cont = document.getElementById('contBtn'); if (cont) cont.click();
    } else { console.log('état non reconnu'); break; }
  }
  check('carrière pilotée jusqu\'à la fin sans crash', !!document.getElementById('again') && errors.length === 0);
  check('bouton "retour au menu principal" présent sur l\'écran de fin', !!document.getElementById('backToMenu'));
  const stageHtml = document.getElementById('stage') ? document.getElementById('stage').innerHTML : document.body.innerHTML;
  check('statistiques cumulées de carrière affichées sur l\'écran de fin (pas seulement au Panthéon)',
    document.querySelectorAll('.legend-grid').length >= 2); // grille "score/titres/mvp/..." + grille "cumulées"
  document.getElementById('backToMenu').click();
  check('retour au menu principal ramène bien à l\'écran titre', !!document.getElementById('go') || !!document.getElementById('resumeGo'));

  // ---- 4. Matchs joués par saison : toujours au moins un match manqué ----
  check(`au moins une saison observée pour vérifier les matchs manqués (${gamesPerSeason.length} saisons)`, gamesPerSeason.length > 0);
  const fullSeasons = gamesPerSeason.filter(s => s.leagueGames != null && s.gamesPlayed >= s.leagueGames);
  check(`aucune saison jouée à 100% du calendrier (${fullSeasons.length}/${gamesPerSeason.length} saison(s) complète(s) trouvée(s), attendu 0)`, fullSeasons.length === 0);
  const withGames = gamesPerSeason.filter(s => s.leagueGames != null);
  const avgMissed = withGames.length ? withGames.reduce((s, x) => s + (x.leagueGames - x.gamesPlayed), 0) / withGames.length : 0;
  check(`la moyenne de matchs manqués par saison reste modeste (${avgMissed.toFixed(1)}, "quelques matchs" -- entre 1 et 8)`, avgMissed >= 1 && avgMissed <= 8);

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
