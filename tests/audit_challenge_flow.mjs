#!/usr/bin/env node
// Garde-fou de non-régression dédié au défi entre amis DE BOUT EN BOUT (voir AGENDA.md AGD-51) :
// deux "appareils" simulés en process Node RÉELLEMENT séparés (voir challenge_flow_device.mjs
// pour la raison -- deux jsdom dans le même process partageraient des singletons de module et ne
// représenteraient pas fidèlement deux appareils physiques distincts), qui ne partagent QUE ce
// qui transite explicitement par un lien, exactement comme deux téléphones différents.
// Vérifie : lien de défi -> carrière -> lien de RÉSULTAT partageable -> ouverture par un ami ->
// classement fusionné correct (2 scores, triés, `mine` jamais confondu) -> rendu podium réel
// (couronne/médaille, pas un numéro nu) -- dans les deux sens (A ouvre le lien de B aussi).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deviceScript = path.join(__dirname, 'challenge_flow_device.mjs');

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

function run(args) {
  const r = spawnSync('node', [deviceScript, ...args], { encoding: 'utf8' });
  if (r.status !== 0) { console.log(r.stdout, r.stderr); throw new Error('appareil simulé en échec: ' + args.join(' ')); }
  const line = r.stdout.split('\n').find(l => l.startsWith('RESULT:'));
  if (!line) { console.log(r.stdout, r.stderr); throw new Error('pas de RESULT: dans la sortie de l\'appareil simulé'); }
  return JSON.parse(line.slice('RESULT:'.length));
}

async function main() {
  console.log('--- Appareil A (process indépendant) : crée le défi, joue sa carrière ---');
  const a = run(['create']);
  check('lien de défi produit', typeof a.link === 'string' && a.link.includes('?challenge='));
  check('écran d\'atterrissage "tu rejoins ton propre défi" affiché', a.landingOk);
  check('carrière de A menée à son terme sans erreur JS', a.errors === 0);
  check('bouton "Comparer avec mes amis" présent sur l\'écran de fin', a.compareBtnPresent);
  check('écran de classement réel rendu (bouton retour présent)', a.leaderboardBackPresent);
  check('bouton "Partager mon score" présent', a.shareBtnPresent);
  check('résultat de A rattaché au bon id de défi dès la fin de carrière (1 seul résultat avant tout échange)', a.beforeImportCount === 1);
  check('lien de résultat de A généré et raisonnablement court', typeof a.resultUrl === 'string' && a.resultUrlLen < 200);

  console.log('\n--- Appareil B (2e process indépendant) : rejoint via le lien de A, joue sa carrière, PUIS ouvre le lien de résultat de A ---');
  const b = run(['join', a.link, a.resultUrl]);
  check('B décode le même défi que A (même id, régénéré depuis la graine du lien)', b.challengeId === a.challengeId);
  check('carrière de B menée à son terme sans erreur JS', b.errors === 0);
  check('avant import, B ne voyait que son propre score (1 résultat)', b.beforeImportCount === 1);
  check('après ouverture du lien de résultat de A, classement de B contient les 2 scores', b.mergedCount === 2);
  check('chez B, "mine" reste posé UNIQUEMENT sur son propre résultat (jamais sur celui reçu de A)', b.mineFlagsOk);
  check('classement de B trié par score décroissant', b.sortedOk);
  check('le score de A apparaît bien chez B après import', b.friendNameShown);
  check('rendu du podium (couronne/médaille SVG, pas un simple numéro nu) chez B', /rk-medal/.test(b.leaderboardHtml || ''));
  check('la propre ligne de B est repérable ("(toi)") dans son propre classement', /\(toi\)/.test(b.leaderboardHtml || ''));

  console.log('\n--- Symétrique : appareil A ouvre le lien de résultat de B (3e process, sans rejouer la carrière) ---');
  const merged = run(['importOnly', a.link, a.resultUrl, b.resultUrl]);
  check('chez A (symétrique), classement contient les 2 scores après avoir ouvert le lien de B', merged.mergedCount === 2);
  check('chez A, "mine" reste posé uniquement sur le résultat de A', merged.mineFlagsOk);
  check('classement de A trié par score décroissant', merged.sortedOk);
  check('podium (couronne/médaille) aussi rendu chez A', /rk-medal/.test(merged.leaderboardHtml || ''));

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
