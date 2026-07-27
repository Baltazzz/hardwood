#!/usr/bin/env node
// Garde-fou de non-régression dédié à la méta-progression (voir AGENDA.md) : joue plusieurs
// carrières de suite (via le harnais partagé tests/harness.mjs, mêmes clics réels que l'audit
// principal) et vérifie que les compteurs qui doivent survivre À TRAVERS les carrières le font
// vraiment -- `totalCareers` (engine/badges.js) et le meilleur score légende (engine/hof.js).
// Existe spécifiquement parce que le bug corrigé (badgesClear() qui remettait aussi totalCareers
// à zéro) ne se voyait PAS dans l'audit standard (tests/audit.mjs), qui ne relit jamais ces
// compteurs entre deux carrières.
//
// Usage : node tests/audit_meta_progression.mjs        (10 carrières par défaut)
//         node tests/audit_meta_progression.mjs 20      (nombre personnalisé)

import { setupEnvironment } from './env.mjs';
import { driveOneCareer } from './harness.mjs';

const N = Number(process.argv[2]) || 10;

async function main() {
  const { document, errors } = setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');

  const screens = await import('../src/ui/screens.js');
  const state = await import('../src/engine/state.js');
  const player = await import('../src/engine/player.js');
  const { ATTRS } = await import('../src/data/positions.js');
  const badges = await import('../src/engine/badges.js');
  const hof = await import('../src/engine/hof.js');

  screens.screenTitle();
  document.getElementById('go').click();

  let failures = 0;
  let prevBest = 0;
  console.log(`Lecture initiale (avant toute carrière) -> totalCareers=${badges.badgesState().totalCareers}, meilleur score=${hof.hofBest()}`);

  for (let i = 1; i <= N; i++) {
    let result;
    try {
      result = driveOneCareer({ document, errors, state, ATTRS });
    } catch (e) {
      result = { crashed: true, reason: e };
    }
    if (result.crashed) {
      console.log(`✗ Carrière ${i} : CRASH (${result.reason && result.reason.message ? result.reason.message : result.reason}) -- arrêt de l'audit`);
      process.exitCode = 1;
      return;
    }

    // Point de vigilance spécifique au bug corrigé : au tiers du parcours, déclenche un reset de
    // badges (comme un joueur curieux cliquant "Réinitialiser les badges") et vérifie que
    // totalCareers SURVIT à ce reset -- exactement le scénario qui causait le blocage à 1.
    if (i === Math.ceil(N / 3)) {
      const before = badges.badgesState().totalCareers;
      badges.badgesClear();
      const after = badges.badgesState().totalCareers;
      if (after !== before) {
        console.log(`✗ badgesClear() a altéré totalCareers (${before} -> ${after}), régression du bug corrigé`);
        failures++;
      } else {
        console.log(`  (reset des badges déclenché à la carrière ${i} -- totalCareers préservé à ${after}, comme attendu)`);
      }
    }

    const total = badges.badgesState().totalCareers;
    const best = hof.hofBest();
    const totalOk = total === i;
    const bestOk = best >= prevBest;
    if (!totalOk) { console.log(`✗ Carrière ${i} : totalCareers=${total}, attendu ${i}`); failures++; }
    if (!bestOk) { console.log(`✗ Carrière ${i} : meilleur score a DIMINUÉ (${prevBest} -> ${best})`); failures++; }
    if (totalOk && bestOk) console.log(`✓ Carrière ${i} : totalCareers=${total}, meilleur score=${best}`);
    prevBest = best;
  }

  console.log(`\n${failures === 0 ? 'TOUT PASSE' : 'ÉCHECS : ' + failures} -- ${N} carrières jouées d'affilée, totalCareers vérifié strictement croissant et meilleur score jamais décroissant.`);
  if (failures > 0) process.exitCode = 1;
}

main().catch(err => {
  console.error('AUDIT MÉTA-PROGRESSION ÉCHOUÉ :', err);
  process.exitCode = 1;
});
