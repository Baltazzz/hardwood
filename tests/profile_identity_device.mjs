// Simule UN appareil réel jouant le défi entre amis, avec son PROPRE pseudo de compte (voir
// tests/audit_profile_identity.mjs, AGENDA.md AGD-58) -- process Node indépendant pour la même
// raison que tests/challenge_flow_device.mjs (singletons de module : le `stage` de ui/dom.js, le
// `mem` en cache d'engine/challenges.js/engine/profile.js, etc.).
// Usage :
//   node profile_identity_device.mjs create <nickname>
//   node profile_identity_device.mjs join <lienDéfi> <nickname>
// Sortie : une ligne JSON préfixée RESULT: sur stdout, avec l'identité de PERSONNAGE imposée
// (nom, mode de vie, club de départ -- doit être strictement identique entre deux appareils) et le
// pseudo de COMPTE utilisé pour le classement (doit lui différer d'un appareil à l'autre).
import { setupEnvironment } from './env.mjs';

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

// Joue la carrière jusqu'au bout et rapporte l'identité obtenue. `link` est simplement reporté
// tel quel dans la sortie (utile pour `create`, où l'appelant en a besoin pour que `join` le
// réutilise) -- rien ici ne le régénère.
function finishAndReport(document, errors, state, challengesEngine, link) {
  // Capturé JUSTE APRÈS "Continuer" (avant de jouer la carrière, qui peut faire évoluer p.club
  // via transferts/promotions) : c'est l'identité de PERSONNAGE réellement imposée par le défi,
  // voir AGENDA.md AGD-58 -- doit être strictement identique entre deux appareils distincts.
  clickId(document, 'continueJoin');
  const p = state.G;
  const identity = { name: p.name, life: p.life, club: p.club, nationId: p.nation.id, pos: p.pos, style: p.style };

  driveCareerToEnd(document, errors);
  clickId(document, 'challengeCompare');
  const challengeId = state.G.challengeId;
  const myResult = challengesEngine.getChallenge(challengeId).results.find(r => r.mine);

  console.log('RESULT:' + JSON.stringify({
    link, challengeId, identity, myResultName: myResult.name, score: myResult.score, errors: errors.length,
  }));
}

async function main() {
  const mode = process.argv[2];
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  const profile = await import('../src/engine/profile.js');
  const screens = await import('../src/ui/screens.js');
  const challengeUi = await import('../src/ui/challenge.js');
  const challengesEngine = await import('../src/engine/challenges.js');
  const codec = await import('../src/engine/challengeCodec.js');
  const state = await import('../src/engine/state.js');

  if (mode === 'create') {
    const [, , , nickname] = process.argv;
    profile.setNickname(nickname);
    screens.screenTitle();
    clickId(document, 'challengeCreate');
    clickId(document, 'challengeHubNew');
    const link = document.getElementById('challengeLink').value;
    clickId(document, 'startMyChallenge');
    finishAndReport(document, errors, state, challengesEngine, link);
    return;
  }

  if (mode === 'join') {
    const [, , , link, nickname] = process.argv;
    profile.setNickname(nickname);
    const urlObj = new URL(link);
    const def = codec.decodeChallengeDef(new URLSearchParams(urlObj.search).get('challenge'));
    screens.screenTitle();
    challengeUi.joinChallenge(def);
    finishAndReport(document, errors, state, challengesEngine, link);
    return;
  }

  throw new Error('mode inconnu: ' + mode);
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
