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
        effect:({p})=>({forceMove:{type:'promo', to:p.nation.path==='au'?'nbl1':'second'}, morale:+4, money:+30}),
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
];
