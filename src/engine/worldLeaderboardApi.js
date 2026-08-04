/* ============================================================
   CLASSEMENTS MONDIAUX — défi du jour + meilleures carrières (voir AGENDA.md AGD-59), backend
   Supabase partagé avec engine/leaderboardApi.js (mêmes primitives, voir engine/supabaseClient.js)
   mais une identité DIFFÉRENTE : ici c'est le PSEUDO DE PROFIL (engine/profile.js) qui identifie
   un joueur, pas l'appareil (`client_id`) -- ces deux classements sont MONDIAUX (tous les joueurs
   du jeu), indépendants de tout défi précis entre amis.

   RÉCONCILIATION DE RENOMMAGE (voir AGENDA.md, décision actée avec l'utilisateur) : un pseudo est
   modifiable à tout moment (réglages/tuile de profil/écran de défi) -- upserter naïvement par
   pseudo après un renommage créerait une ligne fantôme (perdant la progression sous l'ancien
   pseudo) ou entrerait en collision avec un homonyme sous le nouveau pseudo. Chaque ligne porte
   donc aussi `client_id` (même UUID d'appareil que challenge_scores, PAS une clé unique, un simple
   indice de réconciliation) : avant tout upsert par pseudo, ce module vérifie si CET appareil a
   déjà une ligne sous un AUTRE pseudo et, si oui, met à jour CETTE MÊME ligne (par client_id) au
   lieu d'upserter par pseudo -- un joueur qui se renomme ne perd donc jamais sa ligne. Coût : un
   aller-retour réseau de vérification en plus par soumission, invisible (fire-and-forget).

   ROBUSTESSE IMPÉRATIVE (identique à engine/leaderboardApi.js) : AUCUNE fonction ici ne lève
   jamais d'exception -- panne réseau/serveur injoignable/hors ligne laissent le jeu strictement
   utilisable, jamais un écran cassé. Repli sur `null`/`false` explicite, jamais remonté.
============================================================ */
import { SUPABASE_URL, BASE_HEADERS, fetchWithTimeout, FETCH_TIMEOUT_MS } from './supabaseClient.js';
import { getClientId } from './leaderboardApi.js';
import { profileNickname } from './profile.js';

const CAREER_REST_URL = `${SUPABASE_URL}/rest/v1/career_world_scores`;
const DAILY_REST_URL = `${SUPABASE_URL}/rest/v1/daily_world_scores`;
const CAREER_PENDING_KEY = 'hardwood_pending_career_world_v1';
const DAILY_PENDING_KEY = 'hardwood_pending_daily_world_v1';

function loadPending(key) {
  try { const r = localStorage.getItem(key); const arr = r ? JSON.parse(r) : []; return Array.isArray(arr) ? arr : []; }
  catch (e) { return []; }
}
function savePending(key, list) { try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) {} }

function baseRow(result) {
  return {
    nickname: profileNickname(),
    client_id: getClientId(),
    score: Math.max(0, Math.round(result.score || 0)),
    tier: result.tier || null,
    seasons: result.seasons != null ? Math.round(result.seasons) : null,
    hof: !!result.hof,
    summary: result.summary || null,
  };
}

// Convertit une ligne serveur (colonne `nickname`) vers la même forme que
// engine/leaderboardApi.js fetchChallengeScores() (`name`/`mine`) -- même contrat d'affichage
// pour ui/worldLeaderboard.js, quelle que soit la source du classement.
function rowToResult(r) {
  return {
    name: r.nickname, score: r.score, tier: r.tier, seasons: r.seasons, hof: !!r.hof,
    summary: r.summary || null, mine: r.nickname === profileNickname(),
  };
}

