/* ============================================================
   CAGNOTTE — monnaie persistante de la boutique cosmétique (voir AGENDA.md AGD-41/AGD-47), qui
   cumule DIRECTEMENT la trésorerie gagnée en carrière (même unité que p.money -- k€, voir
   engine/utils.js money()) À TRAVERS TOUTES LES CARRIÈRES, plus des primes de titres modérées.
   Même stockage robuste que hof.js/badges.js : localStorage quand disponible, repli mémoire
   sinon -- jamais d'erreur si le stockage est indisponible/plein/bloqué.

   Volontairement DÉCONNECTÉE de p (le joueur) une fois la carrière terminée : cette monnaie ne
   sert qu'à acheter des cosmétiques (engine/cosmetics.js), jamais relue par la simulation d'une
   carrière -- aucun risque d'affecter le gameplay, l'équilibrage, ou un score de classement/défi
   (voir engine/challenges.js/dailyChallenge.js, qui n'importent jamais ce module).

   AGD-47 (voir AGENDA.md) a remplacé l'ancien système de jetons (courbe de conversion opaque,
   monnaie abstraite) : la cagnotte EST désormais la trésorerie de carrière elle-même, cumulée
   sans transformation -- "le joueur dépense ses gains réels". La seule exigence de progression
   vient maintenant du CALIBRAGE DES PRIX (voir engine/cosmetics.js), pas d'une courbe de gain.
============================================================ */
const WALLET_KEY = 'hardwood_wallet_v1';
let mem = null;

function load() {
  if (mem !== null) return mem;
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    mem = raw ? JSON.parse(raw) : null;
  } catch (e) { mem = null; }
  if (!mem || typeof mem !== 'object') mem = { balance: 0 };
  mem.balance = Math.max(0, Math.round(mem.balance || 0));
  return mem;
}
function save() { try { localStorage.setItem(WALLET_KEY, JSON.stringify(mem)); } catch (e) { /* stockage indisponible : on continue en mémoire */ } }

export function walletState() { return load(); }
// En k€ (même unité que p.money -- voir engine/utils.js money() pour le formatage "X k€"/"X M€").
export function walletBalance() { return load().balance; }

// Primes de titres modérées (voir AGENDA.md AGD-47, point 3) : chaque trophée/titre gagné en
// carrière alimente aussi le pouvoir d'achat en boutique, en plus de la trésorerie déjà comptée
// via le salaire/les bonus (engine/season.js). Volontairement mesuré -- même pour une carrière
// G.O.A.T. couverte de titres, la prime totale reste une fraction de la trésorerie déjà gagnée
// (quelques M€ de plus sur des dizaines à centaines de M€), jamais la source dominante.
// Clés identiques à celles utilisées comme accolades (voir engine/season.js A('...')) -- montants
// en k€. Une clé de palier mineur non listée explicitement ("Champion <ligue mineure>"/
// "MVP <ligue mineure>") retombe sur un montant plus modeste (MINOR_*_BONUS ci-dessous).
const TITLE_BONUS = {
  'Champion NBA': 3000, 'Champion EuroLeague': 1800, 'Champion NBL': 1200,
  'MVP': 2500, 'MVP EuroLeague': 1200, 'MVP des finales': 1500,
  'Meilleur défenseur': 800, "Rookie de l'année": 600, 'Meilleur jeune': 400,
  'All-Star': 250, 'All-EuroLeague': 200, 'Meilleur marqueur': 500,
};
const MINOR_CHAMPION_BONUS = 400, MINOR_MVP_BONUS = 300;
const MEDAL_BONUS = { '🥇': 1000, '🥈': 500, '🥉': 250 };

export function titleBonusFor(accolades) {
  let bonus = 0;
  for (const [key, count] of Object.entries(accolades || {})) {
    if (!count) continue;
    if (key in TITLE_BONUS) { bonus += TITLE_BONUS[key] * count; continue; }
    if (key.startsWith('Champion ')) { bonus += MINOR_CHAMPION_BONUS * count; continue; }
    if (key.startsWith('MVP ')) { bonus += MINOR_MVP_BONUS * count; continue; }
    if (key.startsWith('🥇')) { bonus += MEDAL_BONUS['🥇'] * count; continue; }
    if (key.startsWith('🥈')) { bonus += MEDAL_BONUS['🥈'] * count; continue; }
    if (key.startsWith('🥉')) { bonus += MEDAL_BONUS['🥉'] * count; continue; }
  }
  return Math.round(bonus);
}

// Appelé une fois par carrière terminée (voir endCareer() dans ui/screens.js), avec le MÊME
// garde-fou anti-double-comptage que p.savedHOF/p.savedChallengeResult (endCareer() peut être
// ré-invoqué, ex. retour depuis "Ma carte"). Retourne le montant gagné en k€ (trésorerie de fin
// de carrière + primes de titres), pour un éventuel message de félicitations -- 0 si la carrière
// n'a rien rapporté.
export function earnFromCareer(p) {
  const earned = Math.max(0, Math.round(p.money || 0)) + titleBonusFor(p.accolades);
  if (earned > 0) {
    const w = load();
    w.balance += earned;
    save();
  }
  return earned;
}

// Dépense contrôlée : refuse silencieusement (false) si le solde est insuffisant, jamais de
// solde négatif possible par ce chemin.
export function walletSpend(amount) {
  const w = load();
  if (amount <= 0 || w.balance < amount) return false;
  w.balance -= amount;
  save();
  return true;
}

// Utilisé par le seul test dédié (voir tests/audit_cosmetics.mjs) pour repartir d'un état propre
// entre deux scénarios indépendants au sein du même process.
export function walletReset() {
  mem = { balance: 0 };
  save();
}
