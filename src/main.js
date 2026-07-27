import './styles.css';
import { G } from './engine/state.js';
import { saveGame } from './engine/savegame.js';
import { mountHomeButton } from './ui/navbar.js';
import { screenTitle } from './ui/screens.js';

// Bouton accueil persistant, accessible en permanence pendant une carrière (voir ui/navbar.js) --
// posé une seule fois ici, en dehors de #stage, sa visibilité est ensuite pilotée par chaque écran.
mountHomeButton(() => screenTitle());

// Sauvegarde automatique (voir engine/savegame.js) : toute la logique de jeu est pilotée par des
// clics (aucune mutation d'état hors interaction), donc un simple écouteur global en phase de
// bouillonnement -- après que le clic ait déjà fait son effet sur l'état -- couvre fidèlement
// chaque progression, sans avoir à instrumenter chaque écran individuellement. `G` est un import
// de binding ES vivant : il reflète toujours la référence courante posée par setG().
function autosaveIfActive() {
  if (G && !G.retired) saveGame(G);
}
document.addEventListener('click', autosaveIfActive);
// Filet de sécurité supplémentaire : `click` ne suffit pas si l'appli est fermée/mise en arrière-
// plan sans clic final (bascule d'onglet, fermeture directe, en particulier sur mobile où
// `beforeunload` n'est pas fiable).
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') autosaveIfActive(); });
window.addEventListener('pagehide', autosaveIfActive);

screenTitle();

// PWA : enregistrement du service worker (voir public/sw.js) -- app shell précaché à
// l'installation, reste mis en cache à la volée -- pour un vrai fonctionnement hors-ligne une
// fois l'appli installée/déjà visitée en ligne. Après le chargement (`load`), comme recommandé,
// pour ne jamais retarder le premier rendu du jeu.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Enregistrement impossible (navigateur restreint, contexte non sécurisé...) : le jeu
      // reste pleinement jouable en ligne, seul le mode hors-ligne n'est pas disponible.
    });
  });
}
