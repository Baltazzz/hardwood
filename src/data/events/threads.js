import { ovr } from '../../engine/player.js';

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
];
