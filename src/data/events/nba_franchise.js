import { attrOf } from '../../engine/player.js';
import { actionRoll } from '../../engine/utils.js';
import { mediaWeight } from './_helpers.js';

/* ============================================================
   ANECDOTES NBA PAR FRANCHISE — un événement (Miami en porte deux)
   par club, gaté sur le VRAI club du joueur (p.club, voir
   data/leagues.js LEAGUES.nba.clubs -- mêmes chaînes exactes).

   Règle de sécurité, NON négociable malgré la demande de réécriture
   plus mordante (voir AGENDA.md) : AUCUN nom réel cité (respecté),
   et surtout -- au-delà de la seule règle du nom -- aucune situation
   n'est mise en scène de façon à rendre une personne réelle
   identifiable en train de commettre un délit, un crime, ou un acte
   dangereux précis (arme, fraude, etc.). Trois situations demandées
   en ce sens ont été volontairement REFUSÉES et gardées à leur
   niveau d'archétype/ambiance : Memphis (attitude/réseaux, jamais un
   objet dangereux), Charlotte (accrochages de parking sans gravité,
   jamais une escalade réaliste), Miami bis (arnaque financière d'un
   proche, jamais un scandale de paris truqués). Le ton, lui, a été
   nettement durci partout : didascalies, écriture plus vive, humour
   plus mordant sur l'ambiance/la culture de chaque club -- ce
   registre-là (organisationnel, culturel, de vestiaire) porte
   largement assez de matière comique pour ne jamais avoir besoin de
   cibler une personne réelle.

   Cohérence d'ARRIVÉE (inchangée, voir AGENDA.md) : chaque event est
   gaté au moment de la carrière où la situation a RÉELLEMENT du sens,
   pas seulement "être au bon club" :
   - Moment d'ARRIVÉE pur (once:true, clubTenure<=1) : Miami
     Heat Culture, San Antonio, Chicago, Toronto, Philadelphie.
   - Situation qui suppose une place déjà ACQUISE dans l'effectif
     (reputation/clubTenure minimum) : Brooklyn, OKC, Milwaukee,
     Sacramento, Portland, Memphis (âge), Charlotte (poste de
     meneur), Miami bis (argent disponible).
   - Ambiance PERMANENTE du club, sans condition de carrière propre :
     Golden State, Lakers, Boston, New York, Detroit, Denver, Houston,
     Minnesota, Phoenix, Washington.
   `phase` volontairement PAS utilisé : ces situations tiennent au
   CLUB et à l'ancienneté qu'on y a, pas à l'âge global de la
   carrière -- clubTenure/reputation/age remplacent `phase` avec une
   granularité plus juste pour ce lot précis.
============================================================ */
export const NBA_FRANCHISE_EVENTS = [

  {id:'franchise_memphis_attitude', cat:'nightlife', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Memphis' && p.age<=27,
    title:'Le feu follet de Memphis',
    body:'<i>(Ton téléphone vibre pour la troisième fois en dix minutes -- le service com\' a visiblement du travail.)</i> Encore une punchline qui fait plus de bruit qu\'un poster dunk, encore une story qui part alimenter les "vous n\'allez pas croire ce qu\'il a dit" du lendemain matin. Le vestiaire adore, la ligue commence à avoir ton numéro en raccourci.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Assumer le personnage, sans filtre', hint:'Ton public adore, le service com\' vieillit en accéléré',
        effect:(ctx)=>{ const ok=Math.random()<0.5; ctx.ok=ok;
          return ok?{popularity:+8,media:+5,flag:'hothead'}:{popularity:+3,coach:-6,media:+6,flag:['hothead','controversial']}; },
        outcome:(ctx)=> ctx.ok?'Le clip explose, quelqu\'un le remonte en 20 secondes avec une musique épique, et te voilà malgré toi le meilleur community manager du club.':'La punchline de trop tourne en boucle jusque dans les bureaux de la ligue. Le service com\' rédige un communiqué. Encore.'},
      {label:'Lever le pied, soigner l\'image', hint:'La prudence, quitte à ressembler à ton propre communiqué de presse',
        effect:{coach:+5,popularity:-2,morale:-2},
        outcome:'Tu coupes le son pendant quelques semaines. Le vestiaire souffle, la presse s\'ennuie ferme -- et ça, ici, c\'est presque suspect.'}
    ]},

  {id:'franchise_charlotte_driving', cat:'locker', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Charlotte' && p.pos==='PG',
    title:'Le pare-chocs le plus sollicité de Charlotte',
    body:'<i>(Le parking du centre d\'entraînement ressemble de plus en plus à un jeu de tamponneuses.)</i> Nouvel épisode de la saga automobile la plus suivie du vestiaire : un pare-choc de plus cabossé contre un poteau qui n\'a rien vu venir, et déjà les paris sont lancés dans le groupe de discussion sur le prochain sinistre. Ton assureur commence à reconnaître ta voix.',
    weight:()=>0.45,
    choices:()=>[
      {label:'Encaisser les vannes avec le sourire', hint:'Devenir le mème officiel du vestiaire',
        effect:{morale:+4,coach:+1},
        outcome:'Tu proposes toi-même le surnom avant que quelqu\'un d\'autre ne s\'en charge. Le vestiaire adore, et le kiné a déjà commandé un t-shirt "Survivant du parking".'},
      {label:'Se vexer et hausser le ton', hint:'Défendre ton style de conduite, mauvaise idée',
        effect:{morale:-3,coach:-2,flag:'hothead'},
        outcome:'Ta sortie sèche jette un froid. Évidemment, quelqu\'un a filmé la scène avant que tu aies fini ta phrase.'}
    ]},

  {id:'franchise_miami_culture', cat:'training', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Miami' && (p.clubTenure||0)<=1,
    title:'La Heat Culture, sans exception',
    body:'<i>(Le préparateur physique consulte une feuille de calcul qui te concerne, visiblement, en grand détail.)</i> Ici, la légende du camp de conditionnement le plus redouté de la ligue n\'a rien d\'une rumeur montée en épingle : bip-test à l\'aube, régime millimétré au gramme près, séance qui a fait vaciller des vétérans All-Star avant toi. Le message tombe dès le premier jour : ton taux de masse grasse n\'est plus vraiment une donnée privée.',
    choices:()=>[
      {label:'S\'y plier à fond, sans négocier', hint:'La discipline, même quand les jambes hurlent',
        effect:{fitness:+10,coach:+6,ath:+1},
        outcome:'Tu tiens le camp jusqu\'au bout, jambes en compote mais fierté intacte. Ton nom rejoint la petite liste très select de ceux qui n\'ont pas craqué.'},
      {label:'Négocier un aménagement', hint:'Épargner tes jambes, quitte à froisser le vestiaire le plus discipliné de la ligue',
        effect:{fitness:+3,coach:-4},
        outcome:'Tu obtiens un jour de répit. Le regard du staff, lui, ne t\'en accorde étrangement aucun.'}
    ]},

  {id:'franchise_miami_investment', cat:'business', cooldown:6,
    when:(p,lg)=>p.league==='nba' && p.club==='Miami' && p.money>=150 && (p.clubTenure||0)>=1,
    title:'Le plan miracle d\'un proche',
    body:'<i>(Un ami d\'enfance que tu n\'avais pas croisé depuis trois ans t\'invite soudain à déjeuner. Ça sent déjà le PowerPoint.)</i> Il a "un truc énorme", "exclusif", "juste pour le premier cercle" -- une occasion si en or qu\'elle ne peut visiblement pas attendre que ton agent y jette un œil. Refuser, dans son regard, reviendrait à un crime de lèse-amitié.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Mordre à l\'hameçon', hint:'Un pari risqué, sur la seule confiance',
        effect:(ctx)=>{ const win=Math.random()<0.4; ctx.win=win;
          return win?{money:+Math.round(p.money*0.5),flag:'spender'}:{money:-Math.round(p.money*0.5),popularity:-3,flag:['spender','controversial']}; },
        outcome:(ctx)=> ctx.win?'Contre toute attente, l\'affaire tient debout. Ton pote se prend pour un génie de la finance pendant environ deux semaines.':'L\'affaire s\'effondre plus vite qu\'un tir à trois points contesté au buzzer. Ton agent apprend la nouvelle par un article, pas par toi.'},
      {label:'Décliner poliment', hint:'Préserver ton argent et cette amitié, tant bien que mal',
        effect:{morale:-1,flag:'saver'},
        outcome:'Tu déclines. Le déjeuner se termine plus vite que prévu, et le prochain message met un peu plus longtemps à arriver.'}
    ]},

  {id:'franchise_gsw_system', cat:'system', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Golden State',
    title:'Le mouvement de balle avant tout',
    body:'<i>(Le coach rembobine la même séquence vidéo pour la troisième fois, avec le même petit sourire figé.)</i> La règle ici tient en une phrase martelée à chaque temps mort : la dernière passe vaut toujours mieux que le premier bon tir. Prendre sa chance après une seule touche de balle, même réussie, t\'attire un regard qui en dit long -- ici, l\'égoïsme se mesure au nombre de passes sautées, pas au pourcentage au tir.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Suivre le système à la lettre', hint:'Faire circuler, encore et encore',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'passe'),58); ctx.ok=ok;
          return ok?{reputation:+5,coach:+6,morale:+1}:{coach:+3,morale:-3}; },
        outcome:(ctx)=> ctx.ok?'Le ballon voyage cinq fois avant de tomber, le banc se lève comme si c\'était toi qui avais marqué.':'Tu forces la bonne intention mais la dernière passe se perd dans les tribunes. Le coach salue quand même l\'esprit, du bout des lèvres.'},
      {label:'Prendre ton tir quand tu le sens', hint:'Assumer l\'hérésie de l\'initiative individuelle',
        effect:{coach:-4,popularity:+3,reputation:+1},
        outcome:'Tu shootes. Le ballon rentre, la salle exulte -- et le coach note quelque chose sur son carnet que tu préfères ne pas lire.'}
    ]},

  {id:'franchise_lakers_hollywood', cat:'media', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='L.A. Lakers',
    title:'Projecteurs hollywoodiens',
    body:'<i>(Un assistant de production te croise dans le couloir du centre d\'entraînement, carnet à la main, déjà en train de négocier une date.)</i> Entre le tournage qui a annexé le parking VIP et l\'invitation à un gala dont tu ignorais l\'existence il y a une heure, ton téléphone est devenu le standard téléphonique d\'une ville entière. Ici, être joueur de basket est presque un métier à mi-temps.',
    weight:(p)=>mediaWeight(p)*0.35,
    choices:()=>[
      {label:'Jouer le jeu des paillettes', hint:'Se montrer partout, quitte à y laisser de l\'énergie',
        effect:{popularity:+7,media:+6,fitness:-3,coach:-2},
        outcome:'Tu enchaînes les tapis rouges, ton nom circule dans des soirées où personne ne parle de basket. Le corps, lui, présente la note à l\'entraînement du lendemain.'},
      {label:'Fermer la porte, rester au gymnase', hint:'La discipline plutôt que la lumière',
        effect:{coach:+4,fitness:+2,popularity:-2},
        outcome:'Tu déclines, encore et encore. Moins glamour, mais le staff commence à te regarder différemment -- en bien, pour une fois.'}
    ]},

  {id:'franchise_boston_crowd', cat:'pressure', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Boston',
    title:'Un public qui ne pardonne rien',
    body:'<i>(Une perte de balle évitable, et déjà toute une tribune se lève comme un seul homme pour te le faire savoir.)</i> Ici, la ferveur ne fait jamais de cadeau : le public le plus exigeant de la ligue attend une réaction immédiate, pas un sourire gêné ni une main levée en excuse. La rumeur dit qu\'ils sifflaient déjà leurs propres légendes en leur temps -- ce n\'est pas vraiment une consolation.',
    weight:()=>0.5,
    choices:({p})=>[
      {label:'Répondre sur le terrain, tout de suite', hint:'Transformer la colère du public en énergie',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok;
          return ok?{reputation:+6,morale:+5,popularity:+4}:{morale:-4}; },
        outcome:(ctx)=> ctx.ok?'Le sursaut arrive, la salle bascule instantanément de ton côté -- ici, l\'amour et la haine se jouent à la même vitesse.':'La réaction ne vient pas assez vite, les sifflets redoublent. Un soir compliqué, comme il y en aura forcément d\'autres ici.'},
      {label:'Ignorer et rester dans ta bulle', hint:'Ne pas se laisser distraire par les tribunes',
        effect:{morale:+1,popularity:-2},
        outcome:'Tu fais abstraction, visage fermé. Ni éclat ni sursaut : la salle t\'oublie déjà, en attendant ton prochain faux pas.'}
    ]},

  {id:'franchise_ny_tabloids', cat:'media', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='New York',
    title:'Une ville qui ne dort jamais, ni les tabloïds',
    body:'<i>(Un inconnu au comptoir d\'un café te prend en photo sans même faire semblant de te le cacher.)</i> Une sortie tranquille un soir de match, et voilà déjà un entrefilet qui circule dès le lendemain matin, entre deux rumeurs de transfert inventées de toutes pièces. Ici, la moindre soirée peut devenir une manchette, et la moindre manchette peut devenir une légende de vestiaire.',
    weight:(p)=>mediaWeight(p)*0.3,
    choices:()=>[
      {label:'Alimenter la légende, sans complexe', hint:'Jouer avec les projecteurs plutôt que les fuir',
        effect:(ctx)=>{ const ok=Math.random()<0.5; ctx.ok=ok;
          return ok?{popularity:+8,media:+7,flag:'mediaFriend'}:{popularity:+3,media:+8,coach:-3,flag:'controversial'}; },
        outcome:(ctx)=> ctx.ok?'La ville adore ton numéro, les manchettes jouent en ta faveur pour une fois -- un petit miracle, ici.':'La ville s\'emballe dans l\'autre sens, mais elle ne t\'oublie plus -- au Madison, on ne fait jamais rien à moitié, dans un sens comme dans l\'autre.'},
      {label:'Se faire discret, éviter les caméras', hint:'La tranquillité, quitte à paraître fade',
        effect:{coach:+2,media:-2},
        outcome:'Tu passes sous le radar. Une bonne nuit de sommeil, un entrefilet en moins -- presque un exploit dans cette ville.'}
    ]},

  {id:'franchise_brooklyn_egos', cat:'locker', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Brooklyn' && p.reputation>=40,
    title:'Un vestiaire à plusieurs étoiles',
    body:'<i>(Deux voix montent en même temps dans le vestiaire, chacune persuadée d\'avoir eu le dernier mot.)</i> Trop d\'ego dans la même pièce, pas assez de ballons pour tout le monde : la hiérarchie de ce vestiaire se réinvente à chaque interview, chaque story, chaque conférence de presse où quelqu\'un "clarifie" quelque chose que personne n\'avait vraiment demandé. Il va falloir choisir ton camp, ou t\'en inventer un.',
    weight:()=>0.45,
    choices:()=>[
      {label:'Revendiquer ta place de leader', hint:'S\'imposer, quitte à froisser du beau monde',
        effect:{coach:+3,morale:-2,flag:'leaderRep'},
        outcome:'Tu prends la parole en premier, en conférence de presse, sans trembler. Certains suivent, d\'autres serrent les dents en silence -- et attendent leur tour.'},
      {label:'Rester en retrait, jouer l\'apaisement', hint:'La diplomatie plutôt que le rapport de force',
        effect:{morale:+3,coach:+1},
        outcome:'Tu calmes le jeu sans jamais l\'imposer. Le vestiaire respire un peu mieux, sans que la vraie question -- qui commande ici -- soit jamais tranchée.'}
    ]},

  {id:'franchise_philly_process', cat:'system', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Philadelphie' && (p.clubTenure||0)<=2,
    title:'Faire confiance au Process',
    body:'<i>(Le directeur sportif ouvre une présentation à diapositives. Beaucoup de diapositives.)</i> Le discours est rodé, presque religieux : les défaites s\'accumulent par choix froid, pas par accident, le temps qu\'un vrai projet éclose autour de jeunes noyaux savamment collectionnés. On te demande d\'y croire dur comme fer, saison de disette après saison de disette, pendant que les tribunes se vident un peu plus chaque hiver.',
    choices:()=>[
      {label:'Y croire à fond, patienter', hint:'Le temps long, contre l\'envie de résultats immédiats',
        effect:{coach:+6,morale:-2,reputation:+2},
        outcome:'Tu joues le jeu du projet, en public comme en privé. Ce n\'est pas gratifiant tout de suite, mais le front office retient ta patience -- et la ressort à chaque bilan de saison.'},
      {label:'Réclamer des résultats plus vite', hint:'Faire pression pour gagner maintenant',
        effect:{coach:-4,popularity:+3,morale:+1},
        outcome:'Tu fais entendre ton impatience haut et fort. Ça te rend immédiatement populaire dans les tribunes, beaucoup moins dans les bureaux feutrés du dessus.'}
    ]},

  {id:'franchise_sa_system', cat:'system', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='San Antonio' && (p.clubTenure||0)<=1,
    title:'L\'école la plus stricte de la ligue',
    body:'<i>(Le coach-mentor te fixe trois secondes de trop avant de corriger, sans un mot, l\'angle exact de ton pied pivot.)</i> Un système millimétré, une exigence de rigueur qui ne laisse rien passer, pas même un détail de replacement défensif à la 38e minute d\'un match de pré-saison. Ici, la légende dit qu\'on ne réinvente jamais la roue -- on se contente de l\'exécuter mieux que n\'importe qui d\'autre, saison après saison, sans jamais élever la voix.',
    choices:()=>[
      {label:'Se couler dans le moule, sans discuter', hint:'La discipline avant l\'ego',
        effect:{coach:+7,qi:+1},
        outcome:'Tu absorbes chaque consigne sans broncher, même la plus obscure. Le staff repère vite les joueurs qui écoutent vraiment -- et te classe illico dans cette case, rare et enviée.'},
      {label:'Garder ta touche personnelle', hint:'Défendre ton style, quitte à frotter',
        effect:{coach:-3,popularity:+2,morale:+1},
        outcome:'Tu gardes tes habitudes envers et contre tout. Le système laisse un peu de place à la fantaisie -- un tout petit peu, pas plus.'}
    ]},

  {id:'franchise_detroit_badboys', cat:'rivalry', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Detroit',
    title:'L\'héritage des Bad Boys',
    body:'<i>(Un vieux poster jauni traîne encore dans un couloir du complexe d\'entraînement -- personne n\'a jamais osé le décrocher.)</i> L\'histoire du club pèse sur chaque contact : ici, la défense doit se sentir dans les bras autant que dans les jambes adverses, et les vétérans du club racontent encore, avec un sourire un peu trop fier, l\'époque où la dureté se négociait à coups de fautes assumées plutôt qu\'à coups de charme. On attend de toi une intensité qui ne se discute pas.',
    weight:()=>0.45,
    choices:({p})=>[
      {label:'Assumer le rôle d\'intimidateur', hint:'La physicalité assumée, quitte à multiplier les fautes',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'def'),55); ctx.ok=ok;
          return ok?{reputation:+5,def:+1,coach:+3}:{coach:+1,popularity:+2}; },
        outcome:(ctx)=> ctx.ok?'Le message passe sans avoir besoin d\'un mot : l\'adversaire hésite un dixième de seconde de trop avant chaque pénétration. Exactement l\'héritage qu\'on attendait de toi.':'Les fautes s\'accumulent plus vite que les arrêts, l\'arbitre commence à te connaître par ton prénom. L\'intention plaît quand même énormément au staff.'},
      {label:'Défendre dur, mais proprement', hint:'La rigueur technique plutôt que l\'intimidation pure',
        effect:{def:+1,coach:+2},
        outcome:'Tu défends solide sans jamais franchir la ligne. Efficace, respecté -- même si les anciens du vestiaire trouvent ça un peu poli pour leur goût.'}
    ]},

  {id:'franchise_sacramento_curse', cat:'pressure', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Sacramento' && (p.clubTenure||0)>=3,
    title:'La malédiction des playoffs',
    body:'<i>(Un supporter brandit une pancarte qui compte les années depuis la dernière vraie campagne de playoffs. Le chiffre est gênant.)</i> Encore une saison où l\'équipe flirte avec la qualification sans jamais vraiment y croire jusqu\'au bout. Ici, le talent seul n\'a jamais suffi à briser la série -- et toute la ville en parle à mots couverts, comme d\'une malédiction qu\'on préfère ne pas prononcer trop fort de peur de la réveiller.',
    weight:()=>0.4,
    choices:({p})=>[
      {label:'Porter l\'équipe pour briser la série', hint:'Prendre le sujet à bras-le-corps',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi')+(p.clutch||0)*2,58); ctx.ok=ok;
          return ok?{reputation:+8,popularity:+8,morale:+6,flag:'clutchHero'}:{morale:-4,flag:'clutchChoker'}; },
        outcome:(ctx)=> ctx.ok?'Cette fois, la série ne se referme pas sur vous. La ville retient son souffle un instant de trop, puis explose comme si elle attendait ça depuis toujours -- ce qui est le cas.':'La malédiction tient bon une saison de plus. Tu sens le poids de toute une ville retomber sur tes épaules avant même que le buzzer ne sonne.'},
      {label:'Rester sobre, ne pas dramatiser', hint:'Refuser de porter le récit de la malédiction',
        effect:{morale:+2},
        outcome:'Tu refuses d\'y penser à voix haute, en public comme en privé. Ça n\'empêche absolument pas les chroniqueurs extérieurs de continuer, eux, très fort.'}
    ]},

  {id:'franchise_denver_altitude', cat:'personal', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Denver',
    title:'L\'altitude et l\'éloignement',
    body:'<i>(Un adversaire visiteur souffle bruyamment dès le second quart-temps, mains sur les hanches, encore loin de la mi-match.)</i> Les équipes de passage arrivent déjà cuites avant même le coup d\'envoi, un avantage bien réel dont tout le monde parle ici avec un sourire en coin. En dehors du parquet, en revanche, le marché reste loin de tous les projecteurs habituels -- un choix qu\'il faut apprendre à assumer plutôt qu\'à regretter.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Profiter à fond de l\'avantage local', hint:'Faire de l\'altitude une arme, saison après saison',
        effect:{coach:+3,reputation:+2},
        outcome:'Tu apprends à exploiter chaque possession face à des adversaires au bord de l\'asphyxie. Un vrai atout de franchise, jamais écrit sur aucune feuille de stats.'},
      {label:'Regretter l\'absence de lumière médiatique', hint:'Le mal du pays des grands marchés',
        effect:{media:-2,morale:-1},
        outcome:'Tu ressens l\'éloignement des projecteurs plus que prévu. Le club, lui, n\'a jamais vraiment compté dessus pour gagner -- et ça se voit.'}
    ]},

  {id:'franchise_okc_smallmarket', cat:'contract', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='OKC' && p.reputation>=45,
    title:'Le petit marché qui forme puis qui regarde partir',
    body:'<i>(Un journaliste local pose la question qu\'il pose à chaque star qui passe par ici : "Tu te vois rester longtemps ?" Le silence qui suit dure un peu trop.)</i> L\'histoire du club se répète, presque scénarisée : une pépite éclot ici, grandit à l\'abri des projecteurs, devient indispensable... puis finit tôt ou tard par réclamer un plus grand marché. Le front office te regarde déjà en se demandant, discrètement, si tu seras le prochain sur la liste.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Affirmer publiquement ton attachement', hint:'Rassurer la franchise et les tribunes',
        effect:{popularity:+4,coach:+4,reputation:+1},
        outcome:'Tes mots rassurent, au moins pour cette saison. Le doute reviendra, comme toujours ici, dès la première rumeur d\'intersaison.'},
      {label:'Rester vague sur ton avenir', hint:'Ne rien promettre, garder toutes les options ouvertes',
        effect:{coach:-3,popularity:-1,money:+10},
        outcome:'Ton silence, savamment entretenu, alimente la rumeur bien plus efficacement qu\'une déclaration. Les négociations, elles, s\'en trouvent nettement facilitées.'}
    ]},

  {id:'franchise_portland_loyalty', cat:'community', cooldown:6,
    when:(p,lg)=>p.league==='nba' && p.club==='Portland' && (p.clubTenure||0)>=4,
    title:'Fief isolé, fidélité totale',
    body:'<i>(Un enfant porte ton maillot dans les gradins depuis tellement de saisons qu\'il est devenu trop petit pour lui.)</i> Ici, rester longtemps se raconte comme une preuve d\'amour irréfutable, et partir comme une trahison qu\'on ne pardonne jamais tout à fait. Après toutes ces saisons dans ce fief à part, loin du tumulte des grands marchés, la ville te considère un peu comme un des siens -- ce qui est autant un honneur qu\'une obligation.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Endosser le rôle de figure loyale', hint:'Devenir le visage durable du club',
        effect:{popularity:+6,coach:+3,morale:+2},
        outcome:'Tu embrasses ce statut à bras ouverts. Ici, la fidélité pèse plus lourd qu\'ailleurs, et ça s\'entend dans chaque ovation, même après une défaite.'},
      {label:'Garder ouverte l\'idée d\'un jour partir', hint:'Ne pas s\'enfermer dans un seul maillot',
        effect:{popularity:-4,coach:-2},
        outcome:'Le simple doute, une phrase mal tournée en interview, suffit à refroidir une partie du public. Ici, ça ne pardonne vraiment pas facilement.'}
    ]},

  {id:'franchise_chicago_legacy', cat:'pressure', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Chicago' && (p.clubTenure||0)<=1,
    title:'L\'ombre d\'un ancien numéro 23',
    body:'<i>(Une vitrine du hall d\'entrée expose encore, sous verre, des reliques d\'une autre époque -- personne ne songerait à les ranger.)</i> Dans ce vestiaire, une ombre plane sur tout le monde depuis des décennies : celle d\'un ancien numéro 23 devenu la légende absolue de la maison, celle à laquelle chaque nouvel arrivant est comparé avant même d\'avoir joué une minute. Quoi que tu fasses ici, la comparaison n\'est jamais bien loin -- ni bienveillante, ni vraiment évitable.',
    choices:()=>[
      {label:'Assumer la comparaison, viser haut', hint:'Se mesurer à la légende plutôt que la fuir',
        effect:{reputation:+4,popularity:+4,morale:-2},
        outcome:'Tu joues avec la comparaison au lieu de la subir en silence. Risqué, presque effronté -- mais la salle adore l\'ambition affichée sans complexe.'},
      {label:'S\'en détacher complètement', hint:'Tracer ta propre trajectoire, loin des comparaisons',
        effect:{morale:+3,coach:+1},
        outcome:'Tu refuses poliment le parallèle à chaque interview. Plus tranquille, même si l\'histoire du club continue de planer, silencieuse, au-dessus du parquet.'}
    ]},

  {id:'franchise_toronto_expat', cat:'personal', once:true,
    when:(p,lg)=>p.league==='nba' && p.club==='Toronto' && (p.clubTenure||0)<=1,
    title:'Seul club hors des États-Unis',
    body:'<i>(Un douanier feuillette ton passeport avec un mélange de routine et d\'amusement -- il connaît déjà ton visage.)</i> Douanes à chaque déplacement, décalage climatique brutal, hymne différent avant chaque match à domicile : ici, chaque aller-retour rappelle que ce club évolue dans un autre pays que tous les autres de la ligue. Une expatriation en bonne et due forme, rien qu\'en signant ton contrat.',
    choices:()=>[
      {label:'Faire de la différence une force', hint:'Embrasser le statut à part du club',
        effect:{coach:+3,popularity:+3},
        outcome:'Tu adoptes vite les habitudes locales, jusqu\'à en devenir un ambassadeur malgré toi. Le club savoure d\'avoir enfin quelqu\'un qui ne subit pas la situation en silence.'},
      {label:'Regretter le confort du marché américain', hint:'Le mal du pays, difficile à cacher',
        effect:{morale:-3,coach:-1},
        outcome:'La distance pèse plus que prévu, saison après saison. Rien de grave, mais l\'adaptation prend nettement plus de temps que ce que tout le monde imaginait.'}
    ]},

  {id:'franchise_houston_threeball', cat:'system', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Houston',
    title:'Le tir à mi-distance, banni ou presque',
    body:'<i>(Un analyste du front office pointe un graphique sur une tablette, l\'air presque outré par ta dernière tentative à mi-distance.)</i> L\'analytics du club est sans appel, gravé dans le marbre des réunions de pré-saison : le tir à mi-distance est presque proscrit, remplacé par une chasse permanente au tir à trois points ou au panier tout près du cercle. Le staff surveille chaque écart au tableau de bord comme on surveille un compte en banque qui déraille.',
    weight:()=>0.45,
    choices:({p})=>[
      {label:'Se plier entièrement à la doctrine', hint:'Ne shooter que là où le système l\'autorise',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'adr3'),58); ctx.ok=ok;
          return ok?{reputation:+5,coach:+5,adr3:+1}:{coach:+2}; },
        outcome:(ctx)=> ctx.ok?'Tu colles au plan à la lettre, les tirs longue distance tombent, le tableau de bord du staff affiche enfin des couleurs vertes du sol au plafond.':'Tu respectes la doctrine mais l\'adresse ne suit pas ce soir-là. Le staff salue quand même la discipline du choix, avec une grimace polie.'},
      {label:'Garder ton tir de mi-distance favori', hint:'Assumer un geste que le système déteste ouvertement',
        effect:{coach:-4,popularity:+2},
        outcome:'Tu gardes ta botte secrète, envers et contre les statistiques. Efficace pour toi, hérétique pour le plan du club -- et ça se sent dans les regards de la vidéo du lendemain.'}
    ]},

  {id:'franchise_minnesota_cold', cat:'morale', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Minnesota',
    title:'Le froid et la longue traversée du désert',
    body:'<i>(La voiture refuse de démarrer sur le parking du centre d\'entraînement pour la deuxième fois de la semaine.)</i> Dehors, un froid glacial qui décourage même les plus motivés de mettre un pied hors du hall d\'entraînement. Sur le parquet, une franchise qui traîne une réputation de malchance récurrente depuis si longtemps que même les supporters en plaisantent avec une tendresse un peu résignée.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Transformer la grisaille en abnégation', hint:'Utiliser l\'isolement pour se concentrer sur le travail',
        effect:{coach:+4,qi:+1},
        outcome:'Tu profites du calme forcé pour peaufiner des détails que d\'autres marchés, plus distrayants, n\'auraient jamais pris le temps de travailler.'},
      {label:'Se laisser gagner par la morosité ambiante', hint:'Subir l\'ambiance plutôt que la combattre',
        effect:{morale:-3},
        outcome:'Le moral en prend un coup, lentement mais sûrement. Rien d\'irréversible, mais l\'hiver semble ici ne jamais vouloir vraiment finir.'}
    ]},

  {id:'franchise_phoenix_heat', cat:'form', cooldown:4,
    when:(p,lg)=>p.league==='nba' && p.club==='Phoenix',
    title:'La chaleur du désert et un effectif fatigué',
    body:'<i>(Le thermomètre du gymnase affiche un chiffre que le staff médical préfère ne pas commenter à voix haute.)</i> La chaleur écrasante rend chaque entraînement plus éprouvant que prévu, et l\'effectif vieillissant autour de toi collectionne les petits pépins comme on collectionne des timbres. Le staff médical cherche à relancer la machine sans la casser un peu plus -- un exercice d\'équilibriste permanent.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Pousser malgré la chaleur', hint:'Ne pas lever le pied, quitte à forcer sur le corps',
        effect:{fitness:-4,coach:+3,reputation:+2},
        outcome:'Tu tiens la cadence sous une chaleur qui plie les meilleurs. Le staff apprécie visiblement, ton corps encaisse la facture un peu plus tard dans la saison.'},
      {label:'Gérer sa charge avec prudence', hint:'Épargner ton corps pour la durée de la saison',
        effect:{fitness:+4,coach:-1},
        outcome:'Tu doses ton effort, méthodiquement. Moins spectaculaire à l\'entraînement, mais tu arrives frais aux moments qui comptent vraiment.'}
    ]},

  {id:'franchise_milwaukee_smallmarket', cat:'contract', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Milwaukee' && p.reputation>=50,
    title:'Le petit marché qui a décroché le gros lot',
    body:'<i>(Un vendeur de journaux crie un titre qui reformule, pour la centième fois cette année, la même question existentielle de la ville.)</i> Ici, tout le monde sait que la franchise a mis la main sur un talent rare pour un marché de cette taille -- et vit dans la peur sourde et permanente de le voir un jour partir voir plus grand ailleurs. La moindre rumeur d\'ambition suffit à mettre la ville entière sur les nerfs pendant une semaine.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Calmer le jeu publiquement', hint:'Rassurer la franchise sur tes intentions',
        effect:{popularity:+3,coach:+4},
        outcome:'Tes déclarations calment la ville, au moins pour un temps. Ici, on retient collectivement son souffle à chaque intersaison, comme un rituel.'},
      {label:'Laisser planer le doute', hint:'Ne fermer aucune porte pour l\'avenir',
        effect:{coach:-3,media:+4},
        outcome:'Le silence entretient la rumeur bien au-delà du vestiaire, jusque dans les journaux du dimanche. La ville n\'aime vraiment pas ça, mais elle ne peut rien y faire.'}
    ]},

  {id:'franchise_washington_identity', cat:'community', cooldown:5,
    when:(p,lg)=>p.league==='nba' && p.club==='Washington',
    title:'La capitale cherche encore son identité',
    body:'<i>(Une invitation officielle atterrit dans ta boîte mail entre deux dossiers de scouting, tampon institutionnel bien visible.)</i> Entre galas protocolaires, invitations officielles qui s\'accumulent sans prévenir, et une franchise qui peine à se trouver une identité sportive stable depuis des années, difficile de savoir ce qu\'on retiendra vraiment de ton passage ici -- le jeu, ou le nombre de dîners auxquels tu as assisté.',
    weight:()=>0.4,
    choices:()=>[
      {label:'Te concentrer sur le seul basket', hint:'Ignorer le tumulte institutionnel autour du club',
        effect:{coach:+3,fitness:+1},
        outcome:'Tu fais abstraction du bruit ambiant, poliment mais fermement. Discret, mais nettement plus efficace pour construire ta propre trajectoire ici.'},
      {label:'Profiter des mondanités de la capitale', hint:'S\'ouvrir aux sollicitations officielles',
        effect:{media:+4,popularity:+3,coach:-2},
        outcome:'Tu multiplies les apparitions institutionnelles, costume impeccable. Bonne visibilité, un peu moins de temps pour le travail au gymnase -- un compromis assumé.'}
    ]},
];
