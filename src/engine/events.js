import { SHARED_EVENTS } from '../data/events/shared.js';
import { EARLY_EVENTS } from '../data/events/early.js';
import { MID_EVENTS } from '../data/events/mid.js';
import { LATE_EVENTS } from '../data/events/late.js';
import { ATTRIBUTE_EVENTS } from '../data/events/attributes.js';
import { THREAD_EVENTS } from '../data/events/threads.js';
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
  ...SHARED_EVENTS,
];

export { careerPhase };

const CAT_TAG={injury:'🩹 Pépin physique',training:'🎯 Travail',form:'🧊 Méforme',system:'📋 Système',
  community:'❤️ Hors-terrain',rivalry:'🔥 Rivalité',leadership:'🧭 Leadership',pressure:'⏱️ Money-time',
  agentbiz:'💼 Business',personal:'🏠 Vie perso',twilight:'🌇 Vétéran',comeback:'💪 Retour',
  social:'📱 Réseaux',contract:'📝 Contrat',media:'🎤 Médias',business:'💼 Business',
  locker:'🚪 Vestiaire',nation:'🌍 Sélection',youth:'🌱 Jeunesse',lifestyle:'🌙 Hygiène de vie',nightlife:'🌙 Sortie',
  clutch:'🎯 Money-time',defense:'🛡️ Stop décisif',duel:'⚔️ Duel',finals:'🏆 Finale',presser:'🎤 Conférence',
  payoff:'⭐ Aura',wakeup:'🌙 Coup de semonce',chem:'🤝 Vestiaire',
  allstar:'🌟 All-Star',modern:'📺 Débat ligue',superteam:'🌟 Super-groupe',homecoming:'🏠 Retour aux sources',interview:'🎤 Grand entretien'};
export function catTag(ev){ return CAT_TAG[ev.cat] || (ev.tag?('📌 '+ev.tag):'📌 Événement'); }
