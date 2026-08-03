#!/usr/bin/env node
// Garde-fou de non-régression dédié à la correction prioritaire du défi entre amis (voir
// AGENDA.md) + son ajustement du 2026-08-03 (classements déplacés dans le "hub" du mode, filtrés
// aux défis réellement joués, purge auto après un mois + purge manuelle). Vérifie directement
// (pas seulement en lecture de code) :
//   1. Accès permanent : terminer un défi, quitter vers l'accueil, revenir sur SON classement via
//      le hub "Défi entre amis" -> "Mes classements", pour n'importe quel défi joué, à tout moment.
//   2. Rejouer / Nouveau défi : deux actions distinctes et sans ambiguïté depuis le classement --
//      rejouer garde le MÊME profil de départ (même id de défi) et ne pollue jamais le classement
//      de plusieurs lignes pour la même personne (garde le meilleur score) ; "Nouveau défi" démarre
//      un profil VRAIMENT différent (id distinct), qui devient une entrée séparée.
//   3. "Mes classements" n'affiche QUE les défis réellement joués (jamais un défi créé/reçu mais
//      jamais mené à son terme -- "n'a pas de sens" dans un classement).
//   4. Purge : bouton de purge manuelle fonctionnel, et purge automatique après un mois
//      d'inactivité (vérifiée directement sur le moteur, avec une horloge synthétique).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setupEnvironment } from './env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');
  const screens = await import('../src/ui/screens.js');
  const challengeUi = await import('../src/ui/challenge.js');
  const challengesEngine = await import('../src/engine/challenges.js');
  const state = await import('../src/engine/state.js');

  // ---- 0. État neuf : hub -> "Mes classements" affiche bien un état vide, jamais d'erreur ----
  screens.screenTitle();
  check('bouton "Défi entre amis" présent sur l\'accueil', !!document.getElementById('challengeCreate'));
  clickId(document, 'challengeCreate');
  check('la tuile ouvre bien le hub (2 choix nets : nouveau défi / mes classements)',
    !!document.getElementById('challengeHubNew') && !!document.getElementById('challengeHubResults'));
  clickId(document, 'challengeHubResults');
  check('écran "Mes classements" vide affiché sans erreur avant toute création de défi', document.body.innerHTML.includes('Aucun défi joué'));
  clickId(document, 'myChallengesBack');
  check('"Retour" depuis "Mes classements" ramène bien au hub (pas directement à l\'accueil)',
    !!document.getElementById('challengeHubNew'));

  // ---- 1. Crée un défi mais NE LE JOUE PAS -- ne doit jamais apparaître dans les classements ----
  clickId(document, 'challengeHubNew');
  clickId(document, 'startMyChallenge'); // rejoint son propre défi, mais on abandonne avant la fin
  const unplayedChallengeId = state.G.challengeId;
  screens.screenTitle();
  clickId(document, 'challengeCreate');
  clickId(document, 'challengeHubResults');
  check('un défi créé mais jamais joué N\'APPARAÎT PAS dans "Mes classements" (n\'a pas de sens sans score)',
    !document.querySelector(`[data-id="${unplayedChallengeId}"]`));
  check('"Mes classements" reste vide tant qu\'aucun défi n\'a été mené à son terme', document.body.innerHTML.includes('Aucun défi joué'));
  clickId(document, 'myChallengesBack');
  clickId(document, 'challengeHubNew');

  // ---- 2. Termine réellement un défi cette fois, quitte vers l'accueil ----
  const link1 = document.getElementById('challengeLink').value;
  clickId(document, 'startMyChallenge');
  clickId(document, 'continueJoin');
  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  const challengeId1 = state.G.challengeId;
  const score1 = challengesEngine.getChallenge(challengeId1).results.find(r => r.mine).score;
  check('défi terminé, score enregistré', typeof score1 === 'number');
  clickId(document, 'leaderboardBack'); // -> accueil, EXACTEMENT le bug rapporté à l'origine

  // ---- 3. Accès permanent : revenir sur CE classement précis via le hub ----
  check('toujours sur l\'écran titre après "Retour à l\'accueil"', !!document.getElementById('go'));
  clickId(document, 'challengeCreate');
  clickId(document, 'challengeHubResults');
  const listHtml1 = document.getElementById('stage').innerHTML;
  check('le défi terminé apparaît bien dans "Mes classements"', listHtml1.includes(String(score1)));
  const row1 = document.querySelector(`[data-id="${challengeId1}"]`);
  check('la ligne de ce défi précis est bien cliquable (data-id correct)', !!row1);
  row1.click();
  check('clic sur la ligne -> ramène bien sur le classement de CE défi', !!document.getElementById('leaderboardBack'));
  check('le score affiché est bien celui de la tentative précédente (classement fidèle, rien perdu)', document.getElementById('stage').innerHTML.includes(String(score1)));

  // ---- 4. Rejouer CE défi : même profil de départ, résultat REMPLACE (jamais ne s'empile) ----
  check('bouton "Rejouer ce défi" présent (def connu localement)', !!document.getElementById('replayChallenge'));
  clickId(document, 'replayChallenge');
  check('rejouer ramène directement à l\'atterrissage du défi (même profil imposé)', !!document.getElementById('continueJoin'));
  check('rejouer préserve bien le MÊME id de défi', state.G.challengeId === challengeId1);
  clickId(document, 'continueJoin');
  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  const score2 = challengesEngine.getChallenge(challengeId1).results.find(r => r.mine).score;
  const mineCountAfterReplay = challengesEngine.getChallenge(challengeId1).results.filter(r => r.mine).length;
  check('après une 2e tentative sur le MÊME défi, une seule ligne "mine" (jamais empilée)', mineCountAfterReplay === 1);
  const bestOfBoth = Math.max(score1, score2);
  check('le score finalement enregistré est bien le meilleur des deux tentatives',
    challengesEngine.getChallenge(challengeId1).results.find(r => r.mine).score === bestOfBoth);

  // ---- 5. Nouveau défi depuis le classement : id VRAIMENT différent, entrée séparée ----
  clickId(document, 'newChallenge');
  const link2 = document.getElementById('challengeLink').value;
  check('"Nouveau défi" génère bien un lien de défi différent du premier', link2 !== link1);
  clickId(document, 'startMyChallenge');
  const challengeId2 = state.G.challengeId;
  check('le nouveau défi a bien un id différent du premier', challengeId2 !== challengeId1);
  clickId(document, 'continueJoin');
  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  check('le 2e défi enregistre bien son propre score, indépendant du premier', challengesEngine.getChallenge(challengeId2).results.find(r => r.mine) != null);

  // ---- 6. "Mes classements" liste bien les défis JOUÉS (2, pas le 3e jamais terminé) ----
  clickId(document, 'myChallengesLink');
  check('"Mes classements" liste bien 2 défis joués (le défi jamais terminé reste exclu)', document.body.innerHTML.includes('2 défis joués'));
  check('le premier défi (rejoué) reste listé et accessible', !!document.querySelector(`[data-id="${challengeId1}"]`));
  check('le second défi (nouveau) est bien listé et accessible séparément', !!document.querySelector(`[data-id="${challengeId2}"]`));
  check('le défi jamais joué reste absent même après coup', !document.querySelector(`[data-id="${unplayedChallengeId}"]`));

  // ---- 7. Purge manuelle ----
  check('bouton "Vider mes classements" présent quand la liste n\'est pas vide', !!document.getElementById('myChallengesClear'));
  clickId(document, 'myChallengesClear'); // confirm() est stub-é à true dans l'environnement de test (voir tests/env.mjs)
  check('purge manuelle confirmée : "Mes classements" repasse à l\'état vide', document.body.innerHTML.includes('Aucun défi joué'));
  check('purge manuelle confirmée côté moteur aussi (plus aucun défi en mémoire)', challengesEngine.listChallenges().length === 0);

  // ---- 8. Purge automatique après un mois d'inactivité -- process séparé dédié (voir
  // challenge_prune_check.mjs : le cache mémoire du module n'est peuplé qu'une fois par process,
  // la donnée doit donc être en place AVANT le tout premier appel, comme un vrai redémarrage). ----
  {
    const r = spawnSync('node', [path.join(__dirname, 'challenge_prune_check.mjs')], { encoding: 'utf8' });
    const line = (r.stdout || '').split('\n').find(l => l.startsWith('RESULT:'));
    if (!line) { console.log(r.stdout, r.stderr); throw new Error('challenge_prune_check.mjs : pas de RESULT: en sortie'); }
    const pruneResult = JSON.parse(line.slice('RESULT:'.length));
    check('purge automatique : un défi inactif depuis 40 jours disparaît de listChallenges()', pruneResult.staleGoneFromList);
    check('purge automatique : un défi inactif depuis 40 jours est bien retiré du localStorage', pruneResult.staleGoneFromStorage);
    check('purge automatique : un défi actif depuis seulement 2 jours n\'est PAS purgé (listChallenges())', pruneResult.freshKeptInList);
    check('purge automatique : un défi actif depuis seulement 2 jours reste bien en localStorage', pruneResult.freshKeptInStorage);
  }

  check('aucune erreur JS sur tout le parcours (finir -> quitter -> revenir -> rejouer -> nouveau défi -> purge)', errors.length === 0);

  if (errors.length) console.log('Erreurs interceptées :', errors.slice(0, 5));
  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
