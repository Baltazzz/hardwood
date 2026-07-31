#!/usr/bin/env node
// Garde-fou de non-régression dédié à la compaction du lien de défi entre amis (voir AGENDA.md,
// "lien de partage trop long") et à l'expansion des traits (voir AGENDA.md, "développer les
// traits"). Vérifie directement :
//   1. Le lien de défi encode SEULEMENT une graine compacte (pas le profil complet), et reste
//      court même dans un cas défavorable.
//   2. Deux décodages indépendants de la même graine produisent EXACTEMENT le même profil
//      (nation/poste/style/attributs/potentiel/hype/offres d'académie) -- la garantie centrale du
//      défi entre amis ("même profil pour tout le monde") doit survivre à la compaction.
//   3. Un lien corrompu/tronqué échoue proprement (jamais d'exception).
//   4. Le lien de résultat reste décodable fidèlement (score/tier/hof/saisons/nom).
//   5. Les 17 traits sont bien enregistrés, avec des ids uniques, et chacun a un flag nourri par
//      au moins un événement réel du jeu (aucun trait "mort", jamais nourrissable).
import { setupEnvironment } from './env.mjs';

let failures = 0;
function check(label, cond) {
  if (cond) console.log(`✓ ${label}`);
  else { console.log(`✗ ${label}`); failures++; }
}

async function main() {
  setupEnvironment();
  localStorage.setItem('hw_welcome_seen', '1');
  global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
  global.atob = (s) => Buffer.from(s, 'base64').toString('binary');

  const { generateChallengeDef } = await import('../src/engine/challenges.js');
  const { encodeChallengeDef, decodeChallengeDef, encodeResult, decodeResult, buildChallengeUrl } = await import('../src/engine/challengeCodec.js');

  const def = generateChallengeDef();
  const url = buildChallengeUrl(def);
  check(`lien de défi court (${url.length} caractères, seuil 100)`, url.length < 100);

  const seed = def.seed;
  const a = decodeChallengeDef(seed.toString(36));
  const b = decodeChallengeDef(seed.toString(36));
  check('deux décodages de la même graine -> profil identique', JSON.stringify(a) === JSON.stringify(b));
  check('profil décodé a des offres d\'académie', Array.isArray(a.academyOffers) && a.academyOffers.length > 0);

  check('lien corrompu -> null, jamais d\'exception', decodeChallengeDef('!!!') === null);
  check('lien vide -> null', decodeChallengeDef('') === null);
  check('lien non-string -> null', decodeChallengeDef(undefined) === null);

  const res = { challengeId: def.id, name: 'Test Nom', score: 199, tier: 'Superstar', seasons: 9, hof: false, date: 123456789, mine: true };
  const decodedRes = decodeResult(encodeResult(res));
  check('lien de résultat décodé fidèlement', decodedRes.challengeId === res.challengeId && decodedRes.name === res.name
    && decodedRes.score === res.score && decodedRes.tier === res.tier && decodedRes.seasons === res.seasons
    && decodedRes.hof === res.hof && decodedRes.date === res.date && !('mine' in decodedRes));

  // ---- Traits (voir engine/tags.js) ----
  const { TAG_DEFS } = await import('../src/engine/tags.js');
  check(`17 traits enregistrés (trouvé ${TAG_DEFS.length})`, TAG_DEFS.length === 17);
  const ids = TAG_DEFS.map(t => t.id);
  check('ids de traits tous uniques', new Set(ids).size === ids.length);
  check('chaque trait a un couple avantage/inconvénient non vide', TAG_DEFS.every(t => t.pro && t.con));

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const eventsDir = path.join(__dirname, '..', 'src', 'data', 'events');
  const allEventsSrc = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(eventsDir, f), 'utf8')).join('\n');
  const unfed = TAG_DEFS.filter(t => !allEventsSrc.includes(`'${t.flag}'`) && !allEventsSrc.includes(`"${t.flag}"`));
  check(`chaque flag de trait est nourri par au moins un événement (${unfed.length} orphelin(s))`, unfed.length === 0);
  if (unfed.length) console.log('  traits orphelins:', unfed.map(t => t.id + '/' + t.flag));

  console.log(failures ? `\n${failures} vérification(s) en échec.` : '\nToutes les vérifications passent.');
  process.exitCode = failures ? 1 : 0;
}
main().catch(e => { console.error('ERREUR:', e); process.exit(1); });
