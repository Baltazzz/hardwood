/* ============================================================
   CONSENTEMENT DE MESURE D'AUDIENCE — même stockage robuste que le
   Panthéon/les badges (localStorage, repli mémoire si indisponible,
   jamais d'erreur levée). Trois états : null (jamais demandé),
   'accepted', 'refused'. Ne charge/déclenche RIEN par lui-même --
   ce module ne fait QUE mémoriser le choix ; voir engine/analytics.js
   pour ce que ce choix déclenche réellement.
============================================================ */
const CONSENT_KEY = 'hardwood_consent_v1';
let mem = null;

export function getConsent() {
  if (mem !== null) return mem;
  try { mem = localStorage.getItem(CONSENT_KEY); } catch (e) { mem = null; }
  return mem;
}
export function setConsent(value) {
  mem = value;
  try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* repli mémoire pour la session en cours */ }
}
export function clearConsent() {
  mem = null;
  try { localStorage.removeItem(CONSENT_KEY); } catch (e) {}
}
