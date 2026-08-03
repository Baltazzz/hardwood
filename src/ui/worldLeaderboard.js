/* ============================================================
   CLASSEMENTS MONDIAUX (rendu) — défi du jour + meilleures carrières (voir AGENDA.md AGD-59).
   Un seul moteur de rendu paginé partagé (renderWorldLeaderboardScreen()) exposant deux écrans --
   même besoin des deux côtés : pagination "Charger plus" (jamais tout charger d'un coup), tri
   Score/Saisons, mise en évidence de sa propre ligne où qu'elle soit (y compris hors des pages
   déjà chargées), et le même traitement podium (couronne/médaille) que le classement de défi entre
   amis (ui/challenge.js) et le Panthéon local (ui/card.js) -- voir rankGlyph() dans ui/card.js.

   IMPORTANT : rankGlyph()/les classes .top/.podium reçoivent le RANG GLOBAL (position réelle dans
   le classement, `état.rows` accumulé depuis l'offset 0), jamais un index local à une page -- sans
   ça, chaque nouvelle page de "Charger plus" redessinerait sa propre ligne 0 avec une couronne.
============================================================ */
import { stage } from './dom.js';
import { setInCareer } from './navbar.js';
import { rankGlyph } from './card.js';
import { TIER_RANK } from '../engine/badges.js';
import { getTodayDateStr } from '../engine/dailyChallenge.js';
import {
  fetchDailyWorldPage, fetchCareerWorldPage, fetchMyDailyWorldRank, fetchMyCareerWorldRank,
} from '../engine/worldLeaderboardApi.js';
import { t } from '../engine/i18n.js';
// Imports circulaires (challenge.js/profile.js importent eux-mêmes ce fichier pour leurs boutons
// d'entrée) -- déjà un motif établi et éprouvé dans ce projet (ui/screens.js <-> ui/card.js) : sûr
// tant que les liaisons importées ne sont utilisées qu'à l'intérieur de fonctions (jamais à
// l'évaluation du module), ce qui est le cas ici (simples callbacks de navigation).
import { startDailyChallenge } from './challenge.js';
import { renderProfile } from './profile.js';

// Même règle que tierLabel() dans ui/challenge.js : `tier` est stocké en français, traduit
// uniquement à l'affichage via son index dans TIER_RANK.
function tierLabel(tier) { const i = TIER_RANK.indexOf(tier); return t('tierRank.' + (i >= 0 ? i : 0)); }

function rowHTML(r, globalRank) {
  return `<div class="hof-row${globalRank === 0 ? ' top' : globalRank < 3 ? ' podium' : ''}${r.mine ? ' mine' : ''}">
    ${rankGlyph(globalRank)}
    <span class="hof-main">
      <span class="hof-name">${r.name}${r.hof ? ' 🏛️' : ''}${r.mine ? ` <small style="color:var(--mint)">(${t('worldLb.you')})</small>` : ''}</span>
      <span class="hof-sub">${tierLabel(r.tier)} · ${r.seasons} ${t('hof.seasons')}</span>
    </span>
    <span class="hof-score"><b>${r.score}</b><small>score</small></span>
  </div>`;
}

