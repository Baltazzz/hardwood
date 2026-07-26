import { LEGENDS } from '../legends.js';
import { ovr, roleOf, attrOf } from '../../engine/player.js';
import { actionRoll, pick } from '../../engine/utils.js';
import { mediaWeight, clutchWeight } from './_helpers.js';

/* ============================================================
   PHASE MILIEU DE CARRIÈRE — conquête du statut titulaire puis
   star, pression médiatique, grosses blessures, rivalités,
   leadership, transferts importants, contrats majeurs.
============================================================ */
export const MID_EVENTS = [
  {id:'star_clash', cat:'locker', phase:'mid', cooldown:4,
    when:(p,lg)=>lg.tier<=3 && p.reputation>=40 && (p.clubTenure||0)>=1,
    title:'Bras de fer avec la star de l\'équipe',
    body:({p})=>`Le leader du vestiaire supporte mal ta montée en puissance. Les ballons circulent moins vers toi. Il faut trancher.`,
    choices:()=>[
      {label:'T\'imposer, réclamer plus de ballons', hint:'Le rapport de force, quitte à tendre le vestiaire',
        effect:{reputation:+5, perfBonus:+6, coach:-3, morale:-2}, outcome:'Tu prends le pouvoir sur le terrain. Le vestiaire se réorganise autour de toi.'},
      {label:'Jouer collectif, gagner le respect par le travail', hint:'La patience, pour gagner le respect autrement',
        effect:{coach:+5, qi:+2, morale:+3}, outcome:'Tu baisses la tête et bosses. Peu à peu, le respect vient.'}
    ]},

  {id:'rivalry', cat:'rivalry', phase:'mid', cooldown:3,
    when:(p,lg)=>p.reputation>=45 && lg.tier<=2,
    title:'Un rival te cherche',
    body:`Un joueur de ton calibre, dans une équipe adverse, t'a pris pour cible dans la presse. Le duel est lancé.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Répondre sur le terrain', hint:'Laisser parler ton jeu',
        effect:{perfBonus:+5, reputation:+3, morale:+2, flag:'rival'}, outcome:'Tu laisses parler ton jeu. Le duel devient un classique.'},
      {label:'Ignorer et rester au-dessus', hint:'La sérénité, plutôt que le duel public',
        effect:{coach:+3, qi:+1, flag:'rival'}, outcome:'Tu ne rentres pas dans son jeu. Les observateurs saluent ta maturité.'}
    ]},

  {id:'leadership', cat:'leadership', phase:'mid', cooldown:4,
    when:(p,lg)=>ovr(p)>=76 && (p.clubTenure||0)>=1,
    title:'Le vestiaire se tourne vers toi',
    body:`Les jeunes du groupe cherchent un repère, et ton nom revient. Endosser ce rôle, c'est du poids et de l'influence.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Devenir le leader du vestiaire', hint:'Endosser le rôle et son poids',
        effect:{reputation:+4, coach:+3, morale:+2, flag:['mentorLegacy','leaderRep']}, outcome:'Tu prends la parole, tu montres l\'exemple. Le groupe te suit.'},
      {label:'Mener par l\'exemple, sans le rôle', hint:'Les actes plutôt que les discours',
        effect:{qi:+2}, outcome:'Tu préfères les actes aux discours.'}
    ]},

  {id:'coach_change', cat:'system', phase:'mid', cooldown:4,
    when:(p,lg)=>lg.tier<=3,
    title:'Nouveau coach, nouveau système',
    body:`Le club change d'entraîneur. Sa philosophie ne ressemble pas à celle de son prédécesseur : à toi de t'y adapter.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Épouser son système à fond', hint:'S\'aligner complètement sur le nouveau projet',
        effect:{qi:+2, coach:+5}, outcome:'Tu deviens un relais du coach sur le terrain.'},
      {label:'Imposer ton style', hint:'Garder ta patte, au risque de la friction',
        effect:{reputation:+3, coach:-4, perfBonus:+3}, outcome:'Tu joues à ta main. Le courant passe mal avec le staff.'}
    ]},

  {id:'playoff_push', cat:'pressure', phase:'mid', cooldown:2,
    when:(p,lg)=>lg.tier<=2 && p.reputation>=40,
    title:'Match couperet en playoffs',
    body:`Série décisive, tout se joue ce soir. Le coach te demande si tu veux le ballon dans le money-time.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Réclamer les ballons chauds', hint:'Prendre la responsabilité, quoi qu\'il en coûte',
        effect:{perfBonus:+6, reputation:+2}, outcome:'Tu prends tes responsabilités dans le money-time. Frissons garantis.'},
      {label:'Faire confiance au collectif', hint:'Servir le collectif plutôt que forcer',
        effect:{coach:+3, qi:+1}, outcome:'Tu joues juste, tu sers les copains. Le coach apprécie.'}
    ]},

  {id:'clutch_shot', cat:'clutch', phase:'mid', cooldown:2,
    when:(p,lg)=>p.reputation>=28 && lg.tier<=3,
    title:'Le tir de la gagne',
    body:({lg})=>`Dernière possession, un point de retard, la salle retient son souffle. Le ballon est pour toi. Que fais-tu ?`,
    weight:clutchWeight(1.05),
    choices:({p})=>[
      {label:'Je prends le tir de la gagne', hint:'Un pari sur ta touche',
        effect:(ctx)=>{ const shot=Math.round((attrOf(p,'tir')+attrOf(p,'adr3'))/2); const ok=actionRoll(shot,70); ctx.ok=ok; return ok?{reputation:+7,morale:+8,popularity:+6,clutch:+1,flag:'clutchHero'}:{reputation:-3,morale:-5,popularity:+1}; },
          outcome:(ctx)=> ctx.ok?'Splash au buzzer ! Tu délivres tout un peuple. Le genre de tir qui fait les légendes.':'Le tir s\'écrase sur le cercle, la sirène retentit. Rageant, mais tu as pris tes responsabilités.'},
      {label:'Je sers le coéquipier démarqué', hint:'Un pari sur ta vision de jeu',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),58); ctx.ok=ok; return ok?{reputation:+4,coach:+5,morale:+4}:{coach:+1,morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Passe parfaite, panier de la gagne ! Le coach adore ta lucidité.':'Ta passe est interceptée. Le banc grimace.'},
      {label:'Je provoque la faute', hint:'Un pari sur ton explosivité',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'ath'),62); ctx.ok=ok; return ok?{reputation:+3,morale:+5,clutch:+1}:{morale:-3,reputation:-1}; },
        outcome:(ctx)=> ctx.ok?'Tu attaques le cercle, coup de sifflet ! Lancers de la gagne, sang-froid total.':'Pas de sifflet. Tu forces, ça ne passe pas.'}
    ]},

  {id:'defensive_stand', cat:'defense', phase:'mid', cooldown:2,
    when:(p,lg)=>p.reputation>=30 && lg.tier<=3 && (p.pos==='C'||p.pos==='PF'||p.pos==='SF'),
    title:'Le stop décisif',
    body:()=>`Une possession pour tout gagner, mais c'est l'adversaire qui a le ballon. Le money-time se joue aussi en défense.`,
    weight:clutchWeight(0.9),
    choices:({p})=>[
      {label:'Je tente le contre', hint:'Un pari sur ton envergure défensive',
        effect:(ctx)=>{ const ok=actionRoll(Math.round((attrOf(p,'def')+attrOf(p,'ath'))/2),70); ctx.ok=ok; return ok?{reputation:+6,morale:+7,clutch:+1,flag:'lockdown'}:{reputation:-2,morale:-4}; },
        outcome:(ctx)=> ctx.ok?'CONTRE monumental sur la sirène ! Le public explose, tu as tout verrouillé.':'Tu mords sur la feinte, panier encaissé. Dur.'},
      {label:'Je défends propre, sans faute', hint:'La rigueur plutôt que le geste spectaculaire',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok; return ok?{reputation:+4,coach:+4}:{morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Défense parfaite, tir contré par ta position. Money-time maîtrisé.':'Il trouve la faille malgré tout. Rien à te reprocher.'}
    ]},

  {id:'finals_moment', cat:'finals', phase:'mid', cooldown:2,
    when:(p,lg)=>lg.tier<=2 && p.reputation>=48,
    title:({lg})=>`Match décisif · titre ${lg.short} en jeu`,
    body:({lg})=>`Money-time du match qui donne le titre ${lg.short}. Le genre de soirée dont on parle vingt ans après. Comment abordes-tu ces dernières minutes ?`,
    weight:clutchWeight(1.1),
    choices:({p})=>[
      {label:'Je prends le match sur mes épaules', hint:'Porter l\'équipe, quitte à tout miser',
        effect:(ctx)=>{ const scorer=Math.round((attrOf(p,'tir')+attrOf(p,'adr3')+attrOf(p,'dribble'))/3); const ok=actionRoll(scorer,74); ctx.ok=ok; return ok?{reputation:+9,morale:+10,popularity:+8,clutch:+2,flag:'finalsHero',forceFinals:true}:{reputation:-2,morale:-6,popularity:+2,forceFinals:false}; },
        outcome:(ctx)=> ctx.ok?'Récital dans le money-time ! Tu portes ton équipe vers le titre : une prestation pour l\'histoire.':'Tu forces, la réussite n\'est pas là ce soir. La marche était haute.'},
      {label:'Je joue collectif et je fais confiance au groupe', hint:'Faire confiance au collectif jusqu\'au bout',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),66); ctx.ok=ok; return ok?{reputation:+6,coach:+6,morale:+7,clutch:+1,forceFinals:true}:{coach:+2,morale:-3,forceFinals:false}; },
        outcome:(ctx)=> ctx.ok?'Tu orchestres à la perfection, tout le monde touche le ballon. Le titre au bout, en patron discret.':'Le collectif se grippe dans le money-time. Ça passe à côté.'}
    ]},

  {id:'rival_duel', cat:'duel', phase:'mid', cooldown:2,
    when:(p,lg)=>p.reputation>=42 && lg.tier<=2,
    title:'Le duel au sommet',
    body:()=>`Ce soir tu affrontes l'autre grand nom du championnat. Tous les regards sont sur ce face-à-face. Tu veux marquer les esprits ?`,
    weight:(p)=>p.flags&&p.flags.rival?1.1:0.75,
    choices:({p})=>[
      {label:'Je le défie et je prends feu', hint:'Le duel de scoreurs, frontalement',
        effect:(ctx)=>{ const scorer=Math.round((attrOf(p,'tir')+attrOf(p,'dribble'))/2); const ok=actionRoll(scorer,72); ctx.ok=ok; return ok?{reputation:+7,morale:+6,popularity:+6,flag:'rival'}:{reputation:-2,morale:-3,flag:'rival'}; },
        outcome:(ctx)=> ctx.ok?'Tu le domines de la tête et des épaules. Le duel tourne à ta démonstration.':'Il prend le dessus ce soir. Ça pique l\'orgueil, la revanche viendra.'},
      {label:'Je le musèle en défense', hint:'Étouffer l\'adversaire plutôt que le défier au score',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'def'),68); ctx.ok=ok; return ok?{reputation:+5,coach:+4,flag:'rival'}:{morale:-2,flag:'rival'}; },
        outcome:(ctx)=> ctx.ok?'Tu l\'étouffes toute la soirée. Les défenseurs aussi font des statements.':'Il trouve des solutions. Soirée frustrante face à lui.'}
    ]},

  {id:'role_leader', cat:'locker', phase:'mid', cooldown:3,
    when:(p,lg)=>['starter','star','franchise'].includes(roleOf(p).key) && (p.clubTenure||0)>=1,
    title:'Le coach veut faire de toi un cadre',
    body:()=>`<i>(Réunion tactique, tableau blanc noirci de schémas.)</i> Le staff veut bâtir le collectif autour de toi. Endosser ce statut, c'est du poids et de l'influence.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Accepter d\'être le patron sur le terrain', hint:'Prendre les commandes',
        effect:{reputation:+5, coach:+4, morale:+3, flag:'leaderRep'}, outcome:'Tu prends les commandes. Le vestiaire se range derrière toi.'},
      {label:'Rester focalisé sur ton jeu, sans les galons', hint:'Le terrain plutôt que le costume de leader',
        effect:{morale:+3, perfBonus:+3}, outcome:'Tu préfères parler sur le parquet. Ça te va très bien.'}
    ]},

  {id:'role_fight', cat:'locker', phase:'mid', cooldown:2,
    when:(p,lg)=>['bench','rotation'].includes(roleOf(p).key) && p.age<=30 && lg.tier<=3,
    title:'Gratter du temps de jeu',
    body:()=>`<i>(Fin d'entraînement, le coach range ses plots sans un regard.)</i> Tu tournes peu en ce moment. Comment tu abordes ta situation ?`,
    weight:()=>1.15,
    choices:()=>[
      {label:'Bosser dans l\'ombre et forcer la main du coach', hint:'Le sérieux discret, pour forcer la décision',
        effect:{coach:+5, perfBonus:+4, morale:-2, flag:'benchFighter'}, outcome:'Tu redoubles d\'efforts à l\'entraînement. Le coach le remarque.'},
      {label:'Demander plus de responsabilités, franchement', hint:'Le franc-parler, à quitte ou double',
        effect:()=> (Math.random()<0.5)?{coach:+3, reputation:+3}:{coach:-4, reputation:+1},
        outcome:'Tu vas voir le staff en face. La réponse dépendra de ton bagout... et des résultats.'},
      {label:'Réclamer un départ pour jouer ailleurs', hint:'Changer d\'air pour retrouver du jeu',
        effect:{forceMove:{type:'transfer'}, morale:+2}, outcome:'Tu demandes à rebondir dans un club où tu joueras vraiment.'}
    ]},

  {id:'all_star', cat:'allstar', phase:'mid', once:true,
    when:(p,lg)=>lg.tier<=1 && p.reputation>=55,
    title:'Week-end All-Star',
    body:()=>`<i>(Paillettes, caméras à 360°, le public scande déjà.)</i> Tu es convié au grand raout de la ligue. On te propose le concours de dunks, devant le monde entier. Tu te lances ?`,
    weight:()=>0.8,
    choices:({p})=>[
      {label:'Participer au concours de dunks', hint:'Le show télévisé, un pari sur ton explosivité',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'ath'),68); ctx.ok=ok; return ok?{popularity:+10,reputation:+4,media:+3}:{popularity:+4,media:+1}; },
        outcome:(ctx)=> ctx.ok?'Dunk de l\'année, l\'arène s\'embrase ! Ton nom explose partout.':'Tu vises une figure trop ambitieuse, elle ne passe pas. Le buzz reste sympa.'},
      {label:'Profiter du week-end tranquillement', hint:'Le repos plutôt que le show',
        effect:{fitness:+5, media:+1}, outcome:'Tu savoures le moment sans te cramer. Reposé pour la suite.'}
    ]},

  {id:'super_team', cat:'superteam', phase:'mid', once:true,
    when:(p,lg)=>lg.tier<=1 && ['star','franchise'].includes(roleOf(p).key) && p.reputation>=60,
    title:'L\'appel du super-groupe',
    body:()=>`<i>(Coup de fil discret d'une autre star, tard le soir.)</i> On te propose de rejoindre une équipe bâtie pour tout rafler, quitte à partager la lumière. Chasser la bague ensemble, ou rester le patron de ton projet ?`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Rejoindre le super-groupe (chasser le titre)', hint:'Le titre à tout prix, quitte à partager la lumière',
        effect:{forceMove:{type:'transfer'}, reputation:-2, morale:+4, coach:+2, flag:'ringChaser'}, outcome:'Tu t\'associes aux meilleurs. Les puristes jasent, mais les bagues font taire les critiques.'},
      {label:'Rester le leader de ton équipe', hint:'Rester le patron de ton propre projet',
        effect:{reputation:+5, morale:+3, perfBonus:+3, flag:'loyalOne'}, outcome:'Tu refuses la facilité. Gagner avec ton club aurait une autre saveur.'}
    ]},

  {id:'nation_leader', cat:'nation', phase:'mid', once:true,
    when:(p,lg)=>p.natCap && ovr(p)>=80 && (p.clubTenure||0)>=1,
    title:'On te veut capitaine de la sélection',
    body:({p})=>`La fédération voit en toi le leader de la nouvelle génération ${p.nation.flag}. Le brassard, c'est du poids sur les épaules autant qu'un honneur.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Accepter le brassard', hint:'Endosser le rôle, avec la pression qui vient',
        effect:{reputation:+7, morale:+3, popularity:+4, flag:'leaderRep'}, outcome:'Tu deviens le visage de ta sélection. Les attentes montent d\'un cran.'},
      {label:'Laisser le rôle à un plus ancien', hint:'Rester concentré, sans le brassard',
        effect:{coach:+2, morale:+2}, outcome:'Tu préfères montrer l\'exemple sans le brassard.'}
    ]},

  {id:'comparison', cat:'media', phase:'mid', once:true,
    when:(p,lg)=>p.age<=27 && p.hype>=3 && lg.tier<=3,
    title:'La comparaison qui fait du bruit',
    body:({p})=>{ const L=pick(LEGENDS[p.pos]||['un grand nom']);
      return `<i>(Plateau télé, le consultant s'emballe, le bandeau clignote.)</i> Un analyste réputé compare ton profil à celui de <b>${L}</b>, toutes proportions gardées. La hype s'emballe autour de ton nom.`; },
    weight:(p)=>mediaWeight(p)*0.7,
    choices:()=>[
      {label:'M\'en servir de carburant', hint:'Transformer la pression en énergie',
        effect:{popularity:+5, morale:+4, perfBonus:+3}, outcome:'Tu transformes la pression en énergie. Les projecteurs ne te font pas peur.'},
      {label:'Garder la tête froide', hint:'Balayer la comparaison, par sagesse',
        effect:{coach:+3, morale:+2}, outcome:'Tu balaies la comparaison d\'un revers de main. Sagesse saluée.'}
    ]},

  {id:'big_transfer', cat:'contract', phase:'mid', once:true,
    when:(p,lg)=>lg.tier<=2 && p.reputation>=50 && (p.clubTenure||0)>=2,
    title:'Une offre qui change tout arrive sur la table',
    body:()=>`<i>(Ton agent t'appelle, la voix un peu trop calme pour être anodine.)</i> Un club plus huppé vient chercher ta signature, avec un rôle plus grand et un salaire en hausse nette. Ton club actuel se bat pour te retenir.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Suivre l\'argent et l\'ambition', hint:'Le grand saut vers un projet plus huppé',
        effect:{forceMove:{type:'transfer'}, money:+150, reputation:+3, coach:-2}, outcome:'Tu changes de dimension. Ton ancien club encaisse le coup.'},
      {label:'Rester fidèle à ton club formateur', hint:'La loyauté, malgré l\'appel du plus grand',
        effect:{coach:+6, morale:+4, popularity:+5, flag:'loyalOne'}, outcome:'Tu restes. Le public salue ta fidélité, rare dans le milieu.'}
    ]},

  {id:'holdout', cat:'contract', phase:'mid', once:true,
    when:(p,lg)=>p.contractY<=1 && ovr(p)>=lg.star-4 && (p.clubTenure||0)>=2,
    title:'Bras de fer contractuel',
    body:()=>`<i>(Négociations qui traînent, ton agent hausse le ton en coulisses.)</i> Le club sous-évalue ta prochaine prolongation à tes yeux. Certains joueurs, dans ta situation, ont boudé les entraînements pour forcer la main du club : un vrai risque d'image.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Faire monter la pression publiquement', hint:'Le rapport de force ouvert, au risque de l\'image',
        effect:()=>(Math.random()<0.5)?{money:+140, reputation:+2}:{money:+30, reputation:-4, coach:-4, flag:'controversial'},
        outcome:'Le bras de fer se joue à la vue de tous. Le club finit par trancher.'},
      {label:'Négocier en coulisses, sans esclandre', hint:'La discrétion, pour préserver la relation',
        effect:{money:+70, coach:+3}, outcome:'Tu obtiens gain de cause sans faire de vagues. Relation intacte.'}
    ]},

  {id:'trade_deadline_rumor', cat:'media', phase:'mid', cooldown:3,
    when:(p,lg)=>lg.tier<=3 && p.reputation>=38,
    weight:mediaWeight,
    title:'Ton nom circule avant la deadline',
    body:()=>`<i>(Notifications qui s'enchaînent, le même nom qui revient en boucle : le tien.)</i> À l'approche de la fenêtre des transferts, plusieurs médias t'associent à un possible départ. Ton téléphone n'arrête pas de vibrer.`,
    choices:()=>[
      {label:'Couper les réseaux jusqu\'à la fin de la fenêtre', hint:'S\'isoler du bruit ambiant',
        effect:{morale:+3, qi:+1}, outcome:'Tu coupes le bruit. La rumeur continue sans toi, tu restes concentré.'},
      {label:'Publier un message pour couper court', hint:'Prendre les devants publiquement',
        effect:()=>(Math.random()<0.5)?{coach:+4, morale:+2}:{coach:-2, media:+2},
        outcome:'Tu publies un mot pour calmer le jeu. L\'effet dépend de comment il est reçu en interne.'}
    ]},

  {id:'revenge_game', cat:'rivalry', phase:'mid', cooldown:3,
    when:(p,lg)=>(p.clubTenure||0)>=1 && p.seasons.length>=2 && lg.tier<=3,
    title:'Retrouvailles avec ton ancien club',
    body:()=>`<i>(Le même vestiaire visiteur qui t'accueillait autrefois côté domicile.)</i> Ce soir, tu affrontes le club qui t'a laissé partir. La salle entière attend de voir comment tu vas réagir.`,
    weight:()=>0.75,
    choices:({p})=>[
      {label:'En faire une affaire personnelle', hint:'Le match qui compte double, assumé',
        effect:(ctx)=>{ const ok=Math.random()<0.55; ctx.ok=ok; return ok?{reputation:+6, morale:+6, popularity:+3}:{morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Tu livres l\'un de tes meilleurs matchs de la saison. Le message est passé.':'La pression du moment te joue des tours. Soirée à oublier.'},
      {label:'Rester factuel, un match comme un autre', hint:'Refuser de dramatiser la rencontre',
        effect:{qi:+2, coach:+3}, outcome:'Tu refuses de dramatiser. Le coach salue ta maturité sur un soir chargé en émotion.'}
    ]},

  {id:'captaincy_vote', cat:'leadership', phase:'mid', once:true,
    when:(p,lg)=>(p.clubTenure||0)>=2 && p.coach>=60 && ovr(p)>=lg.starter,
    title:'Le vestiaire vote pour un capitanat',
    body:()=>`<i>(Réunion d'équipe, le staff annonce un vote interne pour désigner le nouveau capitaine.)</i> Ton nom fait partie des favoris. Le brassard n'est pas qu'un symbole : il engage.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Te porter candidat ouvertement', hint:'Assumer de vouloir le rôle',
        effect:()=>(Math.random()<0.55)?{reputation:+5, coach:+3, morale:+3, flag:'leaderRep'}:{morale:-2, coach:+1},
        outcome:'Tu assumes vouloir le rôle. Le vestiaire tranche, dans un sens ou dans l\'autre.'},
      {label:'Laisser le groupe décider sans t\'imposer', hint:'Ne rien réclamer, laisser venir',
        effect:{coach:+2, qi:+1}, outcome:'Tu ne réclames rien. Si le brassard vient, il viendra de lui-même.'}
    ]},

  {id:'contract_year_temptation', cat:'contract', phase:'mid', cooldown:3,
    when:(p,lg)=>p.contractY<=1 && lg.tier<=3,
    title:'La tentation de l\'année de contrat',
    body:()=>`<i>(Ton agent te glisse discrètement les chiffres des joueurs à ton poste, marché après marché.)</i> Cette saison décide de ton prochain contrat. Certains gonflent leurs statistiques par tous les moyens les années comme celle-ci.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Forcer un peu le jeu pour les statistiques', hint:'Jouer pour le prochain contrat, assumé',
        effect:{perfBonus:+4, coach:-3, reputation:+2}, outcome:'Tu forces un peu ton jeu vers les statistiques. Le coach le remarque, sans l\'apprécier franchement.'},
      {label:'Jouer exactement comme d\'habitude', hint:'Rester fidèle à ton jeu, marché ou pas',
        effect:{coach:+4, qi:+1}, outcome:'Tu ne changes rien à ton approche. Le marché jugera sur ce que tu es vraiment.'}
    ]},

  {id:'tactical_benching', cat:'system', phase:'mid', cooldown:2,
    when:(p,lg)=>['starter','star'].includes(roleOf(p).key) && lg.tier<=3,
    title:'Décision tactique surprenante du coach',
    body:()=>`<i>(Feuille de match affichée, ton nom manque à l'appel du cinq de départ.)</i> Le coach a un plan précis contre cet adversaire, et ce plan ne commence pas par toi. Rien de personnel, en théorie.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Accepter et rester prêt à entrer', hint:'La confiance dans le plan, sans discuter',
        effect:{coach:+5, qi:+1}, outcome:'Tu acceptes sans discuter. Le coach apprécie la confiance affichée.'},
      {label:'Demander des explications directement', hint:'Le dialogue franc, quitte à froisser',
        effect:()=>(Math.random()<0.5)?{coach:+2, qi:+2}:{coach:-4, morale:-2},
        outcome:'Tu demandes des comptes. Selon le ton de l\'échange, la relation en ressort renforcée ou abîmée.'}
    ]},

  {id:'teammate_injury_bump', cat:'system', phase:'mid', cooldown:3,
    when:(p,lg)=>['bench','rotation'].includes(roleOf(p).key) && lg.tier<=3,
    title:'La blessure d\'un titulaire change tout',
    body:()=>`<i>(Annonce médicale au vestiaire, un silence qui pèse.)</i> Un titulaire de ton poste se blesse pour plusieurs semaines. La place s'ouvre brutalement, sans préavis.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Saisir l\'occasion à pleines mains', hint:'Ne pas laisser passer la chance',
        effect:(ctx)=>{ const ok=Math.random()<0.55; ctx.ok=ok; return ok?{reputation:+6, perfBonus:+5, morale:+4}:{morale:-2, perfBonus:-2}; },
        outcome:(ctx)=> ctx.ok?'Tu profites pleinement de l\'ouverture. Le coach n\'aura plus de raison de te ressortir du cinq.':'La pression de l\'occasion te pèse plus que prévu. Le rendez-vous est raté.'},
      {label:'Rester dans ton rôle habituel, sans forcer', hint:'Ne rien changer à ton approche',
        effect:{coach:+3, qi:+1}, outcome:'Tu ne changes rien à ta manière de jouer. Discret, mais fiable.'}
    ]},

  {id:'allstar_snub', cat:'media', phase:'mid', once:true,
    when:(p,lg)=>lg.tier<=1 && p.reputation>=48 && p.reputation<62,
    title:'Oublié de la sélection All-Star',
    body:()=>`<i>(La liste tombe, ton nom n'y figure pas.)</i> Tes statistiques tiennent la comparaison, mais le vote t'a laissé de côté. Les commentateurs en débattent déjà.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Le dire publiquement, sans filtre', hint:'La frustration assumée devant les caméras',
        effect:{popularity:+5, reputation:+1, coach:-2, flag:'controversial'}, outcome:'Tu ne caches pas ta frustration devant les caméras. Ça fait parler, pas toujours en bien.'},
      {label:'Transformer ça en carburant silencieux', hint:'La revanche par le jeu, sans un mot',
        effect:{perfBonus:+5, qi:+1}, outcome:'Tu ravales la déception et laisses parler le terrain dans les semaines qui suivent.'}
    ]},

  {id:'trade_deadline_survivor', cat:'media', phase:'mid', cooldown:4,
    when:(p,lg)=>lg.tier<=3 && (p.clubTenure||0)>=2,
    title:'Ton nom a circulé, mais rien n\'est venu',
    body:()=>`<i>(Deadline passée à minuit, ton téléphone n'a finalement pas sonné.)</i> Cité dans plusieurs discussions de transfert ces dernières semaines, tu restes finalement au club. Une situation étrange à digérer.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Tourner la page immédiatement', hint:'Ne rien laisser paraître, repartir de l\'avant',
        effect:{coach:+4, morale:+2}, outcome:'Tu tournes la page sans un mot. Le vestiaire apprécie la sérénité affichée.'},
      {label:'Demander des clarifications à la direction', hint:'Vouloir savoir où tu en es vraiment',
        effect:{reputation:+2, coach:-2}, outcome:'Tu veux savoir où tu en es réellement. La discussion est franche, pas toujours confortable.'}
    ]},

  {id:'mentoring_threat', cat:'locker', phase:'mid', cooldown:3,
    when:(p,lg)=>['starter','star','franchise'].includes(roleOf(p).key) && (p.clubTenure||0)>=2,
    title:'Le club recrute un jeune à ton poste',
    body:()=>`<i>(Le prospect prometteur s'installe au vestiaire, casque sur les oreilles, un peu intimidé.)</i> Le club a fait signer un jeune très prometteur exactement à ton poste. À terme, il pourrait bien prendre ta place.`,
    weight:()=>0.65,
    choices:()=>[
      {label:'Le prendre sous ton aile malgré tout', hint:'Transmettre, même à ton propre remplaçant potentiel',
        effect:{reputation:+3, coach:+5, morale:+2, flag:'mentorLegacy'}, outcome:'Tu l\'aides à progresser, en connaissance de cause. Le vestiaire salue la classe du geste.'},
      {label:'Garder tes distances, protéger ta place', hint:'La compétition avant la transmission',
        effect:{perfBonus:+3, morale:-1}, outcome:'Tu gardes tes distances. Chacun pour soi, pour l\'instant.'}
    ]},

  {id:'exteammate_feud', cat:'rivalry', phase:'mid', cooldown:3,
    when:(p,lg)=>((p.flags&&p.flags.rival)||0)===0 && lg.tier<=3 && p.reputation>=40,
    title:'Un ancien coéquipier te charge dans la presse',
    body:()=>`Un joueur avec qui tu partageais autrefois le vestiaire critique publiquement ton attitude d'alors, aujourd'hui installé chez un rival. Les journalistes attendent ta réponse.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Répondre du tac au tac', hint:'Le clash public, assumé',
        effect:{popularity:+5, reputation:-2, coach:-1, flag:'controversial'}, outcome:'Tu réponds sans détour. L\'échange fait le tour des réseaux toute la semaine.'},
      {label:'Ne pas nourrir la polémique', hint:'Le silence, par choix',
        effect:{coach:+3, qi:+2}, outcome:'Tu laisses courir. Certains y voient de la sagesse, d\'autres de la faiblesse.'}
    ]},

  {id:'federation_club_conflict', cat:'nation', phase:'mid', cooldown:3,
    when:(p,lg)=>p.natCap && p.reputation>=45,
    title:'Ton club et ta sélection se disputent ton corps',
    body:()=>`<i>(Deux appels le même jour : le médecin du club, puis celui de la fédération.)</i> Une petite gêne physique traîne. Le club préférerait te voir souffler, la fédération compte sur toi pour la trêve internationale.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Répondre présent pour la sélection', hint:'Le maillot national, malgré la gêne',
        effect:{reputation:+4, popularity:+3, coach:-3, riskUp:+0.1}, outcome:'Tu réponds présent pour ton pays. Le club encaisse le risque, un peu à contrecœur.'},
      {label:'Suivre les consignes de ton club', hint:'Le corps et le club avant tout',
        effect:{coach:+4, fitness:+3}, outcome:'Tu suis les consignes du staff médical du club. La fédération devra faire sans toi cette fois.'}
    ]},

  {id:'veteran_bridge_signing', cat:'system', phase:'mid', cooldown:3,
    when:(p,lg)=>lg.tier<=2 && (p.clubTenure||0)>=1,
    title:'Un vétéran de renom débarque au club',
    body:()=>`<i>(Conférence de presse de présentation, flashs des photographes, un nom que tout le monde connaît.)</i> Le club vient de signer un joueur d'expérience à ton poste. Ton rôle dans l'équipe pourrait bien s'en trouver redéfini.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Apprendre à son contact, avec humilité', hint:'Tirer profit de son expérience',
        effect:{qi:+3, coach:+3}, outcome:'Tu absorbes son expérience au quotidien. Un raccourci précieux dans ta progression.'},
      {label:'Défendre bec et ongles ton temps de jeu', hint:'Ne rien céder de ta place',
        effect:{perfBonus:+3, coach:-2}, outcome:'Tu ne cèdes rien de ton statut. La cohabitation est un peu tendue, mais tu tiens bon.'}
    ]},

  {id:'sixthman_buzz', cat:'media', phase:'mid', once:true,
    when:(p,lg)=>roleOf(p).key==='rotation' && lg.tier<=2 && p.reputation>=42,
    title:'La rumeur du meilleur sixième homme',
    body:()=>`<i>(Un journaliste spécialisé sort ses statistiques : minutes, impact, écart de score.)</i> Ton nom circule pour le trophée du meilleur joueur sorti du banc de la ligue. Un rôle qu'on valorise rarement autant.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Revendiquer fièrement ce rôle', hint:'Assumer pleinement le costume de facteur X',
        effect:{reputation:+4, popularity:+3, media:+2}, outcome:'Tu revendiques ce rôle à fond. Le costume de facteur X te va bien.'},
      {label:'Rappeler que tu vises le cinq de départ', hint:'Ne pas se satisfaire du costume de remplaçant',
        effect:{perfBonus:+3, coach:+1}, outcome:'Tu rappelles poliment que ton objectif reste le cinq de départ. Le message est clair.'}
    ]},

  {id:'union_rep', cat:'locker', phase:'mid', once:true,
    when:(p,lg)=>(p.clubTenure||0)>=2 && p.coach>=55 && lg.tier<=2,
    title:'Représentant des joueurs',
    body:()=>`Le syndicat des joueurs cherche un représentant au sein de l'équipe pour porter la voix du vestiaire dans les discussions avec la ligue. Ton nom est proposé.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Accepter ce rôle de représentation', hint:'Porter la voix du vestiaire, en plus du jeu',
        effect:{reputation:+3, coach:+2, media:+2}, outcome:'Tu deviens une voix écoutée bien au-delà de ton propre vestiaire.'},
      {label:'Décliner, rester concentré sur le terrain', hint:'Laisser ce rôle à un autre',
        effect:{morale:+2}, outcome:'Tu préfères te concentrer sur le jeu. Un autre portera cette voix.'}
    ]},

  {id:'midseason_coach_fired', cat:'system', phase:'mid', cooldown:4,
    when:(p,lg)=>lg.tier<=3 && (p.clubTenure||0)>=1,
    title:'Le coach est limogé en pleine saison',
    body:()=>`<i>(Communiqué officiel du club, tombé sans prévenir en pleine semaine d'entraînement.)</i> Le club se sépare de l'entraîneur en cours de saison. Un intérimaire prend les commandes du jour au lendemain.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Prendre la parole pour rassurer le groupe', hint:'Stabiliser le vestiaire dans l\'incertitude',
        effect:{reputation:+3, coach:+3, morale:+2}, outcome:'Tu prends la parole pour rassurer le groupe. Le vestiaire s\'appuie sur toi dans la tempête.'},
      {label:'Rester en retrait, laisser la direction gérer', hint:'Ne pas s\'en mêler',
        effect:{qi:+1}, outcome:'Tu laisses la direction gérer la crise. Ce n\'est pas ton rôle de trancher.'}
    ]},

  {id:'shoe_deal_upgrade', cat:'business', phase:'mid', once:true,
    when:(p,lg)=>p.popularity>=45 && p.money>=150,
    title:'Ta marque veut passer un cap avec toi',
    body:()=>`<i>(Coup de fil de ton agent, enthousiaste.)</i> Après une percée qui n'est pas passée inaperçue, ton équipementier propose de renégocier : une signature model à ton nom, ou un simple gros chèque cash.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Négocier une chaussure à ton nom', hint:'L\'aura d\'une signature model, pour le long terme',
        effect:{popularity:+9, reputation:+3, money:+40}, outcome:'Ta propre paire arrive en rayon. Le genre de reconnaissance qui dépasse le sport.'},
      {label:'Prendre le gros chèque cash', hint:'La sécurité financière, tout de suite',
        effect:{money:+180}, outcome:'Tu prends l\'option la plus simple : l\'argent, tout de suite, sans conditions.'}
    ]},

  {id:'legend_hot_take', cat:'media', phase:'mid', cooldown:4,
    when:(p,lg)=>p.reputation>=45 && lg.tier<=2,
    title:'Une légende du jeu parle de toi',
    body:({p})=>{ const L=pick(LEGENDS[p.pos]||['une ancienne gloire']);
      return `<i>(Plateau télé, l'invité du soir n'est autre qu'une immense figure du basket.)</i> Interrogé sur la nouvelle génération, ${L!=='une ancienne gloire'?`quelqu\'un qui rappelle un peu le profil de <b>${L}</b>`:'un consultant réputé'} donne son avis tranché sur ton niveau actuel. Les réseaux s'emballent déjà.`; },
    weight:()=>0.5,
    choices:()=>[
      {label:'Répondre avec respect mais fermeté', hint:'Assumer ton propre jugement, sans manquer de respect',
        effect:{reputation:+4, popularity:+3, media:+2}, outcome:'Ta réponse, respectueuse mais ferme, est saluée par beaucoup d\'observateurs.'},
      {label:'Ne rien répondre, laisser le jeu trancher', hint:'Le silence, en attendant les faits',
        effect:{qi:+2, coach:+2}, outcome:'Tu ne réponds rien. Les prochains matchs se chargeront de répondre à ta place.'}
    ]},

  {id:'youth_camp_host', cat:'community', phase:'mid', once:true,
    when:(p,lg)=>p.reputation>=40 && p.money>=100,
    title:'Organiser ton propre camp d\'été',
    body:()=>`L'idée te trotte en tête depuis un moment : organiser un stage d'été à ton nom, pour transmettre directement aux jeunes de ta région ce que tu as appris.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Se lancer et s\'investir personnellement sur place', hint:'La transmission directe, sur le terrain',
        effect:{money:-50, popularity:+7, morale:+4, reputation:+2}, outcome:'Tu passes la semaine sur le terrain avec les jeunes. Un des meilleurs souvenirs de ta saison.'},
      {label:'Financer le projet sans y être personnellement', hint:'Le soutien financier, sans la présence physique',
        effect:{money:-30, popularity:+3}, outcome:'Tu finances le projet à distance. Utile, mais moins marquant qu\'une présence sur place.'}
    ]},

  {id:'front_office_tension', cat:'system', phase:'mid', cooldown:3,
    when:(p,lg)=>['star','franchise'].includes(roleOf(p).key) && (p.clubTenure||0)>=2,
    title:'Désaccord avec la direction sur le projet sportif',
    body:()=>`<i>(Réunion tendue avec le directeur sportif, plans et graphiques de recrutement étalés sur la table.)</i> Tu ne partages pas la vision du front office sur la direction que prend l'effectif. En tant que cadre de l'équipe, ton avis pèse, mais ne décide pas.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Faire entendre ta voix en interne', hint:'Peser dans les décisions, en coulisses',
        effect:{reputation:+3, coach:+2}, outcome:'Tu fais valoir ton point de vue en interne. Pas toujours entendu, mais respecté.'},
      {label:'Laisser la direction sportive décider seule', hint:'Rester à ta place de joueur',
        effect:{coach:+3, morale:+1}, outcome:'Tu laisses la direction trancher sans t\'en mêler. Ce n\'est pas ton rôle, après tout.'}
    ]},

  {id:'career_milestone_game', cat:'media', phase:'mid', once:true,
    when:(p,lg)=>p.seasons.length>=5 && p.reputation>=45,
    title:'Un cap symbolique dans ta carrière',
    body:()=>`<i>(Le speaker interrompt le jeu, la salle entière applaudit debout.)</i> Un chiffre rond de ta carrière tombe ce soir-là : un total de points, de matchs joués, ou de saisons franchies. Le genre de moment qui donne le vertige.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'S\'arrêter un instant pour savourer', hint:'Prendre le temps de mesurer le chemin parcouru',
        effect:{morale:+6, popularity:+4}, outcome:'Tu prends un instant pour mesurer le chemin parcouru. La salle partage ce moment avec toi.'},
      {label:'Rester concentré, le match continue', hint:'Ne pas se laisser distraire par le symbole',
        effect:{qi:+2, coach:+2}, outcome:'Tu restes concentré sur le match. Le symbole attendra la fin de la rencontre.'}
    ]},
];
