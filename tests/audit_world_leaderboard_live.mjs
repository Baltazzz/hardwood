#!/usr/bin/env node
// Vérification de BOUT EN BOUT des classements MONDIAUX (défi du jour + carrières, voir AGENDA.md
// AGD-59) contre le VRAI projet Supabase (aucun mock) -- appareils simulés en process Node
// RÉELLEMENT séparés (même raison qu'AGD-57/AGD-51).
//
// PRÉALABLE : la migration supabase/migrations/0002_world_leaderboards.sql doit avoir été exécutée
// dans l'éditeur SQL du projet Supabase (voir supabase/README.md) -- ce script le détecte et
// l'explique clairement plutôt que d'échouer de façon confuse si ce n'est pas encore fait.
//
// Ces tables sont MONDIALES (pas scopées à un id de défi frais à chaque run comme challenge_scores)
// -- CE SCRIPT ÉCRIT DE VRAIES LIGNES DANS LE VRAI CLASSEMENT PARTAGÉ à chaque exécution (aucune
// suppression possible via la clé anon, volontairement, voir 0002_world_leaderboards.sql). Leçon
// tirée en le vérifiant : une première version de ce fichier utilisait des scores délibérément
// TRÈS élevés (450-580) pour rester "en tête" quel que soit l'état du classement -- ça a
// effectivement fonctionné, mais ça a aussi laissé plusieurs comptes de test trôner en haut d'un
// classement encore vide de vrais joueurs (voir AGENDA.md, signalé par l'utilisateur). Corrigé :
// des scores MODESTES désormais (comparables entre eux pour les vérifications de tri, mais jamais
// dominants), et des pseudos aléatoires uniques à chaque exécution pour ne jamais confondre une
// exécution avec la précédente. world_leaderboard_device_check.mjs interroge avec une limite large
// pour retrouver ces lignes même noyées sous des scores réels plus hauts, sans dépendre d'y être
// en tête.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deviceScript = path.join(__dirname, 'world_leaderboard_device_check.mjs');
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hardwood-world-lb-audit-'));

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}
function run(args) {
  const r = spawnSync('node', [deviceScript, ...args], { encoding: 'utf8', env: { ...process.env, HARDWOOD_DEVICE_STATE_DIR: stateDir } });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('RESULT:'));
  if (!line) { console.log(r.stdout, r.stderr); throw new Error('world_leaderboard_device_check.mjs : pas de RESULT: en sortie'); }
  return JSON.parse(line.slice('RESULT:'.length));
}
const rand = () => Math.floor(Math.random() * 1e9).toString(36);

