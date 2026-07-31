/* ============================================================
   BOUTIQUE COSMÉTIQUE (voir AGENDA.md AGD-41/AGD-47) — écran de la boutique : quatre onglets
   (thèmes de couleur / styles de carte / profil / collection), payés DIRECTEMENT en trésorerie de
   carrière cumulée (engine/wallet.js -- plus de jetons abstraits depuis AGD-47), catalogue et
   logique d'achat/équipement dans engine/cosmetics.js. Cet écran ne fait QUE de l'affichage/
   interaction -- aucune règle de prix ou de possession décidée ici.
============================================================ */
import { stage } from './dom.js';
import { screenTitle } from './screens.js';
import { setInCareer } from './navbar.js';
import { walletBalance } from '../engine/wallet.js';
import { catalogByFamily, isOwned, equippedId, purchase, equip, applyEquippedTheme, themePreviewColors } from '../engine/cosmetics.js';
import { CARD_STYLES } from './card.js';
import { t } from '../engine/i18n.js';
import { money } from '../engine/utils.js';

const TABS = [
  { id: 'theme', labelKey: 'shop.tabThemes' },
  { id: 'card', labelKey: 'shop.tabCards' },
  { id: 'profile', labelKey: 'shop.tabProfile' },
  { id: 'collection', labelKey: 'shop.tabCollection' },
];
let currentTab = 'theme';

const FRAME_SWATCH = {
  frame_wood: '#8A6A45', frame_bronze: '#A5673A', frame_silver: '#9AA3AD',
  frame_emerald: '#2F8F5B', frame_amethyst: '#7B4FA0',
  frame_legends: 'linear-gradient(135deg,#A1821F,#2F8F5B)',
};

function swatchHTML(item) {
  if (item.family === 'theme') {
    const c = themePreviewColors(item.id);
    return `<div class="shop-swatch"><i style="background:${c.primary}"></i><i style="background:${c.secondary}"></i></div>`;
  }
  if (item.family === 'card') {
    const style = CARD_STYLES[item.id] || CARD_STYLES.classic;
    return `<div class="shop-swatch"><i style="background:${style.C.orange}"></i><i style="background:${style.C.mint}"></i></div>`;
  }
  if (item.family === 'frame') {
    return `<div class="shop-swatch" style="background:${FRAME_SWATCH[item.id] || 'var(--panel2)'}"></div>`;
  }
  return `<div class="shop-swatch title-swatch">${t('cosmetics.'+item.id+'.name')}</div>`;
}

function actionHTML(item) {
  const owned = isOwned(item.id);
  const equipped = equippedId(item.family) === item.id;
  if (equipped) return `<button class="shop-action equipped" disabled>${t('shop.equipped')}</button>`;
  if (owned) return `<button class="shop-action equip" data-act="equip" data-id="${item.id}" data-family="${item.family}">${t('shop.equip')}</button>`;
  const afford = walletBalance() >= item.price;
  return `<button class="shop-action buy" data-act="buy" data-id="${item.id}" ${afford ? '' : 'disabled'}>${t('shop.buy',{price:money(item.price)})}</button>`;
}

function tileHTML(item) {
  const owned = isOwned(item.id);
  const equipped = equippedId(item.family) === item.id;
  const desc = t('cosmetics.'+item.id+'.desc');
  return `<div class="shop-tile ${equipped ? 'equipped' : ''} ${item.tier === 'prestige' ? 'prestige' : ''}">
    ${swatchHTML(item)}
    <div class="st-name">${t('cosmetics.'+item.id+'.name')}</div>
    ${desc ? `<div class="st-desc">${desc}</div>` : '<div class="st-desc"></div>'}
    ${owned ? '' : `<div class="shop-price ${walletBalance() >= item.price ? '' : 'cant-afford'}">💰 ${money(item.price)}</div>`}
    ${actionHTML(item)}
  </div>`;
}

// "Aucun" -- seule option pour vider un emplacement cadre/titre (les thèmes/cartes ont toujours
// un défaut équipé, jamais d'emplacement vide).
function noneTileHTML(family, label) {
  const equipped = equippedId(family) === null;
  return `<div class="shop-tile ${equipped ? 'equipped' : ''}">
    <div class="shop-swatch title-swatch" style="color:var(--chalk-dim)">${label}</div>
    <div class="st-name">${label}</div><div class="st-desc"></div>
    ${equipped ? `<button class="shop-action equipped" disabled>${t('shop.equipped')}</button>` : `<button class="shop-action equip" data-act="equip-none" data-family="${family}">${t('shop.equip')}</button>`}
  </div>`;
}

