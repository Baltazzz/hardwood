#!/usr/bin/env node
// Commande de fin de session : audit -> build -> commit -> push, dans cet ordre,
// en s'arrêtant dès qu'une étape échoue (crash détecté par l'audit, build cassé,
// commit/push en échec). Ne fait rien de destructeur : si rien n'a changé après
// l'audit et le build, le commit/push est simplement sauté (pas une erreur).
//
// Usage : npm run ship [-- "message de commit"]

import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function step(label, fn) {
  console.log(`\n=== ${label} ===`);
  try {
    fn();
  } catch {
    console.error(`\n✗ Échec à l'étape « ${label} ». Arrêt — rien n'a été poussé.`);
    process.exit(1);
  }
}

const commitMessage = process.argv[2]
  || `chore: ship ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

step('Audit (100 carrières)', () => run('npm run audit -- 100'));
step('Build', () => run('npm run build'));

console.log('\n=== Commit & push ===');
run('git add -A');
const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
if (!staged) {
  console.log('Rien à committer — audit et build OK, dépôt déjà à jour.');
  process.exit(0);
}
step('Commit', () => run(`git commit -m ${JSON.stringify(commitMessage)}`));
step('Push', () => run('git push'));

console.log('\n✓ Ship terminé : audit OK, build OK, poussé sur le dépôt distant.');
