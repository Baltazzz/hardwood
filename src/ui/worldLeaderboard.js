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

   LISIBILITÉ À GRANDE ÉCHELLE (voir AGENDA.md, "revoir la forme des classements") : le podium
   (rangs 1-3) garde le traitement visuel plein format, mais toutes les lignes suivantes basculent
   en variante CONDENSÉE (`.hof-row.compact`, styles.css) -- sans ça, un classement à plusieurs
   centaines de joueurs devient long à parcourir. Deux MODES d'affichage, choisis par un bouton
   unique : "top" (par défaut, depuis le rang 1, "Charger plus" pour descendre) et "autour de moi"
   (fenêtre centrée sur mon propre rang, ceux juste devant/derrière -- pour se situer d'un coup
   d'œil sans dérouler tout le classement).
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

// Nombre de lignes montrées de part et d'autre de ma position en mode "autour de moi" (5+moi+5).
const AROUND_CONTEXT = 5;

// Même règle que tierLabel() dans ui/challenge.js : `tier` est stocké en français, traduit
// uniquement à l'affichage via son index dans TIER_RANK.
function tierLabel(tier) { const i = TIER_RANK.indexOf(tier); return t('tierRank.' + (i >= 0 ? i : 0)); }

// `globalRank` (0-based) décide à la fois du traitement podium (0-2, plein format) et de la
// variante condensée (3+, voir .hof-row.compact dans styles.css) -- jamais l'index local d'une
// page/fenêtre, voir en-tête du fichier.
function rowHTML(r, globalRank) {
  const compact = globalRank >= 3;
  return `<div class="hof-row${compact ? ' compact' : ''}${globalRank === 0 ? ' top' : globalRank < 3 ? ' podium' : ''}${r.mine ? ' mine' : ''}">
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
  const state = { rows: [], offset: 0, limit: 20, orderBy: 'score', hasMore: false, view: 'top' };

  function renderShell() {
    stage.innerHTML = `<div class="end world-leaderboard" style="text-align:left">
      <div class="eyebrow" style="text-align:center">${config.eyebrow}</div>
      <h2 style="text-align:center;font-size:24px;margin:6px 0 14px">${config.title}</h2>
      <div style="text-align:center;margin-bottom:10px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn sm sort-btn" data-sort="score">${t('worldLb.sortScore')}</button>
        <button class="btn sm sort-btn" data-sort="seasons">${t('worldLb.sortSeasons')}</button>
      </div>
      <div style="text-align:center;margin-bottom:14px">
        <button class="btn ghost sm" id="wlViewToggle">${state.view === 'top' ? t('worldLb.aroundMe') : t('worldLb.fullList')}</button>
      </div>
      <p class="body" id="wlStatus" style="text-align:center;color:var(--chalk-dim);font-size:12px;min-height:15px;margin:0 0 8px"></p>
      <div class="hof-list compact-list" id="wlRows" style="max-width:560px;margin:0 auto"></div>
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
        state.view === 'around' ? loadAroundMe() : loadPage(true);
      };
    });
    document.getElementById('wlViewToggle').onclick = () => {
      state.view = state.view === 'top' ? 'around' : 'top';
      renderShell();
      state.view === 'around' ? loadAroundMe() : loadPage(true);
    };
    document.getElementById('wlLoadMore').onclick = () => loadPage(false);
  }

  function myRowVisible() { return state.rows.some((r) => r.mine); }

  // Bandeau "Ta position" (mode "top" uniquement -- en mode "autour de moi" ma ligne est déjà
  // dans la liste principale, ce bandeau redondant disparaît de lui-même) : affiché uniquement
  // quand ma ligne n'est PAS dans les pages déjà chargées, avec un raccourci direct vers le mode
  // "autour de moi" pour s'y rendre en un clic.
  async function refreshMyRankStrip() {
    const wrap = document.getElementById('wlMyRankWrap');
    if (!wrap) return; // écran quitté entre-temps
    if (state.view !== 'top' || myRowVisible()) { wrap.innerHTML = ''; return; }
    const result = await config.fetchMyRank(state.orderBy);
    if (!document.getElementById('wlMyRankWrap')) return;
    wrap.innerHTML = (result && result.row)
      ? `<div class="world-lb-mine-label">${t('worldLb.yourRank')}</div>${rowHTML(result.row, result.rank - 1)}
         <div style="text-align:center;margin-top:8px"><button class="btn ghost sm" id="wlJumpAround">${t('worldLb.aroundMe')}</button></div>`
      : '';
    const jumpBtn = document.getElementById('wlJumpAround');
    if (jumpBtn) jumpBtn.onclick = () => { state.view = 'around'; renderShell(); loadAroundMe(); };
  }

  // ---- Mode "top" : classement depuis le rang 1, accumulé page par page ----
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

  // ---- Mode "autour de moi" : fenêtre fixe centrée sur mon rang (voir AROUND_CONTEXT) ----
  async function loadAroundMe() {
    const statusEl = document.getElementById('wlStatus');
    const rowsEl = document.getElementById('wlRows');
    const loadMoreBtn = document.getElementById('wlLoadMore');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none'; // fenêtre fixe, pas de "charger plus" ici
    statusEl.textContent = '';
    rowsEl.innerHTML = '';
    const result = await config.fetchMyRank(state.orderBy);
    if (!document.getElementById('wlRows')) return; // écran quitté pendant l'attente réseau
    if (result === null) { statusEl.textContent = t('worldLb.unavailable'); return; }
    if (!result.row) { statusEl.textContent = t('worldLb.notRankedYet'); return; }
    const windowOffset = Math.max(0, result.rank - 1 - AROUND_CONTEXT);
    const windowLimit = AROUND_CONTEXT * 2 + 1;
    const page = await config.fetchPage(windowOffset, windowLimit, state.orderBy);
    if (!document.getElementById('wlRows')) return;
    if (page === null) { statusEl.textContent = t('worldLb.unavailable'); return; }
    state.rows = page; state.offset = windowOffset + page.length; state.hasMore = false;
    rowsEl.innerHTML = page.map((r, i) => rowHTML(r, windowOffset + i)).join('');
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
