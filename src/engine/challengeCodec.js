/* ============================================================
   DÉFI ENTRE AMIS — encodage/décodage compact, sans dépendance externe, sans serveur : tout
   l'état d'un défi (ou d'un résultat partagé) tient dans l'URL elle-même. Deux payloads distincts :
   - "défi" (?challenge=...) : une simple GRAINE en base36 (voir AGENDA.md, lien de défi
     "extrêmement long" signalé) -- le profil complet (attributs + offres d'académie) n'est
     JAMAIS transmis : il est régénéré à l'identique côté destinataire à partir de cette seule
     graine (`generateChallengeDef(seed)`, voir engine/challenges.js/prng.js), exactement comme le
     défi du jour régénère son profil depuis une date. Un lien passe ainsi de plusieurs centaines
     de caractères (JSON complet encodé) à une poignée de caractères.
   - "résultat" (?result=...) : un score déjà obtenu par un participant, ouvert pour l'AJOUTER au
     classement local d'un défi déjà connu ou non (voir engine/challenges.js addResult()). Encodé
     en tableau positionnel (pas d'objet à clés nommées) + palier réduit à son index (voir
     engine/badges.js TIER_RANK) pour rester aussi court que possible -- seul `name` (jusqu'à 22
     caractères, plafonné à la création du personnage) domine encore la longueur, incompressible
     sans perdre l'information.
   Jamais de transport réseau : uniquement des données compactées puis encodées en base64url,
   transmises de main en main par lien (messagerie, etc.).
============================================================ */
import { generateChallengeDef } from './challenges.js';
import { TIER_RANK } from './badges.js';

// btoa/atob sont limités à Latin1 -- passage par encodeURIComponent/decodeURIComponent pour rester
// correct avec des noms accentués (ex. "Bénédict"), technique standard pour un base64 Unicode-safe.
function b64urlEncode(obj) {
  const json = JSON.stringify(obj);
  const latin1 = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return btoa(latin1).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const latin1 = atob(padded);
    const json = decodeURIComponent(Array.prototype.map.call(latin1, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null; // lien corrompu/tronqué/d'une autre version -- jamais levé, l'appelant repli en douceur
  }
}

// Un défi entre amis n'encode plus QUE sa graine (base36) -- le profil complet est régénéré à
// l'identique côté destinataire (voir generateChallengeDef(seed) dans engine/challenges.js).
// Validation stricte avant de tenter la régénération : une chaîne non conforme (lien corrompu,
// tronqué, ou d'une autre version -- ex. un ancien lien JSON complet d'avant cette compaction)
// échoue proprement plutôt que de produire un profil erratique.
export function encodeChallengeDef(def) { return def.seed.toString(36); }
export function decodeChallengeDef(str) {
  if (typeof str !== 'string' || !/^[0-9a-z]{1,7}$/i.test(str)) return null;
  const seed = parseInt(str, 36);
  if (!Number.isFinite(seed) || seed < 0) return null;
  try { return generateChallengeDef(seed); } catch (e) { return null; }
}

// Tableau positionnel (pas d'objet à clés nommées) : plus court qu'un JSON à clés répétées.
// Ordre fixe -- voir decodeResult() pour la reconstruction, jamais désynchronisé puisque les deux
// vivent dans le même fichier.
function tierIndex(tier) { const i = TIER_RANK.indexOf(tier); return i >= 0 ? i : 0; }
// "mine" est purement local à l'appareil qui a joué (voir engine/challenges.js) -- jamais
// transmis : sans cette exclusion, le résultat d'un ami reçu par lien porterait "mine:true"
// depuis SON appareil, ce qui l'afficherait à tort comme "mon" résultat une fois fusionné ici.
export function encodeResult(res) {
  return b64urlEncode([res.challengeId, res.name, res.score, res.seasons, tierIndex(res.tier), res.hof ? 1 : 0, res.date]);
}
export function decodeResult(str) {
  const arr = b64urlDecode(str);
  if (!Array.isArray(arr) || arr.length < 7) return null;
  const [challengeId, name, score, seasons, tierIdx, hofFlag, date] = arr;
  if (typeof challengeId !== 'string' || typeof name !== 'string') return null;
  return { challengeId, name, score, seasons, tier: TIER_RANK[tierIdx] || TIER_RANK[0], hof: !!hofFlag, date };
}

function baseUrl() {
  return window.location.origin + window.location.pathname;
}
export function buildChallengeUrl(def) {
  const url = new window.URL(baseUrl());
  url.searchParams.set('challenge', encodeChallengeDef(def));
  return url.toString();
}
export function buildResultUrl(res) {
  const url = new window.URL(baseUrl());
  url.searchParams.set('result', encodeResult(res));
  return url.toString();
}
