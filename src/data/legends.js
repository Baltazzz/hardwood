// Légendes réelles, utilisées uniquement comme comparaisons/inspiration (aucune citation inventée)
export const LEGENDS = {
  PG:['Magic Johnson','Stephen Curry','Tony Parker','Luka Dončić','Steve Nash'],
  SG:['Michael Jordan','Kobe Bryant','Dwyane Wade','James Harden'],
  SF:['LeBron James','Larry Bird','Kevin Durant','Kawhi Leonard'],
  PF:['Tim Duncan','Dirk Nowitzki','Giannis Antetokounmpo','Charles Barkley'],
  C:['Shaquille O\'Neal','Hakeem Olajuwon','Nikola Jokić','Kareem Abdul-Jabbar']
};

// Légende associée à la NATIONALITÉ du joueur (voir AGENDA.md, "s'inspirer de son idole" --
// adapter la légende citée à p.nation plutôt qu'au seul poste) : un nom réel et réellement
// originaire de cette nation, choisi une fois pour toutes plutôt que tiré au hasard (contrairement
// à LEGENDS ci-dessus, qui reste un pool -- ici il n'y a en général qu'un seul nom qui s'impose
// vraiment par nation). Volontairement PAS d'entrée pour 'US' : la sélection américaine EST déjà
// tout le contenu de LEGENDS (tous les noms ci-dessus sont américains), la distinction
// nation/poste n'a pas de sens pour ce cas précis -- un joueur américain retombe donc directement
// sur le pool par poste (voir legendFor() dans data/events/_helpers.js), exactement comme avant
// ce lot. Couvre les 34 nations jouables (voir data/nations.js) sauf 'US' pour cette raison.
export const NATION_LEGENDS = {
  FR:{name:'Tony Parker', pos:'PG'}, RS:{name:'Nikola Jokić', pos:'C'}, ES:{name:'Pau Gasol', pos:'PF'},
  DE:{name:'Dirk Nowitzki', pos:'PF'}, GR:{name:'Giannis Antetokounmpo', pos:'PF'}, SI:{name:'Luka Dončić', pos:'PG'},
  LT:{name:'Arvydas Sabonis', pos:'C'}, IT:{name:'Danilo Gallinari', pos:'SF'}, TR:{name:'Hedo Türkoğlu', pos:'SF'},
  HR:{name:'Dražen Petrović', pos:'SG'}, LV:{name:'Kristaps Porziņģis', pos:'C'}, ME:{name:'Nikola Vučević', pos:'C'},
  BA:{name:'Jusuf Nurkić', pos:'C'}, FI:{name:'Lauri Markkanen', pos:'PF'}, CH:{name:'Thabo Sefolosha', pos:'SF'},
  UA:{name:'Svi Mykhailiuk', pos:'SG'}, PL:{name:'Marcin Gortat', pos:'C'},
  CA:{name:'Steve Nash', pos:'PG'}, PR:{name:'Carlos Arroyo', pos:'PG'}, DO:{name:'Al Horford', pos:'PF'},
  BS:{name:'Deandre Ayton', pos:'C'}, VI:{name:'Tim Duncan', pos:'PF'},
  AR:{name:'Manu Ginóbili', pos:'SG'}, BR:{name:'Nenê', pos:'C'},
  AU:{name:'Patty Mills', pos:'PG'},
  NG:{name:'Hakeem Olajuwon', pos:'C'}, SN:{name:'Gorgui Dieng', pos:'C'}, CM:{name:'Joel Embiid', pos:'C'},
  SS:{name:'Manute Bol', pos:'C'}, CD:{name:'Dikembe Mutombo', pos:'C'},
  CN:{name:'Yao Ming', pos:'C'}, JP:{name:'Rui Hachimura', pos:'PF'}, PH:{name:'Jordan Clarkson', pos:'SG'},
};
