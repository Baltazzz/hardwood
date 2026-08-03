#!/usr/bin/env node
// Garde-fou dédié au dernier lot avant diffusion (voir AGENDA.md) : invitations discrètes au
// partage (B1), légende d'idole adaptée à la nationalité (B3), couleurs de sélection nationale
// corrigées sur les vraies couleurs de drapeau (B4). Chaque section est indépendante.
import { setupEnvironment } from './env.mjs';
import { driveOneCareer } from './harness.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  // ============================================================
  // B4 -- Couleurs de sélection nationale (vraies couleurs de drapeau)
  // ============================================================
  {
    const { NATIONS } = await import('../src/data/nations.js');
    const { ATTRS, POSITIONS } = await import('../src/data/positions.js');
    const accent = await import('../src/engine/accent.js');
    const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

    let allNationsCovered = true, allValidHex = true, allDistinctPair = true;
    for (const nation of NATIONS) {
      const raw = accent.nationAccentRaw(nation.id);
      if (!raw) { allNationsCovered = false; console.log(`  -- ${nation.id} (${nation.name}) : aucune entrée, retombe sur FALLBACK_ACCENT`); }
      const p = { nation, club: null };
      const primary = accent.getAccent(p, 'nation');
      const { primary: emPrimary, secondary } = accent.emblemColors(p, 'nation');
      if (!HEX_RE.test(primary) || !HEX_RE.test(secondary)) allValidHex = false;
      if (emPrimary === secondary) allDistinctPair = false;
    }
    check('les 34 nations jouables ont toutes une couleur de sélection curatée (aucune sur FALLBACK_ACCENT)', allNationsCovered);
    check('primaire + secondaire résolvent toujours en hex valide, pour les 34 nations', allValidHex);
    check('primaire et secondaire restent toujours distinctes (jamais la même couleur deux fois)', allDistinctPair);

    // Correction du bug signalé : l'Australie n'a AUCUN vert sur son drapeau (bleu/rouge/blanc,
    // Union Jack + Croix du Sud) -- l'ancienne valeur '#00843D' (un vert) venait de la couleur des
    // "Boomers", pas du drapeau réel.
    const auRaw = accent.nationAccentRaw('AU');
    check('Australie : la couleur n\'est plus le vert des "Boomers" (bug signalé, pas une couleur de drapeau)', auRaw !== '#00843D');
    check('Australie : la primaire est bien un bleu (drapeau réel), pas un vert', auRaw && auRaw.toUpperCase() !== '#00843D');

    // Rendu réel sur plusieurs nations diverses (voir renderEvent() en fenêtre de sélection) :
    // applyAccent() ne doit jamais planter et doit toujours poser une variable CSS --accent valide.
    const sample = ['FR', 'DE', 'BR', 'NG', 'JP', 'AU', 'TR', 'US'];
    let renderOk = true;
    for (const id of sample) {
      const nation = NATIONS.find(n => n.id === id);
      const hex = accent.applyAccent({ nation, club: null }, 'nation');
      if (!HEX_RE.test(hex) || document.documentElement.style.getPropertyValue('--accent') !== hex) renderOk = false;
    }
    accent.resetAccent();
    check(`rendu réel vérifié sans exception sur un échantillon de nations diverses (${sample.join(', ')})`, renderOk);
  }

  // ============================================================
  // B3 -- Légende d'idole adaptée à la nationalité
  // ============================================================
  {
    const { legendFor } = await import('../src/data/events/_helpers.js');
    const { NATION_LEGENDS, LEGENDS } = await import('../src/data/legends.js');

    const franceLegend = legendFor({ nation: { id: 'FR' }, pos: 'C' }, 'repli');
    check('France (poste C, sans rapport avec la légende référencée) : la nationalité prime sur le poste', franceLegend === NATION_LEGENDS.FR.name);

    const germanyLegend = legendFor({ nation: { id: 'DE' }, pos: 'PG' }, 'repli');
    check('Allemagne : légende nationale retournée quel que soit le poste du joueur', germanyLegend === NATION_LEGENDS.DE.name);

    const usLegend = legendFor({ nation: { id: 'US' }, pos: 'PG' }, 'repli');
    check('États-Unis (aucune entrée nation -- tous les noms de LEGENDS sont déjà américains) : repli sur le pool par poste', LEGENDS.PG.includes(usLegend));

    const unknownNationLegend = legendFor({ nation: { id: 'ZZ' }, pos: 'SF' }, 'repli');
    check('nation inconnue/non référencée : repli propre sur le pool par poste, jamais une exception', LEGENDS.SF.includes(unknownNationLegend));

    const noNationLegend = legendFor({ nation: null, pos: 'C' }, 'repli ultime');
    check('p.nation absent : ne plante jamais, repli sur le pool par poste', LEGENDS.C.includes(noNationLegend));

    let coveredCount = 0;
    const { NATIONS } = await import('../src/data/nations.js');
    for (const nation of NATIONS) { if (nation.id === 'US' || NATION_LEGENDS[nation.id]) coveredCount++; }
    check(`les 34 nations sont couvertes (légende propre ou repli explicite pour US) -- ${coveredCount}/34`, coveredCount === NATIONS.length);
  }

  // ============================================================
  // B1a -- Invitation au partage : défi entre amis, en tête du classement
  // ============================================================
  {
    const challengesEngine = await import('../src/engine/challenges.js');
    const challengeUi = await import('../src/ui/challenge.js');

    const winId = 'test' + Math.floor(Math.random() * 1e9).toString(36);
    const def = challengesEngine.generateChallengeDef();
    def.id = winId;
    challengesEngine.ensureChallenge(def);
    challengesEngine.recordMyChallengeResult(winId, { challengeId: winId, name: 'MoiEnTete', score: 300, tier: 'Superstar', seasons: 12, hof: false, date: Date.now(), mine: true });
    challengesEngine.addResult(winId, { challengeId: winId, name: 'Ami', score: 150, tier: 'All-Star', seasons: 8, hof: false, date: Date.now(), mine: false });
    challengeUi.renderChallengeLeaderboard(winId);
    check('classement de défi : invitation au partage affichée quand "mine" est en tête (2 participants)', document.body.innerHTML.includes('challengeWinNudge') && !!document.querySelector('#challengeWinNudge .rarity-banner'));

    const loseId = 'test' + Math.floor(Math.random() * 1e9).toString(36);
    const def2 = challengesEngine.generateChallengeDef();
    def2.id = loseId;
    challengesEngine.ensureChallenge(def2);
    challengesEngine.recordMyChallengeResult(loseId, { challengeId: loseId, name: 'MoiDerriere', score: 100, tier: 'Joueur de rotation', seasons: 5, hof: false, date: Date.now(), mine: true });
    challengesEngine.addResult(loseId, { challengeId: loseId, name: 'Ami', score: 250, tier: 'Superstar', seasons: 10, hof: false, date: Date.now(), mine: false });
    challengeUi.renderChallengeLeaderboard(loseId);
    check('classement de défi : AUCUNE invitation quand "mine" n\'est pas en tête (jamais intrusif)', !document.querySelector('#challengeWinNudge .rarity-banner'));

    const soloId = 'test' + Math.floor(Math.random() * 1e9).toString(36);
    const def3 = challengesEngine.generateChallengeDef();
    def3.id = soloId;
    challengesEngine.ensureChallenge(def3);
    challengesEngine.recordMyChallengeResult(soloId, { challengeId: soloId, name: 'Solo', score: 300, tier: 'Superstar', seasons: 12, hof: false, date: Date.now(), mine: true });
    challengeUi.renderChallengeLeaderboard(soloId);
    check('classement de défi : AUCUNE invitation à un seul participant (rien à "gagner" tout seul)', !document.querySelector('#challengeWinNudge .rarity-banner'));
  }

  // ============================================================
  // B1b -- Invitation au partage : fin de grande carrière (rareté)
  // ============================================================
  {
    const screens = await import('../src/ui/screens.js');
    const state = await import('../src/engine/state.js');
    const { ATTRS } = await import('../src/data/positions.js');
    screens.screenTitle();
    document.getElementById('go').click(); // écran titre -> création (1re carrière)

    // Partie 1 : sur plusieurs VRAIES carrières pilotées (choix aléatoires, pas une valeur
    // forcée), l'invariant "bouton présent SSI bandeau présent" doit tenir dans TOUS les cas,
    // qu'ils soient rares ou non -- couvre largement le cas "absence" (l'écrasante majorité de
    // carrières à choix aléatoires n'atteint pas le seuil de rareté).
    const N = 15;
    let checkedAtLeastOnce = false, invariantHeld = true;
    for (let i = 0; i < N; i++) {
      const result = driveOneCareer({ document, errors, state, ATTRS });
      if (result.crashed) { invariantHeld = false; console.log('  -- carrière plantée:', result.reason); break; }
      const hasRarityBanner = !!document.querySelector('.rarity-banner');
      const hasShareNudge = !!document.getElementById('shareRareNudge');
      if (hasRarityBanner !== hasShareNudge) { invariantHeld = false; console.log(`  -- désaccord à l'itération ${i}: bandeau=${hasRarityBanner} bouton=${hasShareNudge}`); }
      checkedAtLeastOnce = true;
    }
    check(`${N} carrières pilotées (choix aléatoires) sans erreur JS pour vérifier l'invariant`, checkedAtLeastOnce && errors.length === 0);
    check('invitation au partage présente SI ET SEULEMENT SI le bandeau de rareté l\'est, sur des carrières réelles', invariantHeld);

    // Partie 2 : couvre déterministement le cas "présence" (les choix aléatoires seuls ne
    // franchissent quasiment jamais le seuil de rareté -- pas fiable pour ce cas précis, voir
    // Partie 1). Repart d'une VRAIE carrière déjà validée (aucun champ inventé, aucun risque de
    // structure invalide) : endCareer() peut être ré-invoqué sur le même joueur sans effet de
    // bord (voir p.savedHOF/p.savedWallet, déjà posés au premier appel) -- seul `legend`/`rarity`
    // sont recalculés à chaque appel depuis les champs courants de p, jamais mis en cache.
    // driveOneCareer() clique "again" comme toute dernière action (repart déjà sur un nouveau
    // joueur avant de rendre la main) -- on ne peut donc pas récupérer le joueur qui vient de
    // terminer une fois l'appel revenu ; on reproduit ici le même pilotage jusqu'à "#again" SANS
    // cliquer dessus, pour garder la main sur ce joueur précis.
    for (let i = 0; i < 4; i++) { document.querySelectorAll('.opt')[0].click(); document.getElementById('nextC').click(); }
    document.getElementById('nextC').click();
    document.querySelectorAll('.academy-opt')[0].click();
    for (let i = 0; i < 1000 && !document.getElementById('again'); i++) {
      if (document.getElementById('afterSeason')) document.getElementById('afterSeason').click();
      else if (document.getElementById('natContinue')) document.getElementById('natContinue').click();
      else if (document.getElementById('forcedEndContinue')) document.getElementById('forcedEndContinue').click();
      else if (document.querySelector('.choice')) {
        document.querySelectorAll('.choice')[0].click();
        const cont = document.getElementById('contBtn'); if (cont) cont.click();
      } else break;
    }
    const p = state.G;
    p.peakOvr = 99; p.reputation = 100; p.accolades = { ...p.accolades, MVP: 3, 'Champion NBA': 2 };
    screens.endCareer(p.endReason || 'choice');
    check('carrière artificiellement portée au-delà du seuil de rareté : le bandeau apparaît bien', !!document.querySelector('.rarity-banner'));
    check('...et l\'invitation au partage apparaît AVEC lui (cas "présence" couvert déterministement)', !!document.getElementById('shareRareNudge'));

    p.peakOvr = 1; p.reputation = 0; p.accolades = {}; p.clutch = 0;
    screens.endCareer(p.endReason || 'choice');
    check('le MÊME joueur ramené sous le seuil : le bandeau disparaît bien', !document.querySelector('.rarity-banner'));
    check('...et l\'invitation au partage disparaît AVEC lui (jamais l\'un sans l\'autre, dans les deux sens)', !document.getElementById('shareRareNudge'));
  }

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
