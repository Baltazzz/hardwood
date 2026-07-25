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

  {id:'jersey_retirement_offer', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>p.age>=34 && p.reputation>=60 && (p.clubTenure||0)>=3,
    title:'Le club veut retirer ton numéro',
    body:()=>`<i>(Le président du club te reçoit en personne, dossier symbolique sous le bras.)</i> Le club t'annonce vouloir retirer ton numéro sous les combles de la salle, plus tard, une fois ta carrière terminée. Un honneur rare, qu'on t'annonce de ton vivant.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Accepter, ému', hint:'Recevoir l\'honneur pleinement',
        effect:{morale:+8, popularity:+6, reputation:+3}, outcome:'Tu acceptes, la gorge nouée. Ton nom vivra dans cette salle bien après toi.'},
      {label:'Demander que la cérémonie attende la vraie fin', hint:'Préférer que l\'honneur vienne plus tard, en toute fin',
        effect:{coach:+3, morale:+3}, outcome:'Tu préfères que ce moment attende ta dernière saison. Le club respecte ta demande.'}
    ]},

  {id:'assistant_coach_offer', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>p.age>=35 && p.coach>=65,
    title:'Le club te propose déjà un rôle d\'après-carrière',
    body:()=>`<i>(Réunion avec la direction sportive, dossier de reconversion sur la table.)</i> Le club t'imagine bien rester dans la structure une fois les crampons raccrochés : assistant-coach, ou un rôle au sein du front office.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Accepter le principe, y réfléchir sérieusement', hint:'Se projeter concrètement dans ce futur rôle',
        effect:{qi:+3, coach:+4, morale:+3}, outcome:'Tu acceptes d\'y réfléchir sérieusement. Une suite logique commence à se dessiner.'},
      {label:'Rester focalisé sur les saisons qui restent', hint:'L\'après attendra encore un peu',
        effect:{perfBonus:+2, morale:+1}, outcome:'Tu remets la discussion à plus tard. Il te reste du basket à jouer.'}
    ]},

  {id:'inspired_rookie', cat:'media', phase:'late', once:true,
    when:(p,lg)=>p.reputation>=55 && p.seasons.length>=6,
    title:'Un jeune cite ton nom comme inspiration',
    body:()=>`<i>(Interview d'un rookie prometteur, micro tendu après un match.)</i> Une jeune pousse de la ligue, interrogée sur ses inspirations, cite ton nom sans hésiter. Le genre de moment qui rappelle le chemin parcouru.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Prendre contact avec lui personnellement', hint:'Transmettre directement, au-delà des mots publics',
        effect:{reputation:+4, morale:+5, flag:'mentorLegacy'}, outcome:'Un message, un échange de numéros. La transmission continue, en dehors des caméras.'},
      {label:'Accueillir le compliment avec humilité, de loin', hint:'Rester touché, sans en faire plus',
        effect:{popularity:+4, morale:+3}, outcome:'Tu es touché, simplement. Voir son propre parcours inspirer quelqu\'un d\'autre a un goût particulier.'}
    ]},

  {id:'one_more_shot_trade', cat:'contract', phase:'late', once:true,
    when:(p,lg)=>p.age>=33 && lg.tier<=2 && (p.clubTenure||0)>=2 && !Object.keys(p.accolades||{}).some(k=>k.startsWith('Champion')),
    title:'Une dernière vraie chance de titre',
    body:()=>`<i>(Ton agent t'appelle, sérieux.)</i> Un club taillé pour gagner cette année te propose de le rejoindre. Le temps presse : à ton âge, les fenêtres pour un titre se comptent sur les doigts d'une main.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Demander ce transfert sans hésiter', hint:'Le titre avant tout, quitte à tout bousculer',
        effect:{forceMove:{type:'transfer'}, reputation:+2, morale:+5, flag:'ringChaser'}, outcome:'Tu forces la porte vers ce dernier vrai coup. Le temps presse, tu le sais.'},
      {label:'Rester fidèle à ton club actuel', hint:'La loyauté, même sans garantie de titre',
        effect:{coach:+6, popularity:+5, morale:+3, flag:'loyalOne'}, outcome:'Tu choisis de rester. Le titre attendra, ou n\'arrivera jamais : ce sera avec les tiens.'}
    ]},

  {id:'declining_minutes', cat:'twilight', phase:'late', cooldown:2,
    when:(p,lg)=>true,
    title:'Les minutes qui s\'amenuisent',
    body:()=>`<i>(Le plan de jeu affiché au vestiaire, ton nom un peu plus bas que la saison passée.)</i> Ton temps de jeu diminue saison après saison. Une réalité que tout vétéran finit par affronter, à sa manière.`,
    weight:()=>0.85,
    choices:()=>[
      {label:'Accepter le rôle réduit avec grâce', hint:'Faire la paix avec un rôle qui rétrécit',
        effect:{coach:+5, morale:+3, qi:+1}, outcome:'Tu acceptes ce nouveau rôle sans amertume. Le vestiaire respecte la manière.'},
      {label:'Te battre pour chaque minute, comme avant', hint:'Refuser de lâcher, quel qu\'en soit le prix',
        effect:{perfBonus:+3, coach:-2, fitness:-3}, outcome:'Tu te bats pour chaque minute comme si de rien n\'était. Le corps proteste un peu plus fort chaque semaine.'}
    ]},

  {id:'role_transformation', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>p.age>=33,
    title:'Réinventer ton jeu pour durer',
    body:()=>`<i>(Séance vidéo avec le staff, chiffres à l'appui.)</i> Ton explosivité d'avant n'est plus au rendez-vous, mais ton expérience de jeu vaut de l'or. Le staff te propose de repenser ton rôle en profondeur pour prolonger ta carrière.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Devenir un role player intelligent et fiable', hint:'Se réinventer, pour durer plus longtemps',
        effect:{qi:+4, def:+2, fitness:+4}, outcome:'Tu te réinventes en pièce fiable du collectif. Une nouvelle carrière dans la carrière.'},
      {label:'Continuer à jouer comme au sommet, coûte que coûte', hint:'Refuser de changer ce qui a fait ta réussite',
        effect:{perfBonus:+3, fitness:-5, riskUp:+0.15}, outcome:'Tu refuses de changer ta manière de jouer. Le corps, lui, note chaque saison passée en plus.'}
    ]},

  {id:'legacy_media_project', cat:'media', phase:'late', once:true,
    when:(p,lg)=>p.reputation>=55 && p.seasons.length>=7,
    title:'Un projet pour raconter ta carrière',
    body:()=>`<i>(Une équipe de production te propose un rendez-vous, caméra et micro déjà sur la table.)</i> Un documentaire, ou une série d'entretiens approfondis, pour raconter ta trajectoire. L'occasion de reprendre le contrôle de ton propre récit.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Te livrer sans filtre', hint:'Tout raconter, y compris les zones d\'ombre',
        effect:{popularity:+7, media:+3, reputation:+2}, outcome:'Tu te livres sans filtre, zones d\'ombre comprises. Le public découvre un visage plus complet.'},
      {label:'Garder le contrôle du récit, rester mesuré', hint:'Raconter, mais en gardant la main',
        effect:{coach:+3, media:+2}, outcome:'Tu racontes ta carrière avec mesure, en gardant la main sur ce qui se dit.'}
    ]},

  {id:'last_home_game', cat:'twilight', phase:'late', once:true,
    when:(p,lg)=>p.age>=37 && p.reputation>=40,
    title:'Le dernier match dans ta salle',
    body:()=>`<i>(La salle est pleine bien avant l'échauffement, des banderoles avec ton nom un peu partout dans les tribunes.)</i> Tout le monde sait que c'est sans doute ton dernier match à domicile. L'ambiance a des allures de fête.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Prendre le micro pour remercier le public', hint:'Le mot d\'adieu, face à la foule',
        effect:{popularity:+8, morale:+6, media:+2}, outcome:'Tu prends le micro, la voix tremblante. La salle entière est debout.'},
      {label:'Laisser parler uniquement le match', hint:'Le geste plutôt que les mots',
        effect:{perfBonus:+4, coach:+2}, outcome:'Tu laisses ton jeu parler une dernière fois dans cette salle. Un adieu tout en pudeur.'}
    ]},

  {id:'rival_coaching_offer', cat:'contract', phase:'late', once:true,
    when:(p,lg)=>p.age>=35 && p.coach>=55 && (p.clubTenure||0)>=2,
    title:'Une autre franchise te propose déjà un rôle d\'entraîneur-joueur',
    body:()=>`<i>(Coup de fil discret d'un dirigeant rival, presque gêné de débaucher un joueur encore actif.)</i> Un club concurrent t'imagine bien terminer ta carrière chez eux avec, en prime, un rôle d'entraîneur-joueur dès la saison prochaine.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Écouter sérieusement cette offre extérieure', hint:'Une opportunité rare, même venue d\'un rival',
        effect:{money:+50, reputation:+2, coach:-2}, outcome:'Tu écoutes sérieusement. Ton club actuel n\'apprécie pas franchement la démarche.'},
      {label:'Rester loyal à ton club actuel', hint:'Refuser par principe, malgré l\'offre alléchante',
        effect:{coach:+5, popularity:+4, flag:'loyalOne'}, outcome:'Tu refuses sans hésiter. La loyauté, jusqu\'au bout de l\'histoire.'}
    ]},
];
