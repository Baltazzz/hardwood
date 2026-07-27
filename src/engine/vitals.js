import { clamp, ri } from './utils.js';

/* ============================================================
   STATS MOLLES VIVANTES — fatigue réelle (forme) + dérive vers une
   base neutre (moral/popularité/médias), pour qu'elles bougent
   visiblement sur une carrière au lieu de plafonner comme avant ce
   lot (la forme en particulier ne faisait quasiment que remonter
   vers 100 en début de saison, sans coût réel lié à la charge
   réellement encaissée). Voir season.js (postSeason/beginSeason)
   pour les points d'appel, hud.js pour la ligne de contexte qui
   commente l'état le plus notable à l'écran.
============================================================ */

// Fin de saison (postSeason(), avant applyAging) : coût réel proportionnel à la charge TOTALE
// réellement encaissée sur la saison qui vient de se jouer (minutes par match x proportion de
// matchs joués, ramené à la référence d'un titulaire à plein temps -- 32 min sur 100% des
// matchs), pas deux termes indépendants qui pénaliseraient à tort un joueur de banc présent à
// tous les matchs mais peu utilisé. Une blessure alourdit encore la facture (le corps n'a pas eu
// le temps de vraiment récupérer).
export function applyFatigue(p) {
  const last = p.seasons.length ? p.seasons[p.seasons.length - 1] : null;
  if (!last) return;
  const gamesRatio = last.leagueGames ? clamp((last.gamesPlayed || 0) / last.leagueGames, 0, 1) : 1;
  const totalLoadRatio = clamp(((last.minutes || 0) * gamesRatio) / 32, 0, 1.3);
  let drain = 6 + totalLoadRatio * 22;
  if (last.injured) drain += 6;
  p.fitness = clamp(p.fitness - Math.round(drain), 12, 100);
}

// Début de saison (beginSeason()) : récupération d'intersaison, nettement plus modeste
// qu'avant ce lot (qui remontait quasi systématiquement vers 100) et de moins en moins efficace
// avec l'âge -- ne ramène plus la forme au plafond par défaut, laisse la fatigue s'accumuler
// réellement sur les carrières à gros volume répété saison après saison, tout en laissant de
// vraies remontées possibles dès qu'une saison est plus légère. Ces magnitudes donnent une
// forme qui oscille vraiment (moyenne ~50, loin du plafond) -- voir `form` dans season.js
// (simulateSeason()), volontairement recalé pour absorber cette nouvelle plage sans faire
// chuter l'équilibrage des récompenses (la variable qui compte pour la calibration, ce n'est
// pas la jauge affichée mais sa transformation en `form`).
export function applyRecovery(p) {
  const ageWear = clamp((p.age - 27) * 0.8, 0, 16);
  const recovery = clamp(ri(12, 22) - ageWear, 5, 22);
  p.fitness = clamp(p.fitness + recovery, 12, 100);
}

// Dérive douce vers une base neutre (moral/popularité) à chaque intersaison : sans ça, ces
// jauges ne font quasiment que monter au gré des choix narratifs, jamais vraiment redescendre --
// au bout d'une longue carrière, tout plafonne aussi près de 100. Rythme volontairement lent
// (5-6% de l'écart courant à la base) : ne combat jamais une vraie saison marquante (les deltas
// d'événements restent nettement plus grands), seulement l'accumulation sans fin sur une
// carrière longue.
function driftToward(v, base, rate) { return v + (base - v) * rate; }
export function applySoftStatDrift(p) {
  p.morale = clamp(Math.round(driftToward(p.morale, 58, 0.06)), 0, 100);
  p.popularity = clamp(Math.round(driftToward(p.popularity, 32, 0.05)), 0, 100);
  // Médias : pas de base fixe -- une base fixe le laissait quasi immobile (les événements qui le
  // touchent sont trop rares/petits pour compenser une dérive constante). Suit à la place la
  // notoriété RÉELLE du moment (popularité + réputation), à un rythme plus vif (16% de l'écart) :
  // les médias mettent du temps à suivre un joueur qui explose, mais suivent vraiment, montent et
  // redescendent avec la carrière plutôt que de stagner près d'une valeur de départ arbitraire.
  const mediaTarget = clamp(p.popularity * 0.6 + p.reputation * 0.4, 5, 95);
  p.media = clamp(Math.round(driftToward(p.media, mediaTarget, 0.16)), 0, 100);
}

// Ligne de contexte (HUD, voir hud.js) : commente la stat molle la plus "notable" -- l'écart le
// plus marqué par rapport à sa zone neutre, une seule à la fois pour rester lisible (pas un mur
// de texte). Rien à afficher si tout reste dans la norme -- pas de ligne pour le principe.
const CONTEXT_RULES = [
  { key: 'fitness', test: v => v < 30, text: 'Corps à plat, la fatigue commence vraiment à peser.', weight: v => 30 - v },
  { key: 'fitness', test: v => v >= 94, text: 'Une forme olympique, tu te sens increvable.', weight: v => v - 94 },
  { key: 'morale', test: v => v < 25, text: 'Vestiaire tendu, le moral n\'y est pas.', weight: v => 25 - v },
  { key: 'morale', test: v => v >= 88, text: 'Groupe soudé, tu rayonnes de confiance.', weight: v => v - 88 },
  { key: 'popularity', test: v => v >= 82, text: 'L\'engouement du public autour de toi ne faiblit pas.', weight: v => v - 82 },
  { key: 'popularity', test: v => v < 10, text: 'Tu joues dans l\'anonymat, loin des projecteurs.', weight: v => 10 - v },
  { key: 'media', test: v => v >= 82, text: 'Chaque sortie de terrain fait la une.', weight: v => v - 82 },
  { key: 'media', test: v => v < 10, text: 'Les médias t\'ignorent superbement.', weight: v => 10 - v },
];
export function statContextLine(p) {
  let best = null, bestW = -1;
  for (const rule of CONTEXT_RULES) {
    const v = p[rule.key];
    if (v == null || !rule.test(v)) continue;
    const w = rule.weight(v);
    if (w > bestW) { bestW = w; best = rule; }
  }
  return best ? best.text : null;
}
