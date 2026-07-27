import { SHARED_EVENTS } from '../data/events/shared.js';
import { EARLY_EVENTS } from '../data/events/early.js';
import { MID_EVENTS } from '../data/events/mid.js';
import { LATE_EVENTS } from '../data/events/late.js';
import { ATTRIBUTE_EVENTS } from '../data/events/attributes.js';
import { THREAD_EVENTS } from '../data/events/threads.js';
import { NBA_FLAVOR_EVENTS } from '../data/events/nba_flavor.js';
import { WELLBEING_EVENTS } from '../data/events/wellbeing.js';
import { TRAITS_PAYOFF_EVENTS } from '../data/events/traits_payoff.js';
import { careerPhase } from '../data/events/_helpers.js';

/* ============================================================
   BANQUE D'ÉVÉNEMENTS — agrégateur
   Le contenu vit dans src/data/events/*.js (par phase de carrière +
   clusters attributs + fils narratifs). Ce fichier ne fait que les
   rassembler et exposer l'API attendue par le reste du moteur
   (EVENTS, catTag, careerPhase) — inchangée pour season.js/screens.js.

   Métadonnées d'événement, en plus de cat/when/weight/choices :
   - phase: 'early'|'mid'|'late'|null — gate dur (null = toute phase)
   - once: true — au plus une fois par carrière
   - cooldown: N — saisons avant de redevenir pleinement probable
     après avoir été tiré (défaut 3, géré par drawEvents dans season.js)
============================================================ */
export const EVENTS = [
  ...EARLY_EVENTS,
  ...MID_EVENTS,
  ...LATE_EVENTS,
  ...ATTRIBUTE_EVENTS,
  ...THREAD_EVENTS,
  ...NBA_FLAVOR_EVENTS,
  ...WELLBEING_EVENTS,
  ...TRAITS_PAYOFF_EVENTS,
  ...SHARED_EVENTS,
];

export { careerPhase };

const CAT_TAG={injury:'🩹 Pépin physique',training:'🎯 Travail',form:'🧊 Méforme',system:'📋 Système',
  community:'❤️ Hors-terrain',rivalry:'🔥 Rivalité',leadership:'🧭 Leadership',pressure:'⏱️ Money-time',
  agentbiz:'💼 Business',personal:'🏠 Vie perso',twilight:'🌇 Vétéran',comeback:'💪 Retour',
  social:'📱 Réseaux',contract:'📝 Contrat',media:'🎤 Médias',business:'💼 Business',
  locker:'🚪 Vestiaire',nation:'🌍 Sélection',youth:'🌱 Jeunesse',lifestyle:'🌙 Hygiène de vie',nightlife:'🌙 Sortie',
  clutch:'🎯 Money-time',defense:'🛡️ Stop décisif',duel:'⚔️ Duel',finals:'🏆 Finale',presser:'🎤 Conférence',
  review:'🔍 Vidéo-arbitrage', morale:'🌧️ Moral en berne', fame:'🌟 Notoriété',
  payoff:'⭐ Aura',wakeup:'🌙 Coup de semonce',chem:'🤝 Vestiaire',
  allstar:'🌟 All-Star',modern:'📺 Débat ligue',superteam:'🌟 Super-groupe',homecoming:'🏠 Retour aux sources',interview:'🎤 Grand entretien'};

// Pictogrammes SVG faits maison pour les "grands moments" (action résolue par jet, enjeu réel) —
// remplacent l'emoji générique par une icône dessinée, cohérente avec l'identité du jeu
// (currentColor : hérite la couleur du chip). Portée volontairement limitée à ces 4 catégories
// pour cette première passe — à généraliser si le résultat convainc.
const SVG_ATTRS = `viewBox="0 0 24 24" width="13" height="13" style="vertical-align:-2px;margin-right:3px"`;
const CAT_ICON = {
  clutch:`<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><ellipse cx="12" cy="7" rx="8" ry="2.3"/><path d="M5.5 7.5 7 16M9 7.8 9.8 16M12 8 12 16M15 7.8 14.2 16M18.5 7.5 17 16"/></svg> Money-time`,
  defense:`<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21 12 11M12 11 7 4M12 11 17 4M9 7 15 7"/><circle cx="19" cy="6" r="2" fill="currentColor" stroke="none"/></svg> Stop décisif`,
  duel:`<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 19 9 9"/><path d="M21 19 15 9"/><circle cx="12" cy="6" r="2" fill="currentColor" stroke="none"/></svg> Duel`,
  finals:`<svg ${SVG_ATTRS} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4H17V8A5 5 0 0 1 7 8Z"/><path d="M7 5H3V7A4 4 0 0 0 7 10"/><path d="M17 5H21V7A4 4 0 0 1 17 10"/><path d="M12 13V17M9 20H15M9 20V18H15V20"/></svg> Finale`,
};
export function catTag(ev){ return CAT_ICON[ev.cat] || CAT_TAG[ev.cat] || (ev.tag?('📌 '+ev.tag):'📌 Événement'); }
