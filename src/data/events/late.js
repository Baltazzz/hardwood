import { ovr } from '../../engine/player.js';

/* ============================================================
   PHASE FIN DE CARRIÈRE — gestion du corps, baisse physique,
   transmission, rôle de vétéran, dernier contrat, tournée
   d'adieux, retraite.
============================================================ */
export const LATE_EVENTS = [
  {id:'veteran_role', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>true,
    title:'Le rôle de vétéran',
    body:`Les jambes répondent moins, mais ton expérience vaut de l'or. Le club te voit désormais en guide pour les jeunes.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Accepter un rôle de mentor', hint:'Transmettre plutôt que jouer les prolongations',
        effect:{coach:+4, reputation:+2, qi:+1, flag:'mentorLegacy'}, outcome:'Tu transmets ce que tu sais. Le vestiaire te vénère.'},
      {label:'Refuser de lâcher ta place de titulaire', hint:'La fierté du titulaire, quitte à créer de la friction',
        effect:{perfBonus:+3, coach:-3, morale:+2}, outcome:'Tu veux encore ton temps de jeu. Le bras de fer commence.'}
    ]},

  {id:'load_mgmt', cat:'modern', phase:'late', cooldown:2,
    when:(p,lg)=>lg.tier<=2,
    title:'Souffler ou jouer à tout prix ?',
    body:()=>`<i>(Le médecin te tend une feuille, le coach attend ta réponse.)</i> Le calendrier est infernal et tes jambes accusent le coup. La ligue débat sans fin du "load management". Et toi ?`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Lever le pied pour être frais en playoffs', hint:'La gestion, quitte à faire grincer les fans',
        effect:{fitness:+10, popularity:-3, coach:+2}, outcome:'Tu te préserves par intelligence. Les fans râlent, ton corps respire.'},
      {label:'Jouer chaque match pour le maillot', hint:'Le maillot avant le corps',
        effect:{reputation:+4, riskUp:+0.2, fitness:-4, flag:'injuryProne'}, outcome:'Tu réponds présent coûte que coûte. Les puristes adorent, tes genoux moins.'}
    ]},

  {id:'legacy_interview', cat:'interview', phase:'late', once:true,
    when:(p,lg)=>p.reputation>=50,
    title:'Grand entretien : ton héritage',
    body:()=>`<i>(Studio tamisé, une seule caméra, le journaliste se penche vers toi.)</i> « Comment aimeriez-vous qu'on se souvienne de vous ? » La question te cueille. Que réponds-tu ?`,
    weight:()=>0.65,
    choices:()=>[
      {label:'« Comme un compétiteur qui n\'a rien lâché »', hint:'L\'image du compétiteur pur',
        effect:{reputation:+4, coach:+2, media:+2}, outcome:'Réponse sincère et fédératrice. Le clip tourne, en bien cette fois.'},
      {label:'« Comme quelqu\'un qui a fait rêver les gens »', hint:'L\'image tournée vers le public',
        effect:{popularity:+6, media:+2}, outcome:'Tu joues la carte de l\'émotion. Le public adore.'}
    ]},

  {id:'body_management', cat:'twilight', phase:'late', cooldown:2,
    when:(p,lg)=>true,
    title:'Le corps qui réclame plus d\'entretien',
    body:()=>`<i>(Salle de kiné vide, glace et bandages étalés sur la table.)</i> Chaque saison demande désormais plus de soin qu\'avant pour tenir le même niveau. Comment tu investis ton temps libre ?`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Investir massivement dans la récupération', hint:'Le corps avant tout, quitte à sacrifier autre chose',
        effect:{fitness:+9, money:-40}, outcome:'Kiné, cryothérapie, sommeil surveillé. Le corps répond, à prix d\'or.'},
      {label:'Faire avec les moyens du bord', hint:'Faire confiance à l\'expérience plutôt qu\'au protocole',
        effect:{qi:+2, fitness:+2}, outcome:'Tu gères avec ton expérience plutôt qu\'avec un protocole dernier cri.'}
    ]},

  {id:'last_contract', cat:'contract', phase:'late', once:true,
    when:(p,lg)=>p.contractY<=1,
    title:'Le dernier grand contrat',
    body:()=>`<i>(Ton agent pose deux offres sur la table : l\'une modeste et proche de chez toi, l\'autre lointaine mais mieux payée.)</i> Ce contrat sera probablement ton dernier. Qu\'est-ce qui compte le plus, maintenant ?`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Signer là où tu as le plus de chances de gagner', hint:'La quête du titre, jusqu\'au bout',
        effect:{forceMove:{type:'transfer'}, reputation:+3, morale:+3}, outcome:'Tu choisis le projet le plus compétitif pour la dernière ligne droite.'},
      {label:'Rester dans un club et une ville qui te sont chers', hint:'L\'attachement plutôt que le calcul',
        effect:{morale:+6, popularity:+4, coach:+3, flag:'loyalOne'}, outcome:'Tu choisis le cœur. Les tiens t\'en seront reconnaissants.'}
    ]},

  {id:'farewell_tour', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>p.age>=35 && p.reputation>=45,
    title:'La tournée d\'adieux',
    body:()=>`<i>(Chaque salle visitée te réserve un tribut, une standing ovation, un cadeau symbolique.)</i> Le monde du basket sait que la fin approche. Chaque déplacement devient un hommage.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Savourer chaque instant, à fond', hint:'Vivre la tournée pleinement',
        effect:{morale:+8, popularity:+6, media:+2}, outcome:'Tu profites de chaque ovation. Une fin de carrière à la hauteur de ce que tu as donné.'},
      {label:'Rester concentré sur la compétition jusqu\'au bout', hint:'La performance avant les honneurs',
        effect:{perfBonus:+4, coach:+3}, outcome:'Tu détournes le regard des hommages pour rester focus sur le jeu.'}
    ]},

  {id:'retirement_decision', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>p.age>=36,
    title:'La question qui approche',
    body:()=>`<i>(Un soir tranquille, seul avec toi-même, le corps qui parle plus fort que d'habitude.)</i> La question de l'après commence à s'installer. Rejouer une saison de plus, ou commencer à préparer la suite ?`,
    weight:()=>0.85,
    choices:()=>[
      {label:'Te projeter déjà sur l\'après-carrière', hint:'Préparer la suite en parallèle',
        effect:{qi:+2, morale:+3}, outcome:'Tu poses les premiers jalons de ta reconversion. L\'esprit plus léger sur le terrain.'},
      {label:'Repousser la question, jouer au présent', hint:'Vivre l\'instant, sans se projeter',
        effect:{morale:+2, perfBonus:+2}, outcome:'Tu chasses la question de ta tête. Une saison à la fois.'}
    ]},
];
