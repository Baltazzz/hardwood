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
import { t } from '../engine/i18n.js';

let el = null;

// Le CONTENU (texte) est reconstruit à CHAQUE appel de render() -- pas seulement à la création du
// conteneur -- pour rester à jour si la langue a changé depuis la dernière fois que ce bandeau a
// été affiché (voir ui/settings.js) : seul l'élément DOM lui-même (et son ajout au document) est
// mis en cache, jamais son texte.
function render() {
  if (!el) {
    el = document.createElement('div');
    el.id = 'consentBanner';
    el.className = 'consent-banner';
    document.body.appendChild(el);
  }
  el.innerHTML = `
      <p class="consent-txt">${t('consent.text')}</p>
      <div class="consent-actions">
        <button type="button" class="btn ghost sm" id="consentRefuse">${t('consent.refuse')}</button>
        <button type="button" class="btn sm" id="consentAccept">${t('consent.accept')}</button>
      </div>`;
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
