/* ============================================================
   RÉACTIONS NARRATIVES DE SEUIL — quand une stat molle (forme,
   moral, popularité, médias, voir engine/vitals.js) franchit un
   niveau vraiment marquant, la carrière en prend acte plutôt que de
   laisser le chiffre bouger seul en coulisses. Génériques, disponibles
   à toute phase de carrière, cooldown pour ne pas se répéter en
   boucle si la stat reste durablement dans la zone.
============================================================ */
export const WELLBEING_EVENTS = [
  {id:'fitness_crisis', cat:'form', phase:null, cooldown:3,
    when:(p,lg)=>p.fitness<28,
    title:'Le corps qui dit stop',
    body:()=>`Les signaux d'alerte s'accumulent -- jambes lourdes, réveils difficiles, petites douleurs qui ne partent plus. Le staff médical veut te parler avant que ça ne tourne mal.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'Lever le pied, accepter de perdre du temps de jeu', hint:'La prudence, pour repartir sur de bonnes bases',
        effect:{fitness:+14, perfBonus:-3, coach:+2}, outcome:'Tu coupes dans la charge. Moins spectaculaire, mais le corps commence enfin à souffler.'},
      {label:'Serrer les dents, continuer comme si de rien n\'était', hint:'Le refus de lâcher, quel qu\'en soit le prix',
        effect:{perfBonus:+3, riskUp:+0.3}, outcome:'Tu refuses de lever le pied. Le staff s\'inquiète, mais tu tiens -- pour l\'instant.'}
    ]},

  {id:'morale_collapse', cat:'morale', phase:null, cooldown:3,
    when:(p,lg)=>p.morale<22,
    title:'Le moral dans les chaussettes',
    body:()=>`Une mauvaise passe qui s'éternise, et le doute s'installe. Certains soirs, tu te demandes presque pourquoi tu fais tout ça.`,
    weight:()=>1.1,
    choices:()=>[
      {label:'En parler ouvertement avec le staff', hint:'Sortir du silence, plutôt que de ruminer seul',
        effect:{morale:+12, coach:+3}, outcome:'Tu mets des mots dessus. Ça ne règle pas tout, mais l\'air est nettement plus respirable.'},
      {label:'Serrer les dents et gérer ça seul', hint:'Encaisser en silence, à ta manière',
        effect:{morale:+4, qi:+1}, outcome:'Tu gères à ta façon, sans en faire une histoire. Lentement, ça remonte.'}
    ]},

  {id:'popularity_explosion', cat:'fame', phase:null, cooldown:3,
    when:(p,lg)=>p.popularity>=88,
    title:'Devenu incontournable',
    body:()=>`Impossible de sortir sans être reconnu, ton nom est partout. L'engouement autour de toi a atteint un tout autre niveau.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Profiter pleinement de la vague', hint:'Surfer sur le moment, sans retenue',
        effect:{popularity:+3, money:+40, morale:+3}, outcome:'Tu profites à fond de ce moment. Les sollicitations pleuvent, tout comme les chèques.'},
      {label:'Garder les pieds sur terre', hint:'La mesure, pour ne pas se perdre dans le vertige',
        effect:{coach:+3, qi:+2}, outcome:'Tu restes concentré, malgré le tourbillon. Le vestiaire apprécie que rien n\'ait changé.'}
    ]},

  {id:'media_saturation', cat:'media', phase:null, cooldown:3,
    when:(p,lg)=>p.media>=76,
    title:'Surexposition médiatique',
    body:()=>`Chaque geste, chaque mot est décortiqué. Ton quotidien est devenu un sujet permanent, jusqu'à l'épuisement parfois.`,
    weight:()=>0.9,
    choices:()=>[
      {label:'Réduire volontairement ta présence médiatique', hint:'Se protéger, quitte à perdre en visibilité',
        effect:{media:-10, morale:+6, fitness:+3}, outcome:'Tu coupes le robinet médiatique. Un vrai bol d\'air, même si l\'exposition en pâtit un peu.'},
      {label:'Continuer à tout accepter', hint:'Rester partout, quitte à s\'épuiser',
        effect:{popularity:+4, morale:-4}, outcome:'Tu ne dis jamais non. Ça entretient la flamme, mais ça use aussi, doucement.'}
    ]},
];
