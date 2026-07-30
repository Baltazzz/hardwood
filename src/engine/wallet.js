/* ============================================================
   CAGNOTTE — monnaie persistante de la boutique cosmétique (voir AGENDA.md AGD-41), qui cumule
   une part de la trésorerie gagnée À TRAVERS TOUTES LES CARRIÈRES. Même stockage robuste que
   hof.js/badges.js : localStorage quand disponible, repli mémoire sinon -- jamais d'erreur si le
   stockage est indisponible/plein/bloqué.

   Volontairement DÉCONNECTÉE de p (le joueur) une fois la carrière terminée : cette monnaie ne
   sert qu'à acheter des cosmétiques (engine/cosmetics.js), jamais relue par la simulation d'une
   carrière -- aucun risque d'affecter le gameplay, l'équilibrage, ou un score de classement/défi
   (voir engine/challenges.js/dailyChallenge.js, qui n'importent jamais ce module).
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
export function walletBalance() { return load().balance; }

// Conversion trésorerie -> jetons, volontairement EXIGEANTE ("mieux vaut trop dur que trop
// facile", consigne explicite). p.money est la trésorerie de fin de carrière en k€ (voir
// engine/player.js/season.js) -- calibrée sur un échantillon RÉEL de 300 carrières pilotées par
// le harnais de test (aléatoire, non trié par qualité) plutôt que sur une estimation :
//   médiane toutes carrières confondues : ~13 900 k€ (~13.9 M€)
//   médiane par palier atteint : Parcours de combattant ~6 300 · Joueur de rotation ~15 500 ·
//     All-Star ~41 300 · Superstar ~56 400 · Hall of Fame ~67 200 · G.O.A.T. (1 seul cas) ~77 600
//   maximum observé sur l'échantillon : ~89 200 k€
// Courbe SUR-linéaire (exposant 1.5, pas une simple proportion) : une carrière médiocre ne
// rapporte presque rien (quelques jetons), une grande carrière rapporte largement plus que
// proportionnellement plus -- empêche de "farmer" la cagnotte en enchaînant des carrières
// médiocres, force à viser une vraie bonne carrière pour progresser dans la boutique. Avec cette
// formule : carrière "Parcours de combattant" médiane -> ~5 jetons, "Joueur de rotation" -> ~20,
// "All-Star" -> ~88, "Superstar" -> ~141, "Hall of Fame" -> ~184, la meilleure carrière observée
// sur 300 (G.O.A.T., 89 200 k€) -> ~280. Les récompenses les plus chères de la boutique (400+
// jetons) réclament donc bien plusieurs bonnes carrières, jamais une seule carrière moyenne.
export function tokensFromMoney(money) {
  const m = Math.max(0, money || 0) / 1000; // k€ -> M€
  return Math.floor(Math.pow(m, 1.5) / 3);
}

// Appelé une fois par carrière terminée (voir endCareer() dans ui/screens.js), avec le MÊME
// garde-fou anti-double-comptage que p.savedHOF/p.savedChallengeResult (endCareer() peut être
// ré-invoqué, ex. retour depuis "Ma carte"). Retourne le nombre de jetons gagnés (pour un
// éventuel message de félicitations), 0 si la carrière n'a rien rapporté.
export function earnFromCareer(p) {
  const earned = tokensFromMoney(p.money);
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
