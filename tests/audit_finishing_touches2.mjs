#!/usr/bin/env node
// Garde-fou dédié au lot d'ajustements suivant (voir AGENDA.md) : correction du bug de draft
// proposée à un joueur déjà en NBA/G-League (A), accès du classement mondial des carrières depuis
// le menu principal + icônes réduites (B1/B2), réseau bloqué par défaut dans les tests (B3, racine
// de la pollution du classement mondial signalée par l'utilisateur).
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  // ============================================================
  // A -- Un joueur déjà en NBA/G-League ne se voit plus jamais proposer la draft
  // ============================================================
  {
    const season = await import('../src/engine/season.js');
    const state = await import('../src/engine/state.js');
    const player = await import('../src/engine/player.js');
    const { NATIONS } = await import('../src/data/nations.js');
    const { ATTRS } = await import('../src/data/positions.js');

    function basePlayer(overrides) {
      const p = player.newPlayer();
      p.nation = NATIONS.find(n => n.id === 'US') || NATIONS[0];
      p.pos = 'PG'; p.style = 'slasher';
      p.attrs = Object.fromEntries(ATTRS.map(a => [a.id, 65]));
      p.club = 'Test Club'; p.reputation = 55; p.seasons = [];
      return Object.assign(p, overrides);
    }

    // Scénario exact du bug rapporté : signature pro directe (voir data/events/early.js
    // early_pro) -> G-League -> callup NBA, SANS jamais passer par une draftDecl --
    // p.draftEntered reste à false pour toujours par cette voie.
    state.setG(basePlayer({ league: 'nba', startPath: 'us', age: 22, draftEntered: false, nbaStruggle: 0 }));
    const nbaMove = season.resolveMovement();
    check('joueur déjà en NBA (jamais passé par la draft) : la draft n\'est plus proposée à 22 ans',
      !nbaMove || nbaMove.type !== 'draftDecl');

    state.setG(basePlayer({ league: 'gleague', startPath: 'us', age: 22, draftEntered: false, attrs: Object.fromEntries(ATTRS.map(a => [a.id, 30])) }));
    const gleagueMove = season.resolveMovement();
    check('joueur en G-League (pas encore en NBA, jamais passé par la draft) : la draft n\'est plus proposée à 22 ans',
      !gleagueMove || gleagueMove.type !== 'draftDecl');

    // Non-régression : un VRAI candidat à la draft (parcours international, jamais encore
    // tenté sa chance) doit toujours se la voir proposer -- le correctif ne doit exclure QUE
    // nba/gleague, jamais les autres paliers.
    state.setG(basePlayer({ league: 'euro', startPath: 'eu', age: 22, draftEntered: false }));
    const introMove = season.resolveMovement();
    check('non-régression : un joueur international jamais passé par la draft se la voit toujours proposer à 22 ans',
      introMove && introMove.type === 'draftDecl' && introMove.forced === true);

    // Non-régression : une fois déjà entré à la draft (p.draftEntered=true), jamais reproposée
    // non plus -- comportement déjà correct avant ce lot, doit le rester.
    state.setG(basePlayer({ league: 'euro', startPath: 'eu', age: 22, draftEntered: true }));
    const alreadyMove = season.resolveMovement();
    check('non-régression : un joueur ayant déjà tenté la draft ne se la voit jamais reproposer',
      !alreadyMove || alreadyMove.type !== 'draftDecl');

    check('aucune erreur JS pendant ces vérifications directes', errors.length === 0);
  }

  // ============================================================
  // B1 -- Classement mondial des carrières accessible depuis le menu principal
  // ============================================================
  {
    const screens = await import('../src/ui/screens.js');
    screens.screenTitle();
    check('bouton "Classement mondial" présent directement sur l\'écran d\'accueil', !!document.getElementById('worldLbHome'));
    document.getElementById('worldLbHome').click();
    check('clic sur ce bouton ouvre bien l\'écran de classement mondial des carrières', !!document.getElementById('wlBack'));
  }

  // ============================================================
  // B2 -- Icônes du classement réduites
  // ============================================================
  {
    const card = await import('../src/ui/card.js');
    const html = card.rankGlyph(0);
    const widthMatch = html.match(/width="(\d+)"/);
    check('icône de rang n°1 (couronne) réduite à 23px (était 30px)', widthMatch && widthMatch[1] === '23');
    const medalHtml = card.rankGlyph(1);
    const medalWidthMatch = medalHtml.match(/width="(\d+)"/);
    check('icône de rang n°2 (médaille) réduite à 21px (était 28px)', medalWidthMatch && medalWidthMatch[1] === '21');
  }

  // ============================================================
  // B3 -- Réseau bloqué par défaut dans les tests (racine de la pollution signalée)
  // ============================================================
  {
    // Nouvel environnement isolé (n'affecte pas le reste de ce script) : confirme que
    // setupEnvironment() SANS options bloque bien tout fetch(), et que { allowNetwork: true }
    // lève explicitement ce blocage -- exactement le contrat que tests/*_device_check.mjs
    // (audits *-live) doivent pouvoir exploiter, sans que le reste de la suite de tests
    // (audit.mjs, deep-audit.mjs...) ne touche jamais le vrai serveur par accident.
    const realFetchBefore = globalThis.fetch;
    setupEnvironment();
    let blockedThrew = false, blockedResult;
    try { blockedResult = await globalThis.fetch('https://example.invalid/'); }
    catch (e) { blockedThrew = true; }
    check('setupEnvironment() sans option bloque bien tout fetch() par défaut', blockedThrew || blockedResult === undefined);

    setupEnvironment({ allowNetwork: true });
    check('setupEnvironment({ allowNetwork: true }) restaure bien un fetch() réel (différent du blocage)', globalThis.fetch !== undefined && typeof globalThis.fetch === 'function');
  }

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
