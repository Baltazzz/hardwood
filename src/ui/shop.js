/* ============================================================
   BOUTIQUE COSMÉTIQUE (voir AGENDA.md AGD-41) — écran de la boutique : trois onglets (thèmes de
   couleur / styles de carte / profil), payés en jetons de la cagnotte (engine/wallet.js),
   catalogue et logique d'achat/équipement dans engine/cosmetics.js. Cet écran ne fait QUE de
   l'affichage/interaction -- aucune règle de prix ou de possession décidée ici.
============================================================ */
import { stage } from './dom.js';
import { screenTitle } from './screens.js';
import { setInCareer } from './navbar.js';
import { walletBalance } from '../engine/wallet.js';
import { catalogByFamily, isOwned, equippedId, purchase, equip, applyEquippedTheme, themePreviewColors } from '../engine/cosmetics.js';
import { CARD_STYLES } from './card.js';

const TABS = [
  { id: 'theme', label: '🎨 Thèmes' },
  { id: 'card', label: '🖼️ Cartes' },
  { id: 'profile', label: '🖼️ Profil' },
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
  return `<div class="shop-swatch title-swatch">${item.name}</div>`;
}

function actionHTML(item) {
  const owned = isOwned(item.id);
  const equipped = equippedId(item.family) === item.id;
  if (equipped) return `<button class="shop-action equipped" disabled>Équipé</button>`;
  if (owned) return `<button class="shop-action equip" data-act="equip" data-id="${item.id}" data-family="${item.family}">Équiper</button>`;
  const afford = walletBalance() >= item.price;
  return `<button class="shop-action buy" data-act="buy" data-id="${item.id}" ${afford ? '' : 'disabled'}>Acheter · 🪙 ${item.price}</button>`;
}

function tileHTML(item) {
  const owned = isOwned(item.id);
  const equipped = equippedId(item.family) === item.id;
  return `<div class="shop-tile ${equipped ? 'equipped' : ''} ${item.tier === 'prestige' ? 'prestige' : ''}">
    ${swatchHTML(item)}
    <div class="st-name">${item.name}</div>
    ${item.desc ? `<div class="st-desc">${item.desc}</div>` : '<div class="st-desc"></div>'}
    ${owned ? '' : `<div class="shop-price ${walletBalance() >= item.price ? '' : 'cant-afford'}">🪙 ${item.price}</div>`}
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
    ${equipped ? `<button class="shop-action equipped" disabled>Équipé</button>` : `<button class="shop-action equip" data-act="equip-none" data-family="${family}">Équiper</button>`}
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
      <div class="shop-section-h">Titres honorifiques</div>
      <div class="shop-grid">${noneTileHTML('title', 'Aucun titre')}${catalogByFamily('title').map(tileHTML).join('')}</div>
      <div class="shop-section-h">Cadres</div>
      <div class="shop-grid">${noneTileHTML('frame', 'Aucun cadre')}${catalogByFamily('frame').map(tileHTML).join('')}</div>`;
  } else {
    body = gridFor(currentTab);
  }
  stage.innerHTML = `<div class="end" style="text-align:left">
    <div class="eyebrow" style="text-align:center">🛍️ Boutique</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">Personnalise ta légende</h2>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin-bottom:6px;font-size:13.5px">Purement cosmétique -- aucun effet sur tes attributs, ta progression ou tes classements.</p>
    <div style="text-align:center"><div class="wallet-chip">🪙 Cagnotte : <b>${walletBalance()}</b></div></div>
    <div class="shop-tabs" style="margin-top:22px">${TABS.map(t => `<button class="shop-tab ${t.id === currentTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}</div>
    ${body}
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="shopBack">Retour</button>
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
