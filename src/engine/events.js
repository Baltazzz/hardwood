import { LEAGUES } from '../data/leagues.js';
import { LIFESTYLES } from '../data/lifestyles.js';
import { STYLES } from '../data/styles.js';
import { LEGENDS } from '../data/legends.js';
import { ovr, roleOf, attrOf } from './player.js';
import { actionRoll, ri, pick } from './utils.js';

/* ============================================================
   BANQUE D'ÉVÉNEMENTS
   cat: catégorie · when(p,lg): condition · weight(p,lg): pondération
   choices(ctx): [{label,hint,effect,outcome,tl}]
============================================================ */
export const EVENTS = [
  // ---------- JEUNESSE / FORMATION ----------
  {id:'coach_pos', cat:'youth', tag:'Formation', solo:true,
    when:(p,lg)=>lg.tier>=4 && p.age<=21,
    title:'Le coach veut te changer de poste',
    body:({p})=>`Ton entraîneur pense que ton avenir est ailleurs que là où tu joues. « Tu as le profil pour évoluer différemment », te dit-il. Accepter, c'est repartir un peu de zéro pour gagner en polyvalence.`,
    choices:()=>[
      {label:'Accepter et apprendre le nouveau rôle', hint:'+QI, +polyvalence, moral en baisse court terme',
        effect:{qi:+4, passe:+2, def:+2, morale:-3}, outcome:'Tu ravales ta fierté et bosses le nouveau poste. Ton intelligence de jeu grimpe.'},
      {label:'Refuser, rester sur tes forces', hint:'Concentré sur ton point fort',
        effect:{coach:-4}, outcome:'Tu tiens ta ligne. Le coach hausse les épaules, un peu déçu.'}
    ]},

  {id:'early_pro', cat:'youth', tag:'Décision', solo:true,
    when:(p,lg)=>lg.tier===5 && p.age>=17 && p.age<=19 && ovr(p)>=LEAGUES.academy.star-8,
    title:'Un club pro te fait les yeux doux',
    body:({p})=>`Un club de division inférieure te propose de signer pro tout de suite. Plus d'argent, mais moins de temps de jeu garanti face à des adultes. La formation, elle, te laisserait dominer ta catégorie encore un an.`,
    weight:()=>1.4,
    choices:()=>[
      {label:'Signer pro maintenant', hint:'Passer pro tout de suite (gros pari)',
        effect:{forceMove:{type:'promo',to:'second'}, morale:+4, money:+30}, outcome:'Tu franchis le pas vers le monde pro plus tôt que prévu.'},
      {label:'Rester en formation encore un an', hint:'Dominer avant de monter',
        effect:{tir:+2, dribble:+2, qi:+1}, outcome:'Tu restes et tu écrases ta catégorie. Ton jeu s\'affine.'}
    ]},

  {id:'growth_spurt', cat:'youth', tag:'Physique',
    when:(p,lg)=>p.age<=20,
    title:'Poussée de croissance',
    body:`Ton corps change vite. Bien géré, c'est de l'explosivité en plus. Mal géré, ce sont des douleurs de croissance qui traînent.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Programme de renforcement encadré', hint:'+Athlé, léger risque',
        effect:{ath:+4, fitness:-4}, outcome:'Tu prends de la caisse. Les cuisses brûlent, mais ça paie.'},
      {label:'Y aller doucement, préserver le corps', hint:'Prudence',
        effect:{ath:+1, fitness:+5}, outcome:'Tu temporises. Le corps te remercie.'}
    ]},

  // ---------- MÉDIAS ----------
  {id:'media_punchline', cat:'media',
    when:(p,lg)=>p.reputation>=25,
    title:'Micro tendu après un gros match',
    body:({p})=>`Un journaliste te cherche : « Certains disent que tu es surcoté. Réponse ? » La salle attend. Ce que tu dis fera la une demain.`,
    choices:()=>[
      {label:'Balancer une punchline assassine', hint:'+Popularité, coach méfiant',
        effect:{popularity:+8, media:+4, coach:-4}, outcome:'Ta phrase tourne en boucle sur les réseaux. Le vestiaire sourit, le coach moins.'},
      {label:'Rester humble et renvoyer vers le collectif', hint:'+Coach, +médias',
        effect:{coach:+5, media:+3, popularity:+1}, outcome:'Réponse propre, pro. Les vétérans apprécient.'},
      {label:'Envoyer une vanne qui détend', hint:'Équilibré',
        effect:{popularity:+4, media:+2, morale:+2}, outcome:'Rires dans la salle. Tu marques des points en sympathie.'}
    ]},

  {id:'transfer_rumor', cat:'media',
    when:(p,lg)=>p.reputation>=40 && lg.tier<=3,
    title:'Une rumeur de transfert fuite',
    body:({p})=>`La presse annonce que tu serais sur le départ. Ton président fulmine, tes coéquipiers te regardent différemment. Comment tu gères ?`,
    choices:()=>[
      {label:'Démentir publiquement et rassurer', hint:'+Coach, +vestiaire',
        effect:{coach:+5, morale:+3, media:+2}, outcome:'Tu calmes le jeu. Le club apprécie ta loyauté affichée.'},
      {label:'Ni oui ni non, entretenir le flou', hint:'+Réputation, coach nerveux',
        effect:{reputation:+4, coach:-3, popularity:+3}, outcome:'Le mystère fait monter ta cote… et la tension.'}
    ]},

  // ---------- MODE DE VIE / BUSINESS ----------
  {id:'sneaker_deal', cat:'business', solo:true,
    when:(p,lg)=>p.popularity>=25 || lg.tier<=2,
    title:'Un équipementier pose un contrat',
    body:({p})=>`Une marque de sneakers veut t'habiller. Gros chèque, séances photo, obligations marketing. C'est de l'argent et de la lumière — mais aussi du temps volé à l'entraînement.`,
    choices:()=>[
      {label:'Signer le gros contrat', hint:'+Argent, +Popularité, -focus',
        effect:{money:+220, popularity:+9, tir:-1}, outcome:'Ton visage s\'affiche en ville. Le compte en banque respire.'},
      {label:'Négocier un deal léger, garder le focus basket', hint:'Équilibre',
        effect:{money:+70, popularity:+4}, outcome:'Deal raisonnable. Tu gardes la tête au jeu.'},
      {label:'Refuser, tout pour le terrain', hint:'+Progression',
        effect:{tir:+2, adr3:+2, coach:+2}, outcome:'Tu déclines. Tes séances supplémentaires parlent pour toi.'}
    ]},

  {id:'night_out', cat:'lifestyle',
    when:(p,lg)=>true,
    title:'Soirée la veille d\'un match',
    body:({p})=>`Les cadres du vestiaire t'invitent à sortir. Refuser peut te couper du groupe ; accepter, c'est jouer avec ta fraîcheur.`,
    weight:(p)=>{const l=LIFESTYLES.find(x=>x.id===p.life);return l.id==='party'?1.6:l.id==='pro'?0.5:1;},
    choices:()=>[
      {label:'Sortir avec le groupe', hint:'+Vestiaire, -Forme',
        effect:{morale:+5, fitness:-10, coach:-2}, outcome:'Bonne soirée, liens resserrés. Le réveil pique un peu.'},
      {label:'Décliner poliment, dodo', hint:'+Forme, un peu à l\'écart',
        effect:{fitness:+6, morale:-2}, outcome:'Tu rentres tôt. Frais pour demain, mais un peu en marge.'}
    ]},

  {id:'invest', cat:'business', solo:true,
    when:(p,lg)=>p.money>=200,
    title:'Une opportunité d\'investissement',
    body:({p})=>`Un proche te propose de placer une partie de tes gains dans un projet. Ça peut rapporter gros… ou partir en fumée.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Investir une grosse somme', hint:'Pari risqué',
        effect:({p})=>{ const win=Math.random()>.5; return win?{money:+Math.round(p.money*0.6)}:{money:-Math.round(p.money*0.4)}; },
        outcome:({p})=>'Les marchés décident… le résultat est tombé sur ton compte.'},
      {label:'Placer prudemment', hint:'Petit gain sûr',
        effect:({p})=>({money:+Math.round(p.money*0.08+20)}), outcome:'Rendement modeste mais tranquille.'},
      {label:'Ne pas toucher à ton argent', hint:'Sécurité',
        effect:{morale:+1}, outcome:'Tu gardes ton magot au chaud.'}
    ]},

  // ---------- VESTIAIRE ----------
  {id:'star_clash', cat:'locker',
    when:(p,lg)=>lg.tier<=3 && p.reputation>=40,
    title:'Bras de fer avec la star de l\'équipe',
    body:({p})=>`Le leader du vestiaire supporte mal ta montée en puissance. Les ballons circulent moins vers toi. Il faut trancher.`,
    choices:()=>[
      {label:'T\'imposer, réclamer plus de ballons', hint:'+Réputation, tension',
        effect:{reputation:+5, perfBonus:+6, coach:-3, morale:-2}, outcome:'Tu prends le pouvoir sur le terrain. Le vestiaire se réorganise autour de toi.'},
      {label:'Jouer collectif, gagner le respect par le travail', hint:'+Coach, +QI',
        effect:{coach:+5, qi:+2, morale:+3}, outcome:'Tu baisses la tête et bosses. Peu à peu, le respect vient.'}
    ]},

  {id:'benched', cat:'locker', solo:true,
    when:(p,lg)=>{const last=p.seasons[p.seasons.length-1]; return last && last.minutes<16 && p.age<32;},
    title:'Le coach te laisse sur le banc',
    body:({p})=>`Les minutes se font rares. Tu ronges ton frein en bout de banc. Trois voies s'offrent à toi.`,
    choices:()=>[
      {label:'Travailler deux fois plus à l\'entraînement', hint:'+Progression réelle',
        effect:{tir:+2, def:+2, ath:+1, coach:+3}, outcome:'Tu transformes la frustration en carburant. Le coach le remarque.'},
      {label:'Demander un transfert', hint:'Forcer un départ',
        effect:{forceMove:{type:'transfer'}, coach:-5, reputation:+1}, outcome:'Tu claques la porte pour aller jouer ailleurs.'},
      {label:'Te plaindre dans la presse', hint:'+Popularité, -Coach',
        effect:{media:+3, popularity:+3, coach:-8, morale:-2}, outcome:'Ton coup de gueule fait du bruit. La relation avec le staff se tend franchement.'}
    ]},

  {id:'mentor', cat:'locker', solo:true,
    when:(p,lg)=>p.age<=24 && lg.tier<=3,
    title:'Un vétéran te prend sous son aile',
    body:`Un ancien du vestiaire, en fin de carrière, voit quelque chose en toi. Il te propose de te transmettre ce qu'il sait — à condition que tu sois assidu.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Boire ses conseils, arriver plus tôt chaque jour', hint:'+QI, +Défense',
        effect:{qi:+4, def:+3, morale:+2}, outcome:'Ses lectures de jeu deviennent les tiennes. Tu grandis vite.'},
      {label:'Le remercier mais rester dans ton coin', hint:'Neutre',
        effect:{morale:+1}, outcome:'Tu préfères ta propre méthode. Le vétéran respecte, sans insister.'}
    ]},

  // ---------- BLESSURES ----------
  {id:'ankle', cat:'injury', solo:true,
    when:(p,lg)=>true,
    title:'Entorse à la cheville',
    body:`Réception maladroite, la cheville tourne. Le staff médical est prudent. Toi, tu veux jouer.`,
    weight:(p)=>{const l=LIFESTYLES.find(x=>x.id===p.life);return 0.16*l.injury*(p.riskMod||1);},
    choices:()=>[
      {label:'Forcer le retour, serrer les dents', hint:'-Forme, risque, perf en baisse',
        effect:{injuryGames:12, fitness:-14, ath:-1, perfBonus:-5, coach:+2}, outcome:'Tu reviens trop tôt. Tu joues diminué mais tu montres du caractère.'},
      {label:'Respecter les délais de guérison', hint:'Manquer des matchs, revenir sain',
        effect:{injuryGames:18, fitness:+4}, outcome:'Tu prends le temps. Le corps guérit correctement.'}
    ]},

  {id:'big_injury', cat:'injury', solo:true,
    when:(p,lg)=>p.age>=20,
    title:'Genou : le diagnostic tombe',
    body:`Un mauvais appui, un craquement. L'IRM confirme une grosse blessure. Longue absence en vue. La façon dont tu traverses ça définira la suite.`,
    weight:(p)=>{const l=LIFESTYLES.find(x=>x.id===p.life);return 0.05*l.injury*(p.riskMod||1);},
    choices:()=>[
      {label:'Rééducation exemplaire, revenir plus fort mentalement', hint:'Longue absence, moral solide',
        effect:{injuryGames:45, ath:-4, fitness:-10, qi:+3, morale:+2, reputation:-2}, outcome:'Des mois de travail dans l\'ombre. Tu perds en explosivité mais tu gagnes en tête.'},
      {label:'Précipiter le retour pour ne pas perdre ta place', hint:'Risque de rechute',
        effect:{injuryGames:30, ath:-7, fitness:-18, perfBonus:-8}, outcome:'Tu reviens trop vite. Le genou n\'est pas le même, et ça se voit.'}
    ]},

  // ---------- NATIONALE ----------
  {id:'first_call', cat:'nation', solo:true,
    when:(p,lg)=>p.reputation>=42 && !p.natCap,
    title:'Première convocation en sélection',
    body:({p})=>`Le sélectionneur de ${p.nation.name} ${p.nation.flag} t'appelle pour la première fois. Endosser le maillot national, c'est un honneur — et une exposition nouvelle.`,
    choices:({p})=>[
      {label:'Répondre présent avec fierté', hint:'+Réputation, +Popularité',
        effect:{reputation:+6, popularity:+6, morale:+5}, tl:()=>`Première sélection avec ${p.nation.name}.`,
        outcome:'Hymne, maillot, frissons. Une nouvelle dimension à ta carrière.'}
    ]},

  {id:'nation_leader', cat:'nation',
    when:(p,lg)=>p.natCap && ovr(p)>=80,
    title:'On te veut capitaine de la sélection',
    body:({p})=>`La fédération voit en toi le leader de la nouvelle génération ${p.nation.flag}. Le brassard, c'est du poids sur les épaules autant qu'un honneur.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Accepter le brassard', hint:'+Réputation, pression',
        effect:{reputation:+7, morale:+3, popularity:+4}, outcome:'Tu deviens le visage de ta sélection. Les attentes montent d\'un cran.'},
      {label:'Laisser le rôle à un plus ancien', hint:'Rester concentré',
        effect:{coach:+2, morale:+2}, outcome:'Tu préfères montrer l\'exemple sans le brassard.'}
    ]},

  // ---------- CONTRAT ----------
  {id:'extension', cat:'contract', solo:true,
    when:(p,lg)=>p.contractY<=1 && ovr(p)>=lg.starter,
    title:'Ton club propose une prolongation',
    body:({p})=>`${p.club} veut te prolonger. Sécuriser ton avenir tout de suite, ou parier sur toi-même en testant le marché à la fin de saison ?`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Prolonger et sécuriser', hint:'+Argent stable, +Coach',
        effect:{money:+120, coach:+4, morale:+3}, outcome:'Tu signes. Le club et toi, c\'est reparti pour un tour.'},
      {label:'Parier sur toi, tester la free agency', hint:'Des offres tomberont en fin de saison',
        effect:{pendingFA:true, reputation:+2, perfBonus:+4, coach:-2}, outcome:'Tu refuses la première offre. En fin de saison, tu écouteras le marché — à toi de le mériter d\'ici là.'}
    ]},

  // ---------- ENTRAÎNEMENT / DÉVELOPPEMENT ----------
  {id:'training_focus', cat:'training', solo:true,
    when:(p,lg)=>p.age<=30,
    title:'Le chantier de l\'intersaison',
    body:`Tu as ciblé un axe pour passer un cap. Où mets-tu l'énergie de ton travail cette année ?`,
    weight:()=>1.3,
    choices:()=>[
      {label:'Ton tir et ton adresse extérieure', hint:'+Tir, +3pts',
        effect:{tir:+3, adr3:+3, coach:+1}, outcome:'Des milliers de shoots plus tard, ta main est plus sûre.'},
      {label:'Ta création et ta vision de jeu', hint:'+Passe, +Dribble',
        effect:{passe:+3, dribble:+3}, outcome:'Ton jeu s\'ouvre, tu lis le terrain différemment.'},
      {label:'Ta défense et ton physique', hint:'+Défense, +Athlé',
        effect:{def:+3, ath:+2, reb:+1}, outcome:'Plus dur à passer, plus dur à bouger.'}
    ]},

  {id:'slump', cat:'form',
    when:(p,lg)=>p.reputation>=30,
    title:'Passage à vide',
    body:`Les shoots ne rentrent plus, la confiance vacille. Les tribunes commencent à murmurer.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Retour aux fondamentaux, tête baissée', hint:'+QI, patience',
        effect:{qi:+2, tir:+1, morale:-2}, outcome:'Tu simplifies ton jeu. Petit à petit, ça revient.'},
      {label:'Forcer pour t\'en sortir seul', hint:'Risqué',
        effect:{perfBonus:-4, morale:-1, reputation:+1}, outcome:'Tu multiplies les tentatives. Ça passe ou ça casse.'}
    ]},

  {id:'coach_change', cat:'system', solo:true,
    when:(p,lg)=>lg.tier<=3,
    title:'Nouveau coach, nouveau système',
    body:`Le club change d'entraîneur. Sa philosophie ne ressemble pas à celle de son prédécesseur — à toi de t'y adapter.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Épouser son système à fond', hint:'+QI, +Coach',
        effect:{qi:+2, coach:+5}, outcome:'Tu deviens un relais du coach sur le terrain.'},
      {label:'Imposer ton style', hint:'+Réputation, friction',
        effect:{reputation:+3, coach:-4, perfBonus:+3}, outcome:'Tu joues à ta main. Le courant passe mal avec le staff.'}
    ]},

  {id:'community', cat:'community',
    when:(p,lg)=>true,
    title:'Action auprès des jeunes du quartier',
    body:`On te sollicite pour un événement caritatif avec les gamins de ta ville. Du temps hors du parquet, mais une image forte.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'T\'investir à fond', hint:'+Popularité, +Moral',
        effect:{popularity:+5, morale:+3}, outcome:'Les sourires des gamins valent tous les contrats. Ta cote de sympathie grimpe.'},
      {label:'Décliner, rester focalisé', hint:'Repos',
        effect:{fitness:+3}, outcome:'Tu préfères te préserver. On comprend, sans plus.'}
    ]},

  {id:'rivalry', cat:'rivalry',
    when:(p,lg)=>p.reputation>=45 && lg.tier<=2,
    title:'Un rival te cherche',
    body:`Un joueur de ton calibre, dans une équipe adverse, t'a pris pour cible dans la presse. Le duel est lancé.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Répondre sur le terrain', hint:'+Perf, +Réputation',
        effect:{perfBonus:+5, reputation:+3, morale:+2}, outcome:'Tu laisses parler ton jeu. Le duel devient un classique.'},
      {label:'Ignorer et rester au-dessus', hint:'+Coach, sérénité',
        effect:{coach:+3, qi:+1}, outcome:'Tu ne rentres pas dans son jeu. Les observateurs saluent ta maturité.'}
    ]},

  {id:'leadership', cat:'leadership',
    when:(p,lg)=>ovr(p)>=76,
    title:'Le vestiaire se tourne vers toi',
    body:`Les jeunes du groupe cherchent un repère, et ton nom revient. Endosser ce rôle, c'est du poids — et de l'influence.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Devenir le leader du vestiaire', hint:'+Réputation, +Coach',
        effect:{reputation:+4, coach:+3, morale:+2}, outcome:'Tu prends la parole, tu montres l\'exemple. Le groupe te suit.'},
      {label:'Mener par l\'exemple, sans le rôle', hint:'Discret',
        effect:{qi:+2}, outcome:'Tu préfères les actes aux discours.'}
    ]},

  {id:'playoff_push', cat:'pressure',
    when:(p,lg)=>lg.tier<=2 && p.reputation>=40,
    title:'Match couperet en playoffs',
    body:`Série décisive, tout se joue ce soir. Le coach te demande si tu veux le ballon dans le money-time.`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Réclamer les ballons chauds', hint:'+Perf, pression',
        effect:{perfBonus:+6, reputation:+2}, outcome:'Tu prends tes responsabilités dans le money-time. Frissons garantis.'},
      {label:'Faire confiance au collectif', hint:'+Coach',
        effect:{coach:+3, qi:+1}, outcome:'Tu joues juste, tu sers les copains. Le coach apprécie.'}
    ]},

  {id:'agent', cat:'agentbiz', solo:true,
    when:(p,lg)=>p.reputation>=45,
    title:'Un agent influent veut te représenter',
    body:`Un agent réputé, carnet d'adresses en or, propose de gérer ta carrière. Ça se paie, mais ça ouvre des portes.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Signer avec lui', hint:'+Réputation, -Argent',
        effect:{reputation:+5, money:-60, popularity:+3}, outcome:'Ton nom circule désormais dans les bons bureaux.'},
      {label:'Rester avec ton agent actuel', hint:'Fidélité',
        effect:{morale:+2, money:+20}, outcome:'Tu gardes ta confiance dans ton entourage historique.'}
    ]},

  {id:'personal', cat:'personal',
    when:(p,lg)=>true,
    title:'La vie en dehors du parquet',
    body:`Entre déplacements et matchs, tes proches réclament du temps. Trouver l'équilibre te rendrait plus solide dans la tête.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Prendre du temps pour tes proches', hint:'+Moral',
        effect:{morale:+5}, outcome:'Tu recharges les batteries loin du bruit. La tête est plus légère.'},
      {label:'Tout donner au basket cette saison', hint:'+Progression, -Moral',
        effect:{tir:+1, def:+1, ath:+1, morale:-3}, outcome:'Tu mets tout de côté pour le jeu. Efficace, mais éprouvant.'}
    ]},

  {id:'veteran_role', cat:'twilight', solo:true,
    when:(p,lg)=>p.age>=32,
    title:'Le rôle de vétéran',
    body:`Les jambes répondent moins, mais ton expérience vaut de l'or. Le club te voit désormais en guide pour les jeunes.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Accepter un rôle de mentor', hint:'+Coach, +Réputation',
        effect:{coach:+4, reputation:+2, qi:+1}, outcome:'Tu transmets ce que tu sais. Le vestiaire te vénère.'},
      {label:'Refuser de lâcher ta place de titulaire', hint:'Fierté, friction',
        effect:{perfBonus:+3, coach:-3, morale:+2}, outcome:'Tu veux encore ton temps de jeu. Le bras de fer commence.'}
    ]},

  {id:'comeback', cat:'comeback',
    when:(p,lg)=>{const l=p.seasons[p.seasons.length-1]; return !!(l && l.injured);},
    title:'Le retour de blessure',
    body:`Après des semaines à l'écart, tu retrouves le parquet. La confiance dans ton corps se reconstruit match après match.`,
    weight:()=>1.4,
    choices:()=>[
      {label:'Retour progressif et intelligent', hint:'+Forme, patience',
        effect:{fitness:+8, qi:+1, morale:+2}, outcome:'Tu reviens sans forcer. Le corps répond bien.'},
      {label:'Vouloir tout rattraper d\'un coup', hint:'Risqué',
        effect:{perfBonus:-3, fitness:-4, reputation:+1}, outcome:'Tu brûles les étapes pour prouver que tu es de retour.'}
    ]},

  {id:'social_media', cat:'social',
    when:(p,lg)=>p.popularity>=20,
    title:'Ton action devient virale',
    body:`Un geste spectaculaire de ta dernière rencontre explose sur les réseaux. L'occasion de surfer sur la vague.`,
    weight:()=>0.5,
    choices:()=>[
      {label:'Alimenter le buzz', hint:'+Popularité',
        effect:{popularity:+7, media:+2}, outcome:'Les vues s\'envolent, ton nom dépasse le cercle des initiés.'},
      {label:'Rester discret et bosser', hint:'+Progression',
        effect:{tir:+1, dribble:+1}, outcome:'Tu laisses le bruit retomber et tu retournes au travail.'}
    ]},

  {id:'nightlife', cat:'nightlife',
    when:(p,lg)=>p.age<=31,
    title:'Sortie avec les potes ce soir ?',
    body:`La bande t'invite à sortir après une grosse semaine. Décompresser fait du bien... mais la nuit peut coûter cher.`,
    weight:()=>0.8,
    choices:({p})=>{ const l=LIFESTYLES.find(x=>x.id===p.life); const risky=(l.id==='party');
      return [
        {label:'Sortir et profiter', hint:'+Popularité, risque de pépin (parfois du bon)',
          effect:(ctx)=>{ const r=Math.random(); const injP=risky?0.34:0.20;
            if(r<injP){ ctx.night='bad'; return {injuryGames:ri(6,12), fitness:-8, popularity:+5, riskUp:+0.25, flag:'nightOwl'}; }
            if(r>0.88){ ctx.night='good'; return {popularity:+8, reputation:+4, morale:+5, qi:+1, flag:'nightOwl'}; }
            ctx.night='ok'; return {popularity:+6, fitness:-3, morale:+3, riskUp:+0.15, flag:'nightOwl'}; },
          outcome:(ctx)=> ctx.night==='bad'?'La soirée dérape un peu... réveil difficile et petit pépin à la clé.'
                        : ctx.night==='good'?'Belle soirée — tu y fais une rencontre qui va compter (contacts, image, énergie). Parfois ça sourit.'
                        : 'Bonne soirée, sans excès. On verra demain à l\'entraînement.'},
        {label:'Rester au calme et récupérer', hint:'+Forme, sérieux',
          effect:{fitness:+7, qi:+1, riskUp:-0.2}, outcome:'Repos, sommeil, glace. Le corps te remerciera.'}
      ]; }},

  {id:'media_controversy', cat:'media',
    when:(p,lg)=>p.popularity>=25 && p.reputation>=35,
    title:'Une phrase sort de son contexte',
    body:`Un média monte en épingle une de tes déclarations. Le vestiaire et les fans attendent ta réaction.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Assumer et clarifier posément', hint:'+Réputation, +Coach',
        effect:{reputation:+4, coach:+2, media:+2}, outcome:'Tu désamorces avec classe. Ton image en sort grandie.'},
      {label:'Répondre cash, du tac au tac', hint:'Buzz, mais scandale',
        effect:{popularity:+6, reputation:-5, coach:-2}, outcome:'Ça fait le buzz, mais certains n\'ont pas apprécié le ton.'}
    ]},

  {id:'overwork', cat:'training',
    when:(p,lg)=>p.age<=29,
    title:'Doubler les séances ?',
    body:`Tu peux enchaîner une deuxième séance quotidienne pour passer un cap. Efficace, mais ton corps a ses limites.`,
    weight:(p)=>p.life==='grinder'?0.9:0.45,
    choices:()=>[
      {label:'Tout donner, double dose', hint:'+Progression, risque',
        effect:()=> (Math.random()<0.25)
          ? {injuryGames:ri(8,16), fitness:-10, ath:+1, perfBonus:-3, riskUp:+0.2}
          : {ath:+2, def:+1, tir:+1, fitness:-4, riskUp:+0.1},
        outcome:'Tu pousses la machine au maximum.'},
      {label:'Charge maîtrisée', hint:'Progrès sûr',
        effect:{qi:+2, fitness:+4}, outcome:'Tu bosses intelligemment, sans casse.'}
    ]},

  /* ========================================================
     MOMENTS D'ACTION — l'issue dépend de tes stats + aléatoire
  ======================================================== */
  {id:'clutch_shot', cat:'clutch',
    when:(p,lg)=>p.reputation>=28 && lg.tier<=3,
    title:'Le tir de la gagne',
    body:({lg})=>`Dernière possession, un point de retard, la salle retient son souffle. Le ballon est pour toi. Que fais-tu ?`,
    weight:()=>1.05,
    choices:({p})=>{ const shot=Math.round((attrOf(p,'tir')+attrOf(p,'adr3'))/2);
      return [
        {label:'Je prends le tir de la gagne', hint:`Dépend de ton tir (${shot})`,
          effect:(ctx)=>{ const ok=actionRoll(shot,70); ctx.ok=ok; return ok?{reputation:+7,morale:+8,popularity:+6,clutch:+1,flag:'clutchHero'}:{reputation:-3,morale:-5,popularity:+1}; },
          outcome:(ctx)=> ctx.ok?'Splash au buzzer ! Tu délivres tout un peuple. Le genre de tir qui fait les légendes.':'Le tir s\'écrase sur le cercle, la sirène retentit. Rageant — mais tu as pris tes responsabilités.'},
        {label:'Je sers le coéquipier démarqué', hint:`Dépend de ta vision (${attrOf(p,'qi')})`,
          effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),58); ctx.ok=ok; return ok?{reputation:+4,coach:+5,morale:+4}:{coach:+1,morale:-2}; },
          outcome:(ctx)=> ctx.ok?'Passe parfaite, panier de la gagne ! Le coach adore ta lucidité.':'Ta passe est interceptée. Le banc grimace.'},
        {label:'Je provoque la faute', hint:`Dépend de ton explosivité (${attrOf(p,'ath')})`,
          effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'ath'),62); ctx.ok=ok; return ok?{reputation:+3,morale:+5,clutch:+1}:{morale:-3,reputation:-1}; },
          outcome:(ctx)=> ctx.ok?'Tu attaques le cercle, coup de sifflet ! Lancers de la gagne, sang-froid total.':'Pas de sifflet. Tu forces, ça ne passe pas.'}
      ]; }},

  {id:'defensive_stand', cat:'defense',
    when:(p,lg)=>p.reputation>=30 && lg.tier<=3 && (p.pos==='C'||p.pos==='PF'||p.pos==='SF'),
    title:'Le stop décisif',
    body:()=>`Une possession pour tout gagner, mais c'est l'adversaire qui a le ballon. Le money-time se joue aussi en défense.`,
    weight:()=>0.9,
    choices:({p})=>[
      {label:'Je tente le contre', hint:`Dépend de ta défense (${attrOf(p,'def')})`,
        effect:(ctx)=>{ const ok=actionRoll(Math.round((attrOf(p,'def')+attrOf(p,'ath'))/2),70); ctx.ok=ok; return ok?{reputation:+6,morale:+7,clutch:+1,flag:'lockdown'}:{reputation:-2,morale:-4}; },
        outcome:(ctx)=> ctx.ok?'CONTRE monumental sur la sirène ! Le public explose, tu as tout verrouillé.':'Tu mords sur la feinte, panier encaissé. Dur.'},
      {label:'Je défends propre, sans faute', hint:`Dépend de ton QI (${attrOf(p,'qi')})`,
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok; return ok?{reputation:+4,coach:+4}:{morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Défense parfaite, tir contré par ta position. Money-time maîtrisé.':'Il trouve la faille malgré tout. Rien à te reprocher.'}
    ]},

  {id:'finals_moment', cat:'finals',
    when:(p,lg)=>lg.tier<=2 && p.reputation>=48,
    title:({lg})=>`Match décisif — titre ${lg.short} en jeu`,
    body:({lg})=>`Money-time du match qui donne le titre ${lg.short}. Le genre de soirée dont on parle vingt ans après. Comment abordes-tu ces dernières minutes ?`,
    weight:()=>1.1,
    choices:({p})=>{ const scorer=Math.round((attrOf(p,'tir')+attrOf(p,'adr3')+attrOf(p,'dribble'))/3);
      return [
        {label:'Je prends le match sur mes épaules', hint:`Dépend de ton scoring (${scorer})`,
          effect:(ctx)=>{ const ok=actionRoll(scorer,74); ctx.ok=ok; return ok?{reputation:+9,morale:+10,popularity:+8,clutch:+2,flag:'finalsHero'}:{reputation:-2,morale:-6,popularity:+2}; },
          outcome:(ctx)=> ctx.ok?'Récital dans le money-time ! Tu portes ton équipe vers le titre — une prestation pour l\'histoire.':'Tu forces, la réussite n\'est pas là ce soir. La marche était haute.'},
        {label:'Je joue collectif et je fais confiance au groupe', hint:`Dépend de ton QI (${attrOf(p,'qi')})`,
          effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),66); ctx.ok=ok; return ok?{reputation:+6,coach:+6,morale:+7,clutch:+1}:{coach:+2,morale:-3}; },
          outcome:(ctx)=> ctx.ok?'Tu orchestres à la perfection, tout le monde touche le ballon. Le titre au bout, en patron discret.':'Le collectif se grippe dans le money-time. Ça passe à côté.'}
      ]; }},

  {id:'rival_duel', cat:'duel',
    when:(p,lg)=>p.reputation>=42 && lg.tier<=2,
    title:'Le duel au sommet',
    body:()=>`Ce soir tu affrontes l'autre grand nom du championnat. Tous les regards sont sur ce face-à-face. Tu veux marquer les esprits ?`,
    weight:(p)=>p.flags&&p.flags.rival?1.1:0.75,
    choices:({p})=>{ const scorer=Math.round((attrOf(p,'tir')+attrOf(p,'dribble'))/2);
      return [
        {label:'Je le défie et je prends feu', hint:`Dépend de ton scoring (${scorer})`,
          effect:(ctx)=>{ const ok=actionRoll(scorer,72); ctx.ok=ok; return ok?{reputation:+7,morale:+6,popularity:+6,flag:'rival'}:{reputation:-2,morale:-3,flag:'rival'}; },
          outcome:(ctx)=> ctx.ok?'Tu le domines de la tête et des épaules. Le duel tourne à ta démonstration.':'Il prend le dessus ce soir. Ça pique l\'orgueil — la revanche viendra.'},
        {label:'Je le musèle en défense', hint:`Dépend de ta défense (${attrOf(p,'def')})`,
          effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'def'),68); ctx.ok=ok; return ok?{reputation:+5,coach:+4,flag:'rival'}:{morale:-2,flag:'rival'}; },
          outcome:(ctx)=> ctx.ok?'Tu l\'étouffes toute la soirée. Les défenseurs aussi font des statements.':'Il trouve des solutions. Soirée frustrante face à lui.'}
      ]; }},

  {id:'presser_hostile', cat:'presser',
    when:(p,lg)=>p.popularity>=22 && p.reputation>=32,
    title:'Conférence de presse tendue',
    body:()=>`Après une défaite, un journaliste te cherche ouvertement devant les caméras. La salle attend ta réaction.`,
    weight:()=>0.6,
    choices:({p})=>[
      {label:'Je réponds avec aplomb et charisme', hint:`Dépend de ton QI (${attrOf(p,'qi')})`,
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),58); ctx.ok=ok; return ok?{reputation:+5,popularity:+5,media:+3}:{reputation:-2,media:+1}; },
        outcome:(ctx)=> ctx.ok?'Réponse classe et maîtrisée, la punchline fait le tour des réseaux. Respect.':'Ta réponse tombe à plat, le clip tourne en boucle pour de mauvaises raisons.'},
      {label:'Je reste factuel et je coupe court', hint:'Sûr, sans éclat',
        effect:{coach:+2, media:+1}, outcome:'Tu bottes en touche proprement. Rien à signaler.'}
    ]},

  /* ========================================================
     ÉVÉNEMENTS LIÉS — débloqués par tes choix précédents
  ======================================================== */
  {id:'clutch_payoff', cat:'payoff', solo:true,
    when:(p,lg)=>((p.flags&&p.flags.clutchHero)||0)>=2 && lg.tier<=2,
    title:'Réputation de clutch',
    body:()=>`À force de briller dans les money-times, tu es devenu LE joueur à qui l'on confie les ballons chauds. Cette aura, ça se cultive.`,
    weight:()=>1.2,
    choices:()=>[
      {label:'J\'embrasse ce rôle de clutch player', hint:'+Réputation durable, +sang-froid',
        effect:{reputation:+5, perfBonus:+5, morale:+4, clutch:+1}, outcome:'Tu deviens le patron des fins de match. Les adversaires te craignent quand le chrono tourne.'},
      {label:'Je relativise, un match reste collectif', hint:'+Vestiaire',
        effect:{coach:+4, qi:+2}, outcome:'Tu renvoies vers le groupe. Le vestiaire apprécie ton humilité.'}
    ]},

  {id:'night_wakeup', cat:'wakeup', solo:true,
    when:(p,lg)=>((p.flags&&p.flags.nightOwl)||0)>=2,
    title:'Le coup de semonce',
    body:()=>`Tes sorties répétées ont fini par se voir : le staff te convoque, un article insinue des choses. Un tournant. Comment réagis-tu ?`,
    weight:()=>1.3,
    choices:({p})=>[
      {label:'Je me reprends en main, à fond', hint:'+Forme, -risque, +sérieux',
        effect:{fitness:+8, coach:+4, riskUp:-0.4, reputation:+2, flag:'reformed'}, outcome:'Tu remets la machine d\'aplomb. Le staff retrouve confiance, ton corps aussi.'},
      {label:'Je continue à vivre comme je l\'entends', hint:'Assumé, mais ça peut coûter cher',
        effect:()=> (Math.random()<0.3) ? {popularity:+8, reputation:-4, riskUp:+0.3} : {popularity:+5, morale:+3, riskUp:+0.2},
        outcome:'Tu restes toi-même. La suite dira si c\'était un pari gagnant.'}
    ]},

  /* ========================================================
     RÔLE DANS L'ÉQUIPE — dépend de ta place (évolue chaque saison)
  ======================================================== */
  {id:'role_leader', cat:'locker', solo:true,
    when:(p,lg)=>['starter','star','franchise'].includes(roleOf(p).key),
    title:'Le coach veut faire de toi un cadre',
    body:()=>`<i>(Réunion tactique, tableau blanc noirci de schémas.)</i> Le staff veut bâtir le collectif autour de toi. Endosser ce statut, c'est du poids — et de l'influence.`,
    weight:()=>1.0,
    choices:()=>[
      {label:'Accepter d\'être le patron sur le terrain', hint:'+Réputation, +Coach',
        effect:{reputation:+5, coach:+4, morale:+3}, outcome:'Tu prends les commandes. Le vestiaire se range derrière toi.'},
      {label:'Rester focalisé sur ton jeu, sans les galons', hint:'Discret, +sérénité',
        effect:{morale:+3, perfBonus:+3}, outcome:'Tu préfères parler sur le parquet. Ça te va très bien.'}
    ]},

  {id:'role_fight', cat:'locker', solo:true,
    when:(p,lg)=>['bench','rotation'].includes(roleOf(p).key) && p.age<=30 && lg.tier<=3,
    title:'Gratter du temps de jeu',
    body:()=>`<i>(Fin d'entraînement, le coach range ses plots sans un regard.)</i> Tu tournes peu en ce moment. Comment tu abordes ta situation ?`,
    weight:()=>1.15,
    choices:()=>[
      {label:'Bosser dans l\'ombre et forcer la main du coach', hint:'+Sérieux (peut débloquer ta place)',
        effect:{coach:+5, perfBonus:+4, morale:-2}, outcome:'Tu redoubles d\'efforts à l\'entraînement. Le coach le remarque.'},
      {label:'Demander plus de responsabilités, franchement', hint:'Direct : ça passe ou ça casse',
        effect:()=> (Math.random()<0.5)?{coach:+3, reputation:+3}:{coach:-4, reputation:+1},
        outcome:'Tu vas voir le staff en face. La réponse dépendra de ton bagout... et des résultats.'},
      {label:'Réclamer un départ pour jouer ailleurs', hint:'Changer d\'air pour du temps de jeu',
        effect:{forceMove:{type:'transfer'}, morale:+2}, outcome:'Tu demandes à rebondir dans un club où tu joueras vraiment.'}
    ]},

  /* ========================================================
     CULTURE BASKET RÉELLE — références, idoles, moments d'époque
  ======================================================== */
  {id:'idol', cat:'youth', solo:true,
    when:(p,lg)=>p.age<=19,
    title:'Ton idole de jeunesse',
    body:({p})=>{ const L=pick(LEGENDS[p.pos]||['un immense joueur']);
      return `<i>(Casque sur les oreilles, vieilles mixtapes en boucle jusqu'à 2h du matin.)</i> Gamin, tu as usé les vidéos de <b>${L}</b>. Ce soir, tu bosses en repensant à ce qui t'a fait aimer ce jeu.`; },
    weight:()=>0.75,
    choices:({p})=>[
      {label:'Copier ses gestes signature', hint:'+un point fort de ton style',
        effect:({p})=>{ const st=STYLES.find(x=>x.id===p.style); const k=st?Object.keys(st.boost)[0]:'tir'; return {[k]:+3, morale:+2}; },
        outcome:'Tu passes des heures à imiter ses moves. À force, ça rentre.'},
      {label:'T\'inspirer surtout de sa mentalité', hint:'+QI, +sérieux',
        effect:{qi:+2, coach:+2}, outcome:'Tu retiens son état d\'esprit de tueur. Ça vaut de l\'or.'}
    ]},

  {id:'comparison', cat:'media', solo:true,
    when:(p,lg)=>p.age<=24 && p.hype>=3 && lg.tier<=3,
    title:'La comparaison qui fait du bruit',
    body:({p})=>{ const L=pick(LEGENDS[p.pos]||['un grand nom']);
      return `<i>(Plateau télé, le consultant s'emballe, le bandeau clignote.)</i> Un analyste réputé compare ton profil à celui de <b>${L}</b>, toutes proportions gardées. La hype s'emballe autour de ton nom.`; },
    weight:()=>0.7,
    choices:()=>[
      {label:'M\'en servir de carburant', hint:'+Motivation, +Popularité',
        effect:{popularity:+5, morale:+4, perfBonus:+3}, outcome:'Tu transformes la pression en énergie. Les projecteurs ne te font pas peur.'},
      {label:'Garder la tête froide', hint:'+Sérénité, +vestiaire',
        effect:{coach:+3, morale:+2}, outcome:'Tu balaies la comparaison d\'un revers de main. Sagesse saluée.'}
    ]},

  {id:'all_star', cat:'allstar', solo:true,
    when:(p,lg)=>lg.tier<=1 && p.reputation>=55,
    title:'Week-end All-Star',
    body:()=>`<i>(Paillettes, caméras à 360°, le public scande déjà.)</i> Tu es convié au grand raout de la ligue. On te propose le concours de dunks, devant le monde entier. Tu te lances ?`,
    weight:()=>0.8,
    choices:({p})=>[
      {label:'Participer au concours de dunks', hint:`Show télé (dépend de ton athlé, ${attrOf(p,'ath')})`,
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'ath'),68); ctx.ok=ok; return ok?{popularity:+10,reputation:+4,media:+3}:{popularity:+4,media:+1}; },
        outcome:(ctx)=> ctx.ok?'Dunk de l\'année, l\'arène s\'embrase ! Ton nom explose partout.':'Tu vises une figure trop ambitieuse, elle ne passe pas. Le buzz reste sympa.'},
      {label:'Profiter du week-end tranquillement', hint:'+Repos, image posée',
        effect:{fitness:+5, media:+1}, outcome:'Tu savoures le moment sans te cramer. Reposé pour la suite.'}
    ]},

  {id:'load_mgmt', cat:'modern',
    when:(p,lg)=>lg.tier<=2 && p.age>=29,
    title:'Souffler ou jouer à tout prix ?',
    body:()=>`<i>(Le médecin te tend une feuille, le coach attend ta réponse.)</i> Le calendrier est infernal et tes jambes accusent le coup. La ligue débat sans fin du "load management". Et toi ?`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Lever le pied pour être frais en playoffs', hint:'+Forme, image ternie auprès du public',
        effect:{fitness:+10, popularity:-3, coach:+2}, outcome:'Tu te préserves par intelligence. Les fans râlent, ton corps respire.'},
      {label:'Jouer chaque match pour le maillot', hint:'+Réputation, corps sous tension',
        effect:{reputation:+4, riskUp:+0.2, fitness:-4}, outcome:'Tu réponds présent coûte que coûte. Les puristes adorent, tes genoux moins.'}
    ]},

  {id:'super_team', cat:'superteam', solo:true,
    when:(p,lg)=>lg.tier<=1 && ['star','franchise'].includes(roleOf(p).key) && p.reputation>=60,
    title:'L\'appel du super-groupe',
    body:()=>`<i>(Coup de fil discret d'une autre star, tard le soir.)</i> On te propose de rejoindre une équipe bâtie pour tout rafler, quitte à partager la lumière. Chasser la bague ensemble, ou rester le patron de ton projet ?`,
    weight:()=>0.7,
    choices:()=>[
      {label:'Rejoindre le super-groupe (chasser le titre)', hint:'+Chances de titre, -aura perso',
        effect:{forceMove:{type:'transfer'}, reputation:-2, morale:+4, coach:+2}, outcome:'Tu t\'associes aux meilleurs. Les puristes jasent, mais les bagues font taire les critiques.'},
      {label:'Rester le leader de ton équipe', hint:'+Aura, faire gagner les tiens',
        effect:{reputation:+5, morale:+3, perfBonus:+3}, outcome:'Tu refuses la facilité. Gagner avec ton club aurait une autre saveur.'}
    ]},

  {id:'legacy_interview', cat:'interview', solo:true,
    when:(p,lg)=>p.age>=30 && p.reputation>=50,
    title:'Grand entretien : ton héritage',
    body:()=>`<i>(Studio tamisé, une seule caméra, le journaliste se penche vers toi.)</i> « Comment aimeriez-vous qu'on se souvienne de vous ? » La question te cueille. Que réponds-tu ?`,
    weight:()=>0.65,
    choices:()=>[
      {label:'« Comme un compétiteur qui n\'a rien lâché »', hint:'+Réputation, +vestiaire',
        effect:{reputation:+4, coach:+2, media:+2}, outcome:'Réponse sincère et fédératrice. Le clip tourne, en bien cette fois.'},
      {label:'« Comme quelqu\'un qui a fait rêver les gens »', hint:'+Popularité',
        effect:{popularity:+6, media:+2}, outcome:'Tu joues la carte de l\'émotion. Le public adore.'}
    ]},

  {id:'rookie_interview', cat:'interview', solo:true,
    when:(p,lg)=>p.seasons.length<=1 && p.age<=22,
    title:'Ta première grande interview',
    body:()=>`<i>(Micro tendu, spots dans les yeux, ton cœur bat un peu vite.)</i> Pour ta première interview télé marquante, le ton que tu donnes va coller à ton image un moment.`,
    weight:()=>0.8,
    choices:()=>[
      {label:'Humble et travailleur', hint:'+Coach, +vestiaire',
        effect:{coach:+4, reputation:+2}, outcome:'Tu tapes juste : le staff et les vétérans apprécient ta modestie.'},
      {label:'Ambitieux et sûr de toi', hint:'+Popularité, attentes en hausse',
        effect:{popularity:+6, morale:+3}, outcome:'Tu affiches tes ambitions. Le public accroche, la pression monte d\'un cran.'}
    ]},
];

