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
    body:({p})=>`Une marque de sneakers veut t'habiller. Gros chèque, séances photo, obligations marketing. C'est de l'argent et de la lumière, mais aussi du temps volé à l'entraînement.`,
    choices:()=>[
      {label:'Signer le gros contrat', hint:'Le chèque le plus haut, au prix d\'un peu de focus',
        effect:{money:+220, popularity:+9, tir:-1, flag:'spender'}, outcome:'Ton visage s\'affiche en ville. Le compte en banque respire.'},
      {label:'Négocier un deal léger, garder le focus basket', hint:'L\'équilibre entre image et travail',
        effect:{money:+70, popularity:+4}, outcome:'Deal raisonnable. Tu gardes la tête au jeu.'},
      {label:'Refuser, tout pour le terrain', hint:'Tu paries sur le travail plutôt que sur l\'image',
        effect:{tir:+2, adr3:+2, coach:+2, flag:'saver'}, outcome:'Tu déclines. Tes séances supplémentaires parlent pour toi.'}
    ]},

  {id:'invest', cat:'business', cooldown:5,
    when:(p,lg)=>p.money>=200,
    title:'Une opportunité d\'investissement',
    body:({p})=>`Un proche te propose de placer une partie de tes gains dans un projet. Ça peut rapporter gros… ou partir en fumée.`,
    choices:()=>[
      {label:'Investir une grosse somme', hint:'Un vrai pari, à double tranchant',
        effect:({p})=>{ const win=Math.random()>.5; return win?{money:+Math.round(p.money*0.6), flag:'spender'}:{money:-Math.round(p.money*0.4), flag:'spender'}; },
        outcome:({p})=>'Les marchés décident… le résultat est tombé sur ton compte.'},
      {label:'Placer prudemment', hint:'Le compromis raisonnable',
        effect:({p})=>({money:+Math.round(p.money*0.08+20)}), outcome:'Rendement modeste mais tranquille.'},
      {label:'Ne pas toucher à ton argent', hint:'La sécurité avant tout',
        effect:{morale:+1, flag:'saver'}, outcome:'Tu gardes ton magot au chaud.'}
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
    body:({p})=>`<i>(Un numéro inconnu s'affiche. Tu hésites une seconde, puis tu reconnais la voix.)</i> Le sélectionneur de ${p.nation.name} ${p.nation.flag} est en ligne. Il ne tourne pas autour du pot : il te veut pour la prochaine trêve internationale. Le maillot floqué à ton nom, l'hymne, les caméras braquées sur le banc : tout ça devient réel, là, maintenant.`,
    choices:({p})=>[
      {label:'Répondre présent, la voix qui tremble un peu', hint:'Le moment que tu attends depuis gamin',
        effect:{reputation:+7, popularity:+7, morale:+7}, tl:()=>`📞 Le sélectionneur de ${p.nation.name} ${p.nation.flag} appelle en personne : première sélection. Un jour qu'on n'oublie pas.`,
        outcome:'Tu raccroches, le cœur qui bat encore. Tu appelles tes proches avant même d\'avoir reposé le téléphone : "J\'y suis."'},
      {label:'Rester concentré, savourer plus tard', hint:'Le pro avant l\'émotion',
        effect:{reputation:+6, coach:+4, morale:+6}, tl:()=>`📞 Le sélectionneur de ${p.nation.name} ${p.nation.flag} appelle en personne : première sélection.`,
        outcome:'Tu remercies, tu raccroches, tu retournes t\'entraîner comme si de rien n\'était. Mais ce soir-là, seul, le sourire ne te quitte pas.'}
    ]},

  // Choix contextuel de la fenêtre de sélection (voir p.seasonMods.natWindow, fixé en tête de
  // saison dans beginSeason()) : le texte s'adapte au niveau réel du joueur (star attendue au
  // sommet vs role player du groupe), et l'issue pèse concrètement sur le résultat du tournoi
  // via natBonus (voir natPower dans simulateSeason()) -- pas une simple couleur narrative.
  {id:'nation_stakes', cat:'nation', cooldown:2,
    when:(p,lg)=>!!(p.seasonMods && p.seasonMods.natWindow),
    title:'Sélection nationale : la pression monte',
    weight:()=>1.3,
    body:({p,lg})=> ovr(p)>=lg.star
      ? `<i>(Vestiaire de la sélection, le sélectionneur s'arrête devant toi.)</i> Le sélectionneur ${p.nation.flag} compte sur toi comme référence de l'équipe pour ce tournoi. Le pays entier attend.`
      : `<i>(Vestiaire de la sélection, les rôles se répartissent.)</i> Tu fais partie du groupe ${p.nation.flag} pour ce tournoi, sans en être la tête d'affiche. Comment abordes-tu ta part du travail ?`,
    choices:({p})=>[
      {label:'Porter le maillot sur mes épaules', hint:'Un pari sur ta performance internationale',
        effect:(ctx)=>{ const ok=actionRoll(ovr(p),72); ctx.ok=ok; return ok?{natBonus:+10, reputation:+3}:{natBonus:-4}; },
        outcome:(ctx)=> ctx.ok?'Tu hausses ton niveau pile au bon moment. La sélection y croit un peu plus.':'La pression internationale te pèse davantage que prévu.'},
      {label:'Jouer mon rôle, sans en faire trop', hint:'La sérénité, pour tenir la distance du tournoi',
        effect:{natBonus:+3, morale:+2}, outcome:'Tu restes toi-même. Un groupe qui tient sur la durée se construit aussi comme ça.'}
    ]},

  // Rivalité INTERNE au groupe (contrairement à "rivalry"/"rival_duel", qui opposent à un
  // adversaire) : deux joueurs de la même sélection qui visent le même rôle dans le cinq --
  // un ressort propre à la sélection nationale, jamais rencontré en club.
  {id:'nation_rivalry', cat:'nation', cooldown:3,
    when:(p,lg)=>!!(p.seasonMods && p.seasonMods.natWindow) && p.natCap,
    title:'Le même poste, deux prétendants',
    body:({p})=>`<i>(À l'entraînement, le sélectionneur ${p.nation.flag} observe en silence, carnet à la main.)</i> Un autre joueur du groupe vise exactement le même rôle que toi dans le cinq de départ. Une seule place à prendre, et le sélectionneur regarde de près qui la mérite.`,
    weight:()=>0.9,
    choices:({p})=>[
      {label:'Hausser le ton à l\'entraînement pour t\'imposer', hint:'Le rapport de force, quitte à tendre le groupe',
        effect:(ctx)=>{ const ok=actionRoll(ovr(p),70); ctx.ok=ok; return ok?{natBonus:+6, reputation:+3, coach:-2}:{natBonus:-3, coach:-3}; },
        outcome:(ctx)=> ctx.ok?'Le sélectionneur tranche en ta faveur. La place est à toi, la relation avec ton rival un peu plus froide.':'Le message ne passe pas comme prévu. Le sélectionneur préfère calmer le jeu... en te laissant sur le banc.'},
      {label:'Proposer une répartition claire des rôles', hint:'La diplomatie, pour préserver le collectif',
        effect:{natBonus:+2, morale:+3, coach:+2}, outcome:'Le sélectionneur salue ta maturité. Le groupe reste soudé, même si le temps de jeu se partage.'}
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
        effect:{pendingFA:true, reputation:+2, perfBonus:+4, coach:-2}, outcome:'Tu refuses la première offre. En fin de saison, tu écouteras le marché : à toi de le mériter d\'ici là.'}
    ]},

  {id:'training_focus', cat:'training', cooldown:4,
    when:(p,lg)=>p.age<=30,
    title:'Le chantier de l\'intersaison',
    body:`Tu as ciblé un axe pour passer un cap. Où mets-tu l'énergie de ton travail cette année ?`,
    weight:()=>1, // ramené (1.3 -> 1) : événement le plus vu du jeu (95%+ des carrières), voir AGENDA.md
    choices:()=>[
      {label:'Ton tir et ton adresse extérieure', hint:'Miser sur la touche',
        effect:{tir:+3, adr3:+3, coach:+1}, outcome:'Des milliers de shoots plus tard, ta main est plus sûre.'},
      {label:'Ta création et ta vision de jeu', hint:'Miser sur la lecture du jeu',
        effect:{passe:+3, dribble:+3}, outcome:'Ton jeu s\'ouvre, tu lis le terrain différemment.'},
      {label:'Ta défense et ton physique', hint:'Miser sur l\'impact physique',
        effect:{def:+3, ath:+2, reb:+1}, outcome:'Plus dur à passer, plus dur à bouger.'}
    ]},

  // ---- Nourrit les traits Showman/Bosseur (voir engine/tags.js, AGENDA.md "étoffer les
  // traits") : deux traits entièrement nouveaux, avec leurs propres événements dédiés plutôt
  // qu'une simple promotion d'un flag narratif déjà existant. ----
  {id:'highlight_reel', cat:'social', cooldown:3,
    when:(p,lg)=>p.age<=33 && p.popularity>=10,
    title:'Un geste qui enflamme les réseaux',
    body:`Une action spectaculaire de ton dernier match tourne en boucle. Le public en redemande -- à toi de voir si tu joues le jeu du spectacle.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Retenter le geste spectaculaire au prochain match', hint:'Le style avant tout, quitte à déplaire au staff',
        effect:{popularity:+5, coach:-1, flag:'showman'}, outcome:'Tu en redonnes. Les réseaux adorent, le coach un peu moins.'},
      {label:'Rester sobre, l\'efficacité d\'abord', hint:'Le collectif avant le show',
        effect:{coach:+2, qi:+1}, outcome:'Tu restes concentré sur l\'essentiel. Moins viral, plus utile.'}
    ]},
  {id:'brand_highlight_deal', cat:'business', cooldown:5,
    when:(p,lg)=>p.popularity>=30,
    title:'Une marque veut construire une pub autour de ton style',
    body:`Ton sens du spectacle a tapé dans l'œil d'un sponsor, qui veut faire de toi le visage d'une campagne "highlights".`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Signer et jouer le jeu du spectacle', hint:'Assumer pleinement l\'image de showman',
        effect:{popularity:+6, money:+40, flag:'showman'}, outcome:'La campagne cartonne. Ton image de showman s\'installe pour de bon.'},
      {label:'Décliner, préférer une image plus sobre', hint:'Garder une image de joueur sérieux',
        effect:{coach:+2, reputation:+1}, outcome:'Tu déclines poliment. Une image plus classique, assumée.'}
    ]},
  {id:'extra_reps', cat:'training', cooldown:3,
    when:(p,lg)=>p.age<=32,
    title:'Encore une série avant de rentrer',
    body:`L'entraînement officiel est terminé, mais la salle est encore ouverte. Rien ne t'oblige à y retourner.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Y retourner, comme toujours', hint:'La régularité comme identité',
        effect:{coach:+2, fitness:-1, flag:'workhorse'}, outcome:'Tu y retournes, encore. Le staff commence à s\'en rendre compte.'},
      {label:'Rentrer, le corps a aussi besoin de repos', hint:'Écouter ton corps',
        effect:{fitness:+2}, outcome:'Tu rentres tôt, pour une fois. Le corps te dira merci demain.'}
    ]},
  {id:'preserve_you', cat:'training', cooldown:4,
    when:(p,lg)=>p.age<=33,
    title:'Le staff veut te faire souffler',
    body:`Le staff médical propose de lever le pied sur une séance pour te préserver. Ce n'est pas franchement dans tes habitudes.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Refuser, insister pour t\'entraîner à fond', hint:'Ne jamais lever le pied',
        effect:{coach:+1, fitness:-2, flag:'workhorse'}, outcome:'Tu insistes, comme toujours. Le staff finit par céder.'},
      {label:'Accepter la pause, pour une fois', hint:'La prudence, pour durer plus longtemps',
        effect:{fitness:+5}, outcome:'Tu acceptes de lever le pied. Une prudence qui n\'est pas dans tes habitudes.'}
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

  {id:'community', cat:'community', cooldown:4,
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

  {id:'personal', cat:'personal', cooldown:3,
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
  {id:'nightlife', cat:'nightlife', cooldown:5,
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
                        : ctx.night==='good'?'Belle soirée : tu y fais une rencontre qui va compter (contacts, image, énergie). Parfois ça sourit.'
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
        effect:{reputation:+4, coach:+2, media:+2, flag:'mediaFriend'}, outcome:'Tu désamorces avec classe. Ton image en sort grandie.'},
      {label:'Répondre cash, du tac au tac', hint:'Le clash assumé, quitte à diviser',
        effect:{popularity:+6, reputation:-5, coach:-2, flag:['controversial','hothead']}, outcome:'Ça fait le buzz, mais certains n\'ont pas apprécié le ton.'}
    ]},

  {id:'overwork', cat:'training', cooldown:4,
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
        effect:{coach:+2, media:+1, flag:'mediaFriend'}, outcome:'Tu bottes en touche proprement. Rien à signaler.'}
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
    body:()=>`Le coach ne te connaît pas encore vraiment. Tu sens qu'il te regarde avec circonspection, comme le reste du staff : la confiance, ici, se mérite.`,
    weight:()=>1.15,
    choices:()=>[
      {label:'Bosser deux fois plus à l\'entraînement pour prouver ta valeur', hint:'Le travail comme seule réponse',
        effect:{coach:+6, fitness:-3}, outcome:'Tu arrives tôt, repars tard. Le staff commence à noter ton sérieux.'},
      {label:'Demander une discussion franche avec le coach', hint:'Une discussion à double tranchant',
        effect:()=>(Math.random()<0.55)?{coach:+8, morale:+2}:{coach:-3, morale:-2},
        outcome:'Tu mets les choses à plat. Ça passe... ou ça casse un peu plus.'}
    ]},

  {id:'video_game_cover', cat:'business', once:true,
    when:(p,lg)=>p.popularity>=55,
    title:'Une jaquette de jeu vidéo à ton effigie',
    body:()=>`<i>(Séance photo en studio, capteurs de mouvement collés sur tout le corps.)</i> Un grand éditeur de jeu vidéo de basket te propose la couverture de sa prochaine édition. Une reconnaissance qui dépasse largement le terrain.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Accepter avec fierté', hint:'Un symbole de statut, assumé pleinement',
        effect:{popularity:+9, media:+3, money:+60}, outcome:'Ton visage s\'affiche dans les vitrines du monde entier. Un symbole fort de ton statut.'},
      {label:'Décliner, préférer rester discret', hint:'La discrétion plutôt que l\'exposition maximale',
        effect:{coach:+3, morale:+2}, outcome:'Tu préfères rester en dehors des projecteurs cette fois. Ton entourage respecte le choix.'}
    ]},

  {id:'charity_foundation', cat:'community', once:true,
    when:(p,lg)=>p.money>=250 && p.popularity>=35,
    title:'Lancer ta propre fondation',
    body:()=>`Tu as désormais les moyens de structurer ton engagement caritatif au-delà des apparitions ponctuelles. Une fondation à ton nom, c'est un vrai projet à porter dans la durée.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Se lancer et s\'impliquer personnellement', hint:'Un engagement de long terme, assumé',
        effect:{money:-80, popularity:+8, reputation:+3, morale:+3}, outcome:'La fondation voit le jour. Un projet qui te dépasse déjà le simple terrain.'},
      {label:'Continuer les dons ponctuels, plus simples', hint:'Rester sur un engagement plus léger',
        effect:{popularity:+3, money:-20}, outcome:'Tu préfères une implication plus légère, sans structure lourde à gérer.'}
    ]},

  {id:'first_home_purchase', cat:'personal', once:true,
    when:(p,lg)=>p.money>=180,
    title:'Acheter une maison pour les tiens',
    body:()=>`Les premiers vrais salaires arrivent, et une idée te trotte en tête depuis longtemps : offrir un vrai toit à ta famille, loin des soucis d'argent d'avant.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Investir dans une grande maison familiale', hint:'Le geste fort pour la famille, quitte à dépenser gros',
        effect:{money:-120, morale:+8, flag:'spender'}, outcome:'Tu poses les clés dans la main de tes proches. Un des plus beaux moments de ta jeune carrière.'},
      {label:'Rester raisonnable, épargner le reste', hint:'La prudence financière avant le geste symbolique',
        effect:{money:-40, morale:+4, flag:'saver'}, outcome:'Tu trouves un compromis raisonnable. Le geste compte autant que le montant.'}
    ]},

  {id:'paparazzi_incident', cat:'media', cooldown:4,
    when:(p,lg)=>p.popularity>=50,
    weight:mediaWeight,
    title:'Traqué jusque devant chez toi',
    body:()=>`<i>(Flashs à travers la vitre de la voiture, un objectif collé à la fenêtre de ton salon.)</i> Des photographes s'installent régulièrement près de chez toi. Ta vie privée devient un produit à part entière.`,
    choices:()=>[
      {label:'Réagir fermement, faire intervenir la sécurité', hint:'Poser une limite claire, quitte à faire du bruit',
        effect:{morale:+3, media:-2, popularity:+2}, outcome:'Tu poses une limite claire. Ça calme le jeu, pour un temps.'},
      {label:'Faire avec, partie du jeu', hint:'Accepter cette part du métier, à contrecœur',
        effect:{morale:-3, media:+2}, outcome:'Tu fais avec, sans plus rien dire. Le prix de la notoriété, en silence.'}
    ]},

  {id:'referee_controversy', cat:'presser', cooldown:3,
    when:(p,lg)=>p.reputation>=32,
    weight:(p)=>mediaWeight(p)*0.6,
    title:'Une décision arbitrale qui fait polémique',
    body:()=>`Une faute sifflée contre toi en fin de match a changé l'issue de la rencontre. Les ralentis passent en boucle, et les journalistes veulent ta réaction à chaud.`,
    choices:()=>[
      {label:'Critiquer ouvertement l\'arbitrage', hint:'Le coup de gueule public, au risque d\'une sanction',
        effect:()=>(Math.random()<0.5)?{popularity:+5, reputation:-3}:{popularity:+2, coach:-2},
        outcome:'Tu ne mâches pas tes mots sur l\'arbitrage. Les instances pourraient ne pas apprécier.'},
      {label:'Rester diplomate malgré la frustration', hint:'Ravaler la frustration, publiquement au moins',
        effect:{coach:+3, media:+1}, outcome:'Tu restes mesuré face aux caméras. La frustration reste, mais pour toi seul.'}
    ]},

  {id:'locker_prank', cat:'locker', cooldown:3,
    when:(p,lg)=>(p.clubTenure||0)>=1,
    title:'La blague du vestiaire',
    body:()=>`<i>(Rires étouffés derrière les casiers, quelqu'un filme discrètement avec son téléphone.)</i> Une bonne blague circule dans le vestiaire ce soir, et tu es soit la cible, soit l'occasion parfaite d'en lancer une toi-même.`,
    weight:()=>0.45,
    choices:()=>[
      {label:'Lancer la prochaine farce toi-même', hint:'Prendre les devants, pour l\'ambiance du groupe',
        effect:{morale:+4, popularity:+2}, outcome:'Ta farce fait un carton. L\'ambiance du vestiaire n\'en est que meilleure.'},
      {label:'Rester spectateur, en profiter sans participer', hint:'Apprécier l\'ambiance sans s\'exposer',
        effect:{morale:+2}, outcome:'Tu profites du moment sans t\'exposer. L\'ambiance reste bonne, discrètement.'}
    ]},

  {id:'heckler_incident', cat:'presser', cooldown:3,
    when:(p,lg)=>p.popularity>=30,
    title:'Un supporter adverse s\'en prend à toi',
    body:()=>`<i>(Une voix qui porte, juste au-dessus du tunnel des vestiaires, des mots qui dépassent la simple provocation sportive.)</i> Un spectateur multiplie les remarques personnelles à ton égard depuis le début du match.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'L\'ignorer complètement', hint:'Ne rien laisser transparaître',
        effect:{qi:+2, coach:+2}, outcome:'Tu n\'accordes aucune réaction. La meilleure des réponses, parfois.'},
      {label:'Répondre par un geste ou une réplique', hint:'Répondre du tac au tac, en public',
        effect:()=>(Math.random()<0.4)?{popularity:+4, flag:'hothead'}:{reputation:-3, coach:-2, flag:['controversial','hothead']},
        outcome:'Tu réponds directement. Le clip fait le tour des réseaux, pour le meilleur ou pour le pire.'}
    ]},

  {id:'nutritionist_upgrade', cat:'training', cooldown:5,
    when:(p,lg)=>p.money>=150,
    title:'S\'entourer d\'une équipe de sciences du sport',
    body:()=>`Nutritionniste personnel, préparateur physique dédié, suivi de sommeil : tu as désormais les moyens de professionnaliser chaque détail autour de ton corps.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Investir massivement dans cette équipe', hint:'Le détail qui peut tout changer, à prix fort',
        effect:{money:-70, fitness:+8, ath:+1, flag:'spender'}, outcome:'Chaque détail est désormais optimisé. Le corps répond, nettement.'},
      {label:'Garder une approche plus simple', hint:'Faire confiance aux méthodes classiques',
        effect:{money:-10, fitness:+2, flag:'saver'}, outcome:'Tu restes sur des méthodes plus classiques. Simple, mais suffisant pour l\'instant.'}
    ]},

  {id:'equipment_switch', cat:'business', cooldown:4,
    when:(p,lg)=>p.popularity>=30,
    title:'Changer d\'équipementier en pleine carrière',
    body:()=>`Une marque concurrente vient chercher ta signature avec une offre nettement supérieure. Changer de chaussures en cours de carrière n'est jamais anodin pour les sensations de jeu.`,
    weight:()=>0.45,
    choices:()=>[
      {label:'Accepter le changement pour le chèque', hint:'L\'argent, malgré la période d\'adaptation',
        effect:{money:+90, tir:-1, popularity:+3}, outcome:'Le chèque est trop bon pour refuser. Les premières semaines dans les nouvelles paires demandent un temps d\'adaptation.'},
      {label:'Rester fidèle à ta marque actuelle', hint:'Le confort et la fidélité avant tout',
        effect:{coach:+2, morale:+2}, outcome:'Tu restes fidèle à ce qui fonctionne. La continuité a aussi sa valeur.'}
    ]},

  {id:'podcast_candor', cat:'media', cooldown:4,
    when:(p,lg)=>p.reputation>=38,
    weight:mediaWeight,
    title:'Une interview podcast sans filtre',
    body:()=>`<i>(Format long, casque sur les oreilles, aucune question interdite à l'avance.)</i> Un podcast réputé du milieu te propose un entretien fleuve, loin du format aseptisé des interviews d'après-match.`,
    choices:()=>[
      {label:'Te livrer vraiment, sujets sensibles compris', hint:'L\'authenticité totale, avec ses risques',
        effect:()=>(Math.random()<0.55)?{popularity:+8, media:+3}:{reputation:-2, coach:-2},
        outcome:'Tu te livres sans filtre. Selon ce qui ressort, l\'accueil varie fortement.'},
      {label:'Rester intéressant mais mesuré', hint:'Le contrôle, sans fermer la porte à l\'authenticité',
        effect:{media:+3, popularity:+3, flag:'mediaFriend'}, outcome:'Tu trouves le bon dosage entre authenticité et prudence. Bel accueil général.'}
    ]},

  {id:'family_emergency', cat:'personal', cooldown:4,
    when:(p,lg)=>true,
    title:'Un appel qui change les priorités',
    body:()=>`<i>(Téléphone qui vibre en pleine nuit, un proche à l'autre bout du fil.)</i> Une urgence familiale te pousse à choisir entre rester concentré sur la saison ou t'absenter pour être auprès des tiens.`,
    weight:()=>0.4,
    choices:()=>[
      {label:'Partir immédiatement, sans hésiter', hint:'La famille avant tout, sans une seconde d\'hésitation',
        effect:{morale:+4, fitness:-2, coach:+2}, outcome:'Tu pars sans une seconde d\'hésitation. Le club comprend et te soutient pleinement.'},
      {label:'Gérer à distance, rester avec l\'équipe', hint:'Gérer du mieux possible, sans quitter le groupe',
        effect:{morale:-4, coach:+1}, outcome:'Tu restes avec le groupe, le cœur ailleurs. Pas simple, mais tu tiens ta place.'}
    ]},

  {id:'analytics_pushback', cat:'system', cooldown:3,
    when:(p,lg)=>lg.tier<=2,
    title:'Le staff analytics veut changer ton jeu',
    body:()=>`<i>(Graphiques de zones de tir affichés en réunion, le responsable data très sûr de lui.)</i> Le département analytique du club a des chiffres précis sur les tirs les plus rentables statistiquement, et voudrait que tu ajustes ta sélection de tirs en conséquence.`,
    weight:()=>0.45,
    choices:()=>[
      {label:'Adopter pleinement les recommandations', hint:'Faire confiance aux chiffres, contre tes habitudes',
        effect:{qi:+2, coach:+3, tir:-1, adr3:+2}, outcome:'Tu ajustes ta sélection de tirs selon les chiffres. Un temps d\'adaptation, puis l\'efficacité suit.'},
      {label:'Garder ton instinct de jeu', hint:'Faire confiance au ressenti plutôt qu\'aux chiffres',
        effect:{morale:+2, coach:-2}, outcome:'Tu préfères ton propre instinct aux tableurs. Le staff data n\'est pas ravi, tu assumes.'}
    ]},

  {id:'fan_meme', cat:'social', cooldown:4,
    when:(p,lg)=>p.popularity>=20,
    title:'Une image de toi devient un mème',
    body:()=>`Une photo prise à un moment maladroit du match circule partout, détournée dans tous les sens sur les réseaux. Tu deviens malgré toi une petite célébrité d'internet.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'En rire publiquement et surfer dessus', hint:'Prendre l\'autodérision comme meilleure arme',
        effect:{popularity:+7, media:+2, morale:+2}, outcome:'Tu en ris le premier et republies les meilleurs détournements. Le public adore l\'autodérision.'},
      {label:'Ignorer et laisser passer', hint:'Laisser le buzz retomber de lui-même',
        effect:{morale:-1}, outcome:'Tu laisses passer sans réagir. Le buzz finit par retomber, comme toujours.'}
    ]},

  {id:'offseason_workout_group', cat:'training', cooldown:3,
    when:(p,lg)=>p.reputation>=35,
    title:'Rejoindre un groupe d\'entraînement de pros l\'été',
    body:()=>`Un groupe fermé de joueurs confirmés s'entraîne ensemble chaque été, loin des regards. Une invitation à les rejoindre te parvient par un ancien coéquipier.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Rejoindre le groupe, se mesurer aux meilleurs', hint:'Se tester face à plus fort que soi',
        effect:{qi:+2, tir:+1, def:+1, fitness:-2}, outcome:'Te mesurer à ce niveau chaque jour élève ton propre plafond, sans ménagement.'},
      {label:'Continuer ta préparation personnelle habituelle', hint:'Rester sur tes repères, en solo',
        effect:{fitness:+4}, outcome:'Tu préfères tes repères habituels. Prévisible, mais confortable.'}
    ]},

  {id:'hometown_discount', cat:'contract', cooldown:4,
    when:(p,lg)=>p.contractY<=1 && p.reputation>=42,
    title:'Le rabais du cœur',
    body:()=>`Ton club de toujours te propose de rester, mais nettement moins payé qu'ailleurs sur le marché. Un choix entre l'attachement et la valeur de marché.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Accepter, l\'attachement avant l\'argent', hint:'Le cœur avant le compte en banque',
        effect:{money:-40, popularity:+6, coach:+4, morale:+3, flag:'loyalOne'}, outcome:'Tu acceptes le rabais du cœur. Le public n\'oublie jamais ce genre de geste.'},
      {label:'Refuser, exiger ta pleine valeur', hint:'La valeur de marché, sans concession',
        effect:{money:+60, coach:-3}, outcome:'Tu refuses de brader ta valeur. Business avant sentiment, cette fois.'}
    ]},

  {id:'public_apology', cat:'media', cooldown:4,
    when:(p,lg)=>((p.flags&&p.flags.controversial)||0)>=1,
    weight:mediaWeight,
    title:'Le moment de recoller les morceaux',
    body:()=>`Après une sortie médiatique qui a fait grincer des dents, ton entourage te pousse à calmer le jeu publiquement. La façon dont tu le fais compte autant que le geste lui-même.`,
    choices:()=>[
      {label:'Des excuses publiques sincères', hint:'Reconnaître ouvertement, sans détour',
        effect:{coach:+5, reputation:+2, popularity:-2, flag:'mediaFriend'}, outcome:'Tes excuses sonnent sincères. Le vestiaire et le club apprécient le geste.'},
      {label:'Minimiser, tourner la page rapidement', hint:'Ne pas s\'attarder sur l\'épisode',
        effect:{media:+1, coach:-1}, outcome:'Tu minimises et passes vite à autre chose. L\'épisode reste dans un coin des mémoires.'}
    ]},

  {id:'offseason_pickup_scare', cat:'injury', cooldown:4,
    when:(p,lg)=>p.age<=30,
    title:'Une frayeur hors saison',
    body:()=>`<i>(Un simple match improvisé entre amis, sans enjeu apparent.)</i> Une entorse te guette même loin des projecteurs, dans un match sans importance officielle. Le corps ne fait pas la différence entre saison et hors-saison.`,
    weight:()=>0.35,
    choices:()=>[
      {label:'Continuer à jouer dans ces matchs informels', hint:'Garder tes habitudes, malgré le risque',
        effect:()=>(Math.random()<0.25)?{injuryGames:ri(4,10), fitness:-6}:{morale:+3, ath:+1},
        outcome:'Tu continues à jouer pour le plaisir, comme toujours. Le risque existe, mais le plaisir aussi.'},
      {label:'Renoncer à ces matchs informels par prudence', hint:'La prudence, même loin des enjeux officiels',
        effect:{fitness:+3, morale:-1}, outcome:'Tu renonces à ces matchs entre amis, par prudence. Un peu de frustration, mais le corps est protégé.'}
    ]},

  {id:'reality_tv_offer', cat:'media', once:true,
    when:(p,lg)=>p.popularity>=48,
    title:'Une émission de télé-réalité te sollicite',
    body:()=>`<i>(Un producteur insiste, promettant une exposition inédite auprès d'un public qui ne suit pas forcément le basket.)</i> Une émission grand public te propose d'y apparaître. Une exposition énorme, mais loin de l'image de sportif sérieux.`,
    weight:()=>0.4,
    choices:()=>[
      {label:'Accepter, toucher un public plus large', hint:'L\'exposition avant l\'image de sérieux',
        effect:{popularity:+8, money:+40, coach:-3}, outcome:'Ton visage touche un public qui ignorait tout de toi. Le milieu du basket grince un peu des dents.'},
      {label:'Décliner, préserver ton image de sportif', hint:'Le sérieux sportif avant l\'exposition grand public',
        effect:{coach:+3, reputation:+1}, outcome:'Tu déclines poliment. Ton image reste centrée sur le terrain, rien d\'autre.'}
    ]},
];
