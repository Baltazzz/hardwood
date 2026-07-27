/* ============================================================
   DÉFI ENTRE AMIS — encodage/décodage base64url, sans dépendance
   externe, sans serveur : tout l'état d'un défi (ou d'un résultat
   partagé) tient dans l'URL elle-même. Deux payloads distincts :
   - "défi" (?challenge=...) : le profil de départ figé, ouvert pour
     REJOINDRE/JOUER le défi (voir ui/challenge.js joinChallenge()).
   - "résultat" (?result=...) : un score déjà obtenu par un
     participant, ouvert pour l'AJOUTER au classement local d'un
     défi déjà connu ou non (voir engine/challenges.js addResult()).
   Jamais de transport réseau : uniquement du JSON compacté puis
   encodé, transmis de main en main par lien (messagerie, etc.).
============================================================ */

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

// Id court, suffisant pour éviter les collisions entre défis créés localement (pas un identifiant
// distribué -- aucun serveur pour arbitrer l'unicité globale, mais deux défis avec le même id sont
// improbables au point d'être négligeables pour un usage entre amis).
export function genChallengeId() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function encodeChallengeDef(def) { return b64urlEncode(def); }
export function decodeChallengeDef(str) { return b64urlDecode(str); }
// "mine" est purement local à l'appareil qui a joué (voir engine/challenges.js) -- jamais
// transmis : sans cette exclusion, le résultat d'un ami reçu par lien porterait "mine:true"
// depuis SON appareil, ce qui l'afficherait à tort comme "mon" résultat une fois fusionné ici.
export function encodeResult(res) { const { mine, ...rest } = res; return b64urlEncode(rest); }
export function decodeResult(str) { return b64urlDecode(str); }

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
