import { STYLES } from '../styles.js';
import { LEGENDS } from '../legends.js';
import { pick } from '../../engine/utils.js';

/* ============================================================
   PHASE DÉBUT DE CARRIÈRE — premiers entraînements, adaptation,
   pression des recruteurs, découverte du haut niveau, lutte pour
   du temps de jeu, premiers contrats.
============================================================ */
export const EARLY_EVENTS = [
  {id:'coach_pos', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>lg.tier>=4 && p.age<=21,
    title:'Le coach veut te changer de poste',
    body:({p})=>`Ton entraîneur pense que ton avenir est ailleurs que là où tu joues. « Tu as le profil pour évoluer différemment », te dit-il. Accepter, c'est repartir un peu de zéro pour gagner en polyvalence.`,
    choices:()=>[
      {label:'Accepter et apprendre le nouveau rôle', hint:'Un pari sur la polyvalence, au prix d\'un moral en berne au début',
        effect:{qi:+4, passe:+2, def:+2, morale:-3}, outcome:'Tu ravales ta fierté et bosses le nouveau poste. Ton intelligence de jeu grimpe.'},
      {label:'Refuser, rester sur tes forces', hint:'Tu tiens ta ligne, quitte à froisser le staff',
        effect:{coach:-4}, outcome:'Tu tiens ta ligne. Le coach hausse les épaules, un peu déçu.'}
    ]},

  {id:'early_pro', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>lg.tier===5 && p.age>=17 && p.age<=19,
    title:'Un club pro te fait les yeux doux',
    body:({p})=>`Un club de division inférieure te propose de signer pro tout de suite. Plus d'argent, mais moins de temps de jeu garanti face à des adultes. La formation, elle, te laisserait dominer ta catégorie encore un an.`,
    weight:()=>1.4,
    choices:()=>[
      {label:'Signer pro maintenant', hint:'Le grand saut, tout de suite',
        // lg.tier===5 couvre 'academy' (voie eu/au) ET 'college' (voie us) : la voie us n'a pas
        // de "2e division" domestique, le grand saut équivalent y est la G League.
        effect:({p})=>({forceMove:{type:'promo', to:p.nation.path==='au'?'nbl1':p.nation.path==='us'?'gleague':'second'}, morale:+4, money:+30}),
        outcome:'Tu franchis le pas vers le monde pro plus tôt que prévu.'},
      {label:'Rester en formation encore un an', hint:'Dominer avant de monter',
        effect:{tir:+2, dribble:+2, qi:+1}, outcome:'Tu restes et tu écrases ta catégorie. Ton jeu s\'affine.'}
    ]},

  {id:'growth_spurt', cat:'youth', phase:'early', cooldown:2,
    when:(p,lg)=>p.age<=20,
    title:'Poussée de croissance',
    body:`Ton corps change vite. Bien géré, c'est de l'explosivité en plus. Mal géré, ce sont des douleurs de croissance qui traînent.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Programme de renforcement encadré', hint:'Encaisser un peu de fatigue pour gagner en explosivité',
        effect:{ath:+4, fitness:-4}, outcome:'Tu prends de la caisse. Les cuisses brûlent, mais ça paie.'},
      {label:'Y aller doucement, préserver le corps', hint:'La prudence avant tout',
        effect:{ath:+1, fitness:+5}, outcome:'Tu temporises. Le corps te remercie.'}
    ]},

  {id:'mentor', cat:'locker', phase:'early', once:true,
    when:(p,lg)=>p.age<=24 && lg.tier<=3,
    title:'Un vétéran te prend sous son aile',
    body:`Un ancien du vestiaire, en fin de carrière, voit quelque chose en toi. Il te propose de te transmettre ce qu'il sait, à condition que tu sois assidu.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Boire ses conseils, arriver plus tôt chaque jour', hint:'Se mettre à l\'école d\'un ancien',
        effect:{qi:+4, def:+3, morale:+2}, outcome:'Ses lectures de jeu deviennent les tiennes. Tu grandis vite.'},
      {label:'Le remercier mais rester dans ton coin', hint:'Tu préfères ta propre méthode',
        effect:{morale:+1}, outcome:'Tu préfères ta propre méthode. Le vétéran respecte, sans insister.'}
    ]},

  {id:'idol', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>p.age<=19,
    title:'Ton idole de jeunesse',
    body:({p})=>{ const L=pick(LEGENDS[p.pos]||['un immense joueur']);
      return `<i>(Casque sur les oreilles, vieilles mixtapes en boucle jusqu'à 2h du matin.)</i> Gamin, tu as usé les vidéos de <b>${L}</b>. Ce soir, tu bosses en repensant à ce qui t'a fait aimer ce jeu.`; },
    weight:()=>0.75,
    choices:({p})=>[
      {label:'Copier ses gestes signature', hint:'Imiter le geste, en espérant que ça rentre',
        effect:({p})=>{ const st=STYLES.find(x=>x.id===p.style); const k=st?Object.keys(st.boost)[0]:'tir'; return {[k]:+3, morale:+2}; },
        outcome:'Tu passes des heures à imiter ses moves. À force, ça rentre.'},
      {label:'T\'inspirer surtout de sa mentalité', hint:'Retenir l\'état d\'esprit plutôt que le geste',
        effect:{qi:+2, coach:+2}, outcome:'Tu retiens son état d\'esprit de tueur. Ça vaut de l\'or.'}
    ]},

  {id:'rookie_interview', cat:'interview', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length<=1 && p.age<=22,
    title:'Ta première grande interview',
    body:()=>`<i>(Micro tendu, spots dans les yeux, ton cœur bat un peu vite.)</i> Pour ta première interview télé marquante, le ton que tu donnes va coller à ton image un moment.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Humble et travailleur', hint:'L\'image sage et sérieuse',
        effect:{coach:+4, reputation:+2}, outcome:'Tu tapes juste : le staff et les vétérans apprécient ta modestie.'},
      {label:'Ambitieux et sûr de toi', hint:'L\'image qui affiche ses ambitions',
        effect:{popularity:+6, morale:+3}, outcome:'Tu affiches tes ambitions. Le public accroche, la pression monte d\'un cran.'}
    ]},

  {id:'recruiter_pressure', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>lg.tier>=4 && p.age>=17 && p.age<=20,
    title:'Les recruteurs sont dans les tribunes',
    body:()=>`<i>(Rangée du fond, carnets et radars de vitesse, quelques visages que tu commences à reconnaître.)</i> Ce soir, plusieurs recruteurs sont annoncés dans le gymnase. Chaque possession compte double dans leur regard.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Jouer ton jeu habituel, sans en rajouter', hint:'Rester toi-même, sans forcer le trait',
        effect:{qi:+2, coach:+2}, outcome:'Tu restes fidèle à ton jeu. Certains y voient de la maturité.'},
      {label:'En faire trois fois plus pour te faire remarquer', hint:'Forcer le trait pour capter l\'attention',
        effect:()=>(Math.random()<0.5)?{reputation:+5, popularity:+3}:{reputation:-1, coach:-2, perfBonus:-2},
        outcome:'Tu forces les prises de responsabilités. Ça retient l\'attention... pour le meilleur ou pour le pire.'}
    ]},

  {id:'first_pro_contract', cat:'contract', phase:'early', once:true,
    when:(p,lg)=>lg.tier<=4 && p.seasons.length<=2,
    title:'Ton premier vrai contrat pro',
    body:()=>`<i>(Bureau du club, dossier sur la table, un stylo qu'on te tend.)</i> Après des années de formation, voici ton premier contrat de joueur professionnel. Les clauses ne sont pas anodines.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Signer un contrat court, garder ta liberté', hint:'Rester mobile, quitte à moins sécuriser',
        effect:{morale:+3, reputation:+1}, outcome:'Tu gardes les mains libres pour la suite. Un pari sur toi-même.'},
      {label:'Signer long, sécuriser une base', hint:'La stabilité avant l\'ambition',
        effect:{money:+40, coach:+3}, outcome:'Tu poses une fondation stable. De quoi voir venir.'}
    ]},

  {id:'draft_bust_label', cat:'media', phase:'early', once:true,
    when:(p,lg)=>{ const s=p.seasons[0]; return p.draftPos!=null && p.draftPos<=14 && s && s.league==='nba' && s.minutes<18; },
    title:'L\'étiquette qui commence à coller',
    body:({p})=>`Choisi haut à la draft, tu étais annoncé comme une pièce maîtresse. Ta première saison, discrète, fait déjà jaser : certains médias sortent le mot qui fait peur pour un joueur de ton rang. L'étiquette est facile à coller, dure à décoller.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Répondre en travaillant dans l\'ombre', hint:'Le travail plutôt que les mots, pour faire mentir l\'étiquette',
        effect:{qi:+2, tir:+1, coach:+3, flag:'bust'}, outcome:'Tu ignores le bruit et retournes t\'entraîner. La réponse viendra sur le terrain, ou pas.'},
      {label:'Répondre publiquement, remettre les choses en perspective', hint:'Le contre publiquement, quitte à s\'exposer',
        effect:{popularity:+2, reputation:-2, flag:'bust'}, outcome:'Tu prends la parole pour calmer le jeu. Ça ne convainc pas tout le monde.'}
    ]},

  {id:'first_start_nerves', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length===0,
    title:'Ton tout premier match chez les pros',
    body:()=>`<i>(Vestiaire silencieux, le bruit de la salle qui monte de l'autre côté du mur.)</i> Dans quelques minutes, ton tout premier match au niveau professionnel. Le trac est bien réel.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Respirer, se concentrer sur les fondamentaux', hint:'Revenir aux bases pour calmer le trac',
        effect:{qi:+2, morale:+2}, outcome:'Tu ramènes ton attention sur ce que tu sais faire. Le trac redescend.'},
      {label:'Laisser parler l\'excitation, foncer', hint:'Jouer sur l\'adrénaline du moment',
        effect:()=>(Math.random()<0.5)?{reputation:+4, morale:+4}:{morale:-2, perfBonus:-2},
        outcome:'Tu te laisses porter par l\'instant. Premier match à quitte ou double.'}
    ]},

  {id:'position_battle', cat:'youth', phase:'early', cooldown:2,
    when:(p,lg)=>p.seasons.length<=2 && p.age<=22,
    title:'Un autre jeune vise ta place',
    body:()=>`<i>(Deux serviettes côte à côte au même casier de secours, deux noms sur la même ligne du tableau.)</i> Un autre prospect de ton âge pousse fort à l'entraînement pour le même temps de jeu que toi. Le coach observe qui va lâcher le premier.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Hausser ton propre niveau, sans un mot', hint:'Répondre par le travail plutôt que par les mots',
        effect:{qi:+1, coach:+3, perfBonus:+3}, outcome:'Tu réponds sur le terrain, sans un mot de trop. Le coach note la maturité.'},
      {label:'Nouer une vraie amitié malgré la concurrence', hint:'La solidarité, même en concurrence directe',
        effect:{morale:+4, coach:+1}, outcome:'Vous vous poussez mutuellement à l\'entraînement. La rivalité reste saine.'}
    ]},

  {id:'homesick', cat:'personal', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length<=1,
    title:'Le mal du pays',
    body:()=>`<i>(Appartement encore à moitié vide, cartons non défaits dans un coin.)</i> Loin des tiens pour la première fois, les soirées seul te pèsent plus que tu ne l'aurais cru. Le basket, lui, n'attend pas.`,
    weight:()=>0.75,
    choices:()=>[
      {label:'Appeler les tiens tous les soirs', hint:'Garder le lien, quitte à y penser encore plus',
        effect:{morale:+5, fitness:-1}, outcome:'Entendre leurs voix chaque soir t\'aide à tenir. Le mal du pays s\'apprivoise.'},
      {label:'Te jeter à corps perdu dans le travail', hint:'Combler le vide par le gymnase',
        effect:{qi:+2, ath:+1, morale:-2}, outcome:'Tu meubles le vide par des heures de gymnase en plus. Efficace, mais solitaire.'}
    ]},

  {id:'temper_flareup', cat:'youth', phase:'early', cooldown:3,
    when:(p,lg)=>p.age<=23,
    title:'Le sang qui monte trop vite',
    body:()=>`Une faute non sifflée, un mot de trop d'un adversaire, et ton sang ne fait qu'un tour. L'arbitre a le sifflet déjà à la bouche.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Encaisser et faire parler le jeu', hint:'Ravaler la colère, laisser le terrain répondre',
        effect:{qi:+3, coach:+2}, outcome:'Tu ravales ta colère. Le coach salue le sang-froid retrouvé.'},
      {label:'Laisser sortir la frustration', hint:'Craquer, quitte à en payer le prix',
        effect:()=>(Math.random()<0.4)?{reputation:-4, coach:-3, flag:'hothead'}:{morale:+2, popularity:+2, flag:'hothead'},
        outcome:'Tu craques. La salle retient son souffle en attendant la décision de l\'arbitre.'}
    ]},

  {id:'rookie_hazing', cat:'locker', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length===0 && lg.tier<=3,
    title:'Le rituel des anciens',
    body:()=>`<i>(Rires étouffés dans le fond du bus, un vétéran qui pousse un micro imaginaire dans ta direction.)</i> Comme chaque nouvelle recrue, tu as droit au petit rituel du vestiaire : chanter devant tout le monde, offrir le petit-déjeuner, ou porter les sacs pendant un mois.`,
    weight:()=>0.85,
    choices:()=>[
      {label:'Jouer le jeu à fond, sans complexe', hint:'Se prêter au jeu sans faire d\'histoires',
        effect:{morale:+3, popularity:+2, coach:+1}, outcome:'Tu t\'y prêtes de bonne grâce. Le vestiaire t\'adopte immédiatement.'},
      {label:'Décliner poliment mais fermement', hint:'Poser une limite, dès le début',
        effect:{coach:-1, qi:+1}, outcome:'Tu déclines poliment. Quelques sourcils se lèvent, mais on respecte le choix.'}
    ]},

  {id:'first_dnp', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length>=1 && p.seasons.length<=2,
    title:'Zéro minute, en survêtement',
    body:()=>`<i>(Bout du banc, survêtement zippé jusqu'au cou, les minutes qui défilent sans que ton nom soit appelé.)</i> Pour la première fois, tu passes un match entier sans toucher le terrain. Simple choix tactique, ou début d'une tendance ?`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Rester positif sur le banc, encourager les copains', hint:'Rester dans le match, même sans jouer',
        effect:{coach:+4, morale:+1}, outcome:'Tu restes dans le match jusqu\'au bout, debout à encourager. Le staff le remarque.'},
      {label:'Ruminer en silence', hint:'Encaisser la frustration, sans le montrer',
        effect:{morale:-3, qi:+1}, outcome:'Tu ravales la frustration. Ça travaille en toi, en silence.'}
    ]},

  {id:'starstruck_matchup', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length<=2 && lg.tier<=3,
    title:'En face de ton idole d\'enfance',
    body:()=>`<i>(Échauffement, tu jettes un œil vers le banc adverse.)</i> Ce soir, tu partages le parquet avec un joueur que tu regardais à la télé, gamin. Difficile de ne pas y penser en s'échauffant.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Aller le saluer avant le match', hint:'Le respect, assumé avant la compétition',
        effect:{morale:+3, popularity:+2}, outcome:'Un bref échange, une poignée de main. Tu gardes la tête froide malgré l\'émotion.'},
      {label:'Rester concentré, garder tes distances', hint:'La compétition avant tout, sans s\'attendrir',
        effect:{qi:+2, coach:+2}, outcome:'Tu gardes tes distances, focus total. Le respect viendra après le buzzer.'}
    ]},

  {id:'sibling_legacy', cat:'youth', phase:'early', once:true,
    when:(p,lg)=>p.age<=21 && p.reputation>=20,
    title:'L\'ombre d\'un nom de famille',
    body:()=>`Un aîné de ta famille a lui aussi porté un maillot, à un niveau qui reste dans les mémoires du coin. Chaque bon match ravive la comparaison ; chaque mauvais aussi.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Revendiquer l\'héritage à voix haute', hint:'Assumer publiquement la comparaison',
        effect:{popularity:+5, reputation:+2, morale:+1}, outcome:'Tu embrasses la comparaison sans complexe. Le public aime l\'histoire.'},
      {label:'Tracer ta propre route, loin de l\'étiquette', hint:'Se construire un nom à part',
        effect:{qi:+2, coach:+2}, outcome:'Tu refuses qu\'on te réduise à un nom de famille. Ton jeu parle pour toi seul.'}
    ]},

  {id:'naive_contract', cat:'contract', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length===0 && lg.tier<=4,
    title:'Un premier papier à signer, sans personne pour te conseiller',
    body:()=>`<i>(Bureau exigu, un club dirigeant pressé, un stylo qu'on te tend directement.)</i> Personne de ton entourage ne connaît vraiment ce monde-là. Le club te propose de signer là, maintenant, sans attendre.`,
    weight:()=>0.85,
    choices:()=>[
      {label:'Signer tout de suite, faire confiance', hint:'La confiance immédiate, sans recul',
        effect:()=>(Math.random()<0.45)?{money:+10, coach:+3}:{money:-15, morale:-2},
        outcome:'Tu signes sans attendre. Avec le recul, les clauses n\'étaient peut-être pas toutes à ton avantage.'},
      {label:'Demander un délai pour te renseigner', hint:'Prendre le temps, quitte à agacer',
        effect:{qi:+2, money:+15}, outcome:'Tu prends le temps de comprendre chaque ligne. Un réflexe qui te servira toute ta carrière.'}
    ]},

  {id:'hostile_crowd', cat:'youth', phase:'early', cooldown:2,
    when:(p,lg)=>p.seasons.length<=3,
    title:'Premier vrai chaudron hostile',
    body:()=>`<i>(Sifflets dès l'annonce des compositions, une salle entière qui scande contre toi.)</i> C'est ton premier vrai déplacement dans une ambiance franchement hostile. Le bruit est fait pour te faire douter.`,
    weight:()=>0.75,
    choices:()=>[
      {label:'Faire taire la salle par le jeu', hint:'Le silence de la salle comme objectif',
        effect:(ctx)=>{ const ok=Math.random()<0.55; ctx.ok=ok; return ok?{reputation:+4, morale:+4}:{morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Tu enchaînes les bons coups, la salle se tait peu à peu. Sensation grisante.':'Le bruit finit par te gagner un peu. Soirée compliquée.'},
      {label:'Ignorer complètement le bruit ambiant', hint:'Se couper mentalement de l\'ambiance',
        effect:{qi:+2, coach:+2}, outcome:'Tu te coupes du bruit, concentré sur ta tâche. Une habitude à prendre tôt.'}
    ]},

  {id:'jersey_number', cat:'personal', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length===0,
    title:'Choisir ton numéro',
    body:()=>`<i>(Le responsable équipement pose un catalogue de flocages devant toi.)</i> Le numéro que tu portes ce soir-là, tu le garderas sans doute longtemps. Un choix presque symbolique avant ta première saison.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Reprendre un numéro qui compte pour toi', hint:'Un choix chargé de sens personnel',
        effect:{morale:+3}, outcome:'Le numéro te suit depuis toujours. Le porter ici a un goût particulier.'},
      {label:'Prendre ce qui reste de disponible, sans y penser', hint:'Le pragmatisme, sans s\'attarder',
        effect:{qi:+1}, outcome:'Tu ne t\'attardes pas sur le symbole. Il y a plus important à régler.'}
    ]},

  {id:'youth_national_call', cat:'nation', phase:'early', once:true,
    when:(p,lg)=>p.age<=19 && p.reputation>=18 && !p.natCap,
    title:'Convocation chez les jeunes de la sélection',
    body:({p})=>`<i>(Un email officiel, l'en-tête de la fédération, ton nom dans la liste des convoqués.)</i> La sélection ${p.nation.flag} des jeunes t'appelle pour un rassemblement. Ce n'est pas encore l'équipe A, mais c'est un premier pas vers le maillot national.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Répondre présent avec fierté', hint:'Un premier pas vers la sélection A',
        effect:{reputation:+3, morale:+4, popularity:+1}, outcome:'Tu enfiles le maillot des jeunes avec fierté. Un avant-goût de ce qui pourrait venir.'},
      {label:'Décliner, priorité au club cette période', hint:'Le club avant tout, pour l\'instant',
        effect:{coach:+3}, outcome:'Tu préfères te concentrer sur ton club cette période-ci. La fédération comprend.'}
    ]},

  {id:'physicality_jump', cat:'form', phase:'early', cooldown:2,
    when:(p,lg)=>p.seasons.length<=2,
    title:'Le choc de la physicalité adulte',
    body:()=>`Les contacts sont d'un autre calibre que ce que tu as connu jusqu'ici. Chaque possession laisse une marque, et le corps doit vite apprendre à encaisser.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Musculation intensive pour tenir le choc', hint:'Prendre de la masse pour encaisser',
        effect:{ath:+3, fitness:-3}, outcome:'Tu prends de la masse rapidement. Les contacts font désormais moins mal.'},
      {label:'Travailler l\'évitement plutôt que le contact', hint:'La technique plutôt que le rapport de force',
        effect:{qi:+2, dribble:+1}, outcome:'Tu apprends à jouer autour des contacts plutôt qu\'à les subir.'}
    ]},

  {id:'road_trip_fatigue', cat:'youth', phase:'early', cooldown:2,
    when:(p,lg)=>p.seasons.length<=2,
    title:'Le rythme épuisant des déplacements',
    body:()=>`<i>(Bus de nuit, aéroport à l'aube, hôtel anonyme, match le soir même.)</i> Personne ne t'avait prévenu à quel point le calendrier serait usant. La fatigue de déplacement se gère aussi, et ça s'apprend.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Discipliner ton sommeil coûte que coûte', hint:'La rigueur du repos, même en déplacement',
        effect:{fitness:+5, qi:+1}, outcome:'Tu deviens rigoureux sur ton sommeil, même en déplacement. Un vétéran te complimente sur ta discipline.'},
      {label:'Profiter des trajets pour décompresser', hint:'Les trajets comme moment de respiration',
        effect:{morale:+4, fitness:-2}, outcome:'Tu profites des trajets pour souffler. Bon pour le moral, un peu moins pour la récupération.'}
    ]},

  {id:'coach_public_praise', cat:'media', phase:'early', once:true,
    when:(p,lg)=>p.seasons.length>=1 && p.seasons.length<=3 && p.coach>=65,
    title:'Le coach te complimente devant les médias',
    body:()=>`<i>(Conférence d'après-match, un journaliste pose une question sur toi.)</i> Pour la première fois, ton entraîneur te cite en exemple ouvertement devant la presse. Un vrai coup de projecteur, inattendu à ce stade.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Répondre par plus de travail encore', hint:'Ne pas se reposer sur le compliment',
        effect:{qi:+2, coach:+3}, outcome:'Tu prends le compliment comme un point de départ, pas un aboutissement.'},
      {label:'Savourer pleinement ce premier vrai coup de projecteur', hint:'Profiter simplement du moment',
        effect:{morale:+4, popularity:+3}, outcome:'Tu savoures ce premier coup de projecteur mérité. Un souvenir qui restera.'}
    ]},
];
