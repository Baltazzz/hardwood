/* ============================================================
   CLASSEMENT DES DÉFIS ENTRE AMIS — backend Supabase (voir AGENDA.md, "lot backend Supabase").
   Avant ce lot, chaque appareil ne voyait que ses propres scores (ou ceux reçus manuellement par
   lien) : un défi entre amis ne se comparait qu'en s'échangeant des liens de résultat à la main.
   Ce module lit/écrit un classement PARTAGÉ via l'API REST publique de Supabase (PostgREST),
   simples appels `fetch()` -- pas de dépendance `@supabase/supabase-js` ajoutée, cohérent avec le
   reste du projet (aucune dépendance runtime jusqu'ici).

   Clé "anon" publique volontairement en dur ici (pas une variable d'environnement) : c'est la clé
   PUBLIQUE de Supabase, conçue pour être exposée côté client (protégée par les policies RLS côté
   serveur, jamais par le secret de la clé elle-même) -- l'alternative (variable d'env injectée au
   build) casserait silencieusement si le pipeline de déploiement ne la fournit pas, une régression
   bien pire qu'une clé publique visible dans le code source. Voir supabase/README.md.

   ROBUSTESSE IMPÉRATIVE (voir AGENDA.md) : AUCUNE fonction ici ne lève jamais d'exception -- une
   panne réseau, un serveur injoignable, un appareil hors ligne doivent laisser le jeu strictement
   identique à avant ce lot, jamais un écran cassé ni une erreur visible. Repli systématique sur le
   fonctionnement 100% local déjà en place (engine/challenges.js).

   SUPABASE_URL/BASE_HEADERS/fetchWithTimeout/FETCH_TIMEOUT_MS vivent désormais dans
   engine/supabaseClient.js (voir AGENDA.md AGD-59) -- partagés avec engine/worldLeaderboardApi.js
   (classements mondiaux), pour ne jamais dupliquer la clé/l'URL en dur une deuxième fois.
============================================================ */
import { SUPABASE_URL, BASE_HEADERS, fetchWithTimeout, FETCH_TIMEOUT_MS } from './supabaseClient.js';
const REST_URL = `${SUPABASE_URL}/rest/v1/challenge_scores`;
// Exportée pour tests/leaderboard_device_check.mjs, qui doit pouvoir pré-remplir ce localStorage
// clé-par-clé afin de simuler un appareil dont le client_id persiste entre plusieurs process Node
// séparés (chaque process a son propre jsdom, donc son propre localStorage en mémoire vide).
export const CLIENT_ID_KEY = 'hardwood_client_id_v1';
const PENDING_KEY = 'hardwood_pending_scores_v1';

// Repli sans crypto.randomUUID (environnements anciens/non sécurisés -- ex. http:// pur en dev) :
// UUID v4 "assez bon" pour un simple identifiant d'appareil, jamais un secret.
function fallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function newUUID() {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  return fallbackUUID();
}

let cachedClientId = null;
// Identifiant d'appareil stable et persistant (jamais un compte réel, voir supabase/README.md) --
// généré une seule fois, réutilisé pour toujours identifier "ma propre ligne" dans un classement
// partagé (voir renderMine() dans ui/challenge.js) et pour que le serveur puisse garder le
// MEILLEUR score par appareil plutôt que d'empiler une ligne par tentative (unique (challenge_id,
// client_id) côté SQL).
export function getClientId() {
  if (cachedClientId) return cachedClientId;
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) { id = newUUID(); localStorage.setItem(CLIENT_ID_KEY, id); }
    cachedClientId = id;
  } catch (e) { cachedClientId = newUUID(); } // stockage indisponible : identifiant valable pour la session en cours seulement
  return cachedClientId;
}

function loadPending() {
  try { const r = localStorage.getItem(PENDING_KEY); const arr = r ? JSON.parse(r) : []; return Array.isArray(arr) ? arr : []; }
  catch (e) { return []; }
}
function savePending(list) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(list)); } catch (e) {} }

function toRow(challengeId, result) {
  return {
    challenge_id: challengeId,
    client_id: getClientId(),
    player_name: String(result.name || '').slice(0, 40) || 'Joueur',
    score: Math.max(0, Math.round(result.score || 0)),
    tier: result.tier || null,
    seasons: result.seasons != null ? Math.round(result.seasons) : null,
    hof: !!result.hof,
    summary: result.summary || null,
  };
}

// Envoi (upsert) d'un score vers le serveur partagé. Ne lève JAMAIS, ne bloque JAMAIS l'appelant
// au-delà de FETCH_TIMEOUT_MS -- retourne true/false, false déclenche automatiquement une mise en
// file pour un nouvel essai plus tard (voir flushPendingScores()). Toujours appelée en
// "fire-and-forget" côté écran (voir endCareer() dans ui/screens.js) : le joueur ne doit jamais
// attendre ni voir une différence selon que l'envoi réussisse ou non.
export async function submitChallengeScore(challengeId, result) {
  const row = toRow(challengeId, result);
  try {
    const res = await fetchWithTimeout(REST_URL + '?on_conflict=challenge_id,client_id', {
      method: 'POST',
      headers: { ...BASE_HEADERS, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([row]),
    }, FETCH_TIMEOUT_MS);
    if (res.ok) return true;
  } catch (e) { /* hors ligne / serveur injoignable / timeout -- traité ci-dessous, jamais remonté */ }
  const pending = loadPending();
  // Une seule entrée en attente par défi (la plus récente/la meilleure remplace, jamais une pile
  // qui grossirait à chaque tentative hors-ligne) -- même esprit que recordMyChallengeResult().
  const idx = pending.findIndex((p) => p.challengeId === challengeId);
  const entry = { challengeId, result, ts: Date.now() };
  if (idx === -1) pending.push(entry); else if (result.score >= pending[idx].result.score) pending[idx] = entry;
  savePending(pending);
  return false;
}

// Retente les envois en attente (voir main.js, appelée au chargement -- un appareil qui était
// hors ligne au moment de finir un défi rattrape l'envoi dès qu'il retrouve une connexion, sans
// aucune action du joueur). Chaque entrée réussie est retirée de la file ; les échecs y restent.
export async function flushPendingScores() {
  const pending = loadPending();
  if (!pending.length) return;
  const stillPending = [];
  for (const entry of pending) {
    const ok = await submitChallengeScore(entry.challengeId, entry.result).catch(() => false);
    if (!ok) stillPending.push(entry);
  }
  // submitChallengeScore() ré-ajoute déjà l'entrée à la file en cas d'échec -- on repart d'une
  // file propre plutôt que de risquer un doublon entre l'ancienne et la nouvelle écriture.
  savePending(stillPending);
}

// Lit le classement PARTAGÉ d'un défi. Retourne un tableau (éventuellement vide) en cas de succès,
// `null` si le serveur est injoignable/indisponible -- `null` est le signal explicite pour
// l'appelant (voir renderChallengeLeaderboard() dans ui/challenge.js) de retomber sur le
// classement local et d'afficher un message clair plutôt qu'une erreur.
export async function fetchChallengeScores(challengeId) {
  try {
    const url = `${REST_URL}?challenge_id=eq.${encodeURIComponent(challengeId)}&order=score.desc&select=player_name,score,tier,seasons,hof,summary,client_id`;
    const res = await fetchWithTimeout(url, { headers: BASE_HEADERS }, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    const myId = getClientId();
    return rows.map((r) => ({
      name: r.player_name, score: r.score, tier: r.tier, seasons: r.seasons, hof: !!r.hof,
      summary: r.summary || null, mine: r.client_id === myId,
    }));
  } catch (e) { return null; }
}
