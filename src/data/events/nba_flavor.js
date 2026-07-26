import { attrOf } from '../../engine/player.js';
import { actionRoll, clamp } from '../../engine/utils.js';
import { clutchWeight } from './_helpers.js';

/* ============================================================
   RÉFÉRENCES ET HUMOUR NBA — moments savoureux inspirés de vrais
   instants de basket (buzzer-beater du milieu de terrain, tir qui
   n'en finit pas de tourner sur l'arceau, vérification vidéo,
   réputation de "pas clutch" qui peut se retourner), mais TOUJOURS
   en situations génériques : jamais de scénario négatif attribué à
   un vrai joueur/club nommé. Les vrais noms (voir data/legends.js)
   restent réservés aux comparaisons/inspirations positives ailleurs
   dans le jeu, jamais convoqués ici pour un quiproquo ou un échec.
   Générique = disponible à toute phase de carrière (gate naturel par
   réputation/palier, comme les events clutch de base), sauf le fil
   de rédemption tardive ci-dessous, volontairement réservé à la fin
   de carrière.
============================================================ */
export const NBA_FLAVOR_EVENTS = [
  {id:'halfcourt_prayer', cat:'clutch', phase:null, cooldown:4,
    when:(p,lg)=>p.reputation>=22 && lg.tier<=3,
    title:'La prière du milieu de terrain',
    body:()=>`Il reste une poignée de dixièmes de seconde, ballon en main bien après la ligne médiane. Statistiquement, ça ne rentre presque jamais. Tu la tentes quand même ?`,
    weight:()=>0.35,
    choices:({p})=>[
      {label:'Lâcher la prière depuis le milieu de terrain', hint:'Un geste que personne ne t\'en voudra de manquer',
        effect:(ctx)=>{ const shot=Math.round((attrOf(p,'tir')+attrOf(p,'adr3'))/2); const ok=Math.random()<clamp(0.04+shot*0.0016,0.03,0.16); ctx.ok=ok;
          return ok?{reputation:+9,morale:+8,popularity:+12,media:+4,clutch:+1,flag:'clutchHero'}:{reputation:+1,popularity:+2}; },
        outcome:(ctx)=> ctx.ok?'Le ballon traverse la moitié du terrain, touche l\'arceau... et rentre. Le banc explose, personne n\'y croyait, toi non plus.':'Air ball monumental, la salle rit gentiment. Ça fera un bon clip quand même, pour de mauvaises raisons.'},
      {label:'Se contenter d\'un tir plus raisonnable', hint:'La prudence, plutôt que le geste fou',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'adr3'),64); ctx.ok=ok; return ok?{reputation:+3,coach:+2,morale:+2}:{morale:-1}; },
        outcome:(ctx)=> ctx.ok?'Tu préfères un tir plus sage, plus près. Il rentre, personne n\'en parlera demain, mais deux points sont deux points.':'Le tir plus raisonnable ne rentre pas non plus. Au moins, personne ne peut dire que tu as forcé.'}
    ]},

  {id:'rim_rattle_putback', cat:'clutch', phase:null, cooldown:3,
    when:(p,lg)=>p.reputation>=26 && lg.tier<=3,
    title:'Le rebond qui ne pardonne pas',
    body:()=>`Ton tir de la gagne tourne autour de l'arceau, hésite, tourne encore... et ressort. Tu es le premier sur le ballon, une fraction de seconde pour la remise. La salle a le cœur qui s'arrête.`,
    weight:clutchWeight(0.8),
    choices:({p})=>[
      {label:'Je remets dedans, instinctivement', hint:'Le réflexe, sans réfléchir',
        effect:(ctx)=>{ const shot=Math.round((attrOf(p,'ath')+attrOf(p,'tir'))/2); const ok=actionRoll(shot,72); ctx.ok=ok;
          return ok?{reputation:+7,morale:+8,popularity:+5,clutch:+1,flag:'clutchHero'}:{reputation:-3,morale:-5,flag:'clutchChoker'}; },
        outcome:(ctx)=> ctx.ok?'Cette fois l\'arceau se décide pour toi : dedans ! Le ballon a mis un temps fou à choisir son camp.':'Le ballon, décidément indécis, ressort une deuxième fois. Même l\'arceau semble s\'excuser.'},
      {label:'Je ressors le ballon pour repartir une action propre', hint:'La sécurité, plutôt que l\'instinct',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok; return ok?{reputation:+3,coach:+4,morale:+3}:{coach:+1,morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Tu ressors intelligemment, l\'action repart proprement, le panier tombe l\'instant d\'après.':'Le temps manque pour repartir une vraie action. La sirène retentit, sans faute individuelle à te reprocher.'}
    ]},

  {id:'replay_review_drama', cat:'review', phase:null, cooldown:3,
    when:(p,lg)=>p.reputation>=30 && lg.tier<=3,
    title:'Le tir litigieux',
    body:()=>`Ton tir tombe dedans au buzzer... mais l'arbitre siffle une vérification vidéo. Le geste était-il parti avant la sirène ? Toute la salle fixe l'écran géant, suspendue à la décision.`,
    weight:()=>0.45,
    choices:()=>[
      {label:'Rester stoïque devant l\'écran géant', hint:'Attendre la décision sans rien montrer',
        effect:()=>(Math.random()<0.5)?{reputation:+7,popularity:+6,morale:+6,clutch:+1,flag:'clutchHero'}:{reputation:-2,morale:-4,popularity:+2},
        outcome:'La salle entière retient son souffle devant les images au ralenti. Verdict sans appel, dans un sens ou dans l\'autre.'},
      {label:'Déjà célébrer avant la décision', hint:'Un pari sur ton instinct de showman',
        effect:()=>(Math.random()<0.42)?{reputation:+9,popularity:+11,morale:+8,flag:['clutchHero','hothead']}:{reputation:-5,popularity:-2,morale:-6,flag:['clutchChoker','hothead']},
        outcome:'Tu avais déjà les bras levés avant même la vérification. Le clip devient culte, pour la bonne ou la mauvaise raison.'}
    ]},
];
