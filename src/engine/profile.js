/* ============================================================
   PROFIL DE JOUEUR — identité persistante à travers toutes les carrières (voir AGENDA.md AGD-58),
   distincte du nom du PERSONNAGE (p.name, propre à chaque carrière) : ce pseudo de compte est ce
   qui identifie un même joueur d'une partie à l'autre, notamment au classement d'un défi entre
   amis (voir engine/challenges.js recordMyChallengeResult()/engine/leaderboardApi.js) une fois
   que le profil de départ d'un défi impose le MÊME nom de personnage à tous les participants --
   seul CE pseudo les distingue encore.

   Même stockage robuste que badges.js/wallet.js/cosmetics.js : localStorage quand disponible,
   repli mémoire sinon, jamais d'erreur levée.

   AUCUN écran bloquant au premier lancement (décision explicite, voir AGENDA.md) : un pseudo
   suggéré est auto-généré et persisté SILENCIEUSEMENT dès le tout premier accès -- un nouveau
   joueur arrivant via un lien de défi partagé doit pouvoir démarrer une carrière immédiatement,
   sans étape intermédiaire. La personnalisation reste possible n'importe quand ensuite, depuis les
   réglages (ui/settings.js), la tuile de profil (ui/profile.js), ou l'écran de défi entre amis
   (ui/challenge.js) -- jamais imposée, toujours proposée au moment où elle prend du sens.
============================================================ */
import { ri } from './utils.js';

const PROFILE_KEY = 'hardwood_profile_v1';
const NICKNAME_MAXLEN = 22; // même plafond que le champ nom de personnage (voir ui/screens.js #pname)
let mem = null;

function suggestNickname() { return 'Joueur' + ri(1000, 9999); }

function load() {
  if (mem !== null) return mem;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    mem = raw ? JSON.parse(raw) : null;
  } catch (e) { mem = null; }
  if (!mem || typeof mem !== 'object') mem = { nickname: null, createdAt: Date.now() };
  // Auto-provisionnement silencieux : un pseudo existe TOUJOURS dès ce premier accès, jamais un
  // état "profil manquant" qui obligerait un appelant à gérer un écran de configuration.
  if (!mem.nickname) { mem.nickname = suggestNickname(); save(); }
  return mem;
}
function save() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(mem)); } catch (e) { /* repli mémoire déjà en place */ } }

export function getProfile() { return load(); }
export function hasProfile() { return !!load().nickname; }
export function profileNickname() { return load().nickname; }

// Trim + plafond, comme le nom de personnage -- retombe sur le pseudo déjà en place si la nouvelle
// valeur est vide après nettoyage (jamais de pseudo vide, l'identité de classement en dépend).
export function setNickname(nickname) {
  const clean = String(nickname || '').trim().slice(0, NICKNAME_MAXLEN);
  const state = load();
  state.nickname = clean || state.nickname || suggestNickname();
  save();
  return state.nickname;
}

export function profileReset() {
  mem = { nickname: null, createdAt: Date.now() };
  save();
}