// Implémente le flux hybride pseudo+appareil décrit en en-tête. `filterQS` (vide, ou
// `date=eq.<jour>&`) scope la vérification/l'upsert au bon jour pour le classement quotidien --
// un appareil peut y avoir une ligne par jour, contrairement au classement de carrières où
// `client_id` n'apparaît jamais que sur une seule ligne au total.
async function submitWorldRow(restUrl, onConflictCols, filterQS, row) {
  try {
    const mineUrl = `${restUrl}?${filterQS}client_id=eq.${row.client_id}&select=nickname`;
    const mineRes = await fetchWithTimeout(mineUrl, { headers: BASE_HEADERS }, FETCH_TIMEOUT_MS);
    if (!mineRes.ok) return false;
    const mineRows = await mineRes.json();
    const renamed = Array.isArray(mineRows) && mineRows.length > 0 && mineRows[0].nickname !== row.nickname;
    if (renamed) {
      // Renommage détecté depuis la dernière soumission de CET appareil : met à jour SA MÊME
      // ligne (filtrée par client_id), jamais un nouvel upsert par pseudo qui la laisserait
      // orpheline ou entrerait en collision avec un homonyme sous ce nouveau pseudo.
      const patchRes = await fetchWithTimeout(`${restUrl}?${filterQS}client_id=eq.${row.client_id}`, {
        method: 'PATCH',
        headers: { ...BASE_HEADERS, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row),
      }, FETCH_TIMEOUT_MS);
      return patchRes.ok;
    }
    const res = await fetchWithTimeout(`${restUrl}?on_conflict=${onConflictCols}`, {
      method: 'POST',
      headers: { ...BASE_HEADERS, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([row]),
    }, FETCH_TIMEOUT_MS);
    return res.ok;
  } catch (e) { return false; } // hors ligne / serveur injoignable / timeout -- traité par l'appelant (file d'attente)
}

// Soumission (voir endCareer() dans ui/screens.js, fire-and-forget comme submitChallengeScore()) :
// toute carrière terminée concourt pour LE MEILLEUR score mondial de ce pseudo, jamais empilée.
export async function submitCareerWorldScore(result) {
  const row = baseRow(result);
  const ok = await submitWorldRow(CAREER_REST_URL, 'nickname', '', row);
  if (!ok) {
    const pending = loadPending(CAREER_PENDING_KEY);
    const entry = { result, ts: Date.now() };
    // Un seul emplacement en attente (pas un par tentative) -- ne garde que la meilleure.
    if (!pending.length || result.score >= pending[0].result.score) savePending(CAREER_PENDING_KEY, [entry]);
  }
  return ok;
}

// Soumission quotidienne (voir recordDailyResult() dans engine/dailyChallenge.js, même esprit).
export async function submitDailyWorldScore(dateStr, result) {
  const row = { date: dateStr, ...baseRow(result) };
  const ok = await submitWorldRow(DAILY_REST_URL, 'date,nickname', `date=eq.${encodeURIComponent(dateStr)}&`, row);
  if (!ok) {
    const pending = loadPending(DAILY_PENDING_KEY);
    const idx = pending.findIndex((p) => p.date === dateStr);
    const entry = { date: dateStr, result, ts: Date.now() };
    if (idx === -1) pending.push(entry); else if (result.score >= pending[idx].result.score) pending[idx] = entry;
    savePending(DAILY_PENDING_KEY, pending);
  }
  return ok;
}

// Retente les envois en attente (voir main.js, appelée au chargement -- même principe que
// flushPendingScores() dans engine/leaderboardApi.js).
export async function flushPendingWorldScores() {
  const career = loadPending(CAREER_PENDING_KEY);
  if (career.length) {
    const ok = await submitCareerWorldScore(career[0].result).catch(() => false);
    // submitCareerWorldScore() ré-ajoute déjà l'entrée en cas d'échec -- repart d'une file propre
    // plutôt que de risquer un doublon entre l'ancienne et la nouvelle écriture.
    if (ok) savePending(CAREER_PENDING_KEY, []);
  }
  const daily = loadPending(DAILY_PENDING_KEY);
  if (daily.length) {
    const stillPending = [];
    for (const entry of daily) {
      const ok = await submitDailyWorldScore(entry.date, entry.result).catch(() => false);
      if (!ok) stillPending.push(entry);
    }
    savePending(DAILY_PENDING_KEY, stillPending);
  }
}

// Page paginée triée (voir ui/worldLeaderboard.js) -- retourne un tableau (éventuellement vide) en
// cas de succès, `null` si le serveur est injoignable (même contrat que fetchChallengeScores()).
// `id.asc` en tie-break systématique : sans lui, des scores à égalité (fréquents, score entier
// 0-600) n'auraient pas d'ordre stable d'une page "Charger plus" à l'autre.
async function fetchPage(restUrl, filterQS, { offset = 0, limit = 20, orderBy = 'score' } = {}) {
  try {
    const orderCol = orderBy === 'seasons' ? 'seasons' : 'score';
    const url = `${restUrl}?${filterQS}order=${orderCol}.desc,id.asc&select=nickname,score,tier,seasons,hof,summary&offset=${offset}&limit=${limit}`;
    const res = await fetchWithTimeout(url, { headers: BASE_HEADERS }, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows.map(rowToResult);
  } catch (e) { return null; }
}
export async function fetchCareerWorldPage(opts) { return fetchPage(CAREER_REST_URL, '', opts); }
export async function fetchDailyWorldPage({ date, ...rest } = {}) {
  return fetchPage(DAILY_REST_URL, `date=eq.${encodeURIComponent(date)}&`, rest);
}

// Rang APPROXIMATIF de ma propre ligne (voir ui/worldLeaderboard.js, "mise en évidence de sa
// propre ligne où qu'elle soit") : "combien de joueurs ont fait strictement mieux que moi" + 1,
// via le "count trick" PostgREST (Prefer: count=exact + Range: 0-0, total lu dans Content-Range)
// -- évite de charger tout le classement pour savoir où je me situe. Approximatif en cas d'égalité
// de score (accepté, même tolérance que d'autres valeurs dérivées de ce jeu -- ex. l'index
// d'académie imposée du défi du jour, dérivé par modulo). Recalculé selon l'axe de tri actif
// (`orderBy`) -- jamais figé sur le score si le joueur trie par saisons.
//
// Contrat de retour à TROIS états, distingués volontairement (voir ui/worldLeaderboard.js "autour
// de moi", qui a besoin d'un message différent selon le cas) :
//   - `null`                      -> serveur injoignable/hors ligne (même convention que le reste
//                                     de ce module -- jamais confondu avec "pas encore classé").
//   - `{ row: null, rank: null }` -> serveur joignable, mais ce joueur n'a encore aucune ligne ici.
//   - `{ row, rank }`             -> trouvé, rang 1-based.
async function fetchMyRank(restUrl, filterQS, orderBy) {
  try {
    const nickname = profileNickname();
    const mineUrl = `${restUrl}?${filterQS}nickname=eq.${encodeURIComponent(nickname)}&select=nickname,score,tier,seasons,hof,summary`;
    const mineRes = await fetchWithTimeout(mineUrl, { headers: BASE_HEADERS }, FETCH_TIMEOUT_MS);
    if (!mineRes.ok) return null;
    const mineRows = await mineRes.json();
    if (!Array.isArray(mineRows)) return null;
    if (!mineRows.length) return { row: null, rank: null };
    const myRow = mineRows[0];
    const col = orderBy === 'seasons' ? 'seasons' : 'score';
    const myValue = myRow[col];
    if (myValue == null) return null;
    const countUrl = `${restUrl}?${filterQS}select=id&${col}=gt.${myValue}`;
    const countRes = await fetchWithTimeout(countUrl, { headers: { ...BASE_HEADERS, Prefer: 'count=exact', Range: '0-0' } }, FETCH_TIMEOUT_MS);
    if (!countRes.ok) return null;
    const range = countRes.headers.get('content-range'); // ex. "0-0/123" ou "*/0"
    const total = range ? parseInt(range.split('/')[1], 10) : NaN;
    if (!Number.isFinite(total)) return null;
    return { row: rowToResult(myRow), rank: total + 1 };
  } catch (e) { return null; }
}
export async function fetchMyCareerWorldRank(orderBy = 'score') { return fetchMyRank(CAREER_REST_URL, '', orderBy); }
export async function fetchMyDailyWorldRank(dateStr, orderBy = 'score') {
  return fetchMyRank(DAILY_REST_URL, `date=eq.${encodeURIComponent(dateStr)}&`, orderBy);
}
