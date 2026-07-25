import { attrOf } from '../../engine/player.js';
import { actionRoll } from '../../engine/utils.js';
import { clutchWeight } from './_helpers.js';

/* ============================================================
   PROFIL → SCÉNARIOS — le profil du joueur (attributs + poste)
   génère des situations différentes : un shooteur voit plus de
   tirs décisifs, un défenseur des missions défensives, un
   passeur de la création, un pivot de la protection de cercle,
   un scoreur des concours à 3 points.
============================================================ */
export const ATTRIBUTE_EVENTS = [
  // ---------- SHOOTEUR ----------
  {id:'three_point_invite', cat:'allstar', phase:'mid', cooldown:3,
    when:(p,lg)=>lg.tier<=2 && attrOf(p,'adr3')>=78 && p.reputation>=35,
    title:'Invitation au concours à trois points',
    body:()=>`<i>(Rack de ballons alignés, chrono affiché sur l'écran géant.)</i> Ta réputation de shooteur t'a valu une invitation au concours longue distance du week-end des étoiles. La pression de la précision, sous les projecteurs.`,
    weight:()=>0.85,
    choices:({p})=>[
      {label:'Foncer pour la victoire, prendre des risques', hint:'Viser le titre, quitte à forcer le rythme',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'adr3'),76); ctx.ok=ok; return ok?{popularity:+9,reputation:+5,media:+2}:{popularity:+3,media:+1}; },
        outcome:(ctx)=> ctx.ok?'Rack parfait sur la dernière volée. Le titre du concours est à toi !':'Le rythme te trahit sur la fin. Belle prestation, mais pas de trophée.'},
      {label:'Rester dans ton tempo habituel', hint:'Ton rythme, sans en changer',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'adr3'),68); ctx.ok=ok; return ok?{popularity:+6,media:+1}:{popularity:+3}; },
        outcome:(ctx)=> ctx.ok?'Solide du début à la fin, sans trembler. Prestation propre et appréciée.':'Une prestation correcte, sans éclat particulier.'}
    ]},

  {id:'shooter_clutch_call', cat:'clutch', phase:null, cooldown:2,
    when:(p,lg)=>lg.tier<=3 && attrOf(p,'adr3')>=80 && p.reputation>=30,
    title:'Le coach ne veut que ton tir',
    body:()=>`<i>(Temps mort, le coach dessine un seul schéma : un écran, et le ballon dans tes mains.)</i> Il n'y a pas de plan B dans son cahier ce soir. Tout le monde dans la salle sait ce qui va se passer.`,
    weight:clutchWeight(0.85),
    choices:({p})=>[
      {label:'Prendre le tir sans hésiter', hint:'Assumer d\'être LA solution',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'adr3'),74); ctx.ok=ok; return ok?{reputation:+6,morale:+7,clutch:+1,flag:'clutchHero'}:{morale:-4,reputation:-2}; },
        outcome:(ctx)=> ctx.ok?'Le filet claque. Tout le monde savait, personne n\'a pu l\'arrêter.':'La défense a lu le scénario. Le tir ne rentre pas.'},
      {label:'Feinter le tir pour libérer un partenaire', hint:'Détourner l\'attention plutôt que forcer',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok; return ok?{coach:+5,reputation:+3}:{morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Toute la défense se fixe sur toi. Le partenaire démarqué ne rate pas.':'La défense ne mord pas à l\'hameçon. L\'occasion se perd.'}
    ]},

  {id:'shooter_slump', cat:'form', phase:null, cooldown:3,
    when:(p,lg)=>attrOf(p,'adr3')>=78 && p.reputation>=30,
    title:'La disette du shooteur',
    body:()=>`Ta marque de fabrique, c'est le tir. Sauf que depuis deux matchs, rien ne rentre — même les tirs ouverts. Le doute s'installe sur le geste qui te définit.`,
    weight:()=>0.75,
    choices:()=>[
      {label:'Continuer à tirer, envers et contre tout', hint:'La confiance dans le geste, coûte que coûte',
        effect:()=>(Math.random()<0.5)?{reputation:+3, morale:+3}:{perfBonus:-3, morale:-2}, outcome:'Tu ne changes rien à ton approche. Le geste finit par revenir, ou pas encore.'},
      {label:'Revenir aux séances vidéo pour corriger le geste', hint:'L\'analyse plutôt que l\'instinct',
        effect:{tir:+2, qi:+1}, outcome:'Tu décortiques ton geste image par image. Un petit réglage suffisait.'}
    ]},

  // ---------- PASSEUR / MENEUR ----------
  {id:'triple_double_chase', cat:'clutch', phase:null, cooldown:3,
    when:(p,lg)=>attrOf(p,'passe')>=78 && (p.pos==='PG'||p.pos==='SG') && p.reputation>=32,
    title:'À deux passes du triple-double',
    body:()=>`<i>(Tableau d'affichage : il te manque deux passes décisives pour boucler la ligne de stats parfaite.)</i> Le money-time approche. Chasser la statistique historique, ou juste gagner le match le plus simplement possible ?`,
    weight:()=>0.75,
    choices:({p})=>[
      {label:'Chercher activement les dernières passes', hint:'La statistique, assumée jusqu\'au bout',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'passe'),70); ctx.ok=ok; return ok?{reputation:+6,popularity:+5,media:+2}:{coach:-2,morale:-1}; },
        outcome:(ctx)=> ctx.ok?'Triple-double bouclé sur le fil ! La stat-sheet fait le tour des réseaux.':'Tu forces des passes qui ne sont pas là. Le coach n\'apprécie pas trop.'},
      {label:'Jouer simple, laisser filer la statistique', hint:'Le jeu juste, sans arrière-pensée',
        effect:{coach:+4, qi:+2}, outcome:'Tu joues juste, sans calcul. Le coach salue ta lecture du jeu.'}
    ]},

  {id:'playmaker_orchestration', cat:'finals', phase:'mid', cooldown:2,
    when:(p,lg)=>attrOf(p,'passe')>=78 && lg.tier<=3 && p.reputation>=40,
    title:'Orchestrer la fin de match',
    body:()=>`Dernière minute, ton équipe mène d'un point. Le coach te confie le ballon avec une consigne simple : fais tourner l'horloge et trouve le bon tir.`,
    weight:clutchWeight(0.8),
    choices:({p})=>[
      {label:'Prendre ton temps, chercher le tir parfait', hint:'La patience, pour le tir le plus sûr',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),64); ctx.ok=ok; return ok?{reputation:+5,coach:+5}:{coach:-2}; },
        outcome:(ctx)=> ctx.ok?'Tu fais tourner l\'équipe jusqu\'au tir idéal. Gestion de money-time exemplaire.':'Le chrono te piège, le tir part précipité.'},
      {label:'Créer ton propre tir tout de suite', hint:'Prendre l\'initiative sans attendre',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'dribble'),68); ctx.ok=ok; return ok?{reputation:+5,morale:+5,clutch:+1}:{morale:-3}; },
        outcome:(ctx)=> ctx.ok?'Un enchaînement de dribbles et le tir tombe. Tu prends tout le monde de vitesse.':'Ta création ne débouche sur rien de propre.'}
    ]},

  {id:'point_guard_dilemma', cat:'system', phase:null, cooldown:3,
    when:(p,lg)=>attrOf(p,'passe')>=76 && (p.pos==='PG') && p.reputation>=28,
    title:'Faire jouer les autres ou te mettre en avant ?',
    body:()=>`Le coach te laisse le libre choix ce soir : chercher tes propres points, ou continuer à faire briller tes coéquipiers comme tu le fais depuis le début de saison.`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Continuer à faire jouer le collectif', hint:'Rester fidèle à ton rôle de créateur',
        effect:{coach:+4, qi:+2, morale:+2}, outcome:'Tu restes fidèle à ton jeu. Le collectif tourne rond, le coach est ravi.'},
      {label:'Chercher davantage tes propres points', hint:'Élargir ton registre, pour voir',
        effect:()=>(Math.random()<0.5)?{reputation:+4, perfBonus:+3}:{coach:-2, perfBonus:-2}, outcome:'Tu élargis ton registre offensif. Résultat mitigé selon les soirs.'}
    ]},

  // ---------- DÉFENSEUR D'ÉLITE ----------
  {id:'lockdown_assignment', cat:'defense', phase:'mid', cooldown:2,
    when:(p,lg)=>attrOf(p,'def')>=78 && lg.tier<=3 && p.reputation>=35,
    title:'Mission de marquage sur la star adverse',
    body:()=>`<i>(Vidéo de scouting, le coach pointe du doigt le meilleur marqueur de l'équipe d'en face.)</i> Le coach ne veut qu'une chose de toi ce soir : neutraliser leur star. Toute la game plan repose sur cette mission.`,
    weight:clutchWeight(0.9),
    choices:({p})=>[
      {label:'Coller la mission à fond, tout donner en défense', hint:'La mission avant tout, quitte à sacrifier ton attaque',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'def'),74); ctx.ok=ok; return ok?{reputation:+7,coach:+6,clutch:+1,flag:'lockdown'}:{morale:-3,coach:-1}; },
        outcome:(ctx)=> ctx.ok?'Tu l\'étouffes du premier au dernier ballon. Une masterclass défensive.':'Il trouve quand même des solutions. Frustrant malgré tes efforts.'},
      {label:'Gérer intelligemment, sans te cramer', hint:'Le dosage, pour durer sur toute la rencontre',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),62); ctx.ok=ok; return ok?{reputation:+4,coach:+4}:{coach:+1}; },
        outcome:(ctx)=> ctx.ok?'Tu doses ton effort avec intelligence. Efficace sur la durée du match.':'Une mission honnête, sans étincelle particulière.'}
    ]},

  {id:'dpoy_buzz', cat:'media', phase:null, once:true,
    when:(p,lg)=>attrOf(p,'def')>=82 && (lg.tier<=2) && p.reputation>=45,
    title:'La rumeur du titre de meilleur défenseur',
    body:()=>`<i>(Un journaliste spécialisé te tend son micro après l'entraînement.)</i> Ton nom circule pour le trophée de meilleur défenseur de la ligue. Comment tu accueilles cette reconnaissance ?`,
    weight:()=>0.6,
    choices:()=>[
      {label:'Assumer le statut de référence défensive', hint:'Endosser pleinement l\'étiquette',
        effect:{reputation:+5, coach:+3, popularity:+3}, outcome:'Tu embrasses ce statut. Les stats et les highlights confirment.'},
      {label:'Renvoyer le mérite au système collectif', hint:'Partager le mérite avec le collectif',
        effect:{coach:+5, qi:+2}, outcome:'Tu insistes sur le collectif. Le vestiaire apprécie ton humilité.'}
    ]},

  // ---------- PIVOT DOMINANT ----------
  {id:'rim_protection', cat:'defense', phase:null, cooldown:2,
    when:(p,lg)=>p.pos==='C' && attrOf(p,'def')>=76 && attrOf(p,'reb')>=72,
    title:'Protéger le cercle, envers et contre tout',
    body:()=>`<i>(Raquette bondée, les attaquants adverses s'enchaînent à la file.)</i> Le coach compte sur toi comme dernier rempart. Chaque incursion adverse doit se heurter à ta présence.`,
    weight:clutchWeight(0.85),
    choices:({p})=>[
      {label:'Contester chaque tir près du cercle', hint:'Aucune incursion ne doit passer',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'def'),72); ctx.ok=ok; return ok?{reputation:+6,coach:+5,clutch:+1,flag:'lockdown'}:{reputation:-1,coach:+1}; },
        outcome:(ctx)=> ctx.ok?'Rideau de fer dans la raquette. Rien ne passe ce soir.':'Ils forcent le passage plus souvent que prévu.'},
      {label:'Positionnement intelligent, éviter les fautes inutiles', hint:'La discipline, pour rester sur le terrain',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),58); ctx.ok=ok; return ok?{reputation:+4,coach:+4}:{coach:+2}; },
        outcome:(ctx)=> ctx.ok?'Tu restes propre et présent toute la rencontre. Impact discret mais réel.':'Une prestation solide, sans plus.'}
    ]},

  {id:'post_duel', cat:'duel', phase:null, cooldown:2,
    when:(p,lg)=>p.pos==='C' && attrOf(p,'reb')>=76 && p.reputation>=32,
    title:'Duel de pivots dans la raquette',
    body:()=>`L'autre grand pivot du championnat t'attend au poste bas ce soir. Un duel à l'ancienne, épaule contre épaule, loin des paillettes du jeu extérieur.`,
    weight:()=>0.65,
    choices:({p})=>[
      {label:'Imposer ton physique dans le rebond', hint:'Le combat au rebond, sans concession',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'reb'),70); ctx.ok=ok; return ok?{reputation:+6,morale:+5}:{morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Tu domines la bataille des rebonds de bout en bout.':'Il gagne la bataille du rebond ce soir. Dur pour l\'orgueil.'},
      {label:'Jouer finesse et déplacements plutôt que la force pure', hint:'La technique plutôt que le rapport de force',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'qi'),60); ctx.ok=ok; return ok?{reputation:+4,tir:+1}:{morale:-1}; },
        outcome:(ctx)=> ctx.ok?'Tes appuis et tes feintes font la différence sur un pivot plus costaud.':'Ton jeu de finesse ne suffit pas ce soir.'}
    ]},

  // ---------- ATHLÈTE EXPLOSIF ----------
  {id:'poster_dunk_moment', cat:'clutch', phase:null, cooldown:2,
    when:(p,lg)=>attrOf(p,'ath')>=80 && p.reputation>=28,
    title:'L\'appel d\'air pour le poster',
    body:()=>`<i>(Contre-attaque, un seul défenseur entre toi et le cercle.)</i> L'espace est là pour un dunk spectaculaire — ou tu peux jouer plus simple et sûr.`,
    weight:clutchWeight(0.9),
    choices:({p})=>[
      {label:'Tenter le poster monumental', hint:'Le geste spectaculaire, à tes risques',
        effect:(ctx)=>{ const ok=actionRoll(attrOf(p,'ath'),72); ctx.ok=ok; return ok?{popularity:+8,reputation:+4,morale:+5,clutch:+1}:{popularity:+2,morale:-2}; },
        outcome:(ctx)=> ctx.ok?'Dunk monumental, l\'adversaire au sol dans les highlights du soir !':'Le défenseur se dérobe au dernier moment, ton geste se conclut mal.'},
      {label:'Assurer un tir simple', hint:'L\'efficacité plutôt que le geste',
        effect:{tir:+1, qi:+1}, outcome:'Tu prends le plus sûr. Deux points au tableau, sans effet de manche.'}
    ]},

  {id:'athletic_showcase', cat:'social', phase:null, cooldown:3,
    when:(p,lg)=>attrOf(p,'ath')>=82 && p.popularity>=25,
    title:'Une séquence qui affole les réseaux',
    body:()=>`Un contre ou un dunk spectaculaire de ta dernière sortie tourne en boucle sur les réseaux. Les marques d'équipement s'y intéressent de près.`,
    weight:()=>0.55,
    choices:()=>[
      {label:'Capitaliser sur ton image d\'athlète hors norme', hint:'Vendre l\'image de l\'athlète spectaculaire',
        effect:{popularity:+7, media:+2}, outcome:'Ton profil physique devient une vraie carte à jouer médiatiquement.'},
      {label:'Laisser parler le jeu, rester discret', hint:'Rester discret, laisser parler le terrain',
        effect:{qi:+1, coach:+2}, outcome:'Tu restes concentré sur le jeu. Discret, mais respecté.'}
    ]},
];
