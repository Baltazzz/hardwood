// Pilote une carrière HARDWOOD de bout en bout en cliquant les vrais boutons
// du DOM (jsdom), en choisissant aléatoirement parmi les options proposées à
// chaque écran. Sert de base au script d'audit (tests/audit.mjs).

function pickRandomEl(list) {
  const arr = Array.from(list);
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function clickId(document, id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Élément #${id} introuvable`);
  el.click();
}

// Une carrière = jusqu'à ce que l'écran de fin ("#again") apparaisse, ou que
// le nombre d'itérations dépasse le plafond de sécurité (carrière "bloquée").
const MAX_STEPS_PER_CAREER = 1000;

// Suppose que le DOM est déjà sur l'étape 1 de la création de personnage
// (c'est le cas juste après l'écran titre, ou juste après avoir cliqué
// "Nouvelle carrière" en fin de partie précédente, qui saute directement
// dans la création sans repasser par l'écran titre).
export function driveOneCareer({ document, errors, state, ATTRS }) {
  const errorsBefore = errors.length;

  // --- création en 5 étapes ---
  for (let step = 0; step < 4; step++) {
    const opt = pickRandomEl(document.querySelectorAll('.opt'));
    if (!opt) throw new Error(`Aucune option ".opt" à l'étape de création ${step}`);
    opt.click();
    clickId(document, 'nextC');
  }
  clickId(document, 'nextC'); // étape 5 (scouting + nom) -> startCareer()

  // --- boucle de saison / intersaison jusqu'à la fin de carrière ---
  let age22MaxAttr = null;
  for (let i = 0; i < MAX_STEPS_PER_CAREER; i++) {
    if (errors.length > errorsBefore) {
      return { crashed: true, reason: errors[errors.length - 1] };
    }
    if (document.getElementById('again')) {
      break; // fin de carrière atteinte
    }
    if (document.getElementById('afterSeason')) {
      clickId(document, 'afterSeason');
    } else if (document.querySelector('.choice')) {
      const choice = pickRandomEl(document.querySelectorAll('.choice'));
      choice.click();
      const cont = document.getElementById('contBtn');
      if (cont) cont.click(); // écran d'événement : bandeau "Suite" à valider
    } else {
      throw new Error('État d\'écran non reconnu pendant la boucle de carrière');
    }

    if (age22MaxAttr === null) {
      const G = state.G;
      if (G && G.age === 22 && G.attrs) {
        age22MaxAttr = Math.max(...ATTRS.map(a => G.attrs[a.id] || 0));
      }
    }
  }

  if (!document.getElementById('again')) {
    return { crashed: true, reason: 'Carrière bloquée (plafond d\'itérations atteint)' };
  }

  const G = state.G;
  const seasons = G.seasons.map(s => ({ league: s.league, pts: s.pts, injured: s.injured }));
  const firstNbaAge = G.firstNbaAge;

  // Repart sur une nouvelle carrière pour la prochaine itération de l'audit.
  clickId(document, 'again');

  return { crashed: false, seasons, firstNbaAge, age22MaxAttr };
}
