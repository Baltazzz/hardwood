/* ============================================================
   BANDEAU COOKIES — discret, non intrusif, cohérent avec la palette
   Terre battue. Posé une seule fois en dehors de #stage (même
   convention que le bouton accueil, voir navbar.js) : survit à
   chaque `stage.innerHTML = ...`. Deux choix explicites, aucune case
   pré-cochée, aucun choix par défaut favorisé visuellement au-delà
   d'une simple mise en avant du bouton "Accepter" (habituel, pas
   trompeur -- "Refuser" reste tout aussi cliquable et lisible).
============================================================ */
import { getConsent, setConsent } from '../engine/consent.js';
import { acceptAnalytics, refuseAnalytics } from '../engine/analytics.js';

let el = null;

function render() {
  if (!el) {
    el = document.createElement('div');
    el.id = 'consentBanner';
    el.className = 'consent-banner';
    el.innerHTML = `
      <p class="consent-txt">Ce jeu utilise une mesure d'audience anonyme (Google Analytics) pour comprendre son usage. Rien n'est chargé sans ton accord.</p>
      <div class="consent-actions">
        <button type="button" class="btn ghost sm" id="consentRefuse">Refuser</button>
        <button type="button" class="btn sm" id="consentAccept">Accepter</button>
      </div>`;
    document.body.appendChild(el);
    el.querySelector('#consentAccept').onclick = () => {
      setConsent('accepted');
      acceptAnalytics();
      hide();
    };
    el.querySelector('#consentRefuse').onclick = () => {
      setConsent('refused');
      refuseAnalytics();
      hide();
    };
  }
  el.classList.add('visible');
}
function hide() { if (el) el.classList.remove('visible'); }

// Appelé une fois au démarrage (voir main.js) : n'affiche le bandeau QUE si aucun choix n'a
// encore été mémorisé -- un visiteur qui a déjà répondu (accepté ou refusé) ne le revoit pas à
// chaque visite.
export function mountConsentBanner() {
  if (getConsent() === null) render();
}

// Petit lien discret de pied de page (voir écran titre, screens.js) : permet de revenir sur son
// choix à tout moment, sans avoir à vider le stockage du navigateur soi-même.
export function reopenConsentBanner() {
  render();
}