const CAT_TAG={injury:'🩹 Pépin physique',training:'🎯 Travail',form:'🧊 Méforme',system:'📋 Système',
  community:'❤️ Hors-terrain',rivalry:'🔥 Rivalité',leadership:'🧭 Leadership',pressure:'⏱️ Money-time',
  agentbiz:'💼 Business',personal:'🏠 Vie perso',twilight:'🌇 Vétéran',comeback:'💪 Retour',
  social:'📱 Réseaux',contract:'📝 Contrat',media:'🎤 Médias',business:'💼 Business',
  locker:'🚪 Vestiaire',nation:'🌍 Sélection',youth:'🌱 Jeunesse',lifestyle:'🌙 Hygiène de vie',nightlife:'🌙 Sortie',
  clutch:'🎯 Money-time',defense:'🛡️ Stop décisif',duel:'⚔️ Duel',finals:'🏆 Finale',presser:'🎤 Conférence',
  payoff:'⭐ Aura',wakeup:'🌙 Coup de semonce',chem:'🤝 Vestiaire',
  allstar:'🌟 All-Star',modern:'📺 Débat ligue',superteam:'🌟 Super-groupe',homecoming:'🏠 Retour aux sources',interview:'🎤 Grand entretien'};
export function catTag(ev){ return CAT_TAG[ev.cat] || (ev.tag?('📌 '+ev.tag):'📌 Événement'); }
