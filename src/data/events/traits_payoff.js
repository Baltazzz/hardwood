import { hasTrait } from '../../engine/tags.js';

/* ============================================================
   ÉVÉNEMENTS GATÉS SUR UN TRAIT ACTIF (voir engine/tags.js) — la
   version "influence certains choix et certaines situations" du
   système de traits, pas seulement un affichage passif. Utilise
   hasTrait(), pas le compteur de flag brut : un trait qui s'est
   estompé ou perdu (contredit par des choix suivants) ne rouvre
   plus ces situations, cohérent avec le reste du système.
============================================================ */
export const TRAITS_PAYOFF_EVENTS = [
  {id:'saver_investment_offer', cat:'agentbiz', phase:null, cooldown:5,
    when:(p,lg)=>hasTrait(p,'saver'),
    title:'Un fonds flaire ta réputation d\'épargnant',
    body:()=>`Ta réputation de joueur prudent avec son argent a fini par intéresser un fonds d'investissement local, qui te propose d'entrer au capital d'un projet.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Investir une part significative', hint:'Un pari qui tranche avec ta réputation',
        effect:()=>(Math.random()<0.6)?{money:+120}:{money:-40},
        outcome:'Le pari est engagé. Le temps dira si le flair du fonds était le bon.'},
      {label:'Rester sur des placements plus classiques', hint:'La prudence, encore et toujours',
        effect:{money:+20, coach:+1}, outcome:'Tu préfères la sécurité. Moins spectaculaire, jamais risqué.'}
    ]},

  {id:'bling_lifestyle_pressure', cat:'business', phase:null, cooldown:4,
    when:(p,lg)=>hasTrait(p,'bling'),
    title:'Le train de vie à tenir',
    body:()=>`L'image que tu dégages a un prix -- littéralement. Voitures, sorties, cadeaux : tout le monde s'attend à ce que tu continues sur le même rythme.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Continuer le train de vie, sans complexe', hint:'Assumer l\'image jusqu\'au bout',
        effect:{money:-50, popularity:+4}, outcome:'Tu ne changes rien. L\'image reste intacte, le compte en banque un peu moins.'},
      {label:'Freiner discrètement les dépenses', hint:'Souffler un peu, sans le crier sur les toits',
        effect:{money:+15, popularity:-2}, outcome:'Tu lèves un peu le pied, sans en faire une annonce. Personne ne le remarque, ou presque.'}
    ]},

  {id:'leader_captaincy_moment', cat:'leadership', phase:null, once:true,
    when:(p,lg)=>hasTrait(p,'leader') && (p.clubTenure||0)>=1,
    title:'Le brassard, pour de bon',
    body:()=>`Ce que tu incarnes déjà dans les faits, le club veut le rendre officiel : le coach veut faire de toi le capitaine formel du groupe.`,
    weight:()=>1.2,
    choices:()=>[
      {label:'Accepter le brassard', hint:'Porter le rôle jusqu\'au bout, officiellement',
        effect:{reputation:+5, coach:+5, morale:+3, flag:'leaderRep'}, outcome:'Le brassard est officiellement à ton bras. Un symbole, mais aussi une charge de plus.'},
      {label:'Décliner, rester un leader dans l\'ombre', hint:'Le rôle, sans le titre',
        effect:{qi:+2, morale:+2}, outcome:'Tu préfères continuer sans le titre. Le vestiaire sait très bien qui mène, brassard ou pas.'}
    ]},

  {id:'controversial_crisis_pr', cat:'presser', phase:null, cooldown:4,
    when:(p,lg)=>hasTrait(p,'controversial'),
    title:'Une nouvelle sortie qui enflamme la presse',
    body:()=>`Une déclaration, un geste, une story mal interprétée : le buzz autour de toi repart, encore. Le service com veut une réponse rapide.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Assumer frontalement, sans un mot de regret', hint:'Rester toi-même, quitte à jeter de l\'huile sur le feu',
        effect:()=>(Math.random()<0.5)?{popularity:+7, reputation:+2}:{reputation:-4, coach:-3},
        outcome:'Tu assumes sans reculer d\'un pouce. Selon les jours, ça passe ou ça casse.'},
      {label:'Publier un communiqué apaisant', hint:'Calmer le jeu, façon service de communication',
        effect:{coach:+3, popularity:-2, media:+2}, outcome:'Le communiqué calme un peu les choses. Sobre, efficace, pas franchement toi.'}
    ]},

  // ---- Lot d'extension (voir AGENDA.md, "étoffer les traits") : comble les deux traits qui
  // n'avaient encore AUCUN scénario dédié (Tête brûlée/Chouchou des médias -- nourris par de
  // nombreux événements, mais jamais "vécus" une fois actifs), et donne à Showman/Bosseur (traits
  // entièrement nouveaux) leur propre moment récurrent -- pas seulement le paiement final de
  // data/events/threads.js. ----
  {id:'hothead_incident', cat:'locker', phase:null, cooldown:4,
    when:(p,lg)=>hasTrait(p,'hothead'),
    title:'Encore un accrochage',
    body:()=>`Une nouvelle altercation sur le terrain fait parler après le match. Ta réputation de tempérament chaud te précède désormais, partout où tu joues.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Assumer, tu ne changeras pas', hint:'En faire une force plutôt qu\'un défaut',
        effect:()=>(Math.random()<0.5)?{popularity:+6, reputation:+2}:{coach:-4, reputation:-3},
        outcome:'Tu assumes, comme toujours. Selon les soirs, ton public adore ou le staff s\'arrache les cheveux.'},
      {label:'Travailler avec un préparateur mental', hint:'Apprendre à canaliser, sans perdre ce qui te fait jouer',
        effect:{coach:+4, qi:+2, morale:+2}, outcome:'Le travail commence à payer. Le tempérament est toujours là, mais mieux dirigé.'}
    ]},
  {id:'media_friend_deal', cat:'media', phase:null, cooldown:5,
    when:(p,lg)=>hasTrait(p,'mediaFriend'),
    title:'Une chaîne te propose une chronique régulière',
    body:()=>`Ton aisance avec la presse a été remarquée : une émission te propose une place récurrente, entre analyses et coulisses.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Accepter, devenir une vraie voix médiatique', hint:'Construire ta marque personnelle au-delà du terrain',
        effect:{popularity:+6, money:+30, media:+3}, outcome:'La chronique cartonne. Ton nom circule désormais bien au-delà des seuls résultats sportifs.'},
      {label:'Décliner, rester concentré sur le terrain', hint:'Le jeu d\'abord, le reste peut attendre',
        effect:{coach:+3, qi:+1}, outcome:'Tu déclines poliment. Le terrain reste ta seule vraie priorité.'}
    ]},
  {id:'showman_encore', cat:'social', phase:null, cooldown:4,
    when:(p,lg)=>hasTrait(p,'showman'),
    title:'Le public attend le prochain geste',
    body:()=>`À chaque match, une partie du public vient maintenant spécifiquement pour TON style. La pression du spectacle ne retombe jamais vraiment.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Livrer le spectacle, encore et encore', hint:'Ne jamais décevoir le public venu pour ça',
        effect:()=>(Math.random()<0.55)?{popularity:+6, morale:+3}:{coach:-2, perfBonus:-2},
        outcome:'Tu essaies de livrer, comme toujours. Ce soir-là, le geste passe ou casse.'},
      {label:'Rappeler que tu sais aussi juste bien jouer', hint:'Varier le registre, sans perdre l\'identité',
        effect:{qi:+2, coach:+2}, outcome:'Tu montres un visage plus complet. Le public s\'habitue à cette nouvelle facette.'}
    ]},
  {id:'workhorse_checkup', cat:'training', phase:null, cooldown:4,
    when:(p,lg)=>hasTrait(p,'workhorse'),
    title:'Le bilan physique de mi-saison',
    body:()=>`Le staff médical fait le point : ton éthique de travail est citée en exemple, mais la charge accumulée commence sérieusement à inquiéter.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Continuer sur le même rythme', hint:'La charge de travail comme identité, quel qu\'en soit le prix',
        effect:{coach:+3, fitness:-3}, outcome:'Tu ne changes rien. Le staff s\'incline devant ton éthique de travail, un peu inquiet quand même.'},
      {label:'Accepter un vrai programme de charge maîtrisée', hint:'Travailler intelligemment, pas seulement beaucoup',
        effect:{fitness:+4, qi:+1}, outcome:'Tu acceptes d\'encadrer ta charge de travail. Toujours aussi sérieux, un peu plus durable.'}
    ]},
];
