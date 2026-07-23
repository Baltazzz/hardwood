// Pyramide: du plus bas au sommet. starter/star = OVR pour être titulaire / star. prestige = attrait.
export const LEAGUES = {
  academy:  {tier:5, emoji:'🌱', name:'Centre de formation', short:'FORMATION', color:'#7d8794', starter:46, star:60, prestige:1, region:'eu', clubs:['INSEP','Centre Fédéral','Pôle Espoirs ASVEL','Académie Monaco','Centre Nanterre']},
  college:  {tier:5, emoji:'🎓', name:'NCAA (université US)', short:'NCAA', color:'#7a5cff', starter:48, star:62, prestige:2, region:'us', clubs:['Duke','Kentucky','Gonzaga','UConn','Kansas','Baylor','Arizona','Houston']},
  second:   {tier:4, emoji:'🔷', name:'2e division pro', short:'PRO 2', color:'#8a6d3b', starter:60, star:71, prestige:3, region:'eu', clubs:['Nancy','Roanne','Saint-Quentin','Vichy','Blois','Fos-sur-Mer','Denain']},
  gleague:  {tier:4, emoji:'🔶', name:'G League', short:'G-LEAGUE', color:'#3b6d8a', starter:64, star:74, prestige:4, region:'us', clubs:['Rip City','Ignite','Windy City','Long Island','Rio Grande','Maine']},
  national: {tier:3, emoji:'🏆', name:'Élite nationale', short:'ÉLITE NAT.', color:'#3b8a6d', starter:69, star:80, prestige:6, region:'eu', clubs:['ASVEL','Strasbourg','Bayern','Alba Berlin','Milan','Bologne','Valence','Málaga','Tenerife']},
  euro:     {tier:2, emoji:'⭐', name:'EuroLeague', short:'EUROLEAGUE', color:'#c98a4b', starter:77, star:87, prestige:9, region:'eu', clubs:['Real Madrid','FC Barcelone','Panathinaïkos','Olympiakos','Fenerbahçe','Monaco','Baskonia','Maccabi','Žalgiris']},
  nba:      {tier:1, emoji:'🏀', name:'NBA', short:'NBA', color:'#ec6a43', starter:78, star:90, prestige:12, region:'us', clubs:['Boston','L.A. Lakers','Golden State','Denver','Milwaukee','Miami','New York','Dallas','Phoenix','OKC','Philadelphie','Memphis']},
};
export const clubColor = (lg)=>LEAGUES[lg]?LEAGUES[lg].color:'#5c6b7a';
