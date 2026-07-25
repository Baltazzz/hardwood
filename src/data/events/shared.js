import { LIFESTYLES } from '../lifestyles.js';
import { ovr, attrOf } from '../../engine/player.js';
import { ri, pick, clamp, actionRoll } from '../../engine/utils.js';
import { mediaWeight } from './_helpers.js';

/* ============================================================
   ÉVÉNEMENTS TRANSVERSES — pas liés à une phase de carrière précise
   (médias, business, mode de vie, blessures courantes, contrat, etc.)
============================================================ */
export const SHARED_EVENTS = [
  {id:'media_punchline', cat:'media', cooldown:3,
    when:(p,lg)=>p.reputation>=25,
    weight:mediaWeight,
    title:'Micro tendu après un gros match',
    body:({p})=>`Un journaliste te cherche : « Certains disent que tu es surcoté. Réponse ? » La salle attend. Ce que tu dis fera la une demain.`,
    choices:()=>[
      {label:'Balancer une punchline assassine', hint:'Tu joues la provoc, quitte à froisser le staff',
        effect:{popularity:+8, media:+4, coach:-4}, outcome:'Ta phrase tourne en boucle sur les réseaux. Le vestiaire sourit, le coach moins.'},
      {label:'Rester humble et renvoyer vers le collectif', hint:'La carte sérieuse et posée',
        effect:{coach:+5, media:+3, popularity:+1}, outcome:'Réponse propre, pro. Les vétérans apprécient.'},
      {label:'Envoyer une vanne qui détend', hint:'Le juste milieu, sur le ton de l\'humour',
        effect:{popularity:+4, media:+2, morale:+2}, outcome:'Rires dans la salle. Tu marques des points en sympathie.'}
    ]},

  {id:'transfer_rumor', cat:'media', cooldown:4,
    when:(p,lg)=>p.reputation>=40 && lg.tier<=3,
    weight:mediaWeight,
    title:'Une rumeur de transfert fuite',
    body:({p})=>`La presse annonce que tu serais sur le départ. Ton président fulmine, tes coéquipiers te regardent différemment. Comment tu gères ?`,
    choices:()=>[
      {label:'Démentir publiquement et rassurer', hint:'Tu joues la carte de la loyauté affichée',
        effect:{coach:+5, morale:+3, media:+2}, outcome:'Tu calmes le jeu. Le club apprécie ta loyauté affichée.'},
      {label:'Ni oui ni non, entretenir le flou', hint:'Le mystère peut jouer pour toi... ou contre toi',
        effect:{reputation:+4, coach:-3, popularity:+3}, outcome:'Le mystère fait monter ta cote… et la tension.'}
    ]},

  {id:'sneaker_deal', cat:'business', once:true,
    when:(p,lg)=>p.popularity>=25 || lg.tier<=2,
    title:'Un équipementier pose un contrat',
    body:({p})=>`Une marque de sneakers veut t'habiller. Gros chèque, séances photo, obligations marketing. C'est de l'argent et de la lumière — mais aussi du temps volé à l'entraînement.`,
    choices:()=>[
      {label:'Signer le gros contrat', hint:'Le chèque le plus haut, au prix d\'un peu de focus',
        effect:{money:+220, popularity:+9, tir:-1}, outcome:'Ton visage s\'affiche en ville. Le compte en banque respire.'},
      {label:'Négocier un deal léger, garder le focus basket', hint:'L\'équilibre entre image et travail',
        effect:{money:+70, popularity:+4}, outcome:'Deal raisonnable. Tu gardes la tête au jeu.'},
      {label:'Refuser, tout pour le terrain', hint:'Tu paries sur le travail plutôt que sur l\'image',
        effect:{tir:+2, adr3:+2, coach:+2}, outcome:'Tu déclines. Tes séances supplémentaires parlent pour toi.'}
    ]},

  {id:'invest', cat:'business', cooldown:4,
    when:(p,lg)=>p.money>=200,
    title:'Une opportunité d\'investissement',
    body:({p})=>`Un proche te propose de placer une partie de tes gains dans un projet. Ça peut rapporter gros… ou partir en fumée.`,
    choices:()=>[
      {label:'Investir une grosse somme', hint:'Un vrai pari, à double tranchant',
        effect:({p})=>{ const win=Math.random()>.5; return win?{money:+Math.round(p.money*0.6)}:{money:-Math.round(p.money*0.4)}; },
        outcome:({p})=>'Les marchés décident… le résultat est tombé sur ton compte.'},
      {label:'Placer prudemment', hint:'Le compromis raisonnable',
        effect:({p})=>({money:+Math.round(p.money*0.08+20)}), outcome:'Rendement modeste mais tranquille.'},
      {label:'Ne pas toucher à ton argent', hint:'La sécurité avant tout',
        effect:{morale:+1}, outcome:'Tu gardes ton magot au chaud.'}
    ]},

  {id:'ankle', cat:'injury', cooldown:2,
    when:(p,lg)=>true,
    title:'Entorse à la cheville',
    body:`Réception maladroite, la cheville tourne. Le staff médical est prudent. Toi, tu veux jouer.`,
    weight:(p)=>{const l=LIFESTYLES.find(x=>x.id===p.life); const fitRisk=clamp(1.7-p.fitness/85,0.6,1.7); return 0.16*l.injury*(p.riskMod||1)*fitRisk;},
    choices:()=>[
      {label:'Forcer le retour, serrer les dents', hint:'Tu joues diminué plutôt que de rater des matchs',
        effect:{injuryGames:12, fitness:-14, ath:-1, perfBonus:-5, coach:+2}, outcome:'Tu reviens trop tôt. Tu joues diminué mais tu montres du caractère.'},
      {label:'Respecter les délais de guérison', hint:'La prudence, quitte à manquer des matchs',
        effect:{injuryGames:18, fitness:+4}, outcome:'Tu prends le temps. Le corps guérit correctement.'}
    ]},

  {id:'big_injury', cat:'injury', cooldown:4,
    when:(p,lg)=>p.age>=20,
    title:'Genou : le diagnostic tombe',
    body:`Un mauvais appui, un craquement. L'IRM confirme une grosse blessure. Longue absence en vue. La façon dont tu traverses ça définira la suite.`,
    weight:(p)=>{const l=LIFESTYLES.find(x=>x.id===p.life); const fitRisk=clamp(1.7-p.fitness/85,0.6,1.7); return 0.05*l.injury*(p.riskMod||1)*fitRisk;},
    choices:()=>[
      {label:'Rééducation exemplaire, revenir plus fort mentalement', hint:'Le temps long, pour revenir sur des bases saines',
        effect:{injuryGames:45, ath:-4, fitness:-10, qi:+3, morale:+2, reputation:-2, flag:'injuryProne'}, outcome:'Des mois de travail dans l\'ombre. Tu perds en explosivité mais tu gagnes en tête.'},
      {label:'Précipiter le retour pour ne pas perdre ta place', hint:'Un pari sur l\'urgence, au risque d\'une rechute',
        effect:{injuryGames:30, ath:-7, fitness:-18, perfBonus:-8, flag:'injuryProne'}, outcome:'Tu reviens trop vite. Le genou n\'est pas le même, et ça se voit.'}
    ]},

  {id:'first_call', cat:'nation', once:true,
    when:(p,lg)=>p.reputation>=42 && !p.natCap,
    title:'Le coup de fil qui change tout',
    weight:()=>1.4,
    body:({p})=>`<i>(Un numéro inconnu s'affiche. Tu hésites une seconde — puis tu reconnais la voix.)</i> Le sélectionneur de ${p.nation.name} ${p.nation.flag} est en ligne. Il ne tourne pas autour du pot : il te veut pour la prochaine trêve internationale. Le maillot floqué à ton nom, l'hymne, les caméras braquées sur le banc — tout ça devient réel, là, maintenant.`,
    choices:({p})=>[
      {label:'Répondre présent, la voix qui tremble un peu', hint:'Le moment que tu attends depuis gamin',
        effect:{reputation:+7, popularity:+7, morale:+7}, tl:()=>`📞 Le sélectionneur de ${p.nation.name} ${p.nation.flag} appelle en personne — première sélection. Un jour qu'on n'oublie pas.`,
        outcome:'Tu raccroches, le cœur qui bat encore. Tu appelles tes proches avant même d\'avoir reposé le téléphone : "J\'y suis."'},
      {label:'Rester concentré, savourer plus tard', hint:'Le pro avant l\'émotion',
        effect:{reputation:+6, coach:+4, morale:+6}, tl:()=>`📞 Le sélectionneur de ${p.nation.name} ${p.nation.flag} appelle en personne — première sélection.`,
        outcome:'Tu remercies, tu raccroches, tu retournes t\'entraîner comme si de rien n\'était. Mais ce soir-là, seul, le sourire ne te quitte pas.'}
    ]},

  {id:'extension', cat:'contract', cooldown:3,
    when:(p,lg)=>p.contractY<=1 && ovr(p)>=lg.starter,
    title:'Ton club propose une prolongation',
    body:({p})=>`${p.club} veut te prolonger. Sécuriser ton avenir tout de suite, ou parier sur toi-même en testant le marché à la fin de saison ?`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Prolonger et sécuriser', hint:'La sécurité, tout de suite',
        effect:{money:+120, coach:+4, morale:+3}, outcome:'Tu signes. Le club et toi, c\'est reparti pour un tour.'},
      {label:'Parier sur toi, tester la free agency', hint:'Un pari sur ta propre saison',
        effect:{pendingFA:true, reputation:+2, perfBonus:+4, coach:-2}, outcome:'Tu refuses la première offre. En fin de saison, tu écouteras le marché — à toi de le mériter d\'ici là.'}
    ]},

  {id:'training_focus', cat:'training', cooldown:2,
    when:(p,lg)=>p.age<=30,
    title:'Le chantier de l\'intersaison',
    body:`Tu as ciblé un axe pour passer un cap. Où mets-tu l'énergie de ton travail cette année ?`,
    weight:()=>1.3,
    choices:()=>[
      {label:'Ton tir et ton adresse extérieure', hint:'Miser sur la touche',
        effect:{tir:+3, adr3:+3, coach:+1}, outcome:'Des milliers de shoots plus tard, ta main est plus sûre.'},
      {label:'Ta création et ta vision de jeu', hint:'Miser sur la lecture du jeu',
        effect:{passe:+3, dribble:+3}, outcome:'Ton jeu s\'ouvre, tu lis le terrain différemment.'},
      {label:'Ta défense et ton physique', hint:'Miser sur l\'impact physique',
        effect:{def:+3, ath:+2, reb:+1}, outcome:'Plus dur à passer, plus dur à bouger.'}
    ]},

  {id:'slump', cat:'form', cooldown:3,
    when:(p,lg)=>p.reputation>=30,
    title:'Passage à vide',
    body:`Les shoots ne rentrent plus, la confiance vacille. Les tribunes commencent à murmurer.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Retour aux fondamentaux, tête baissée', hint:'La patience plutôt que la panique',
        effect:{qi:+2, tir:+1, morale:-2}, outcome:'Tu simplifies ton jeu. Petit à petit, ça revient.'},
      {label:'Forcer pour t\'en sortir seul', hint:'Un coup de tête, quitte à s\'enfoncer un peu plus',
        effect:{perfBonus:-4, morale:-1, reputation:+1}, outcome:'Tu multiplies les tentatives. Ça passe ou ça casse.'}
    ]},

  {id:'community', cat:'community', cooldown:3,
    when:(p,lg)=>true,
    title:'Action auprès des jeunes du quartier',
    body:`On te sollicite pour un événement caritatif avec les gamins de ta ville. Du temps hors du parquet, mais une image forte.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'T\'investir à fond', hint:'Le temps donné, pour l\'image et le cœur',
        effect:{popularity:+5, morale:+3}, outcome:'Les sourires des gamins valent tous les contrats. Ta cote de sympathie grimpe.'},
      {label:'Décliner, rester focalisé', hint:'Tu préfères te préserver',
        effect:{fitness:+3}, outcome:'Tu préfères te préserver. On comprend, sans plus.'}
    ]},

  {id:'agent', cat:'agentbiz', once:true,
    when:(p,lg)=>p.reputation>=45,
    title:'Un agent influent veut te représenter',
    body:`Un agent réputé, carnet d'adresses en or, propose de gérer ta carrière. Ça se paie, mais ça ouvre des portes.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Signer avec lui', hint:'Le réseau, contre une part du gâteau',
        effect:{reputation:+5, money:-60, popularity:+3}, outcome:'Ton nom circule désormais dans les bons bureaux.'},
      {label:'Rester avec ton agent actuel', hint:'La fidélité à ton entourage historique',
        effect:{morale:+2, money:+20}, outcome:'Tu gardes ta confiance dans ton entourage historique.'}
    ]},

  {id:'personal', cat:'personal', cooldown:2,
    when:(p,lg)=>true,
    title:'La vie en dehors du parquet',
    body:`Entre déplacements et matchs, tes proches réclament du temps. Trouver l'équilibre te rendrait plus solide dans la tête.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Prendre du temps pour tes proches', hint:'Recharger loin du bruit',
        effect:{morale:+5}, outcome:'Tu recharges les batteries loin du bruit. La tête est plus légère.'},
      {label:'Tout donner au basket cette saison', hint:'Tout sacrifier au jeu, pour voir',
        effect:{tir:+1, def:+1, ath:+1, morale:-3}, outcome:'Tu mets tout de côté pour le jeu. Efficace, mais éprouvant.'}
    ]},

  {id:'comeback', cat:'comeback', cooldown:1,
    when:(p,lg)=>{const l=p.seasons[p.seasons.length-1]; return !!(l && l.injured);},
    title:'Le retour de blessure',
    body:`Après des semaines à l'écart, tu retrouves le parquet. La confiance dans ton corps se reconstruit match après match.`,
    weight:()=>1.4,
    choices:()=>[
      {label:'Retour progressif et intelligent', hint:'La patience, pour revenir sur de bonnes bases',
        effect:{fitness:+8, qi:+1, morale:+2}, outcome:'Tu reviens sans forcer. Le corps répond bien.'},
      {label:'Vouloir tout rattraper d\'un coup', hint:'L\'urgence de prouver que tu es de retour',
        effect:{perfBonus:-3, fitness:-4, reputation:+1}, outcome:'Tu brûles les étapes pour prouver que tu es de retour.'}
    ]},

  {id:'social_media', cat:'social', cooldown:3,
    when:(p,lg)=>p.popularity>=20,
    title:'Ton action devient virale',
    body:`Un geste spectaculaire de ta dernière rencontre explose sur les réseaux. L'occasion de surfer sur la vague.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Alimenter le buzz', hint:'Surfer sur la vague pendant qu\'elle dure',
        effect:{popularity:+7, media:+2}, outcome:'Les vues s\'envolent, ton nom dépasse le cercle des initiés.'},
      {label:'Rester discret et bosser', hint:'Laisser le bruit retomber',
        effect:{tir:+1, dribble:+1}, outcome:'Tu laisses le bruit retomber et tu retournes au travail.'}
    ]},

  // "night_out" et "nightlife" étaient deux événements quasi-identiques (sortie entre amis) qui
  // se tiraient indépendamment l'un de l'autre — la cause principale de la sensation de répétition
  // signalée. Fusionnés en un seul, avec un cooldown généreux : c'est LE seul event "sortie" du jeu.
  {id:'nightlife', cat:'nightlife', cooldown:4,
    when:(p,lg)=>p.age<=31,
    title:'Sortie avec les potes ce soir ?',
    body:`La bande t'invite à sortir après une grosse semaine. Décompresser fait du bien... mais la nuit peut coûter cher.`,
    weight:()=>0.8,
    choices:({p})=>{ const l=LIFESTYLES.find(x=>x.id===p.life); const risky=(l.id==='party');
      return [
        {label:'Sortir et profiter', hint:'Une soirée qui peut tourner dans un sens comme dans l\'autre',
          effect:(ctx)=>{ const r=Math.random(); const injP=risky?0.34:0.20;
            if(r<injP){ ctx.night='bad'; return {injuryGames:ri(6,12), fitness:-8, popularity:+5, riskUp:+0.25, flag:'nightOwl'}; }
            if(r>0.88){ ctx.night='good'; return {popularity:+8, reputation:+4, morale:+5, qi:+1, flag:'nightOwl'}; }
            ctx.night='ok'; return {popularity:+6, fitness:-3, morale:+3, riskUp:+0.15, flag:'nightOwl'}; },
          outcome:(ctx)=> ctx.night==='bad'?'La soirée dérape un peu... réveil difficile et petit pépin à la clé.'
                        : ctx.night==='good'?'Belle soirée — tu y fais une rencontre qui va compter (contacts, image, énergie). Parfois ça sourit.'
                        : 'Bonne soirée, sans excès. On verra demain à l\'entraînement.'},
        {label:'Rester au calme et récupérer', hint:'Repos et sérieux',
          effect:{fitness:+7, qi:+1, riskUp:-0.2}, outcome:'Repos, sommeil, glace. Le corps te remerciera.'}
      ]; }},

  {id:'media_controversy', cat:'media', cooldown:4,
    when:(p,lg)=>p.popularity>=25 && p.reputation>=35,
    title:'Une phrase sort de son contexte',
    body:`Un média monte en épingle une de tes déclarations. Le vestiaire et les fans attendent ta réaction.`,
    weight:(p)=>mediaWeight(p)*0.55,
    choices:()=>[
      {label:'Assumer et clarifier posément', hint:'Désamorcer avec sang-froid',
        effect:{reputation:+4, coach:+2, media:+2}, outcome:'Tu désamorces avec classe. Ton image en sort grandie.'},
      {label:'Répondre cash, du tac au tac', hint:'Le clash assumé, quitte à diviser',
        effect:{popularity:+6, reputation:-5, coach:-2, flag:'controversial'}, outcome:'Ça fait le buzz, mais certains n\'ont pas apprécié le ton.'}
    ]},

  {id:'overwork', cat:'training', cooldown:3,
    when:(p,lg)=>p.age<=29,
    title:'Doubler les séances ?',
    body:`Tu peux enchaîner une deuxième séance quotidienne pour passer un cap. Efficace, mais ton corps a ses limites.`,
    weight:(p)=>p.life==='grinder'?0.9:0.45,
    choices:()=>[
      {label:'Tout donner, double dose', hint:'Pousser la machine au maximum',
        effect:()=> (Math.random()<0.25)
          ? {injuryGames:ri(8,16), fitness:-10, ath:+1, perfBonus:-3, riskUp:+0.2}
          : {ath:+2, def:+1, tir:+1, fitness:-4, riskUp:+0.1},
        outcome:'Tu pousses la machine au maximum.'},
      {label:'Charge maîtrisée', hint:'Le travail intelligent',
        effect:{qi:+2, fitness:+4}, outcome:'Tu bosses intelligemment, sans casse.'}
    ]},

  {id:'presser_hostile', cat:'presser', cooldown:3,
    when:(p,lg)=>p.popularity>=22 && p.reputation>=32,
    title:'Conférence de presse tendue',
    body:()=>`Après une défaite, un journaliste te cherche ouvertement devant les caméras. La salle attend ta réaction.`,
    weight:(p)=>mediaWeight(p)*0.6,
    choices:({p})=>[
      {label:'Je réponds avec aplomb et charisme', hint:'Un pari sur ton charisme',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),58); ctx.ok=ok; return ok?{reputation:+5,popularity:+5,media:+3}:{reputation:-2,media:+1}; },
        outcome:(ctx)=> ctx.ok?'Réponse classe et maîtrisée, la punchline fait le tour des réseaux. Respect.':'Ta réponse tombe à plat, le clip tourne en boucle pour de mauvaises raisons.'},
      {label:'Je reste factuel et je coupe court', hint:'Sûr, sans éclat',
        effect:{coach:+2, media:+1}, outcome:'Tu bottes en touche proprement. Rien à signaler.'}
    ]},

  {id:'benched', cat:'locker', cooldown:2,
    when:(p,lg)=>{const last=p.seasons[p.seasons.length-1]; return last && last.minutes<16 && p.age<32;},
    title:'Le coach te laisse sur le banc',
    body:({p})=>`Les minutes se font rares. Tu ronges ton frein en bout de banc. Trois voies s'offrent à toi.`,
    choices:()=>[
      {label:'Travailler deux fois plus à l\'entraînement', hint:'Transformer la frustration en travail',
        effect:{tir:+2, def:+2, ath:+1, coach:+3, flag:'benchFighter'}, outcome:'Tu transformes la frustration en carburant. Le coach le remarque.'},
      {label:'Demander un transfert', hint:'Forcer un départ pour rejouer ailleurs',
        effect:{forceMove:{type:'transfer'}, coach:-5, reputation:+1}, outcome:'Tu claques la porte pour aller jouer ailleurs.'},
      {label:'Te plaindre dans la presse', hint:'Le coup de gueule public',
        effect:{media:+3, popularity:+3, coach:-8, morale:-2}, outcome:'Ton coup de gueule fait du bruit. La relation avec le staff se tend franchement.'}
    ]},

  // Adaptation à l'arrivée dans un nouveau club (cf. arrivalCoachTrust) : gaté sur une confiance
  // basse ET une ancienneté quasi nulle, pour coller précisément à la fenêtre d'adaptation.
  {id:'coach_trust_low', cat:'locker', cooldown:1,
    when:(p,lg)=>p.coach<45 && (p.clubTenure||0)<=1,
    title:'Un nouveau staff, pas encore convaincu',
    body:()=>`Le coach ne te connaît pas encore vraiment. Tu sens qu'il te regarde avec circonspection, comme le reste du staff — la confiance, ici, se mérite.`,
    weight:()=>1.15,
    choices:()=>[
      {label:'Bosser deux fois plus à l\'entraînement pour prouver ta valeur', hint:'Le travail comme seule réponse',
        effect:{coach:+6, fitness:-3}, outcome:'Tu arrives tôt, repars tard. Le staff commence à noter ton sérieux.'},
      {label:'Demander une discussion franche avec le coach', hint:'Une discussion à double tranchant',
        effect:()=>(Math.random()<0.55)?{coach:+8, morale:+2}:{coach:-3, morale:-2},
        outcome:'Tu mets les choses à plat. Ça passe... ou ça casse un peu plus.'}
    ]},
];
