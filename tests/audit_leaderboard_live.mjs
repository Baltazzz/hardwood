#!/usr/bin/env node
// Vérification de BOUT EN BOUT du classement partagé (voir AGENDA.md, "lot backend Supabase")
// contre le VRAI projet Supabase (aucun mock) -- deux "appareils" simulés en process Node
// RÉELLEMENT séparés (même raison qu'AGD-51 : chacun a son propre client_id persistant, comme
// deux téléphones distincts), qui ne partagent QUE ce que le serveur partagé leur montre.
//
// PRÉALABLE : la migration supabase/migrations/0001_challenge_scores.sql doit avoir été exécutée
// dans l'éditeur SQL du projet Supabase (voir supabase/README.md) -- ce script le détecte et
// l'explique clairement plutôt que d'échouer de façon confuse si ce n'est pas encore fait.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deviceScript = path.join(__dirname, 'leaderboard_device_check.mjs');

// Chaque appel à run() est un process Node tout neuf (voir leaderboard_device_check.mjs) -- ce
// répertoire est ce qui permet à deux appels successifs désignant le même deviceId (ex. "A" qui
// se resoumet) de rester le MÊME appareil aux yeux du serveur, en persistant son client_id entre
// les process. Propre à cette exécution de l'audit, supprimé à la fin (voir finally en bas).
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hardwood-leaderboard-audit-'));

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}
function run(args) {
  const r = spawnSync('node', [deviceScript, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HARDWOOD_DEVICE_STATE_DIR: stateDir },
  });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('RESULT:'));
  if (!line) { console.log(r.stdout, r.stderr); throw new Error('leaderboard_device_check.mjs : pas de RESULT: en sortie'); }
  return JSON.parse(line.slice('RESULT:'.length));
}

async function main() {
  const challengeId = 'test' + Math.floor(Math.random() * 1e9).toString(36);

  const probe = run(['probe']);
  if (!probe.tableExists) {
    console.log('\n⚠️  La table "challenge_scores" n\'existe pas encore sur le projet Supabase.');
    console.log('   Exécute supabase/migrations/0001_challenge_scores.sql dans l\'éditeur SQL du');
    console.log('   dashboard Supabase (voir supabase/README.md), puis relance cet audit :');
    console.log('   npm run audit:leaderboard-live');
    console.log('\nVérification interrompue -- pas un échec de code, une étape manuelle requise.');
    process.exitCode = 2;
    return;
  }
  check('la table "challenge_scores" existe sur le projet Supabase (migration appliquée)', probe.tableExists);

  // ---- Appareil A : soumet un score ----
  const a = run(['submit', 'A', challengeId, 'Alice', '150']);
  check('appareil A (process indépendant) : soumission acceptée par le serveur', a.ok);

  // ---- Appareil B : soumet un score différent sur le MÊME défi ----
  const b = run(['submit', 'B', challengeId, 'Bob', '220']);
  check('appareil B (process indépendant, client_id différent) : soumission acceptée', b.ok);

  // ---- Appareil A relit le classement : doit voir SES DEUX scores, sans avoir échangé de lien ----
  const fetchA = run(['fetch', 'A', challengeId]);
  check('appareil A voit bien les 2 scores (le sien ET celui de B) sans aucun échange de lien', fetchA.rows && fetchA.rows.length === 2);
  check('appareil A : son propre score porte bien "mine:true", celui de B "mine:false"',
    fetchA.rows && fetchA.rows.find(r => r.name === 'Alice')?.mine === true && fetchA.rows.find(r => r.name === 'Bob')?.mine === false);
  check('classement trié par score décroissant (Bob 220 avant Alice 150)',
    fetchA.rows && fetchA.rows[0].name === 'Bob' && fetchA.rows[0].score === 220);

  // ---- Appareil B relit le classement : symétrique, doit voir les 2 aussi ----
  const fetchB = run(['fetch', 'B', challengeId]);
  check('appareil B voit bien les 2 scores également (symétrique)', fetchB.rows && fetchB.rows.length === 2);
  check('appareil B : son propre score porte bien "mine:true", celui de A "mine:false"',
    fetchB.rows && fetchB.rows.find(r => r.name === 'Bob')?.mine === true && fetchB.rows.find(r => r.name === 'Alice')?.mine === false);

  // ---- A rejoue et fait MOINS bien : le serveur garde le meilleur (jamais une régression) ----
  const aWorse = run(['submit', 'A', challengeId, 'Alice', '90']);
  check('une resoumission avec un score PLUS FAIBLE est acceptée par l\'API (pas rejetée)', aWorse.ok);
  const fetchAfterWorse = run(['fetch', 'A', challengeId]);
  const aliceRow = fetchAfterWorse.rows && fetchAfterWorse.rows.find(r => r.name === 'Alice');
  check('...mais le score enregistré reste le MEILLEUR (150), jamais écrasé par un moins bon (90)', aliceRow && aliceRow.score === 150);

  // ---- A rejoue et fait MIEUX : remplace bien (une seule ligne par appareil, jamais empilée) ----
  // Le trigger SQL anti-spam (0001_challenge_scores.sql) limite une VRAIE amélioration de score à
  // une fois toutes les 5s par ligne, décompté depuis la dernière vraie écriture -- ici l'insertion
  // initiale d'Alice (la resoumission plus faible juste avant ne compte pas, volontairement, voir
  // le trigger). Un joueur réel ne rejoue jamais un défi en moins de 5s ; on respecte cette même
  // fenêtre ici plutôt que d'affaiblir la garde anti-triche pour la commodité du test.
  await new Promise((resolve) => setTimeout(resolve, 5200));
  const aBetter = run(['submit', 'A', challengeId, 'Alice', '300']);
  check('une resoumission avec un MEILLEUR score est acceptée', aBetter.ok);
  const fetchAfterBetter = run(['fetch', 'A', challengeId]);
  check('le classement contient toujours exactement 2 lignes (jamais empilé malgré 3 soumissions de A)', fetchAfterBetter.rows && fetchAfterBetter.rows.length === 2);
  const aliceRow2 = fetchAfterBetter.rows && fetchAfterBetter.rows.find(r => r.name === 'Alice');
  check('...et le score est bien mis à jour au meilleur (300)', aliceRow2 && aliceRow2.score === 300);

  // ---- Garde-fou anti-triche : un score aberrant est rejeté par la base, jamais accepté ----
  const cheatId = 'test' + Math.floor(Math.random() * 1e9).toString(36);
  const cheat = run(['submit', 'C', cheatId, 'Tricheur', '999999']);
  check('un score aberrant (999999, hors des bornes autorisées) est REJETÉ par le serveur', cheat.ok === false);
  const fetchCheat = run(['fetch', 'C', cheatId]);
  check('le score aberrant rejeté n\'apparaît bien dans aucun classement', !fetchCheat.rows || fetchCheat.rows.length === 0);

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent (contre le vrai serveur Supabase).');
  process.exitCode = failures ? 1 : 0;
}
main().finally(() => { fs.rmSync(stateDir, { recursive: true, force: true }); })
  .catch(e => { console.error('ERREUR:', e); process.exit(1); });
