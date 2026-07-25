// Nations: path 'us' (lycée->NCAA->draft), 'eu' (formation->pro->europe->NBA) ou 'au' (formation->NBL1->NBL->passerelle NBA). strength = force nation en sélection.
export const NATIONS = [
  {id:'US', name:'États-Unis', flag:'🇺🇸', path:'us', strength:98, names:['Marcus','Jaylen','DeShawn','Tyrese','Cameron','Isaiah','Brandon','Malik'], last:['Carter','Brooks','Williams','Jackson','Hayes','Coleman','Reed','Bishop']},
  {id:'FR', name:'France',     flag:'🇫🇷', path:'eu', strength:88, names:['Enzo','Nolan','Théo','Malik','Lucas','Adam','Yanis','Noah'], last:['Traoré','Dubois','Ndiaye','Lefèvre','Moreau','Diallo','Girard','Bonnet']},
  {id:'RS', name:'Serbie',     flag:'🇷🇸', path:'eu', strength:90, names:['Nikola','Vasilije','Aleksa','Stefan','Marko','Luka','Petar','Ognjen'], last:['Jović','Petrović','Milić','Đorđević','Savić','Kostić','Ilić','Radović']},
  {id:'ES', name:'Espagne',   flag:'🇪🇸', path:'eu', strength:87, names:['Sergio','Álex','Pau','Marc','Hugo','Dario','Iker','Juan'], last:['Garrido','Fernández','Rubio','Hernán','Ortiz','Vidal','Sáez','Cano']},
  {id:'DE', name:'Allemagne', flag:'🇩🇪', path:'eu', strength:89, names:['Leon','Max','Jonas','Finn','Noah','Elias','Ben','Luis'], last:['Wagner','Schröder','Bauer','Keller','Vogel','Hartmann','Braun','Frank']},
  {id:'GR', name:'Grèce',     flag:'🇬🇷', path:'eu', strength:85, names:['Giannis','Kostas','Thanasis','Nikos','Vasilis','Dimitris','Panos','Alexis'], last:['Papadópoulos','Antetokoúmpo','Kaláthis','Sloúkas','Larentzákis','Mitóglou']},
  {id:'AU', name:'Australie', flag:'🇦🇺', path:'au', strength:84, names:['Josh','Jack','Dyson','Tyler','Ben','Matt','Cooper','Riley'], last:['Giddey','Daniels','Mills','Ingles','Landale','Exum','Green','Baynes']},
  {id:'CA', name:'Canada',    flag:'🇨🇦', path:'us', strength:88, names:['Shai','RJ','Andrew','Dillon','Jamal','Cory','Nickeil','Bennedict'], last:['Barrett','Wiggins','Murray','Brooks','Alexander','Powell','Dort','Mathurin']},
  {id:'SI', name:'Slovénie',  flag:'🇸🇮', path:'eu', strength:80, names:['Luka','Goran','Vlatko','Klemen','Žiga','Edo','Aleksej','Rok'], last:['Dončić','Dragić','Čančar','Prepelič','Blažič','Nikolić','Murić']},
  {id:'LT', name:'Lituanie',  flag:'🇱🇹', path:'eu', strength:86, names:['Jonas','Domantas','Mindaugas','Rokas','Arnas','Tadas','Gytis','Deividas'], last:['Sabonis','Valančiūnas','Kuzminskas','Jokubaitis','Grigonis','Motiejūnas','Ulanovas','Butkevičius']},
  {id:'IT', name:'Italie',    flag:'🇮🇹', path:'eu', strength:81, names:['Marco','Simone','Nicolò','Danilo','Andrea','Luigi','Stefano','Riccardo'], last:['Fontecchio','Melli','Gallinari','Datome','Belinelli','Barone','Spissu','Ricci']},
  {id:'TR', name:'Turquie',   flag:'🇹🇷', path:'eu', strength:82, names:['Alperen','Cedi','Furkan','Ömer','Cem','Berk','Sertaç','Emir'], last:['Şengün','Osman','Korkmaz','Yurtseven','Aldemir','Güler','Erden','Özmen']},
  {id:'NG', name:'Nigeria',   flag:'🇳🇬', path:'us', strength:78, names:['Chidi','Emeka','Obi','Kelechi','Tobi','Ikenna','Chuka','Uche'], last:['Okafor','Adebayo','Nwosu','Achiuwa','Okonkwo','Eze','Nnamdi','Onwuka']},
  {id:'PR', name:'Porto Rico', flag:'🇵🇷', path:'us', strength:80, names:['José','Carlos','Ángel','Luis','Iván','Ramón','Gian','Renaldo'], last:['Arroyo','Rivera','Vassallo','Cruz','Colón','Meléndez','Ortiz','Rosario']},
];
