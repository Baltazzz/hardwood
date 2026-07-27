/* ============================================================
   GOOGLE ANALYTICS 4 — chargement STRICTEMENT conditionné au
   consentement (voir engine/consent.js). Le script gtag.js n'est
   injecté dans le DOM que si `getConsent()==='accepted'` -- jamais
   au chargement de la page par défaut, jamais "chargé mais bridé"
   (pas de consent-mode Google qui charge quand même le script) :
   sans consentement, AUCUNE requête réseau vers Google n'est
   émise, point final.
============================================================ */
import { getConsent } from './consent.js';

const GA_ID = 'G-X2Z51SZ8XK';
let loaded = false;

function injectScript() {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

// Appelé une fois au démarrage de l'appli (voir main.js) : ne fait RIEN par défaut -- charge le
// script UNIQUEMENT si un consentement a déjà été donné lors d'une visite précédente (mémorisé
// dans localStorage). Un visiteur qui n'a jamais répondu, ou qui a refusé, ne déclenche jamais ce
// chargement -- il faudra un clic explicite sur "Accepter" (voir acceptAnalytics() ci-dessous).
export function initAnalytics() {
  if (getConsent() === 'accepted') injectScript();
}

// Appelé au clic "Accepter" du bandeau (voir ui/consentBanner.js). setConsent() est déjà appelé
// par l'appelant -- ici uniquement l'effet concret du consentement : charger le script.
export function acceptAnalytics() {
  injectScript();
  if (window[`ga-disable-${GA_ID}`]) delete window[`ga-disable-${GA_ID}`];
}

// Appelé au clic "Refuser", y compris un revirement APRÈS un "Accepter" précédent dans la même
// session (rouvert via le lien de pied de page) : `ga-disable-*` est le mécanisme d'opt-out
// officiel de gtag.js -- respecté même si le script est déjà chargé en mémoire, empêche l'envoi
// de tout événement futur sans avoir à retirer le script du DOM.
export function refuseAnalytics() {
  window[`ga-disable-${GA_ID}`] = true;
}

// Suivi d'événement : n'envoie RIEN si le consentement n'est pas (ou plus) 'accepted', vérifié à
// CHAQUE appel plutôt qu'une fois au chargement -- couvre le cas d'un refus après un accord
// initial dans la même session. Ne lève jamais si gtag n'est pas chargé (visiteur sans
// consentement) : le suivi est un plus, jamais une dépendance dont le jeu a besoin pour tourner.
export function trackEvent(name, params) {
  if (getConsent() !== 'accepted' || typeof window.gtag !== 'function') return;
  try { window.gtag('event', name, params || {}); } catch (e) { /* le suivi ne doit jamais casser le jeu */ }
}
