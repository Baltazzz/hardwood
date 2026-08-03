// Simule UN appareil réel face au VRAI serveur Supabase (voir tests/audit_world_leaderboard_live.mjs)
// -- process Node indépendant, même raison que leaderboard_device_check.mjs (AGD-57). Identité
// PSEUDO (pas appareil, voir AGENDA.md AGD-59) : le pseudo se passe en simple argument CLI, aucune
// persistance nécessaire pour lui d'un appel à l'autre. Seul `client_id` a encore besoin de
// persister entre deux appels représentant explicitement le MÊME appareil -- uniquement pour
// vérifier le scénario de RÉCONCILIATION DE RENOMMAGE (un appareil qui se soumet deux fois sous
// deux pseudos différents doit mettre à jour SA MÊME ligne, jamais en créer une seconde) : quand un
// `deviceId` est fourni, ce script réinjecte le client_id précédemment vu pour ce deviceId (même
// mécanisme que leaderboard_device_check.mjs, via HARDWOOD_DEVICE_STATE_DIR).
// Usage :
//   node world_leaderboard_device_check.mjs probe
//   node world_leaderboard_device_check.mjs career-submit <deviceId> <nickname> <score>
//   node world_leaderboard_device_check.mjs career-fetch <nickname>
//   node world_leaderboard_device_check.mjs career-rank <nickname>
//   node world_leaderboard_device_check.mjs daily-submit <deviceId> <date> <nickname> <score>
//   node world_leaderboard_device_check.mjs daily-fetch <date> <nickname>
import fs from 'node:fs';
import path from 'node:path';
import { setupEnvironment } from './env.mjs';

setupEnvironment();
localStorage.setItem('hw_welcome_seen', '1');

const mode = process.argv[2];
const stateDir = process.env.HARDWOOD_DEVICE_STATE_DIR;

function statePathFor(deviceId) { return stateDir && deviceId ? path.join(stateDir, `device-${deviceId}.json`) : null; }

async function main() {
  if (mode === 'probe') {
    // Sonde DIRECTE des deux tables (pas via fetch*WorldPage(), qui traiterait "table absente" et
    // "hors ligne" de façon identique -- ici on veut distinguer les deux, même raison que le probe
    // de leaderboard_device_check.mjs).
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcm90a3FscXB4dHFxdXhtY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTg5NDMsImV4cCI6MjEwMTMzNDk0M30.BnOumRNtNDwS4mOelHwZC-YHbhEsBgwRHRv6Ymb9toQ';
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    async function probeOne(table) {
      try {
        const res = await fetch(`https://mqrotkqlqpxtqquxmcxi.supabase.co/rest/v1/${table}?select=id&limit=1`, { headers });
        return res.status !== 404;
      } catch (e) { return false; }
    }
    const careerExists = await probeOne('career_world_scores');
    const dailyExists = await probeOne('daily_world_scores');
    console.log('RESULT:' + JSON.stringify({ tableExists: careerExists && dailyExists, careerExists, dailyExists }));
    return;
  }

  const api = await import('../src/engine/worldLeaderboardApi.js');
  const profile = await import('../src/engine/profile.js');
  const lbApi = await import('../src/engine/leaderboardApi.js');

  if (mode === 'career-submit' || mode === 'daily-submit') {
    const isDaily = mode === 'daily-submit';
    const [, , , deviceId, dateOrNickname, nicknameOrScore, maybeScore] = process.argv;
    const dateStr = isDaily ? dateOrNickname : null;
    const nickname = isDaily ? nicknameOrScore : dateOrNickname;
    const score = Number(isDaily ? maybeScore : nicknameOrScore);

    // Réinjecte le client_id de cet appareil s'il a déjà été vu (voir en-tête) -- AVANT tout appel
    // qui utiliserait getClientId(), qui sinon en génèrerait un nouveau faute de le trouver dans ce
    // localStorage vierge.
    const statePath = statePathFor(deviceId);
    if (statePath && fs.existsSync(statePath)) {
      const saved = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      localStorage.setItem(lbApi.CLIENT_ID_KEY, saved.clientId);
    }
    profile.setNickname(nickname);
    const result = { score, tier: 'All-Star', seasons: 12, hof: false };
    const ok = isDaily ? await api.submitDailyWorldScore(dateStr, result) : await api.submitCareerWorldScore(result);
    if (statePath) fs.writeFileSync(statePath, JSON.stringify({ clientId: lbApi.getClientId() }));
    console.log('RESULT:' + JSON.stringify({ ok, nickname, clientId: lbApi.getClientId() }));
    return;
  }

  if (mode === 'career-fetch' || mode === 'daily-fetch') {
    const isDaily = mode === 'daily-fetch';
    const [, , , dateOrNickname, maybeNickname] = process.argv;
    const dateStr = isDaily ? dateOrNickname : null;
    const nickname = isDaily ? maybeNickname : dateOrNickname;
    profile.setNickname(nickname); // pour que `mine` reflète bien le point de vue de CE pseudo
    const rows = isDaily
      ? await api.fetchDailyWorldPage({ date: dateStr, offset: 0, limit: 50, orderBy: 'score' })
      : await api.fetchCareerWorldPage({ offset: 0, limit: 50, orderBy: 'score' });
    console.log('RESULT:' + JSON.stringify({ rows, nickname }));
    return;
  }

  if (mode === 'career-rank' || mode === 'daily-rank') {
    const isDaily = mode === 'daily-rank';
    const [, , , dateOrNickname, maybeNickname] = process.argv;
    const dateStr = isDaily ? dateOrNickname : null;
    const nickname = isDaily ? maybeNickname : dateOrNickname;
    profile.setNickname(nickname);
    const result = isDaily ? await api.fetchMyDailyWorldRank(dateStr, 'score') : await api.fetchMyCareerWorldRank('score');
    console.log('RESULT:' + JSON.stringify({ result, nickname }));
    return;
  }

  throw new Error('mode inconnu: ' + mode);
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
