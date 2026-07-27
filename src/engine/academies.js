// Choix d'académie de départ : remplace l'ancien point de départ automatique (déduit de la
// nationalité) par une vraie décision. Voir CLAUDE.md / AGENDA.md (lot "création et immersion
// nationale") -- la nationalité n'a plus aucune influence sur le point de départ sportif.
import { NATIONS } from '../data/nations.js';
import { pick, ri } from './utils.js';
import { pickClub } from './clubs.js';

// Nations dont clubData.js modélise vraiment un centre de formation (donc une vraie voie de
// départ jouable : collège US, académie EU, académie AU) -- les seules pouvant apparaître comme
// destination d'académie, quelle que soit la nationalité du joueur. Un prospect sénégalais ou
// chinois peut très bien rejoindre une académie française ou américaine : les académies
// recrutent dans le monde entier, elles ne sont pas réservées aux nationaux.
const ACADEMY_NATION_IDS = ['FR','DE','GR','RS','SI','ES','US','AU'];
function academyNation(id){ return NATIONS.find(n=>n.id===id); }
// Continent "local" pour chaque voie jouable -- sert à repérer si le continent du joueur a une
// offre domestique (Europe/Amérique du Nord/Océanie) ou non (Afrique/Asie/Amérique du Sud).
const PATH_HOME_CONTINENT = { eu:'europe', us:'namerica', au:'oceania' };

// Génère 5-6 offres d'académies (objets NATIONS) pour le profil du joueur :
// - au moins une par grande voie jouable (Europe/Amérique du Nord/Océanie) ;
// - plusieurs sur le continent d'origine du joueur, s'il a une voie locale (ex. un joueur
//   français verra plusieurs académies européennes en plus du lot garanti) ;
// - tirage entièrement aléatoire parmi les 8 académies disponibles pour un joueur venu d'un
//   continent sans championnat dans les données (Afrique, Asie, Amérique du Sud) : aucune
//   académie "locale" n'existe pour lui, donc aucune raison de renforcer un continent en
//   particulier.
export function generateAcademyOffers(playerNation){
  const total = ri(5,6);
  const homeContinent = playerNation?.continent;
  const homePath = Object.keys(PATH_HOME_CONTINENT).find(p=>PATH_HOME_CONTINENT[p]===homeContinent) || null;

  const used = new Set();
  const offers = [];
  function tryAdd(id){
    if(!id || used.has(id)) return false;
    const n = academyNation(id); if(!n) return false;
    used.add(id); offers.push(n); return true;
  }
  function fillRandomly(){
    while(offers.length < total){
      const rest = ACADEMY_NATION_IDS.filter(id=>!used.has(id));
      if(!rest.length) break;
      tryAdd(pick(rest));
    }
  }

  if(homePath){
    // Garantit au moins une académie par grande voie jouable.
    ['eu','us','au'].forEach(path=>{
      const candidates = ACADEMY_NATION_IDS.filter(id=>academyNation(id).path===path);
      tryAdd(pick(candidates));
    });
    // Renforce le continent d'origine du joueur (1-2 académies de plus de la même voie, si
    // d'autres nations existent pour cette voie -- seule la voie EU en a plusieurs).
    let bonus = 0;
    while(bonus<2 && offers.length<total){
      const homeCandidates = ACADEMY_NATION_IDS.filter(id=>academyNation(id).path===homePath && !used.has(id));
      if(!homeCandidates.length) break;
      if(tryAdd(pick(homeCandidates))) bonus++; else break;
    }
    fillRandomly();
  } else {
    fillRandomly();
  }
  // Le vrai club d'académie (nom, niveau, prestige, club pro lié -- voir clubData.js) est tiré
  // UNE FOIS ici et attaché à l'offre elle-même : c'est ce même objet, jamais un second tirage
  // indépendant, qui doit être affiché sur la carte de choix ET devenir le point de départ réel
  // si l'offre est retenue (voir chooseAcademy() dans season.js). Copie superficielle de la
  // nation (jamais de mutation des objets partagés de NATIONS).
  return offers.map(n => ({ ...n, club: pickClub('academy', n.id) }));
}
