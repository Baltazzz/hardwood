/* ============================================================
   BOUTON ACCUEIL PERSISTANT — accessible en permanence pendant une
   carrière, sans jamais perturber la mise en page des écrans (posé
   une seule fois en dehors de #stage, en position fixe -- il
   survit à chaque `stage.innerHTML = ...` au lieu d'avoir besoin
   d'être réinjecté par chaque écran).
============================================================ */
import { t } from '../engine/i18n.js';

let btn = null;

export function mountHomeButton(onClick) {
  if (btn) return;
  btn = document.createElement('button');
  btn.id = 'homeFab';
  btn.className = 'home-fab';
  btn.type = 'button';
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 11 12 4 20 11M6 10V20H18V10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  updateHomeButtonLabel();
  btn.onclick = () => onClick();
  document.body.appendChild(btn);
}

// Appelée au montage ET à chaque changement de langue (voir ui/settings.js) : le bouton n'est
// créé qu'une seule fois au démarrage (voir en-tête de fichier), donc son libellé/aria-label ne
// se rafraîchirait jamais tout seul si la langue change en cours de session sans cet appel explicite.
export function updateHomeButtonLabel() {
  if (!btn) return;
  const label = t('navbar.backHome');
  btn.setAttribute('aria-label', label);
  btn.title = label;
}

// Affiché uniquement pendant une carrière (création, événement, bilan, transfert...) -- jamais
// sur le titre, le Panthéon, les badges ou l'écran de fin, où revenir à l'accueil n'a pas de sens.
export function setInCareer(v) {
  if (btn) btn.classList.toggle('visible', !!v);
}
