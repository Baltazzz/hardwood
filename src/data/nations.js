// Nations : identité (nom/drapeau/patronymes) et éligibilité en sélection nationale.
// - continent : géographie réelle -- pilote la zone de tournoi de sélection ('EuroBasket',
//   'Coupe d'Amérique', 'Coupe d'Asie'/Océanie, 'Coupe d'Afrique') ET la répartition des offres
//   d'académies à la création (voir engine/academies.js). Valeurs : 'europe','namerica',
//   'samerica','africa','asia','oceania'.
// - path : famille de données de club utilisée en repli quand cette nation devient un pays de
//   JEU (playCountry -- voir engine/player.js) sans avoir ses propres données dans clubData.js
//   ('us','eu','au' -- voir PATH_FALLBACK_NATION dans engine/clubs.js). N'A PLUS aucun rôle dans
//   le point de départ de carrière depuis le lot académies : la voie de départ (collège US,
//   académie EU, académie AU) vient désormais du choix d'académie, pas de la nationalité --
//   deux joueurs de la même nation peuvent démarrer dans des voies différentes.
// - strength = force de la sélection nationale (0-100).
export const NATIONS = [
  // ---------- Europe ----------
  {id:'FR', name:'France',     flag:'🇫🇷', continent:'europe', path:'eu', strength:88, names:['Enzo','Nolan','Théo','Malik','Lucas','Adam','Yanis','Noah'], last:['Traoré','Dubois','Ndiaye','Lefèvre','Moreau','Diallo','Girard','Bonnet']},
  {id:'RS', name:'Serbie',     flag:'🇷🇸', continent:'europe', path:'eu', strength:90, names:['Nikola','Vasilije','Aleksa','Stefan','Marko','Luka','Petar','Ognjen'], last:['Jović','Petrović','Milić','Đorđević','Savić','Kostić','Ilić','Radović']},
  {id:'ES', name:'Espagne',   flag:'🇪🇸', continent:'europe', path:'eu', strength:87, names:['Sergio','Álex','Pau','Marc','Hugo','Dario','Iker','Juan'], last:['Garrido','Fernández','Rubio','Hernán','Ortiz','Vidal','Sáez','Cano']},
  {id:'DE', name:'Allemagne', flag:'🇩🇪', continent:'europe', path:'eu', strength:89, names:['Leon','Max','Jonas','Finn','Noah','Elias','Ben','Luis'], last:['Wagner','Schröder','Bauer','Keller','Vogel','Hartmann','Braun','Frank']},
  {id:'GR', name:'Grèce',     flag:'🇬🇷', continent:'europe', path:'eu', strength:85, names:['Giannis','Kostas','Thanasis','Nikos','Vasilis','Dimitris','Panos','Alexis'], last:['Papadópoulos','Antetokoúmpo','Kaláthis','Sloúkas','Larentzákis','Mitóglou']},
  {id:'SI', name:'Slovénie',  flag:'🇸🇮', continent:'europe', path:'eu', strength:80, names:['Luka','Goran','Vlatko','Klemen','Žiga','Edo','Aleksej','Rok'], last:['Dončić','Dragić','Čančar','Prepelič','Blažič','Nikolić','Murić']},
  {id:'LT', name:'Lituanie',  flag:'🇱🇹', continent:'europe', path:'eu', strength:86, names:['Jonas','Domantas','Mindaugas','Rokas','Arnas','Tadas','Gytis','Deividas'], last:['Sabonis','Valančiūnas','Kuzminskas','Jokubaitis','Grigonis','Motiejūnas','Ulanovas','Butkevičius']},
  {id:'IT', name:'Italie',    flag:'🇮🇹', continent:'europe', path:'eu', strength:81, names:['Marco','Simone','Nicolò','Danilo','Andrea','Luigi','Stefano','Riccardo'], last:['Fontecchio','Melli','Gallinari','Datome','Belinelli','Barone','Spissu','Ricci']},
  {id:'TR', name:'Turquie',   flag:'🇹🇷', continent:'europe', path:'eu', strength:82, names:['Alperen','Cedi','Furkan','Ömer','Cem','Berk','Sertaç','Emir'], last:['Şengün','Osman','Korkmaz','Yurtseven','Aldemir','Güler','Erden','Özmen']},
  {id:'HR', name:'Croatie',   flag:'🇭🇷', continent:'europe', path:'eu', strength:85, names:['Luka','Marko','Ivan','Dario','Ante','Filip','Tomislav','Josip'], last:['Šarić','Zubac','Hezonja','Bogdanović','Rudan','Bender','Zizic','Prkacin']},
  {id:'LV', name:'Lettonie',  flag:'🇱🇻', continent:'europe', path:'eu', strength:82, names:['Kristaps','Dāvis','Rodions','Artūrs','Jānis','Kārlis','Anžejs','Rihards'], last:['Porziņģis','Bertāns','Kurucs','Žagars','Šmits','Bundzis','Pasečņiks','Lomažs']},
  {id:'ME', name:'Monténégro', flag:'🇲🇪', continent:'europe', path:'eu', strength:79, names:['Nikola','Bojan','Vladimir','Marko','Nemanja','Petar','Đorđije','Aleksa'], last:['Vučević','Dubljević','Micov','Radulica','Radonjić','Popović','Femić','Zubić']},
  {id:'BA', name:'Bosnie-Herzégovine', flag:'🇧🇦', continent:'europe', path:'eu', strength:77, names:['Jusuf','Mirza','Nihad','Edin','Adin','Semir','Amar','Ognjen'], last:['Nurkić','Teletović','Đedović','Begić','Suljević','Čolo','Zaimović','Krndžija']},
  {id:'FI', name:'Finlande',  flag:'🇫🇮', continent:'europe', path:'eu', strength:80, names:['Lauri','Sasu','Elias','Miro','Mikael','Oskari','Aleksi','Niko'], last:['Markkanen','Salin','Valtonen','Little','Koponen','Räisänen','Ojanen','Hämäläinen']},
  {id:'CH', name:'Suisse',    flag:'🇨🇭', continent:'europe', path:'eu', strength:71, names:['Clint','Thabo','Marco','Luca','Loïc','Killian','Grégoire','Julian'], last:['Capela','Sefolosha','Kolo','Rüfenacht','Fernandez','Berset','Bösiger','Gutknecht']},
  {id:'UA', name:'Ukraine',   flag:'🇺🇦', continent:'europe', path:'eu', strength:76, names:['Sviatoslav','Oleksiy','Denys','Andriy','Vladyslav','Danylo','Kyrylo','Yevhen'], last:['Mykhailiuk','Len','Lypovyy','Sydorov','Kovalenko','Tyshchenko','Voronov','Bilyk']},
  {id:'PL', name:'Pologne',   flag:'🇵🇱', continent:'europe', path:'eu', strength:74, names:['Marcin','Mateusz','Adam','Przemysław','Aleksander','Kacper','Michał','Dominik'], last:['Gortat','Ponitka','Waczyński','Balcerowski','Sokołowski','Karnowski','Kolenda','Michalak']},
  {id:'IL', name:'Israël',    flag:'🇮🇱', continent:'europe', path:'eu', strength:77, names:['Deni','Yovel','Tamir','Omri','Itay','Roman','Guy','Elishai'], last:['Avdija','Zoosman','Blatt','Casspi','Segev','Sorkin','Pnini','Cohen']},

  // ---------- Amérique du Nord ----------
  {id:'US', name:'États-Unis', flag:'🇺🇸', continent:'namerica', path:'us', strength:98, names:['Marcus','Jaylen','DeShawn','Tyrese','Cameron','Isaiah','Brandon','Malik'], last:['Carter','Brooks','Williams','Jackson','Hayes','Coleman','Reed','Bishop']},
  {id:'CA', name:'Canada',    flag:'🇨🇦', continent:'namerica', path:'us', strength:88, names:['Shai','RJ','Andrew','Dillon','Jamal','Cory','Nickeil','Bennedict'], last:['Barrett','Wiggins','Murray','Brooks','Alexander','Powell','Dort','Mathurin']},
  {id:'PR', name:'Porto Rico', flag:'🇵🇷', continent:'namerica', path:'us', strength:80, names:['José','Carlos','Ángel','Luis','Iván','Ramón','Gian','Renaldo'], last:['Arroyo','Rivera','Vassallo','Cruz','Colón','Meléndez','Ortiz','Rosario']},
  {id:'DO', name:'République dominicaine', flag:'🇩🇴', continent:'namerica', path:'us', strength:75, names:['Al','Karl-Anthony','Francisco','José','Chris','Eloy','Manuel','Víctor'], last:['Horford','Towns','García','Reyes','Duarte','Vargas','Peña','Núñez']},
  {id:'BS', name:'Bahamas',   flag:'🇧🇸', continent:'namerica', path:'us', strength:68, names:['Deandre','Buddy','Kentavious','Ariel','Eddie','Franco','Tyrese','Norvel'], last:['Ayton','Hield','Caldwell-Pope','Rolle','Gibson','Wells','Bassett','Munroe']},
  {id:'VI', name:'Îles Vierges', flag:'🇻🇮', continent:'namerica', path:'us', strength:60, names:['Tim','Jerome','Raja','Devante','Julien','Marcus','Ian','Elrick'], last:['Duncan','James','Bell','Smith','Wells','Ferguson','Todman','George']},

  // ---------- Amérique du Sud ----------
  {id:'AR', name:'Argentine', flag:'🇦🇷', continent:'samerica', path:'us', strength:87, names:['Manu','Luis','Facundo','Gabriel','Nicolás','Andrés','Leandro','Patricio'], last:['Ginóbili','Scola','Campazzo','Deck','Laprovíttola','Nocioni','Garino','Barreiro']},
  {id:'BR', name:'Brésil',    flag:'🇧🇷', continent:'samerica', path:'us', strength:83, names:['Anderson','Nenê','Leandrinho','Bruno','Raulzinho','Marcelinho','Vitor','Yago'], last:['Varejão','Hilário','Barbosa','Caboclo','Neto','Machado','Benite','Santos']},

  // ---------- Océanie ----------
  {id:'AU', name:'Australie', flag:'🇦🇺', continent:'oceania', path:'au', strength:84, names:['Josh','Jack','Dyson','Tyler','Ben','Matt','Cooper','Riley'], last:['Giddey','Daniels','Mills','Ingles','Landale','Exum','Green','Baynes']},

  // ---------- Afrique ----------
  {id:'NG', name:'Nigeria',   flag:'🇳🇬', continent:'africa', path:'us', strength:78, names:['Chidi','Emeka','Obi','Kelechi','Tobi','Ikenna','Chuka','Uche'], last:['Okafor','Adebayo','Nwosu','Achiuwa','Okonkwo','Eze','Nnamdi','Onwuka']},
  {id:'SN', name:'Sénégal',   flag:'🇸🇳', continent:'africa', path:'us', strength:71, names:['Gorgui','Ibou','Youssou','Cheikh','Moussa','Babacar','Aziz','Mamadou'], last:['Dieng','Badji','Ndiaye','Fall','Diagne','Diop','Camara','Gueye']},
  {id:'CM', name:'Cameroun',  flag:'🇨🇲', continent:'africa', path:'us', strength:69, names:['Joel','Pascal','Luc','Christian','Yves','Bertrand','Franck','Serge'], last:['Embiid','Siakam','Mbah a Moute','Koulagna','Fotso','Ndoumbe','Awa','Tchamda']},
  {id:'SS', name:'Soudan du Sud', flag:'🇸🇸', continent:'africa', path:'us', strength:73, names:['Wenyen','Bol','Duop','Khaman','Deng','Peter','Majok','Nuni'], last:['Gabriel','Bol','Reath','Maluach','Gach','Akol','Deng','Omuya']},
  {id:'CD', name:'RD Congo',  flag:'🇨🇩', continent:'africa', path:'us', strength:65, names:['Bismack','Emmanuel','Serge','Christian','Dikembe','Jonathan','Ferdinand','Blaise'], last:['Biyombo','Mudiay','Ibaka','Eyenga','Mutombo','Kalambay','Casimir','Tshimanga']},

  // ---------- Asie ----------
  {id:'CN', name:'Chine',     flag:'🇨🇳', continent:'asia', path:'us', strength:78, names:['Hao','Wei','Jun','Lei','Peng','Chao','Tao','Bin'], last:['Yao','Yi','Wang','Zhang','Li','Chen','Zhou','Guo']},
  {id:'JP', name:'Japon',     flag:'🇯🇵', continent:'asia', path:'us', strength:73, names:['Rui','Yuta','Yudai','Makoto','Yuki','Kenta','Hayato','Ryusei'], last:['Hachimura','Watanabe','Baba','Fujita','Nakagawa','Kawamura','Sato','Tanaka']},
  {id:'PH', name:'Philippines', flag:'🇵🇭', continent:'asia', path:'us', strength:75, names:['Kai','Jordan','Ray','Kiefer','Terrence','Japeth','Andray','June Mar'], last:['Sotto','Clarkson','Parks','Ravena','Romeo','Blatche','Fajardo','Castro']},
];
