import { attrOf } from '../../engine/player.js';
import { actionRoll } from '../../engine/utils.js';
import { mediaWeight } from './_helpers.js';

/* ============================================================
   ANECDOTES NBA PAR FRANCHISE — un événement (Miami en porte deux)
   par club, gaté sur le VRAI club du joueur (p.club, voir
   data/leagues.js LEAGUES.nba.clubs -- mêmes chaînes exactes).
   Règle de sécurité stricte, non négociable : on évoque des
   travers/ambiances/archétypes reconnaissables par les fans du
   club concerné, JAMAIS un délit ou un crime attribué à une
   personne réelle identifiable, et AUCUN nom réel n'est cité
   -- le clin d'œil vient du club + de la situation, jamais d'une
   accusation portée sur quelqu'un. Chaque situation volontairement
   maintenue au niveau de l'ambiance/du trait de personnalité
   générique (ex. Memphis : "attitude, sorties, réseaux" jamais un
   fait précis ; Charlotte : "accrochages sans gravité" jamais un
   accident réel ; Detroit : "dureté défensive/fautes" jamais une
   instruction à blesser).

   Cohérence d'ARRIVÉE (demandée explicitement, voir AGENDA.md) :
   chaque event est gaté au moment de la carrière où la situation a
   RÉELLEMENT du sens, pas seulement "être au bon club" :
   - Moment d'ARRIVÉE pur (once:true, clubTenure<=1) : Miami
     Heat Culture (le rite de passage du premier jour), San Antonio
     (le système s'impose dès l'intégration), Chicago (la
     comparaison tombe dès que tu portes le maillot), Toronto (le
     changement de pays se vit à l'installation), Philadelphie (le
     discours du projet se tient tôt dans le passage au club).
   - Situation qui suppose une place déjà ACQUISE dans l'effectif
     (reputation/clubTenure minimum) : Brooklyn (hiérarchie
     d'ego, suppose plusieurs joueurs déjà en place), OKC/Milwaukee
     (la peur du départ suppose une star déjà installée), Sacramento
     (la malédiction se ressent après plusieurs saisons sur place),
     Portland (la fidélité se raconte après une longue présence),
     Memphis (le "jeune prodige" reste jeune, gaté sur l'âge),
     Charlotte (gaté sur le poste de meneur, cohérent avec la
     situation décrite), Miami bis (l'"ami" ne sollicite que
     quelqu'un déjà installé et solvable).
   - Ambiance PERMANENTE du club, sans condition de carrière propre
     (recontrée à toute étape d'un passage dans ce club) : Golden
     State, Lakers, Boston, New York, Detroit, Denver, Houston,
     Minnesota, Phoenix, Washington.
   `phase` (early/mid/late) volontairement PAS utilisé ici : ces
   situations tiennent au CLUB et à l'ancienneté qu'on y a, pas à
   l'âge global de la carrière (on peut aussi bien arriver à Miami
   en early qu'en late) -- clubTenure/reputation/age remplacent
   `phase` avec une granularité plus juste pour ce lot précis.
============================================================ */
export const NBA_FRANCHISE_EVENTS = [

  {id:'franchise_memphis_attitude', cat:'nightlife', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Memphis' && p.age<=27,
    title:'Le feu follet de Memphis',
    body:'Ta réputation de trublion te précède déjà : sorties tardives, punchlines assassines sur les réseaux, un franc-parler qui embrase les commentaires à chaque sortie médiatique. Le staff commence à s\'inquiéter du narratif qui se construit autour de toi.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Assumer le personnage, sans filtre', hint:'Ton public adore, le staff beaucoup moins',
        effect:(ctx)=>{ const ok=Math.random()<0.5; ctx.ok=ok;
          return ok?{popularity:+8,media:+5,flag:'hothead'}:{popularity:+3,coach:-6,media:+6,flag:['hothead','controversial']}; },
        outcome:(ctx)=> ctx.ok?'Le clip devient culte, la ferveur autour de toi grimpe encore d\'un cran.':'La punchline de trop tourne en boucle. Le staff serre les dents, mais ta cote de popularité explose quand même.'},
      {label:'Lever le pied, soigner l\'image', hint:'La prudence, quitte à paraître lisse',
        effect:{coach:+5,popularity:-2,morale:-2},
        outcome:'Tu coupes le son, tu rentres tôt. Moins de titres dans la presse, plus de tranquillité dans le vestiaire.'}
    ]},

  {id:'franchise_charlotte_driving', cat:'locker', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Charlotte' && p.pos==='PG',
    title:'Le pare-chocs le plus sollicité de Charlotte',
    body:'Nouvelle anecdote de parking qui circule dans le vestiaire : un accrochage de plus à ton actif, sans gravité mais suffisant pour relancer les vannes. Tes coéquipiers ont déjà un surnom tout prêt pour toi.',
    weight:()=>0.45,
    choices:()=>[
      {label:'Encaisser les vannes avec le sourire', hint:'Jouer le jeu, ça désamorce tout',
        effect:{morale:+4,coach:+1},
        outcome:'Tu ris le premier de l\'histoire. Le vestiaire adore, l\'ambiance grimpe encore d\'un cran.'},
      {label:'Se vexer et hausser le ton', hint:'Défendre ton style, quitte à envenimer',
        effect:{morale:-3,coach:-2,flag:'hothead'},
        outcome:'Ta réaction sèche jette un froid. L\'histoire continuera de circuler, en pire.'}
    ]},

  {id:'franchise_miami_culture', cat:'training', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Miami' && (p.clubTenure||0)<=1,
    title:'La Heat Culture, sans exception',
    body:'Le staff jette un œil à ta condition physique et fronce les sourcils : ici, personne n\'échappe au fameux régime maison, ni à la séance de conditionnement réputée la plus dure de la ligue. Bienvenue à Miami.',
    choices:()=>[
      {label:'S\'y plier à fond, sans négocier', hint:'La discipline, aussi dure soit-elle',
        effect:{fitness:+10,coach:+6,ath:+1},
        outcome:'Tu tiens le rythme imposé. Le staff note l\'état d\'esprit, ton corps encaisse mieux la saison qui vient.'},
      {label:'Négocier un aménagement', hint:'Épargner tes jambes, quitte à froisser le staff',
        effect:{fitness:+3,coach:-4},
        outcome:'Tu obtiens un peu de répit. Le message est clair côté staff : ici, ce n\'est pas comme ça que ça marche.'}
    ]},

  {id:'franchise_miami_investment', cat:'business', cooldown:6,
    when:(p,lg)=>p.league==='nba' && p.club==='Miami' && p.money>=150 && (p.clubTenure||0)>=1,
    title:'Le plan miracle d\'un proche',
    body:'Un visage familier débarque avec un projet "exclusif" à Miami, la promesse d\'un rendement énorme et un ton qui sent le montage. Refuser, dit-il, serait une trahison entre amis.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Mordre à l\'hameçon', hint:'Un pari risqué, sur la confiance',
        effect:(ctx)=>{ const win=Math.random()<0.4; ctx.win=win;
          return win?{money:+Math.round(p.money*0.5),flag:'spender'}:{money:-Math.round(p.money*0.5),popularity:-3,flag:['spender','controversial']}; },
        outcome:(ctx)=> ctx.win?'Contre toute attente, l\'histoire tourne bien, ton compte en garde le sourire.':'Le montage s\'effondre, l\'argent s\'évapore, et l\'histoire finit par filtrer dans la presse locale.'},
      {label:'Décliner poliment', hint:'Préserver ton argent et cette amitié, tant bien que mal',
        effect:{morale:-1,flag:'saver'},
        outcome:'Tu passes ton tour. La relation refroidit un peu, mais ton compte reste intact.'}
    ]},

  {id:'franchise_gsw_system', cat:'system', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Golden State',
    title:'Le mouvement de balle avant tout',
    body:'Le coach est clair : ici, un tir raté après une seule passe fait plus grincer des dents qu\'un tir manqué après cinq. Le système passe avant l\'individu, même quand tu sens le bon coup à prendre.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Suivre le système à la lettre', hint:'Faire circuler, encore et encore',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'passe'),58); ctx.ok=ok;
          return ok?{reputation:+5,coach:+6,morale:+1}:{coach:+3,morale:-3}; },
        outcome:(ctx)=> ctx.ok?'Le ballon circule, l\'action se dénoue à la dernière passe, le banc jubile de ce point collectif.':'Tu forces la bonne intention mais la dernière passe se perd. Le coach salue quand même l\'esprit.'},
      {label:'Prendre ton tir quand tu le sens', hint:'Assumer l\'initiative individuelle',
        effect:{coach:-4,popularity:+3,reputation:+1},
        outcome:'Tu shootes. Ça peut payer sur l\'instant, mais le système n\'aime pas qu\'on s\'en écarte.'}
    ]},

  {id:'franchise_lakers_hollywood', cat:'media', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='L.A. Lakers',
    title:'Projecteurs hollywoodiens',
    body:'Entre les tournages qui traversent la salle d\'entraînement et les invitations mondaines qui s\'accumulent, ton téléphone n\'arrête plus de vibrer. Difficile de rester concentré sur le seul basket ici.',
    weight:(p)=>mediaWeight(p)*0.35,
    choices:()=>[
      {label:'Jouer le jeu des paillettes', hint:'Se montrer, quitte à y laisser de l\'énergie',
        effect:{popularity:+7,media:+6,fitness:-3,coach:-2},
        outcome:'Tu enchaînes les événements, ton nom circule partout en ville. Le corps encaisse un peu moins bien la préparation.'},
      {label:'Fermer la porte, rester au gymnase', hint:'La discipline plutôt que la lumière',
        effect:{coach:+4,fitness:+2,popularity:-2},
        outcome:'Tu déclines poliment. Moins glamour, mais le staff apprécie visiblement le sérieux.'}
    ]},

  {id:'franchise_boston_crowd', cat:'pressure', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Boston',
    title:'Un public qui ne pardonne rien',
    body:'Une action molle en première mi-temps et déjà les sifflets tombent des travées. Ici, la ferveur ne fait pas de cadeau : le public attend une réaction immédiate, pas des excuses.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Répondre sur le terrain, tout de suite', hint:'Transformer la colère du public en énergie',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok;
          return ok?{reputation:+6,morale:+5,popularity:+4}:{morale:-4}; },
        outcome:(ctx)=> ctx.ok?'Le sursaut arrive, la salle bascule aussitôt de ton côté -- ici, ça va vite dans les deux sens.':'La réaction ne vient pas assez vite, les sifflets redoublent. Un soir compliqué, comme il y en aura d\'autres ici.'},
      {label:'Ignorer et rester dans ta bulle', hint:'Ne pas se laisser distraire par les tribunes',
        effect:{morale:+1,popularity:-2},
        outcome:'Tu fais abstraction. Ni éclat ni sursaut, la salle t\'oublie vite en attendant le prochain relâchement.'}
    ]},

  {id:'franchise_ny_tabloids', cat:'media', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='New York',
    title:'Une ville qui ne dort jamais, ni les tabloïds',
    body:'Une sortie tranquille un soir de match, et voilà déjà un entrefilet qui circule le lendemain matin. Ici, la moindre soirée peut devenir une manchette.',
    weight:(p)=>mediaWeight(p)*0.3,
    choices:()=>[
      {label:'Alimenter la légende, sans complexe', hint:'Jouer avec les projecteurs plutôt que les fuir',
        effect:(ctx)=>{ const ok=Math.random()<0.5; ctx.ok=ok;
          return ok?{popularity:+8,media:+7,flag:'mediaFriend'}:{popularity:+3,media:+8,coach:-3,flag:'controversial'}; },
        outcome:(ctx)=> ctx.ok?'La ville adore ton numéro, les manchettes jouent en ta faveur pour une fois.':'La ville s\'emballe dans l\'autre sens, mais elle ne t\'oublie plus -- au Madison, on ne fait jamais les choses à moitié.'},
      {label:'Se faire discret, éviter les caméras', hint:'La tranquillité, quitte à paraître fade',
        effect:{coach:+2,media:-2},
        outcome:'Tu passes sous le radar. Une bonne nuit de sommeil, un entrefilet en moins.'}
    ]},

  {id:'franchise_brooklyn_egos', cat:'locker', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Brooklyn' && p.reputation>=40,
    title:'Un vestiaire à plusieurs étoiles',
    body:'Trop d\'ego dans la même pièce, pas assez de ballons pour tout le monde : le vestiaire cherche encore sa hiérarchie, et chacun tire un peu la couverture à soi. Il va falloir choisir ton camp, ou t\'en inventer un.',
    weight:()=>0.45,
    choices:()=>[
      {label:'Revendiquer ta place de leader', hint:'S\'imposer, quitte à froisser',
        effect:{coach:+3,morale:-2,flag:'leaderRep'},
        outcome:'Tu prends la parole en premier. Certains suivent, d\'autres serrent les dents en silence.'},
      {label:'Rester en retrait, jouer l\'apaisement', hint:'La diplomatie plutôt que le rapport de force',
        effect:{morale:+3,coach:+1},
        outcome:'Tu calmes le jeu sans l\'imposer. Le vestiaire respire un peu mieux, sans que rien ne soit vraiment réglé.'}
    ]},

  {id:'franchise_philly_process', cat:'system', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Philadelphie' && (p.clubTenure||0)<=2,
    title:'Faire confiance au Process',
    body:'Le discours du front office est rodé : les défaites s\'accumulent par choix, pas par accident, le temps qu\'un vrai projet se construise autour de jeunes noyaux. On te demande d\'y croire, saison de disette après saison de disette.',
    choices:()=>[
      {label:'Y croire à fond, patienter', hint:'Le temps long, contre l\'envie de résultats immédiats',
        effect:{coach:+6,morale:-2,reputation:+2},
        outcome:'Tu joues le jeu du projet. Ce n\'est pas gratifiant tout de suite, mais le front office retient ta patience.'},
      {label:'Réclamer des résultats plus vite', hint:'Faire pression pour gagner maintenant',
        effect:{coach:-4,popularity:+3,morale:+1},
        outcome:'Tu fais entendre ton impatience. Ça te rend populaire dans les tribunes, beaucoup moins dans les bureaux.'}
    ]},

  {id:'franchise_sa_system', cat:'system', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='San Antonio' && (p.clubTenure||0)<=1,
    title:'L\'école la plus stricte de la ligue',
    body:'Un système millimétré, un coach-mentor à l\'ancienne qui rabote toute fantaisie inutile, et une exigence de rigueur qui ne laisse rien passer, pas même un détail. Ici, on ne réinvente pas la roue, on l\'exécute mieux que les autres.',
    choices:()=>[
      {label:'Se couler dans le moule, sans discuter', hint:'La discipline avant l\'ego',
        effect:{coach:+7,qi:+1},
        outcome:'Tu absorbes chaque consigne sans broncher. Le staff remarque vite les joueurs qui écoutent vraiment.'},
      {label:'Garder ta touche personnelle', hint:'Défendre ton style, quitte à frotter',
        effect:{coach:-3,popularity:+2,morale:+1},
        outcome:'Tu gardes tes habitudes. Le système laisse un peu de place, mais pas beaucoup.'}
    ]},

  {id:'franchise_detroit_badboys', cat:'rivalry', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Detroit',
    title:'L\'héritage des Bad Boys',
    body:'L\'histoire du club pèse encore sur chaque contact : ici, la défense doit se sentir dans les bras autant que dans les jambes adverses. On attend de toi une dureté qui ne se discute pas.',
    weight:()=>0.45,
    choices:({p})=>[
      {label:'Assumer le rôle d\'intimidateur', hint:'La physicalité, quitte à multiplier les fautes',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'def'),55); ctx.ok=ok;
          return ok?{reputation:+5,def:+1,coach:+3}:{coach:+1,popularity:+2}; },
        outcome:(ctx)=> ctx.ok?'Le message passe, l\'adversaire hésite avant chaque pénétration. Exactement l\'héritage qu\'on attendait de toi.':'Les fautes s\'accumulent plus vite que les arrêts. L\'intention plaît quand même au staff.'},
      {label:'Défendre dur, mais proprement', hint:'La rigueur technique plutôt que l\'intimidation',
        effect:{def:+1,coach:+2},
        outcome:'Tu défends solide sans franchir la ligne. Efficace, même si ça manque un peu de la légende du club.'}
    ]},

  {id:'franchise_sacramento_curse', cat:'pressure', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Sacramento' && (p.clubTenure||0)>=3,
    title:'La malédiction des playoffs',
    body:'Encore une saison où l\'équipe flirte avec la qualification sans jamais vraiment y croire. Ici, le talent n\'a jamais suffi à briser la série, et tout le monde en parle à mots couverts, comme d\'une fatalité.',
    weight:()=>0.4,
    choices:({p})=>[
      {label:'Porter l\'équipe pour briser la série', hint:'Prendre le sujet à bras-le-corps',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi')+(p.clutch||0)*2,58); ctx.ok=ok;
          return ok?{reputation:+8,popularity:+8,morale:+6,flag:'clutchHero'}:{morale:-4,flag:'clutchChoker'}; },
        outcome:(ctx)=> ctx.ok?'Cette fois, la série ne se referme pas sur vous. La ville retient son souffle puis explose de joie.':'La malédiction tient bon une saison de plus. Tu sens le poids retomber sur tes épaules avant même la fin du match.'},
      {label:'Rester sobre, ne pas dramatiser', hint:'Refuser de porter le récit de la malédiction',
        effect:{morale:+2},
        outcome:'Tu refuses d\'y penser à voix haute. Ça n\'empêche pas les commentaires extérieurs de continuer.'}
    ]},

  {id:'franchise_denver_altitude', cat:'personal', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Denver',
    title:'L\'altitude et l\'éloignement',
    body:'Les équipes visiteuses arrivent déjà essoufflées avant le coup d\'envoi, un avantage bien réel dont tout le monde parle ici. En dehors du parquet, en revanche, le marché reste loin des grands projecteurs -- un choix à assumer.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Profiter à fond de l\'avantage local', hint:'Faire de l\'altitude une arme, saison après saison',
        effect:{coach:+3,reputation:+2},
        outcome:'Tu apprends à exploiter chaque possession face à des adversaires cuits avant l\'heure. Un vrai atout de franchise.'},
      {label:'Regretter l\'absence de lumière médiatique', hint:'Le mal du pays des grands marchés',
        effect:{media:-2,morale:-1},
        outcome:'Tu ressens l\'éloignement des projecteurs. Le club, lui, n\'a jamais compté sur eux pour gagner.'}
    ]},

  {id:'franchise_okc_smallmarket', cat:'contract', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='OKC' && p.reputation>=45,
    title:'Le petit marché qui forme puis qui regarde partir',
    body:'L\'histoire du club se répète : une pépite éclot ici, grandit, devient indispensable... puis finit par réclamer un plus grand marché. Le front office te regarde déjà en se demandant si tu seras le prochain.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Affirmer publiquement ton attachement', hint:'Rassurer la franchise et les tribunes',
        effect:{popularity:+4,coach:+4,reputation:+1},
        outcome:'Tes mots rassurent, pour cette saison au moins. Le doute reviendra, comme toujours ici.'},
      {label:'Rester vague sur ton avenir', hint:'Ne rien promettre, garder toutes les options',
        effect:{coach:-3,popularity:-1,money:+10},
        outcome:'Ton silence entretient la rumeur. Les négociations, elles, s\'en trouvent facilitées.'}
    ]},

  {id:'franchise_portland_loyalty', cat:'community', cooldown:6,
    when:(p,lg)=>p.league==='nba' && p.club==='Portland' && (p.clubTenure||0)>=4,
    title:'Fief isolé, fidélité totale',
    body:'Ici, rester longtemps se raconte comme une preuve d\'amour, et partir comme une trahison qu\'on ne pardonne pas facilement. Après toutes ces saisons dans ce fief à part, la ville te considère un peu comme les siens.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Endosser le rôle de figure loyale', hint:'Devenir le visage durable du club',
        effect:{popularity:+6,coach:+3,morale:+2},
        outcome:'Tu embrasses ce statut. Ici, la fidélité pèse plus lourd qu\'ailleurs, et ça se voit dans chaque ovation.'},
      {label:'Garder ouverte l\'idée d\'un jour partir', hint:'Ne pas s\'enfermer dans un seul maillot',
        effect:{popularity:-4,coach:-2},
        outcome:'Le simple doute suffit à refroidir une partie du public. Ici, ça ne pardonne pas facilement.'}
    ]},

  {id:'franchise_chicago_legacy', cat:'pressure', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Chicago' && (p.clubTenure||0)<=1,
    title:'L\'ombre d\'un ancien numéro 23',
    body:'Dans ce vestiaire, une ombre plane encore sur tout le monde : celle d\'un ancien numéro 23 devenu légende absolue de la maison. Quoi que tu fasses ici, la comparaison n\'est jamais loin.',
    choices:()=>[
      {label:'Assumer la comparaison, viser haut', hint:'Se mesurer à la légende plutôt que la fuir',
        effect:{reputation:+4,popularity:+4,morale:-2},
        outcome:'Tu joues avec la comparaison plutôt que de la subir. Risqué, mais la salle aime l\'ambition affichée.'},
      {label:'S\'en détacher complètement', hint:'Tracer ta propre trajectoire, loin des comparaisons',
        effect:{morale:+3,coach:+1},
        outcome:'Tu refuses le parallèle. Plus tranquille, même si l\'histoire du club continue de planer au-dessus du parquet.'}
    ]},

  {id:'franchise_toronto_expat', cat:'personal', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Toronto' && (p.clubTenure||0)<=1,
    title:'Seul club hors des États-Unis',
    body:'Douanes, passeport à portée de main à chaque déplacement, décalage climatique : ici, chaque aller-retour rappelle que ce club joue dans un autre pays que tous les autres. Une expatriation dans la ligue elle-même.',
    choices:()=>[
      {label:'Faire de la différence une force', hint:'Embrasser le statut à part du club',
        effect:{coach:+3,popularity:+3},
        outcome:'Tu adoptes vite les habitudes locales. Le club savoure d\'avoir quelqu\'un qui ne subit pas la situation.'},
      {label:'Regretter le confort du marché américain', hint:'Le mal du pays, difficile à cacher',
        effect:{morale:-3,coach:-1},
        outcome:'La distance pèse plus que prévu. Rien de grave, mais l\'adaptation prend un peu plus de temps.'}
    ]},

  {id:'franchise_houston_threeball', cat:'system', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Houston',
    title:'Le tir à mi-distance, banni ou presque',
    body:'L\'analytics du club est sans appel : le tir à mi-distance est presque proscrit, remplacé par une chasse permanente au tir à trois points ou au panier tout près du cercle. Le staff surveille chaque écart au tableau de bord.',
    weight:()=>0.45,
    choices:({p})=>[
      {label:'Se plier entièrement à la doctrine', hint:'Ne shooter que là où le système l\'autorise',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'adr3'),58); ctx.ok=ok;
          return ok?{reputation:+5,coach:+5,adr3:+1}:{coach:+2}; },
        outcome:(ctx)=> ctx.ok?'Tu colles au plan, les tirs longue distance tombent, le tableau de bord du staff affiche enfin des couleurs vertes.':'Tu respectes la doctrine mais l\'adresse ne suit pas ce soir-là. Le staff salue quand même la discipline du choix.'},
      {label:'Garder ton tir de mi-distance favori', hint:'Assumer un geste que le système déteste',
        effect:{coach:-4,popularity:+2},
        outcome:'Tu gardes ta botte secrète. Efficace pour toi, hérétique pour le plan du club.'}
    ]},

  {id:'franchise_minnesota_cold', cat:'morale', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Minnesota',
    title:'Le froid et la longue traversée du désert',
    body:'Dehors, un froid glacial qui décourage même les plus motivés à sortir du hall d\'entraînement. Sur le parquet, une franchise qui traîne une réputation de malchance récurrente, saison après saison.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Transformer la grisaille en abnégation', hint:'Utiliser l\'isolement pour se concentrer sur le travail',
        effect:{coach:+4,qi:+1},
        outcome:'Tu profites du calme forcé pour travailler des détails que d\'autres marchés n\'auraient pas le temps de peaufiner.'},
      {label:'Se laisser gagner par la morosité ambiante', hint:'Subir l\'ambiance plutôt que la combattre',
        effect:{morale:-3},
        outcome:'Le moral en prend un coup. Rien d\'irréversible, mais l\'hiver semble ne jamais vouloir finir.'}
    ]},

  {id:'franchise_phoenix_heat', cat:'form', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Phoenix',
    title:'La chaleur du désert et un effectif fatigué',
    body:'La chaleur écrasante rend chaque entraînement plus éprouvant que prévu, et l\'effectif vieillissant autour de toi collectionne les petits pépins. Le staff cherche à relancer la machine sans la casser davantage.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Pousser malgré la chaleur', hint:'Ne pas lever le pied, quitte à forcer sur le corps',
        effect:{fitness:-4,coach:+3,reputation:+2},
        outcome:'Tu tiens la cadence sous une chaleur écrasante. Le staff apprécie, ton corps encaisse la note plus tard.'},
      {label:'Gérer sa charge avec prudence', hint:'Épargner ton corps pour la durée de la saison',
        effect:{fitness:+4,coach:-1},
        outcome:'Tu doses ton effort. Moins spectaculaire à l\'entraînement, mais tu arrives frais aux moments qui comptent.'}
    ]},

  {id:'franchise_milwaukee_smallmarket', cat:'contract', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Milwaukee' && p.reputation>=50,
    title:'Le petit marché qui a décroché le gros lot',
    body:'Ici, tout le monde sait que la franchise a mis la main sur une star rare pour un marché de cette taille -- et vit dans la peur sourde de la voir un jour partir voir plus grand ailleurs. Chaque rumeur d\'ambition met la ville sur les nerfs.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Calmer le jeu publiquement', hint:'Rassurer la franchise sur tes intentions',
        effect:{popularity:+3,coach:+4},
        outcome:'Tes déclarations calment la ville, au moins pour un temps. Ici, on retient son souffle à chaque intersaison.'},
      {label:'Laisser planer le doute', hint:'Ne fermer aucune porte pour l\'avenir',
        effect:{coach:-3,media:+4},
        outcome:'Le silence entretient la rumeur bien au-delà du vestiaire. La ville n\'aime pas ça, mais elle ne peut rien y faire.'}
    ]},

  {id:'franchise_washington_identity', cat:'community', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Washington',
    title:'La capitale cherche encore son identité',
    body:'Entre galas institutionnels, invitations officielles et une franchise qui peine à se trouver une identité sportive stable, difficile de savoir ce qu\'on retiendra vraiment de ton passage ici.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Te concentrer sur le seul basket', hint:'Ignorer le tumulte institutionnel autour du club',
        effect:{coach:+3,fitness:+1},
        outcome:'Tu fais abstraction du bruit ambiant. Discret, mais efficace pour construire ta propre trajectoire ici.'},
      {label:'Profiter des mondanités de la capitale', hint:'S\'ouvrir aux sollicitations officielles',
        effect:{media:+4,popularity:+3,coach:-2},
        outcome:'Tu multiplies les apparitions institutionnelles. Bonne visibilité, un peu moins de temps pour le travail au gymnase.'}
    ]},
];
