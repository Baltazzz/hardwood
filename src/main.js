import './styles.css';
import { G } from './engine/state.js';
import { saveGame } from './engine/savegame.js';
import { mountHomeButton } from './ui/navbar.js';
import { screenTitle } from './ui/screens.js';
import { mountConsentBanner } from './ui/consentBanner.js';
import { initAnalytics } from './engine/analytics.js';
import { handleIncomingLink } from './ui/challenge.js';
import { applyEquippedTheme } from './engine/cosmetics.js';
import { flushPendingScores } from './engine/leaderboardApi.js';

// Thème de boutique équipé (voir engine/cosmetics.js, AGENDA.md AGD-41) : posé une seule fois au
// chargement, AVANT le premier écran -- persiste ensuite pour toute la session via les variables
// CSS globales, sans avoir besoin d'être réappliqué à chaque changement d'écran (contrairement à
// l'accent de club/nation, remis à zéro par chaque écran via resetAccent()).
applyEquippedTheme();

// Bouton accueil persistant, accessible en permanence pendant une carrière (voir ui/navbar.js) --
// posé une seule fois ici, en dehors de #stage, sa visibilité est ensuite pilotée par chaque écran.
mountHomeButton(() => screenTitle());

// Mesure d'audience (Google Analytics 4) sous consentement -- voir engine/consent.js/analytics.js.
// initAnalytics() ne charge RIEN par défaut : le script gtag.js n'est injecté que si un
// consentement 'accepted' a déjà été mémorisé lors d'une visite précédente. mountConsentBanner()
// n'affiche le bandeau que si aucun choix n'a encore été fait -- jamais les deux en même temps
// pour un même visiteur (soit le choix est déjà connu et appliqué, soit on le lui demande).
initAnalytics();
mountConsentBanner();

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

// Défi entre amis (voir ui/challenge.js) : un lien ?challenge=.../?result=... ouvert directement
// (partagé par un ami) prend le pas sur l'écran titre normal -- handleIncomingLink() rend déjà le
// bon écran lui-même dans ce cas et retourne true, sinon écran titre habituel.
if (!handleIncomingLink()) screenTitle();

// Classement partagé des défis (voir engine/leaderboardApi.js, AGENDA.md "lot backend Supabase") :
// rattrape en silence tout score qui n'avait pas pu être envoyé faute de réseau la dernière fois
// (ex. carrière terminée hors ligne) -- fire-and-forget, ne retarde jamais le premier rendu, ne
// lève jamais (voir la garantie de robustesse du module).
flushPendingScores();

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
