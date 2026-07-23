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
];