// Moteur partagé -- voir renderDailyWorldLeaderboard()/renderCareerWorldLeaderboard() plus bas
// pour la configuration propre à chaque classement.
function renderWorldLeaderboardScreen(config) {
  setInCareer(false);
  const state = { rows: [], offset: 0, limit: 20, orderBy: 'score', hasMore: false };

  function renderShell() {
    stage.innerHTML = `<div class="end world-leaderboard" style="text-align:left">
      <div class="eyebrow" style="text-align:center">${config.eyebrow}</div>
      <h2 style="text-align:center;font-size:24px;margin:6px 0 14px">${config.title}</h2>
      <div style="text-align:center;margin-bottom:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn sm sort-btn" data-sort="score">${t('worldLb.sortScore')}</button>
        <button class="btn sm sort-btn" data-sort="seasons">${t('worldLb.sortSeasons')}</button>
      </div>
      <p class="body" id="wlStatus" style="text-align:center;color:var(--chalk-dim);font-size:12px;min-height:15px;margin:0 0 8px"></p>
      <div class="hof-list" id="wlRows" style="max-width:560px;margin:0 auto"></div>
      <div id="wlMyRankWrap" style="max-width:560px;margin:14px auto 0"></div>
      <div style="margin-top:16px;text-align:center"><button class="btn ghost sm" id="wlLoadMore" style="display:none">${t('worldLb.loadMore')}</button></div>
      <div style="margin-top:22px;text-align:center"><button class="btn" id="wlBack">${config.backLabel}</button></div>
    </div>`;
    document.getElementById('wlBack').onclick = config.onBack;
    stage.querySelectorAll('.sort-btn').forEach((btn) => {
      btn.classList.toggle('ghost', btn.dataset.sort !== state.orderBy);
      btn.onclick = () => {
        if (state.orderBy === btn.dataset.sort) return;
        state.orderBy = btn.dataset.sort;
        renderShell();
        loadPage(true);
      };
    });
    document.getElementById('wlLoadMore').onclick = () => loadPage(false);
  }

  function myRowVisible() { return state.rows.some((r) => r.mine); }

  async function refreshMyRankStrip() {
    const wrap = document.getElementById('wlMyRankWrap');
    if (!wrap) return; // écran quitté entre-temps
    if (myRowVisible()) { wrap.innerHTML = ''; return; }
    const result = await config.fetchMyRank(state.orderBy);
    if (!document.getElementById('wlMyRankWrap')) return;
    wrap.innerHTML = result
      ? `<div class="world-lb-mine-label">${t('worldLb.yourRank')}</div>${rowHTML(result.row, result.rank - 1)}`
      : '';
  }

  async function loadPage(reset) {
    const statusEl = document.getElementById('wlStatus');
    const rowsEl = document.getElementById('wlRows');
    const loadMoreBtn = document.getElementById('wlLoadMore');
    if (reset) { state.rows = []; state.offset = 0; state.hasMore = false; }
    if (loadMoreBtn) loadMoreBtn.disabled = true;
    const page = await config.fetchPage(state.offset, state.limit, state.orderBy);
    if (!document.getElementById('wlRows')) return; // écran quitté pendant l'attente réseau
    if (page === null) {
      // Serveur injoignable/hors ligne (voir engine/worldLeaderboardApi.js) : message clair,
      // jamais un écran cassé -- si une page était déjà chargée, elle reste affichée telle quelle.
      statusEl.textContent = state.rows.length ? t('worldLb.loadMoreFailed') : t('worldLb.unavailable');
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }
    statusEl.textContent = '';
    state.rows = state.rows.concat(page);
    state.offset += page.length;
    state.hasMore = page.length === state.limit;
    rowsEl.innerHTML = state.rows.length
      ? state.rows.map((r, i) => rowHTML(r, i)).join('')
      : `<p class="body" style="text-align:center;color:var(--chalk-dim);margin:20px 0">${config.emptyMessage}</p>`;
    if (loadMoreBtn) { loadMoreBtn.style.display = state.hasMore ? '' : 'none'; loadMoreBtn.disabled = false; }
    refreshMyRankStrip();
  }

  renderShell();
  loadPage(true);
}

// ---- Défi du jour, classement mondial (voir startDailyChallenge() dans ui/challenge.js) ----
export function renderDailyWorldLeaderboard() {
  const dateStr = getTodayDateStr();
  renderWorldLeaderboardScreen({
    eyebrow: `🌍 ${t('worldLb.dailyEyebrow')}`,
    title: t('worldLb.dailyTitle', { date: dateStr }),
    backLabel: t('common.back'),
    onBack: () => startDailyChallenge(),
    fetchPage: (offset, limit, orderBy) => fetchDailyWorldPage({ date: dateStr, offset, limit, orderBy }),
    fetchMyRank: (orderBy) => fetchMyDailyWorldRank(dateStr, orderBy),
    emptyMessage: t('worldLb.dailyEmpty'),
  });
}

// ---- Meilleures carrières, classement mondial (voir renderProfile() dans ui/profile.js) ----
export function renderCareerWorldLeaderboard() {
  renderWorldLeaderboardScreen({
    eyebrow: `🌍 ${t('worldLb.careerEyebrow')}`,
    title: t('worldLb.careerTitle'),
    backLabel: t('common.back'),
    onBack: () => renderProfile(),
    fetchPage: (offset, limit, orderBy) => fetchCareerWorldPage({ offset, limit, orderBy }),
    fetchMyRank: (orderBy) => fetchMyCareerWorldRank(orderBy),
    emptyMessage: t('worldLb.careerEmpty'),
  });
}
