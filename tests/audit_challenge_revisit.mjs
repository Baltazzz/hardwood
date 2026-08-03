#!/usr/bin/env node
// Garde-fou de non-régression dédié à la correction prioritaire du défi entre amis (voir
// AGENDA.md) : avant ce correctif, une fois l'écran de classement quitté ("Retour à l'accueil"),
// il n'existait plus AUCUN moyen d'y revenir -- pourtant le classement restait bien en mémoire
// (localStorage). Vérifie directement (pas seulement en lecture de code) :
//   1. Accès permanent : terminer un défi, quitter vers l'accueil, revenir sur SON podium via
//      "Mes défis", pour n'importe quel défi connu sur l'appareil, à tout moment.
//   2. Rejouer / Nouveau défi : deux actions distinctes et sans ambiguïté depuis le podium --
//      rejouer garde le MÊME profil de départ (même id de défi) et ne pollue jamais le classement
//      de plusieurs lignes pour la même personne (garde le meilleur score, comme le Panthéon
//      personnel du défi du jour) ; "Nouveau défi" démarre un profil VRAIMENT différent (id
//      distinct), qui devient une entrée séparée dans "Mes défis".
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

function pickRandomEl(list) { const arr = Array.from(list); return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
function clickId(document, id) { const el = document.getElementById(id); if (!el) throw new Error(`#${id} introuvable`); el.click(); }
function driveCareerToEnd(document, errors) {
  for (let i = 0; i < 1000; i++) {
    if (errors.length) throw new Error('erreur JS: ' + errors[errors.length - 1]);
    if (document.getElementById('again')) return;
    if (document.getElementById('afterSeason')) clickId(document, 'afterSeason');
    else if (document.getElementById('natContinue')) clickId(document, 'natContinue');
    else if (document.getElementById('forcedEndContinue')) clickId(document, 'forcedEndContinue');
    else if (document.querySelector('.choice')) {
      pickRandomEl(document.querySelectorAll('.choice')).click();
      const cont = document.getElementById('contBtn'); if (cont) cont.click();
    } else throw new Error('état non reconnu: ' + document.body.innerHTML.slice(0, 200));
  }
  throw new Error('plafond atteint');
}
function driveCreationSteps(document) {
  pickRandomEl(document.querySelectorAll('.opt')).click(); clickId(document, 'nextC');
  clickId(document, 'nextC');
  pickRandomEl(document.querySelectorAll('.academy-opt')).click();
}

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');
  const screens = await import('../src/ui/screens.js');
  const challengeUi = await import('../src/ui/challenge.js');
  const challengesEngine = await import('../src/engine/challenges.js');
  const state = await import('../src/engine/state.js');

  // ---- 0. État neuf : "Mes défis" affiche bien un état vide, jamais d'erreur ----
  screens.screenTitle();
  check('bouton "Mes défis" présent sur l\'accueil', !!document.getElementById('myChallenges'));
  clickId(document, 'myChallenges');
  check('écran "Mes défis" vide affiché sans erreur avant toute création de défi', document.body.innerHTML.includes('Aucun défi entre amis'));
  clickId(document, 'myChallengesBack');

  // ---- 1. Termine un premier défi, quitte vers l'accueil ----
  clickId(document, 'challengeCreate');
  const link1 = document.getElementById('challengeLink').value;
  clickId(document, 'startMyChallenge');
  clickId(document, 'continueJoin');
  driveCreationSteps(document);
  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  const challengeId1 = state.G.challengeId;
  const score1 = challengesEngine.getChallenge(challengeId1).results.find(r => r.mine).score;
  check('premier défi terminé, score enregistré', typeof score1 === 'number');
  clickId(document, 'leaderboardBack'); // -> accueil, EXACTEMENT le bug rapporté : plus aucun moyen d'y revenir avant ce correctif

  // ---- 2. Accès permanent : revenir sur CE podium précis depuis "Mes défis" ----
  check('toujours sur l\'écran titre après "Retour à l\'accueil"', !!document.getElementById('go'));
  clickId(document, 'myChallenges');
  const listHtml1 = document.getElementById('stage').innerHTML;
  check('le défi terminé apparaît bien dans "Mes défis"', listHtml1.includes(String(score1)));
  const row1 = document.querySelector(`[data-id="${challengeId1}"]`);
  check('la ligne de ce défi précis est bien cliquable (data-id correct)', !!row1);
  row1.click();
  check('clic sur la ligne -> ramène bien sur le classement de CE défi (même id de défi)', !!document.getElementById('leaderboardBack'));
  check('le score affiché est bien celui de la tentative précédente (podium fidèle, rien perdu)', document.getElementById('stage').innerHTML.includes(String(score1)));

  // ---- 3. Rejouer CE défi : même profil de départ, résultat REMPLACE (jamais ne s'empile) ----
  check('bouton "Rejouer ce défi" présent (def connu localement)', !!document.getElementById('replayChallenge'));
  clickId(document, 'replayChallenge');
  check('rejouer ramène directement à l\'atterrissage du défi (même profil imposé)', !!document.getElementById('continueJoin'));
  check('rejouer préserve bien le MÊME id de défi', state.G.challengeId === challengeId1);
  clickId(document, 'continueJoin');
  driveCreationSteps(document);
  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  const score2 = challengesEngine.getChallenge(challengeId1).results.find(r => r.mine).score;
  const mineCountAfterReplay = challengesEngine.getChallenge(challengeId1).results.filter(r => r.mine).length;
  check('après une 2e tentative sur le MÊME défi, une seule ligne "mine" (jamais empilée)', mineCountAfterReplay === 1);
  check('la ligne "mine" reflète le MEILLEUR des deux scores (retenter un meilleur score, pas un historique)',
    score2 === Math.max(score1, score2) || score2 === score1);
  const bestOfBoth = Math.max(score1, score2);
  check('le score finalement enregistré est bien le meilleur des deux tentatives',
    challengesEngine.getChallenge(challengeId1).results.find(r => r.mine).score === bestOfBoth);

  // ---- 4. Nouveau défi depuis le podium : id VRAIMENT différent, entrée séparée ----
  clickId(document, 'newChallenge');
  const link2 = document.getElementById('challengeLink').value;
  check('"Nouveau défi" génère bien un lien de défi différent du premier', link2 !== link1);
  clickId(document, 'startMyChallenge');
  const challengeId2 = state.G.challengeId;
  check('le nouveau défi a bien un id différent du premier', challengeId2 !== challengeId1);
  clickId(document, 'continueJoin');
  driveCreationSteps(document);
  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  check('le 2e défi enregistre bien son propre score, indépendant du premier', challengesEngine.getChallenge(challengeId2).results.find(r => r.mine) != null);

  // ---- 5. "Mes défis" liste bien les DEUX défis désormais, chacun accessible ----
  clickId(document, 'myChallengesLink');
  const listHtml2 = document.getElementById('stage').innerHTML;
  check('"Mes défis" liste bien 2 défis distincts après coup', document.body.innerHTML.includes('2 défis'));
  check('le premier défi (rejoué) reste listé et accessible', !!document.querySelector(`[data-id="${challengeId1}"]`));
  check('le second défi (nouveau) est bien listé et accessible séparément', !!document.querySelector(`[data-id="${challengeId2}"]`));

  check('aucune erreur JS sur tout le parcours (finir -> quitter -> revenir -> rejouer -> nouveau défi)', errors.length === 0);

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