// Emplacement Collection (voir AGENDA.md AGD-47 point 5) : structure préparée pour de futurs
// visuels à collectionner, jamais achetable/équipable pour l'instant (`comingSoon:true` sur le
// catalogue, voir engine/cosmetics.js) -- rendu volontairement "vide mais propre" (silhouette en
// pointillés + badge "Bientôt disponible"), aucun bouton d'action tant qu'il n'y a rien à faire.
function collectionSlotHTML(item) {
  return `<div class="shop-tile collection-slot">
    <div class="shop-swatch collection-swatch">
      <svg viewBox="0 0 24 24" width="26" height="26"><path d="${item.sub === 'jersey' ? 'M8 3 4 6v4h2v11h12V10h2V6l-4-3-2 2h-4z' : 'M4 5h16v14H4z M4 9h16'}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="st-name">${t('cosmetics.'+item.id+'.name')}</div>
    <div class="st-desc">${t('cosmetics.'+item.id+'.desc')}</div>
    <span class="shop-action equipped" style="cursor:default">${t('shop.comingSoon')}</span>
  </div>`;
}

function gridFor(family) {
  return `<div class="shop-grid">${catalogByFamily(family).map(tileHTML).join('')}</div>`;
}

export function renderShop() {
  setInCareer(false);
  let body;
  if (currentTab === 'profile') {
    body = `
      <div class="shop-section-h">${t('shop.titlesSection')}</div>
      <div class="shop-grid">${noneTileHTML('title', t('shop.noTitle'))}${catalogByFamily('title').map(tileHTML).join('')}</div>
      <div class="shop-section-h">${t('shop.framesSection')}</div>
      <div class="shop-grid">${noneTileHTML('frame', t('shop.noFrame'))}${catalogByFamily('frame').map(tileHTML).join('')}</div>`;
  } else if (currentTab === 'collection') {
    const items = catalogByFamily('collection');
    body = `
      <p class="body" style="text-align:center;color:var(--chalk-dim);font-size:13px;max-width:480px;margin:0 auto 18px">${t('shop.collectionIntro')}</p>
      <div class="shop-section-h">${t('shop.collectionCardsSection')}</div>
      <div class="shop-grid">${items.filter(i => i.sub === 'card').map(collectionSlotHTML).join('')}</div>
      <div class="shop-section-h">${t('shop.collectionJerseysSection')}</div>
      <div class="shop-grid">${items.filter(i => i.sub === 'jersey').map(collectionSlotHTML).join('')}</div>`;
  } else {
    body = gridFor(currentTab);
  }
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">${t('shop.eyebrow')}</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">${t('shop.title')}</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin-bottom:6px;font-size:13.5px">${t('shop.subtitle')}</p>
    <div style="text-align:center"><div class="wallet-chip">${t('shop.walletLabel',{balance:`<b>${money(walletBalance())}</b>`})}</div></div>
    <div class="shop-tabs" style="margin-top:22px">${TABS.map(tb => `<button class="shop-tab ${tb.id === currentTab ? 'active' : ''}" data-tab="${tb.id}">${t(tb.labelKey)}</button>`).join('')}</div>
    ${body}
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="shopBack">${t('common.back')}</button>
    </div>
  </div>`;
  document.getElementById('shopBack').onclick = () => screenTitle();
  stage.querySelectorAll('.shop-tab').forEach(el => { el.onclick = () => { currentTab = el.dataset.tab; renderShop(); }; });
  stage.querySelectorAll('[data-act="buy"]').forEach(el => {
    el.onclick = () => { purchase(el.dataset.id); renderShop(); };
  });
  stage.querySelectorAll('[data-act="equip"]').forEach(el => {
    el.onclick = () => { equip(el.dataset.family, el.dataset.id); if (el.dataset.family === 'theme') applyEquippedTheme(); renderShop(); };
  });
  stage.querySelectorAll('[data-act="equip-none"]').forEach(el => {
    el.onclick = () => { equip(el.dataset.family, null); renderShop(); };
  });
}
