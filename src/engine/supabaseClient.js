/* ============================================================
   PRIMITIVES SUPABASE PARTAGÉES — extrait d'engine/leaderboardApi.js (voir AGENDA.md AGD-59) pour
   être réutilisé tel quel par engine/worldLeaderboardApi.js (classements mondiaux), sans dupliquer
   une seconde fois la clé/l'URL en dur ni le petit utilitaire de timeout. Aucun changement de
   comportement pour le classement de défi entre amis (toujours vérifié par
   tests/audit_leaderboard_offline.mjs/audit_leaderboard_live.mjs).

   Clé "anon" publique volontairement en dur ici (pas une variable d'environnement) : c'est la clé
   PUBLIQUE de Supabase, conçue pour être exposée côté client (protégée par les policies RLS côté
   serveur, jamais par le secret de la clé elle-même) -- voir supabase/README.md.
============================================================ */
export const SUPABASE_URL = 'https://mqrotkqlqpxtqquxmcxi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcm90a3FscXB4dHFxdXhtY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTg5NDMsImV4cCI6MjEwMTMzNDk0M30.BnOumRNtNDwS4mOelHwZC-YHbhEsBgwRHRv6Ymb9toQ';
export const FETCH_TIMEOUT_MS = 6000;
export const BASE_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

// ROBUSTESSE IMPÉRATIVE (voir AGENDA.md) : jamais d'exception qui remonterait -- une panne
// réseau/un serveur injoignable doit se traduire par un rejet d'AbortController normal, géré par
// l'appelant (try/catch), jamais un jeu cassé.
export async function fetchWithTimeout(url, opts, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...opts, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
