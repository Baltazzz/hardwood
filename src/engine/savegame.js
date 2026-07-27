import { EVENTS } from './events.js';

/* ============================================================
   SAUVEGARDE DE CARRIÈRE — reprise exacte après fermeture de
   l'application. Même stockage robuste que hof.js/badges.js :
   localStorage quand disponible, repli mémoire sinon -- jamais
   d'erreur si le stockage est indisponible/plein/bloqué.

   Piège vérifié et évité : p.curEvents contient des RÉFÉRENCES aux
   objets événements du catalogue (voir engine/events.js), dont
   choices/body/when/weight sont des FONCTIONS -- JSON.stringify les
   supprime silencieusement (aucune erreur, juste des events cassés
   au réveil, `ev.choices is not a function`). On sauvegarde donc
   juste leurs id, et on les re-résout dans EVENTS au chargement.
   Vérifié exhaustivement sur une carrière complète pilotée : c'est
   le SEUL champ de l'état joueur à porter des fonctions imbriquées.
============================================================ */
const SAVE_KEY = 'hardwood_save_v1';
let mem; // undefined = pas encore chargé, null = pas de sauvegarde, objet = sauvegarde en mémoire

function hydrate(saved) {
  if (!saved) return saved;
  if (Array.isArray(saved.curEvents)) {
    saved.curEvents = saved.curEvents.map(id => EVENTS.find(e => e.id === id)).filter(Boolean);
  }
  return saved;
}

function load() {
  if (mem !== undefined) return mem;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    mem = raw ? hydrate(JSON.parse(raw)) : null;
  } catch (e) { mem = null; }
  return mem;
}

// Sérialise et persiste l'état de carrière courant. Re-parse la chaîne plutôt que de garder une
// référence directe vers `p` (muté en continu par le jeu) : le cache mémoire doit refléter
// exactement ce qui a été écrit, pas un objet vivant qui continuerait de changer sous nos pieds.
export function saveGame(p) {
  const forSave = Array.isArray(p.curEvents) ? { ...p, curEvents: p.curEvents.map(ev => ev && ev.id) } : p;
  let json;
  try { json = JSON.stringify(forSave); } catch (e) { return; } // état non sérialisable : abandonne cette sauvegarde plutôt que de planter
  try { mem = hydrate(JSON.parse(json)); } catch (e) { mem = null; return; }
  try { localStorage.setItem(SAVE_KEY, json); } catch (e) { /* stockage indisponible : repli mémoire déjà fait au-dessus */ }
}

export function loadGame() { return load(); }
export function hasSavedGame() { return !!load(); }
export function clearSavedGame() {
  mem = null;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}
