/* ============================================================
   PROFIL DE JOUEUR — écran regroupé (voir AGENDA.md AGD-58) : remplace l'ancien renderProgress()
   (ui/card.js) en réunissant dans une seule tuile ce qui va ensemble -- pseudo de compte
   (engine/profile.js), statistiques cumulées de carrière, résumé de hauts faits, et progression --
   personnalisable via les cosmétiques de la boutique (cadre/titre déjà branchés ici, comme avant),
   ce qui leur donne enfin un usage visible en dehors de la boutique elle-même.

   La grille complète des hauts faits (41 badges) reste un écran à part (renderBadges(), ui/card.js,
   inchangé) -- l'inliner ici rendrait la tuile trop longue ; seul un résumé (compteur + quelques
   icônes débloquées) est repris directement.
============================================================ */
import { hofLoad, hofBest } from '../engine/hof.js';
import { BADGES, badgesState } from '../engine/badges.js';
import { equippedFrameId, equippedTitleId, cosmeticById } from '../engine/cosmetics.js';
import { profileNickname, setNickname } from '../engine/profile.js';
import { walletBalance } from '../engine/wallet.js';
import { money } from '../engine/utils.js';
import { stage } from './dom.js';
import { setInCareer } from './navbar.js';
import { renderHallOfFame, renderBadges } from './card.js';
import { renderShop } from './shop.js';
import { screenTitle } from './screens.js';
import { renderCareerWorldLeaderboard } from './worldLeaderboard.js';
import { t } from '../engine/i18n.js';

function recordRow(label, value) {
  return `<div class="lg"><div class="v">${value}</div><div class="l">${label}</div></div>`;
}

export function renderProfile(){
  setInCareer(false);
  const list = hofLoad();
  const state = badgesState();
  const totalCareers = state.totalCareers || 0;
  const best = hofBest();
  const unlockedBadges = BADGES.filter(b=>state.unlocked[b.id]);
  const badgeCount = unlockedBadges.length;
  const maxSeasons = list.length ? Math.max(...list.map(r=>r.seasons||0)) : 0;
  const maxPeak = list.length ? Math.max(...list.map(r=>r.peak||0)) : 0;
  const maxChamps = list.length ? Math.max(...list.map(r=>r.champs||0)) : 0;
  const maxMvps = list.length ? Math.max(...list.map(r=>r.mvps||0)) : 0;
  const maxPts = list.length ? Math.max(...list.map(r=>r.bestPts||0)) : 0;
  const maxTd = list.length ? Math.max(...list.map(r=>r.tripleDoubles||0)) : 0;
  // Profil cosmétique (voir engine/cosmetics.js) : cadre + titre honorifique équipés depuis la
  // boutique, purement décoratifs -- repris tel quel de l'ancien renderProgress().
  const frameId = equippedFrameId();
  const titleItem = cosmeticById(equippedTitleId());
  const profileHeader = (frameId || titleItem) ? `<div class="profile-header ${frameId?`frame-${frameId.replace('frame_','')}`:''}">
      ${titleItem?`<span class="profile-title-chip">${t('cosmetics.'+titleItem.id+'.name')}</span>`:`<span class="profile-title-chip" style="color:var(--chalk-dim)">${t('profile.noTitleEquipped')}</span>`}
    </div>` : '';
  // Résumé de hauts faits : quelques icônes débloquées (au plus 6, les plus récentes n'étant pas
  // trackées -- ordre de définition, suffisant pour un aperçu) + compteur, jamais la grille
  // complète (voir en-tête de ce fichier).
  const badgePreview = badgeCount
    ? `<div class="badge-mini-row">${unlockedBadges.slice(0,6).map(b=>`<span class="badge-mini" title="${t('badges.'+b.id+'.name')}" style="--badge-color:${b.color}">${b.emoji}</span>`).join('')}</div>`
    : `<p class="body" style="text-align:center;color:var(--chalk-dim);font-size:12.5px;margin-top:4px">${t('profile.noBadgesYet')}</p>`;
  stage.innerHTML = `<div class="end profile-screen" style="text-align:left">
    <div class="eyebrow" style="text-align:center">${t('profile.eyebrow')}</div>
    <h2 style="text-align:center;font-size:26px;margin:6px 0 4px">${t('profile.title')}</h2>
    ${profileHeader}
    <div class="profile-nickname-row">
      <input id="profileNicknameInput" value="${profileNickname()}" maxlength="22" autocomplete="off">
      <button class="btn ghost sm" id="profileNicknameSave">${t('common.save')}</button>
    </div>
    <p class="body" style="text-align:center;color:var(--chalk-dim);margin:10px 0 18px;font-size:13.5px">${totalCareers?t('profile.subtitleWithCareers',{n:totalCareers,s:totalCareers>1?'s':''}):t('profile.subtitleEmpty')}</p>
    <div class="legend-grid" style="max-width:560px">
      ${recordRow(t('profile.careersPlayed'), totalCareers)}
      ${recordRow(t('profile.bestScore'), best)}
      ${recordRow(t('profile.badgesUnlocked'), `${badgeCount}/${BADGES.length}`)}
      ${recordRow(t('profile.longestCareer'), maxSeasons?`${maxSeasons} ${t('hof.seasons')}`:'--')}
    </div>
    <div class="recap-block" style="max-width:640px">
      <div class="eyebrow" style="text-align:center;margin-bottom:10px">${t('profile.badgesSection')}</div>
      ${badgePreview}
      <div style="text-align:center;margin-top:12px"><button class="btn ghost sm" id="profileViewBadges">${t('profile.viewAllBadges')}</button></div>
    </div>
    ${list.length?`
    <div class="recap-block" style="max-width:640px">
      <div class="eyebrow" style="text-align:center;margin-bottom:14px">${t('profile.personalRecords')}</div>
      <div class="legend-grid">
        ${recordRow(t('profile.highestPeak'), maxPeak||'--')}
        ${recordRow(t('profile.titlesOneCareer'), maxChamps)}
        ${recordRow(t('profile.mvpOneCareer'), maxMvps)}
        ${recordRow(t('profile.bestPtsRecord'), maxPts||'--')}
        ${recordRow(t('profile.tripleDoublesOneCareer'), maxTd)}
      </div>
    </div>`:''}
    <div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="btn" id="profileBack">${t('common.back')}</button>
      <button class="btn ghost" id="profileHof">${t('profile.viewHof')}</button>
      <button class="btn ghost" id="profileWorldLb">${t('profile.viewWorldLb')}</button>
      <button class="btn ghost" id="profileShop">${t('profile.shopBtn',{balance:money(walletBalance())})}</button>
    </div>
  </div>`;
  document.getElementById('profileNicknameSave').onclick=()=>{ setNickname(document.getElementById('profileNicknameInput').value); renderProfile(); };
  document.getElementById('profileBack').onclick=()=>screenTitle();
  document.getElementById('profileHof').onclick=()=>renderHallOfFame();
  document.getElementById('profileWorldLb').onclick=()=>renderCareerWorldLeaderboard();
  document.getElementById('profileViewBadges').onclick=()=>renderBadges();
  document.getElementById('profileShop').onclick=()=>renderShop();
}
