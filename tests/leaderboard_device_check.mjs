// Simule UN appareil réel face au VRAI serveur Supabase (voir tests/audit_leaderboard_live.mjs) --
// process Node indépendant pour que chaque "appareil" ait son propre client_id persistant, exactement
// comme deux téléphones différents n'ayant jamais partagé leur stockage local.
//
// Un process Node = un jsdom = un localStorage EN MÉMOIRE VIDE à chaque lancement -- rien ne le
// distingue naturellement d'un autre process. Pour qu'un même "appareil" (ex. "A") garde le MÊME
// client_id à travers plusieurs appels successifs de ce script (ex. soumission, puis re-soumission),
// on doit persister ce client_id nous-mêmes sur disque, dans HARDWOOD_DEVICE_STATE_DIR (fourni par
// audit_leaderboard_live.mjs, un répertoire temporaire propre à cette exécution de l'audit).
// Usage :
//   node leaderboard_device_check.mjs probe
//   node leaderboard_device_check.mjs submit <deviceId> <challengeId> <name> <score>
//   node leaderboard_device_check.mjs fetch <deviceId> <challengeId>
import fs from 'node:fs';
import path from 'node:path';
import { setupEnvironment } from './env.mjs';

setupEnvironment({ allowNetwork: true }); // parle au VRAI serveur Supabase, voir tests/env.mjs
localStorage.setItem('hw_welcome_seen', '1');

const mode = process.argv[2];
const deviceId = process.argv[3];
const stateDir = process.env.HARDWOOD_DEVICE_STATE_DIR;
const statePath = stateDir && deviceId ? path.join(stateDir, `device-${deviceId}.json`) : null;

async function main() {
  if (mode === 'probe') {
    // Sonde DIRECTE (pas via fetchChallengeScores(), qui traiterait "table absente" et "hors
    // ligne" de façon identique -- ici on veut spécifiquement distinguer les deux) : la même
    // requête que fetchChallengeScores() ferait, mais on inspecte la réponse brute.
    const url = 'https://mqrotkqlqpxtqquxmcxi.supabase.co/rest/v1/challenge_scores?select=id&limit=1';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcm90a3FscXB4dHFxdXhtY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTg5NDMsImV4cCI6MjEwMTMzNDk0M30.BnOumRNtNDwS4mOelHwZC-YHbhEsBgwRHRv6Ymb9toQ';
    try {
      const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      console.log('RESULT:' + JSON.stringify({ tableExists: res.status !== 404, status: res.status }));
    } catch (e) {
      console.log('RESULT:' + JSON.stringify({ tableExists: false, status: null, error: String(e) }));
    }
    return;
  }

  const api = await import('../src/engine/leaderboardApi.js');

  // Réinjecte le client_id de cet appareil s'il a déjà été vu lors d'un appel précédent de
  // l'audit (voir en-tête) -- doit se faire avant tout appel à getClientId()/submit/fetch,
  // qui sinon en génèrerait un nouveau faute de le trouver dans ce localStorage vierge.
  if (statePath && fs.existsSync(statePath)) {
    const saved = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    localStorage.setItem(api.CLIENT_ID_KEY, saved.clientId);
  }

  if (mode === 'submit') {
    const [, , , , challengeId, name, score] = process.argv;
    const ok = await api.submitChallengeScore(challengeId, { name, score: Number(score), tier: 'All-Star', seasons: 12, hof: false });
    if (statePath) fs.writeFileSync(statePath, JSON.stringify({ clientId: api.getClientId() }));
    console.log('RESULT:' + JSON.stringify({ ok, clientId: api.getClientId() }));
    return;
  }

  if (mode === 'fetch') {
    const [, , , , challengeId] = process.argv;
    const rows = await api.fetchChallengeScores(challengeId);
    if (statePath) fs.writeFileSync(statePath, JSON.stringify({ clientId: api.getClientId() }));
    console.log('RESULT:' + JSON.stringify({ rows, clientId: api.getClientId() }));
    return;
  }

  throw new Error('mode inconnu: ' + mode);
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
