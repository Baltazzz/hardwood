// Simule UN appareil réel jouant le défi entre amis (voir tests/audit_challenge_flow.mjs, qui
// lance ce script en process Node séparé -- volontairement : deux instances jsdom dans le MÊME
// process partageraient les singletons de module (le `stage` de ui/dom.js, le `mem` en cache de
// engine/challenges.js, etc.) et ne peuvent donc pas représenter fidèlement deux appareils
// physiques distincts, qui eux ne partagent QUE ce qui transite explicitement par un lien.
// Usage :
//   node challenge_flow_device.mjs create
//   node challenge_flow_device.mjs join <lienDéfi> [lienRésultatAmiÀImporter]
//   node challenge_flow_device.mjs importOnly <lienDéfi> <monPropreLienRésultat> <lienRésultatAmi>
// Sortie : une ligne JSON préfixée RESULT: sur stdout.
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
function driveCreationSteps(document) {
  // Étape 3 (mode de vie, seule étape .opt restante quand nation/poste/style sont figés par un
  // défi) -> étape 4 (nom, pas de .opt) -> nextC déclenche startCareer() -> académies figées.
  pickRandomEl(document.querySelectorAll('.opt')).click(); clickId(document, 'nextC');
  clickId(document, 'nextC');
  pickRandomEl(document.querySelectorAll('.academy-opt')).click();
}

async function main() {
  const mode = process.argv[2];
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  const screens = await import('../src/ui/screens.js');
  const challengeUi = await import('../src/ui/challenge.js');
  const challengesEngine = await import('../src/engine/challenges.js');
  const codec = await import('../src/engine/challengeCodec.js');
  const state = await import('../src/engine/state.js');

  if (mode === 'create' || mode === 'join') {
    let link = process.argv[3];
    if (mode === 'create') {
      screens.screenTitle();
      clickId(document, 'challengeCreate');
      link = document.getElementById('challengeLink').value;
      clickId(document, 'startMyChallenge');
    } else {
      const urlObj = new URL(link);
      const challengeParam = new URLSearchParams(urlObj.search).get('challenge');
      const def = codec.decodeChallengeDef(challengeParam);
      screens.screenTitle();
      challengeUi.joinChallenge(def);
    }
    const landingOk = !!document.getElementById('continueJoin');
    clickId(document, 'continueJoin');
    driveCreationSteps(document);
    driveCareerToEnd(document, errors);
    const compareBtn = document.getElementById('challengeCompare');
    const compareBtnPresent = !!compareBtn;
    compareBtn.click();
    const leaderboardBackPresent = !!document.getElementById('leaderboardBack');
    const shareBtnPresent = !!document.getElementById('shareMyResult');

    const challengeId = state.G.challengeId;
    const entry = challengesEngine.getChallenge(challengeId);
    const myResult = entry.results.find(r => r.mine);
    const resultUrl = codec.buildResultUrl(myResult);
    const beforeImportCount = entry.results.length;

    let mergedCount = null, mineFlagsOk = null, sortedOk = null, leaderboardHtml = null, friendNameShown = null;
    const importResultUrl = process.argv[4];
    if (importResultUrl) {
      const resParam = new URL(importResultUrl).searchParams.get('result');
      const decoded = codec.decodeResult(resParam);
      challengesEngine.addResult(decoded.challengeId, { ...decoded, mine: false });
      challengeUi.renderChallengeLeaderboard(challengeId);
      const merged = challengesEngine.getChallenge(challengeId);
      mergedCount = merged.results.length;
      mineFlagsOk = merged.results.filter(r => r.mine).length === 1 && merged.results.find(r => r.mine).name === myResult.name;
      sortedOk = merged.results.every((r, i) => i === 0 || merged.results[i - 1].score >= r.score);
      leaderboardHtml = document.getElementById('stage').querySelector('.hof-list').innerHTML;
      friendNameShown = merged.results.some(r => !r.mine);
    }

    console.log('RESULT:' + JSON.stringify({
      link, challengeId, landingOk, compareBtnPresent, leaderboardBackPresent, shareBtnPresent,
      myResultName: myResult.name, myResultScore: myResult.score, resultUrl, resultUrlLen: resultUrl.length,
      beforeImportCount, mergedCount, mineFlagsOk, sortedOk, friendNameShown, leaderboardHtml,
      errors: errors.length,
    }));
    return;
  }

  if (mode === 'importOnly') {
    const [, , , link, ownResultUrl, friendResultUrl] = process.argv;
    const urlObj = new URL(link);
    const challengeParam = new URLSearchParams(urlObj.search).get('challenge');
    const def = codec.decodeChallengeDef(challengeParam);
    challengesEngine.ensureChallenge(def);
    const ownRes = codec.decodeResult(new URL(ownResultUrl).searchParams.get('result'));
    challengesEngine.addResult(ownRes.challengeId, { ...ownRes, mine: true });
    const friendRes = codec.decodeResult(new URL(friendResultUrl).searchParams.get('result'));
    challengesEngine.addResult(friendRes.challengeId, { ...friendRes, mine: false });
    challengeUi.renderChallengeLeaderboard(def.id);
    const merged = challengesEngine.getChallenge(def.id);
    const leaderboardHtml = document.getElementById('stage').querySelector('.hof-list').innerHTML;
    console.log('RESULT:' + JSON.stringify({
      mergedCount: merged.results.length,
      mineFlagsOk: merged.results.filter(r => r.mine).length === 1 && merged.results.find(r => r.mine).name === ownRes.name,
      sortedOk: merged.results.every((r, i) => i === 0 || merged.results[i - 1].score >= r.score),
      leaderboardHtml,
      errors: errors.length,
    }));
    return;
  }
  throw new Error('mode inconnu: ' + mode);
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
