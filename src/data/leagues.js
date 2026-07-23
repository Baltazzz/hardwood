// Pyramide: du plus bas au sommet. starter/star = OVR pour être titulaire / star. prestige = attrait.
// Les clubs (hors euro/nba, déjà de vrais noms globaux) viennent de src/data/clubData.js,
// nation par nation, via src/engine/clubs.js — voir ce module pour la sélection.
export const LEAGUES = {
  academy:  {tier:5,   emoji:'🌱', name:'Centre de formation', short:'FORMATION', color:'#7d8794', starter:46, star:60, prestige:1},
  college:  {tier:5,   emoji:'🎓', name:'NCAA (université US)', short:'NCAA', color:'#7a5cff', starter:48, star:62, prestige:2},
  third:    {tier:4.5, emoji:'🔹', name:'Division régionale', short:'3E DIV.', color:'#6d5a3b', starter:53, star:65, prestige:2},
  second:   {tier:4,   emoji:'🔷', name:'2e division pro', short:'PRO 2', color:'#8a6d3b', starter:60, star:71, prestige:3},
  gleague:  {tier:4,   emoji:'🔶', name:'G League', short:'G-LEAGUE', color:'#3b6d8a', starter:64, star:74, prestige:4},
  national: {tier:3,   emoji:'🏆', name:'Élite nationale', short:'ÉLITE NAT.', color:'#3b8a6d', starter:69, star:80, prestige:6},
  nbl1:     {tier:3,   emoji:'🏅', name:'NBL1 (régionale)', short:'NBL1', color:'#5a8a3b', starter:66, star:78, prestige:5},
  euro:     {tier:2,   emoji:'⭐', name:'EuroLeague', short:'EUROLEAGUE', color:'#c98a4b', starter:77, star:87, prestige:9, clubs:['Real Madrid','FC Barcelone','Panathinaïkos','Olympiakos','Fenerbahçe','Monaco','Baskonia','Maccabi','Žalgiris']},
  nbl:      {tier:2,   emoji:'🌟', name:'NBL (Australie)', short:'NBL', color:'#b98a3b', starter:74, star:85, prestige:8},
  nba:      {tier:1,   emoji:'🏀', name:'NBA', short:'NBA', color:'#ec6a43', starter:78, star:90, prestige:12, clubs:['Boston','L.A. Lakers','Golden State','Denver','Milwaukee','Miami','New York','Dallas','Phoenix','OKC','Philadelphie','Memphis']},
};
export const clubColor = (lg)=>LEAGUES[lg]?LEAGUES[lg].color:'#5c6b7a';