async function main() {
  const probe = run(['probe']);
  if (!probe.tableExists) {
    console.log('\n⚠️  Les tables des classements mondiaux n\'existent pas encore sur le projet Supabase.');
    console.log(`   career_world_scores : ${probe.careerExists ? 'OK' : 'ABSENTE'} · daily_world_scores : ${probe.dailyExists ? 'OK' : 'ABSENTE'}`);
    console.log('   Exécute supabase/migrations/0002_world_leaderboards.sql dans l\'éditeur SQL du');
    console.log('   dashboard Supabase (voir supabase/README.md), puis relance cet audit :');
    console.log('   npm run audit:world-leaderboard-live');
    console.log('\nVérification interrompue -- pas un échec de code, une étape manuelle requise.');
    process.exitCode = 2;
    return;
  }
  check('les tables "career_world_scores" et "daily_world_scores" existent (migration appliquée)', probe.tableExists);

  // ============================================================
  // CLASSEMENT MONDIAL DES CARRIÈRES
  // ============================================================
  const alice = 'AliceCareer' + rand(), bob = 'BobCareer' + rand();

  const aSub = run(['career-submit', 'devA', alice, '45']);
  check('carrière -- appareil A : soumission acceptée par le serveur', aSub.ok);
  const bSub = run(['career-submit', 'devB', bob, '60']);
  check('carrière -- appareil B (pseudo distinct) : soumission acceptée', bSub.ok);

  const fetchA = run(['career-fetch', alice]);
  const aRow = fetchA.rows && fetchA.rows.find(r => r.name === alice);
  const bRowSeenByA = fetchA.rows && fetchA.rows.find(r => r.name === bob);
  check('carrière -- A voit bien les 2 pseudos (le sien ET celui de B) sans rien échanger', !!aRow && !!bRowSeenByA);
  check('carrière -- "mine" bien posé uniquement sur la ligne de A de son propre point de vue', aRow?.mine === true && bRowSeenByA?.mine === false);
  check('carrière -- classement trié par score décroissant (Bob 60 avant Alice 45)',
    fetchA.rows.indexOf(bRowSeenByA) < fetchA.rows.indexOf(aRow));

  const aWorse = run(['career-submit', 'devA', alice, '30']);
  check('carrière -- resoumission PLUS FAIBLE acceptée par l\'API (pas rejetée)', aWorse.ok);
  const rankAfterWorse = run(['career-rank', alice]);
  check('carrière -- score reste le MEILLEUR (45), jamais écrasé par un moins bon (30)', rankAfterWorse.result?.row?.score === 45);

  await new Promise((r) => setTimeout(r, 5200)); // throttle anti-spam (voir 0002_world_leaderboards.sql)
  const aBetter = run(['career-submit', 'devA', alice, '70']);
  check('carrière -- resoumission MEILLEURE acceptée après la fenêtre anti-spam', aBetter.ok);
  const rankAfterBetter = run(['career-rank', alice]);
  check('carrière -- score bien mis à jour au meilleur (70)', rankAfterBetter.result?.row?.score === 70);

  const cheatCareer = 'Tricheur' + rand();
  const cheat = run(['career-submit', 'devCheat', cheatCareer, '999999']);
  check('carrière -- score aberrant (999999) REJETÉ par le serveur', cheat.ok === false);
  const cheatRank = run(['career-rank', cheatCareer]);
  check('carrière -- le score aberrant rejeté n\'apparaît dans aucun classement', cheatRank.result === null);

  // ---- Réconciliation de renommage (le scénario clé de ce lot, voir AGENDA.md AGD-59) : le MÊME
  // appareil se renomme -- doit mettre à jour SA MÊME ligne, jamais en créer une seconde. ----
  const nameBefore = 'RenameBefore' + rand(), nameAfter = 'RenameAfter' + rand();
  const renameSub1 = run(['career-submit', 'devRename', nameBefore, '55']);
  check('renommage -- 1re soumission (avant renommage) acceptée', renameSub1.ok);
  const renameSub2 = run(['career-submit', 'devRename', nameAfter, '55']);
  check('renommage -- 2e soumission (même appareil, nouveau pseudo, même score) acceptée', renameSub2.ok);
  const rankOldName = run(['career-rank', nameBefore]);
  check('renommage -- l\'ANCIEN pseudo n\'a plus de ligne (pas de doublon fantôme)', rankOldName.result === null);
  const rankNewName = run(['career-rank', nameAfter]);
  check('renommage -- le NOUVEAU pseudo porte bien la ligne, score préservé (55)', rankNewName.result?.row?.score === 55);

  // ============================================================
  // CLASSEMENT MONDIAL DU DÉFI DU JOUR
  // ============================================================
  const today = new Date().toISOString().slice(0, 10);
  const daliceA = 'AliceDaily' + rand(), dbobB = 'BobDaily' + rand();

  const dASub = run(['daily-submit', 'devDA', today, daliceA, '48']);
  check('quotidien -- appareil A : soumission acceptée', dASub.ok);
  const dBSub = run(['daily-submit', 'devDB', today, dbobB, '62']);
  check('quotidien -- appareil B (pseudo distinct) : soumission acceptée', dBSub.ok);

  const dFetchA = run(['daily-fetch', today, daliceA]);
  const dARow = dFetchA.rows && dFetchA.rows.find(r => r.name === daliceA);
  const dBRowSeenByA = dFetchA.rows && dFetchA.rows.find(r => r.name === dbobB);
  check('quotidien -- A voit bien les 2 pseudos du jour sans rien échanger', !!dARow && !!dBRowSeenByA);
  check('quotidien -- "mine" bien posé uniquement sur la ligne de A', dARow?.mine === true && dBRowSeenByA?.mine === false);
  check('quotidien -- classement du jour trié par score décroissant (Bob 62 avant Alice 48)',
    dFetchA.rows.indexOf(dBRowSeenByA) < dFetchA.rows.indexOf(dARow));

  const dWorse = run(['daily-submit', 'devDA', today, daliceA, '35']);
  check('quotidien -- resoumission plus faible acceptée par l\'API', dWorse.ok);
  const dRankAfterWorse = run(['daily-rank', today, daliceA]);
  check('quotidien -- score du jour reste le meilleur (48), jamais écrasé', dRankAfterWorse.result?.row?.score === 48);

  const dCheat = 'TricheurDaily' + rand();
  const dCheatSub = run(['daily-submit', 'devDCheat', today, dCheat, '999999']);
  check('quotidien -- score aberrant (999999) REJETÉ par le serveur', dCheatSub.ok === false);

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent (contre le vrai serveur Supabase).');
  process.exitCode = failures ? 1 : 0;
}
main().finally(() => { fs.rmSync(stateDir, { recursive: true, force: true }); })
  .catch(e => { console.error('ERREUR:', e); process.exit(1); });
