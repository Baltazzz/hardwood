import { ovr, attrOf } from '../../engine/player.js';
import { actionRoll } from '../../engine/utils.js';

/* ============================================================
   FILS NARRATIFS — paiements débloqués par des choix passés
   (compteurs de flags posés par les événements des autres modules).
============================================================ */
export const THREAD_EVENTS = [
  {id:'clutch_payoff', cat:'payoff', once:true,
    when:(p,lg)=>((p.flags&&p.flags.clutchHero)||0)>=2 && lg.tier<=2,
    title:'Réputation de clutch',
    body:()=>`À force de briller dans les money-times, tu es devenu LE joueur à qui l'on confie les ballons chauds. Cette aura, ça se cultive.`,
    weight:()=>1.2,
    choices:()=>[
      {label:'J\'embrasse ce rôle de clutch player', hint:'Endosser durablement cette aura',
        effect:{reputation:+5, perfBonus:+5, morale:+4, clutch:+1}, outcome:'Tu deviens le patron des fins de match. Les adversaires te craignent quand le chrono tourne.'},
      {label:'Je relativise, un match reste collectif', hint:'Renvoyer le mérite au collectif',
        effect:{coach:+4, qi:+2}, outcome:'Tu renvoies vers le groupe. Le vestiaire apprécie ton humilité.'}
    ]},

  {id:'night_wakeup', cat:'wakeup', once:true,
    when:(p,lg)=>((p.flags&&p.flags.nightOwl)||0)>=2,
    title:'Le coup de semonce',
    body:()=>`Tes sorties répétées ont fini par se voir : le staff te convoque, un article insinue des choses. Un tournant. Comment réagis-tu ?`,
    weight:()=>1.3,
    choices:({p})=>[
      {label:'Je me reprends en main, à fond', hint:'Le sursaut, pour rassurer tout le monde',
        effect:{fitness:+8, coach:+4, riskUp:-0.4, reputation:+2, flag:'reformed'}, outcome:'Tu remets la machine d\'aplomb. Le staff retrouve confiance, ton corps aussi.'},
      {label:'Je continue à vivre comme je l\'entends', hint:'Assumer ta manière de vivre, quoi qu\'il en coûte',
        effect:()=> (Math.random()<0.3) ? {popularity:+8, reputation:-4, riskUp:+0.3} : {popularity:+5, morale:+3, riskUp:+0.2},
        outcome:'Tu restes toi-même. La suite dira si c\'était un pari gagnant.'}
    ]},

  {id:'bust_redemption', cat:'payoff', phase:'mid', once:true,
    when:(p,lg)=>((p.flags&&p.flags.bust)||0)>=1 && ovr(p)>=lg.starter+3,
    title:'Faire taire l\'étiquette',
    body:()=>`Le mot qui te collait à la peau depuis tes débuts sonne de plus en plus faux au vu de tes dernières saisons. Certains commencent même à parler de "renaissance". Le récit peut basculer.`,
    weight:()=>1.2,
    choices:()=>[
      {label:'Répondre publiquement à ceux qui doutaient', hint:'Le règlement de comptes assumé',
        effect:{reputation:+6, popularity:+5, media:+2}, outcome:'Tu savoures publiquement ce retournement. Le récit autour de toi change pour de bon.'},
      {label:'Laisser les stats parler pour toi', hint:'Les actes, sans un mot',
        effect:{coach:+5, qi:+2, reputation:+3}, outcome:'Tu ne dis rien, tu laisses le terrain répondre. La reconnaissance vient quand même.'}
    ]},

  {id:'superteam_echo', cat:'interview', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.ringChaser)||0)>=1,
    title:'Le choix du super-groupe, des années après',
    body:()=>`En fin de carrière, on te repose la question du jour où tu as rejoint un collectif déjà taillé pour gagner. Le temps a-t-il changé ton regard sur ce choix ?`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Assumer pleinement, bagues à l\'appui', hint:'Le résultat justifie le choix',
        effect:{reputation:+4, popularity:+3, morale:+3}, outcome:'Tu n\'as aucun regret. Les titres parlent d\'eux-mêmes.'},
      {label:'Reconnaître le prix payé en aura personnelle', hint:'La nuance, avec le recul',
        effect:{coach:+3, qi:+2}, outcome:'Tu admets la nuance avec le recul. Une honnêteté qui te grandit.'}
    ]},

  {id:'loyalty_echo', cat:'interview', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.loyalOne)||0)>=2,
    title:'La fidélité, saluée par tous',
    body:()=>`Tu as choisi, encore et encore, de rester plutôt que de courir après un projet plus brillant ailleurs. En fin de carrière, cette fidélité devient une part entière de ton histoire.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'En faire le cœur de ton discours d\'adieu', hint:'Mettre la loyauté au centre de ton histoire',
        effect:{popularity:+7, reputation:+3, morale:+4}, outcome:'Ton discours d\'adieu marque les esprits. La fidélité, ça compte encore.'},
      {label:'Rester discret sur le sujet', hint:'Laisser ce choix parler de lui-même',
        effect:{coach:+3, morale:+2}, outcome:'Tu n\'en fais pas des tonnes. Ceux qui savent, savent.'}
    ]},

  {id:'bench_fighter_breakout', cat:'payoff', phase:'mid', once:true,
    when:(p,lg)=>((p.flags&&p.flags.benchFighter)||0)>=2 && ovr(p)>=lg.starter-2,
    title:'La percée après la lutte',
    body:()=>`Après des saisons à te battre pour des miettes de temps de jeu, le coach n'a plus le choix : tes prestations forcent enfin la porte du cinq de départ.`,
    weight:()=>1.3,
    choices:()=>[
      {label:'Savourer et hausser encore le niveau', hint:'Confirmer, pour ne plus jamais redescendre',
        effect:{reputation:+5, morale:+6, perfBonus:+4}, outcome:'Tu places la barre encore plus haut. Impossible de te renvoyer sur le banc maintenant.'},
      {label:'Rester humble, comme aux jours difficiles', hint:'Garder l\'humilité qui t\'a porté jusque-là',
        effect:{coach:+5, qi:+2}, outcome:'Tu gardes les pieds sur terre. Le vestiaire respecte ton parcours.'}
    ]},

  {id:'image_rehab', cat:'payoff', once:true,
    when:(p,lg)=>((p.flags&&p.flags.controversial)||0)>=2,
    title:'Reprendre le contrôle de ton image',
    body:()=>`Les polémiques à répétition ont fini par coller une étiquette à ton nom. Un conseiller en communication te propose un plan pour reprendre la main sur ton récit public.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Suivre le plan de communication à la lettre', hint:'Le travail d\'image, méthodique',
        effect:{media:+5, popularity:+4, reputation:+3}, outcome:'L\'image se redresse petit à petit. Le récit autour de toi s\'apaise.'},
      {label:'Laisser le temps et le jeu faire le travail', hint:'Laisser le terrain parler, sans artifice',
        effect:{coach:+4, qi:+2}, outcome:'Tu ne changes rien à ta manière d\'être. Ça finit par se tasser, à ton rythme.'}
    ]},

  {id:'mentor_legacy_teaser', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.mentorLegacy)||0)>=2,
    title:'Et après le terrain ?',
    body:()=>`Tu as passé une bonne partie de ta carrière à transmettre à plus jeune que toi. Un dirigeant te glisse, mi-sérieux, que le coaching ou un rôle dans le front office t'attend le jour venu.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Se projeter ouvertement vers le coaching', hint:'Se projeter dès maintenant vers l\'après',
        effect:{qi:+3, coach:+4, morale:+3}, outcome:'Tu commences à te voir de l\'autre côté de la ligne de touche. L\'idée fait son chemin.'},
      {label:'Rester concentré sur ta dernière ligne droite de joueur', hint:'L\'après attendra',
        effect:{morale:+2, perfBonus:+2}, outcome:'Tu repousses la question à plus tard. Une chose à la fois.'}
    ]},

  {id:'injury_prone_crossroads', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.injuryProne)||0)>=2,
    title:'Le corps qui commence à lâcher',
    body:()=>`Les blessures se sont accumulées au fil des saisons. Le staff médical est franc avec toi : continuer à ce rythme comporte un vrai risque. La décision t'appartient.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Adapter ton jeu pour préserver ton corps', hint:'S\'adapter, pour durer encore un peu',
        effect:{fitness:+10, qi:+2, perfBonus:-2}, outcome:'Tu rabotes ton jeu pour épargner ton corps. Moins spectaculaire, mais plus durable.'},
      {label:'Continuer comme si de rien n\'était', hint:'Refuser de changer, quel qu\'en soit le prix',
        effect:{perfBonus:+3, riskUp:+0.25}, outcome:'Tu refuses de changer ta manière de jouer. Le corps encaisse, pour l\'instant.'}
    ]},

  {id:'rivalry_closure', cat:'rivalry', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.rival)||0)>=3,
    title:'La dernière confrontation',
    body:()=>`Après des années de duels, cette rencontre a toutes les allures d'une dernière fois face à ton grand rival de toujours. Le respect a fini par dépasser l'animosité des débuts.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Lui rendre hommage publiquement avant le match', hint:'Le respect affiché, avant le dernier duel',
        effect:{popularity:+6, reputation:+3, morale:+4}, outcome:'Le geste marque les esprits. Une rivalité qui se termine en respect mutuel.'},
      {label:'Rester dans la compétition jusqu\'au bout, sans sentiment', hint:'La rivalité jusqu\'au bout, sans concession',
        effect:{perfBonus:+4, clutch:+1}, outcome:'Tu ne lâches rien jusqu\'à la dernière seconde. La rivalité reste entière.'}
    ]},

  {id:'lockdown_legacy', cat:'payoff', phase:'mid', once:true,
    when:(p,lg)=>((p.flags&&p.flags.lockdown)||0)>=2 && lg.tier<=2,
    title:'Ta réputation de verrou défensif',
    body:()=>`Les attaquants adverses préparent désormais des plans spécifiques rien que pour contourner ta défense. Ce genre de réputation ne se construit pas en un match.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'En faire ton identité de carrière', hint:'Embrasser durablement ce statut de référence défensive',
        effect:{reputation:+5, coach:+4, def:+1}, outcome:'Tu deviens la référence défensive de la ligue. Les gameplans adverses te citent nommément.'},
      {label:'Rappeler que tu sais aussi scorer', hint:'Refuser d\'être réduit à un seul registre',
        effect:{tir:+1, popularity:+3}, outcome:'Tu rappelles que ton jeu ne se limite pas à la défense. Un registre plus complet, assumé.'}
    ]},

  {id:'finals_pedigree', cat:'interview', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.finalsHero)||0)>=1,
    title:'Le joueur des grands soirs',
    body:()=>`Ton nom revient systématiquement dès qu'on évoque les joueurs qui répondent présent quand le titre est en jeu. Une réputation forgée dans les moments qui comptent le plus.`,
    weight:()=>0.85,
    choices:()=>[
      {label:'Revendiquer fièrement ce statut', hint:'Assumer pleinement l\'étiquette de joueur des grands soirs',
        effect:{reputation:+5, popularity:+4, morale:+3}, outcome:'Tu revendiques ce statut sans fausse modestie. Les faits te donnent raison.'},
      {label:'Rappeler que ce sont des victoires collectives', hint:'Partager le mérite avec le collectif',
        effect:{coach:+4, qi:+2}, outcome:'Tu renvoies systématiquement vers le collectif. L\'humilité, même au sommet.'}
    ]},

  {id:'reformed_confirmed', cat:'wakeup', phase:'mid', once:true,
    when:(p,lg)=>((p.flags&&p.flags.reformed)||0)>=1 && (p.clubTenure||0)>=1,
    title:'La page tournée, pour de bon',
    body:()=>`Depuis ton sursaut d'il y a quelques saisons, plus le moindre écart. Le staff et les médias le remarquent : le virage pris ce jour-là a tenu dans la durée.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'En parler ouvertement comme un tournant de carrière', hint:'Assumer publiquement ce chapitre de ton histoire',
        effect:{reputation:+4, popularity:+3, media:+2}, outcome:'Tu assumes ce chapitre de ton histoire sans le cacher. Ça résonne chez d\'autres joueurs.'},
      {label:'Préférer laisser cette période derrière toi, sans en reparler', hint:'Tourner la page sans revenir dessus',
        effect:{coach:+3, morale:+2}, outcome:'Tu préfères ne pas rouvrir ce chapitre. Les actes, depuis, parlent assez d\'eux-mêmes.'}
    ]},

  {id:'clutch_redemption_arc', cat:'payoff', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.clutchChoker)||0)>=2,
    title:'Le récit qu\'on te colle à la peau',
    body:()=>`Les commentateurs ont un mot pour les joueurs qui craquent dans ces moments-là, et ce n'est jamais un compliment. Une dernière balle de match avant la fin de carrière : l'occasion de changer le récit, ou de le confirmer pour de bon.`,
    weight:()=>1.2,
    choices:({p})=>[
      {label:'Redemander le ballon, comme toujours', hint:'Refuser de fuir la pression, une dernière fois',
        effect:(ctx)=>{ const shot=Math.round((attrOf(p,'tir')+attrOf(p,'adr3'))/2); const ok=actionRoll(shot,68); ctx.ok=ok;
          return ok?{reputation:+10,popularity:+9,morale:+10,clutch:+2,flag:'clutchHero'}:{reputation:-4,morale:-6}; },
        outcome:(ctx)=> ctx.ok?'Le mot "pas clutch" disparaît des articles à ton sujet, comme par magie. Une dernière image qui efface toutes les autres.':'Le récit continue de te coller à la peau. Tant pis : l\'histoire n\'aime pas toujours offrir de rachat.'},
      {label:'Passer la main à un coéquipier plus en confiance', hint:'Le collectif, plutôt que le pari personnel',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),56); ctx.ok=ok; return ok?{reputation:+4,coach:+6,morale:+4}:{coach:+2,morale:-1}; },
        outcome:(ctx)=> ctx.ok?'Tu ne rentres pas dans l\'histoire par la grande porte, mais l\'équipe gagne. Ça aussi, ça compte.':'Le collectif ne trouve pas la solution non plus ce soir-là. Au moins, tu n\'auras pas porté ça seul.'}
    ]},

  {id:'clutch_legend_status', cat:'payoff', phase:'late', once:true,
    when:(p,lg)=>((p.flags&&p.flags.clutchHero)||0)>=4,
    title:'Le statut de légende du money-time',
    body:()=>`Au fil des saisons, ton nom est devenu synonyme de fin de match décisive. Ce n'est plus une réputation naissante : c'est désormais gravé dans ton histoire.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Savourer pleinement ce statut construit sur des années', hint:'Reconnaître le chemin parcouru vers ce statut',
        effect:{reputation:+6, popularity:+5, morale:+4}, outcome:'Tu savoures un statut construit sur des années de sang-froid. Peu de joueurs peuvent en dire autant.'},
      {label:'Continuer comme si de rien n\'était', hint:'Rester le même, malgré le statut acquis',
        effect:{coach:+4, perfBonus:+3}, outcome:'Tu ne changes rien à ton approche. Le statut est là, mais l\'humilité aussi.'}
    ]},
];
