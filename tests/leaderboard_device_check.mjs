// Simule UN appareil réel face au VRAI serveur Supabase (voir tests/audit_leaderboard_live.mjs) --
// process Node indépendant pour que chaque "appareil" ait son propre client_id persistant, exactement
// comme deux téléphones différents n'ayant jamais partagé leur stockage local.
// Usage :
//   node leaderboard_device_check.mjs probe
//   node leaderboard_device_check.mjs submit <challengeId> <name> <score>
//   node leaderboard_device_check.mjs fetch <challengeId>
import { setupEnvironment } from './env.mjs';

setupEnvironment();
localStorage.setItem('hw_welcome_seen', '1');

const mode = process.argv[2];

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

  if (mode === 'submit') {
    const [, , , challengeId, name, score] = process.argv;
    const ok = await api.submitChallengeScore(challengeId, { name, score: Number(score), tier: 'All-Star', seasons: 12, hof: false });
    console.log('RESULT:' + JSON.stringify({ ok, clientId: api.getClientId() }));
    return;
  }

  if (mode === 'fetch') {
    const [, , , challengeId] = process.argv;
    const rows = await api.fetchChallengeScores(challengeId);
    console.log('RESULT:' + JSON.stringify({ rows, clientId: api.getClientId() }));
    return;
  }

  throw new Error('mode inconnu: ' + mode);
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
