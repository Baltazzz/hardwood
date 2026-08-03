#!/usr/bin/env node
// Vérification dédiée du lot identité de joueur (voir AGENDA.md AGD-58) : profil persistant
// (pseudo auto-généré SILENCIEUSEMENT, jamais d'écran bloquant au premier lancement), modifiable
// depuis les trois points prévus (réglages, tuile de profil, écran de défi entre amis), et surtout
// -- le cœur du lot -- équité TOTALE du défi entre amis : deux appareils distincts rejoignant le
// même défi obtiennent un personnage strictement identique (nom, mode de vie, académie retenue),
// seul leur pseudo de compte les distingue au classement.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setupEnvironment } from './env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const deviceScript = path.join(__dirname, 'profile_identity_device.mjs');

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}
function run(args) {
  const r = spawnSync('node', [deviceScript, ...args], { encoding: 'utf8' });
  const line = (r.stdout || '').split('\n').find(l => l.startsWith('RESULT:'));
  if (!line) { console.log(r.stdout, r.stderr); throw new Error('profile_identity_device.mjs : pas de RESULT: en sortie'); }
  return JSON.parse(line.slice('RESULT:'.length));
}

async function main() {
  // ---- 1. Auto-provisionnement silencieux + aucun écran bloquant au premier lancement ----
  // Process tout neuf, aucun accès préalable à engine/profile.js : le tout premier appel doit
  // déjà renvoyer un pseudo, sans la moindre action explicite.
  const { document } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1'); // isole ce test du garde-fou "écran de bienvenue", non concerné ici
  const profile = await import('../src/engine/profile.js');
  const initialNickname = profile.getProfile().nickname;
  check('un pseudo est déjà présent dès le tout premier accès, sans aucune action explicite', !!initialNickname && initialNickname.length > 0);

  const screens = await import('../src/ui/screens.js');
  screens.screenTitle();
  check('le tout premier lancement mène directement à l\'écran titre normal (aucun écran de configuration interposé)',
    !!document.getElementById('go') || !!document.getElementById('resumeGo'));
  check('le pseudo auto-généré apparaît bien sur la tuile de profil de l\'accueil', document.getElementById('stage').innerHTML.includes(initialNickname));

  // ---- 2. Pseudo modifiable depuis les 3 points prévus ----
  const settingsUi = await import('../src/ui/settings.js');
  settingsUi.renderSettings();
  document.getElementById('settingsNicknameInput').value = 'DepuisReglages';
  document.getElementById('settingsNicknameSave').click();
  check('pseudo modifiable depuis les réglages', profile.profileNickname() === 'DepuisReglages');

  const profileUi = await import('../src/ui/profile.js');
  profileUi.renderProfile();
  document.getElementById('profileNicknameInput').value = 'DepuisTuileProfil';
  document.getElementById('profileNicknameSave').click();
  check('pseudo modifiable depuis la tuile de profil', profile.profileNickname() === 'DepuisTuileProfil');

  const challengeUi = await import('../src/ui/challenge.js');
  challengeUi.renderChallengeHub();
  document.getElementById('nicknameInput').value = 'DepuisDefiEntreAmis';
  document.getElementById('nicknameSave').click();
  check('pseudo modifiable depuis l\'écran de défi entre amis', profile.profileNickname() === 'DepuisDefiEntreAmis');

  // ---- 3. Le cœur du lot : équité totale entre deux appareils distincts sur le MÊME défi ----
  const alice = run(['create', 'Alice']);
  const bob = run(['join', alice.link, 'Bob']);

  check('appareil A (process indépendant) : défi créé et carrière menée à son terme sans erreur', alice.errors === 0);
  check('appareil B (process indépendant) : rejoint via le lien, carrière menée à son terme sans erreur', bob.errors === 0);
  check('B rejoint bien le MÊME défi que A (même id, régénéré depuis la graine du lien)', bob.challengeId === alice.challengeId);

  check('même nom de personnage imposé aux deux appareils (aucune divergence de départ)', alice.identity.name === bob.identity.name);
  check('même mode de vie imposé aux deux appareils', alice.identity.life === bob.identity.life);
  check('même académie (même club de départ) imposée aux deux appareils', alice.identity.club === bob.identity.club);
  check('même nationalité/poste/style imposés aux deux appareils (non-régression)',
    alice.identity.nationId === bob.identity.nationId && alice.identity.pos === bob.identity.pos && alice.identity.style === bob.identity.style);

  check('le classement affiche bien le pseudo de A ("Alice"), pas le nom du personnage', alice.myResultName === 'Alice');
  check('le classement affiche bien le pseudo de B ("Bob"), pas le nom du personnage', bob.myResultName === 'Bob');
  check('les deux pseudos de classement sont bien DISTINCTS (le nom de personnage identique ne les confond pas)',
    alice.myResultName !== bob.myResultName);

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
