/* ============================================================
   RÉGLAGES (voir AGENDA.md, "réglages et langue anglaise") — écran accessible depuis l'accueil.
   Pour l'instant, un seul réglage : la langue (voir engine/i18n.js). Structure volontairement
   simple pour accueillir d'autres réglages plus tard sans réorganiser l'écran.
============================================================ */
import { stage } from './dom.js';
import { screenTitle } from './screens.js';
import { setInCareer, updateHomeButtonLabel } from './navbar.js';
import { t, LOCALES, getLocale, setLocale } from '../engine/i18n.js';

export function renderSettings() {
  setInCareer(false);
  const current = getLocale();
  stage.innerHTML = `<div class="end" style="max-width:480px">
    <div class="eyebrow" style="text-align:center">${t('settings.eyebrow')}</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">${t('settings.title')}</h2>
    <div class="recap-block" style="max-width:420px">
      <div class="eyebrow" style="text-align:center;margin-bottom:6px">${t('settings.language')}</div>
      <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13px;margin-bottom:14px">${t('settings.languageDesc')}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        ${LOCALES.map(l => `<button class="btn ${l.id === current ? '' : 'ghost'} sm" data-locale="${l.id}">${l.flag} ${l.label}</button>`).join('')}
      </div>
      <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:11.5px;margin-top:14px">${t('settings.narrativeNote')}</p>
    </div>
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="settingsBack">${t('common.back')}</button>
    </div>
  </div>`;
  document.getElementById('settingsBack').onclick = () => screenTitle();
  stage.querySelectorAll('[data-locale]').forEach(el => {
    el.onclick = () => { setLocale(el.dataset.locale); updateHomeButtonLabel(); renderSettings(); };
  });
}
