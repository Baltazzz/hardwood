// Traits de joueur (anciennement "étiquettes" en interne -- même système, présentation
// gratifiante) : transforment les flags narratifs (déjà posés par les choix d'événements, voir
// applyChoice() dans season.js) en identité visible et vivante. Un trait s'active à partir d'un
// seuil de flag -- moment marqué par une animation "Trait débloqué" (voir renderTraitUnlockCard()
// plus bas, consommée par showDeltaFlash() dans screens.js) -- puis s'ESTOMPE s'il n'est plus
// nourri par de nouveaux choix pendant plusieurs saisons (p.flagYear), ou se perd plus vite si un
// choix ultérieur le CONTREDIT directement (voir OPPOSES ci-dessous, appliqué dans applyChoice()) :
// il peut donc bien se perdre, pas seulement s'accumuler. Chaque trait porte un vrai couple
// avantage/inconvénient, mécanique (effect(), appliqué une fois par saison dans postSeason()) et
// pas seulement narratif -- volontairement modeste, jamais de quoi peser sur les probabilités de
// récompense (MVP/titre/HOF), seulement une inflexion de trajectoire de stats molles cohérente
// avec ce que le trait raconte.
import { clamp } from './utils.js';

const DECAY_SEASONS = 5;

// Fenêtre de décroissance individuelle, quand un trait a besoin de plus de temps que les autres
// pour accumuler ses 2 occurrences de flag : audit réel (voir AGENDA.md) montrant clutch/fragile/
// controversial à peine 3-3.7% de carrières concernées (contre 12-39% pour les autres traits) --
// pas parce que leurs événements sont absents (clutchHero est nourri par 9 branches d'événements
// différentes), mais parce qu'ils sont eux-mêmes situationnels/probabilistes : 5 saisons ne
// suffisent souvent pas à enchaîner 2 occurrences. Fenêtre allongée pour ces 3 traits seulement --
// le seuil (2) ne change pas, ils gardent le même sens, juste plus de temps pour se révéler.
const DECAY_OVERRIDE = { clutchHero: 8, injuryProne: 8, controversial: 8 };

export const TAG_DEFS = [
  // ---- Jeu ----
  { id: 'clutch', label: 'Clutch', registry: 'jeu', flag: 'clutchHero', threshold: 2,
    pro: 'Sang-froid reconnu dans les money-times', con: 'La pression retombe toujours sur toi',
    icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3.5 2',
    effect: (p) => { p.reputation = clamp(p.reputation + 1, 0, 100); p.fitness = clamp(p.fitness - 1, 0, 100); } },
  { id: 'lockdown', label: 'Verrou défensif', registry: 'jeu', flag: 'lockdown', threshold: 2,
    pro: 'Le staff te confie les missions les plus dures', con: 'Toujours sur le meilleur scoreur adverse',
    icon: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5z',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); p.fitness = clamp(p.fitness - 1, 0, 100); } },
  { id: 'fragile', label: 'Fragile', registry: 'jeu', flag: 'injuryProne', threshold: 2,
    pro: 'Le staff médical veille sur toi en priorité', con: 'Le corps qui lâche plus souvent qu\'à ton tour',
    icon: 'M12 21C7 17 3 13.5 3 9.5A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 9 1.5C21 13.5 17 17 12 21ZM9 12h2l1-2 2 4 1-2h2',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); p.fitness = clamp(p.fitness - 1, 0, 100); } },
  // ---- Mental / vestiaire ----
  { id: 'leader', label: 'Leader', registry: 'mental', flag: 'leaderRep', threshold: 2,
    pro: 'Le vestiaire se range naturellement derrière toi', con: 'Chaque défaite retombe un peu plus sur toi',
    icon: 'M12 3 14.5 8.5 20.5 9.3 16 13.3 17.2 19.3 12 16.2 6.8 19.3 8 13.3 3.5 9.3 9.5 8.5Z',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); p.morale = clamp(p.morale - 1, 0, 100); } },
  { id: 'hothead', label: 'Tête brûlée', registry: 'mental', flag: 'hothead', threshold: 2,
    pro: 'Une intensité que le public adore', con: 'Un sang qui monte vite, staff sur les nerfs',
    icon: 'M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-2-1-3-2-4 .3 2-1 3-2 2 1-3-1-6-2-9Z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.coach = clamp(p.coach - 1, 0, 100); } },
  // ---- Médiatique ----
  { id: 'mediaFriend', label: 'Chouchou des médias', registry: 'media', flag: 'mediaFriend', threshold: 2,
    pro: 'La presse te réserve toujours un traitement de faveur', con: 'On retient ton image avant ton jeu',
    icon: 'M20 8h-3.2L15 4H9L7.2 8H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1ZM12 18a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.reputation = clamp(p.reputation - 1, 0, 100); } },
  { id: 'controversial', label: 'Sulfureux', registry: 'media', flag: 'controversial', threshold: 2,
    pro: 'Ton nom fait vendre, ton aura est immense', con: 'Le staff marche sur des œufs autour de toi',
    icon: 'M13 2 4 14h6l-1 8 9-12h-6z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.coach = clamp(p.coach - 2, 0, 100); } },
  // ---- Finance ----
  { id: 'bling', label: 'Bling', registry: 'finance', flag: 'spender', threshold: 2,
    pro: 'Un train de vie qui fait rêver, image de star assumée', con: 'Les comptes fondent plus vite qu\'ils ne se remplissent',
    icon: 'M6 9 12 3l6 6-6 12z M6 9h12',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.money = Math.round(p.money * 0.98); } },
  { id: 'saver', label: 'Économe', registry: 'finance', flag: 'saver', threshold: 2,
    pro: 'Un patrimoine qui grandit saison après saison', con: 'Une image plus terne qu\'une star tape-à-l\'œil',
    icon: 'M5 12a7 7 0 0 1 12-5l2-1v4l-2 1M5 12v6h9v-3M5 12a7 7 0 0 0 4 6.3',
    effect: (p) => { p.money = p.money + 15; p.popularity = clamp(p.popularity - 1, 0, 100); } },

  // ---- Lot d'extension (voir AGENDA.md, "étoffer les traits") : 8 traits supplémentaires.
  // Six réutilisent des flags narratifs déjà nourris par de nombreux événements existants mais
  // jamais promus en trait visible (nightOwl/finalsHero/mentorLegacy/rival/ringChaser/loyalOne --
  // chacun a déjà son propre "fil narratif" de paiement dans data/events/threads.js, parfois
  // depuis plusieurs lots) : les rendre visibles (puce + effet) leur donne enfin une vraie
  // identité de trait, sans dupliquer tout le travail narratif déjà écrit. Deux sont entièrement
  // nouveaux (showman/workhorse), avec leurs propres événements nourriciers (voir
  // data/events/shared.js) -- vraiment "plus de traits", pas seulement plus d'affichage.
  { id: 'nightOwlTrait', label: 'Noctambule', registry: 'vie', flag: 'nightOwl', threshold: 2,
    pro: 'Une popularité qui grimpe à chaque sortie remarquée', con: 'Une forme physique qui en pâtit discrètement',
    icon: 'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z M17.2 4l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6L15 6.2l1.6-.6Z',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.fitness = clamp(p.fitness - 1, 0, 100); } },
  { id: 'finalsHero', label: 'Héros des finales', registry: 'jeu', flag: 'finalsHero', threshold: 1,
    pro: 'Une réputation forgée dans les matchs qui comptent', con: 'La pression redouble à chaque grand rendez-vous',
    icon: 'M8 4h8v3a4 4 0 0 1-8 0V4Z M6 5H4v2a4 4 0 0 0 4 4 M18 5h2v2a4 4 0 0 1-4 4 M12 12v4 M9 20h6 M10 20l.6-3h2.8l.6 3',
    effect: (p) => { p.reputation = clamp(p.reputation + 1, 0, 100); p.morale = clamp(p.morale - 1, 0, 100); } },
  { id: 'mentor', label: 'Mentor', registry: 'mental', flag: 'mentorLegacy', threshold: 2,
    pro: 'Le vestiaire progresse notablement à ton contact', con: 'Ton propre jeu individuel passe parfois au second plan',
    icon: 'M12 4 3 8l9 4 9-4-9-4Z M7 11v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); p.popularity = clamp(p.popularity - 1, 0, 100); } },
  { id: 'rivalTrait', label: 'Grande rivalité', registry: 'jeu', flag: 'rival', threshold: 2,
    pro: 'Un supplément d\'âme à chaque confrontation', con: 'Une fatigue nerveuse qui s\'accumule autour de ces duels',
    icon: 'M4 20 20 4 M20 20 4 4 M4 20l3-1 1-3 M20 20l-3-1-1-3',
    effect: (p) => { p.reputation = clamp(p.reputation + 1, 0, 100); p.fitness = clamp(p.fitness - 1, 0, 100); } },
  { id: 'ringChaser', label: 'Chasseur de bagues', registry: 'mental', flag: 'ringChaser', threshold: 1,
    pro: 'Une réputation de gagnant, prêt à tout pour le titre', con: 'L\'image d\'un joueur qui suit le succès plutôt qu\'il ne le construit',
    icon: 'M12 2v6 M9 5l3 3 3-3 M8 13a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',
    effect: (p) => { p.reputation = clamp(p.reputation + 1, 0, 100); p.popularity = clamp(p.popularity - 1, 0, 100); } },
  { id: 'loyalist', label: 'Loyaliste', registry: 'mental', flag: 'loyalOne', threshold: 2,
    pro: 'Un soutien indéfectible du public, une place à part dans le vestiaire', con: 'Un pouvoir de négociation plus faible sur le marché',
    icon: 'M6 3v18 M6 4h12l-3 4 3 4H6',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.money = Math.round(p.money * 0.99); } },
  { id: 'showman', label: 'Showman', registry: 'media', flag: 'showman', threshold: 2,
    pro: 'Le public se déplace pour tes highlights', con: 'On te reproche de privilégier le spectacle au jeu collectif',
    icon: 'M12 2v4 M12 18v4 M4.2 4.2l2.8 2.8 M17 17l2.8 2.8 M2 12h4 M18 12h4 M4.2 19.8 7 17 M17 7l2.8-2.8',
    effect: (p) => { p.popularity = clamp(p.popularity + 1, 0, 100); p.coach = clamp(p.coach - 1, 0, 100); } },
  { id: 'workhorse', label: 'Bosseur', registry: 'jeu', flag: 'workhorse', threshold: 2,
    pro: 'Une régularité et une progression que le staff salue', con: 'Le corps encaisse une charge de travail toujours plus lourde',
    icon: 'M4 9v6 M2 10v4 M7 7v10 M17 7v10 M20 10v4 M22 9v6 M7 12h10',
    effect: (p) => { p.coach = clamp(p.coach + 1, 0, 100); p.fitness = clamp(p.fitness - 1, 0, 100); } },
];

// Paires de traits directement OPPOSÉS (par nom de FLAG, pas d'id -- c'est sur ce nom que
// applyChoice() opère) : un choix qui nourrit l'un affaiblit activement l'autre s'il est en
// cours, plutôt que d'attendre la seule décroissance par oubli (DECAY_SEASONS). Un trait peut
// donc bien se perdre parce que la carrière prend le contrepied de ce qu'il racontait, pas
// seulement parce qu'il n'a plus été nourri depuis longtemps.
export const OPPOSES = { spender: 'saver', saver: 'spender', controversial: 'mediaFriend', mediaFriend: 'controversial',
  ringChaser: 'loyalOne', loyalOne: 'ringChaser' };

// Un trait est actif si son flag a atteint le seuil ET a été nourri il y a moins de
// DECAY_SEASONS saisons -- silencieux plus longtemps que ça, il s'efface (peut donc bien "se
// perdre", pas seulement s'accumuler).
export function activeTags(p) {
  const flags = p.flags || {}, flagYear = p.flagYear || {}, year = p.year || 0;
  return TAG_DEFS.filter(t => {
    const count = flags[t.flag] || 0;
    if (count < t.threshold) return false;
    const lastYear = flagYear[t.flag] || 0;
    return (year - lastYear) <= (DECAY_OVERRIDE[t.flag] || DECAY_SEASONS);
  });
}

// Un trait actif donné, par id -- pour gater/pondérer des événements sur la présence d'un trait
// (voir data/events/traits_payoff.js), la version "influence certains choix et certaines
// situations" demandée en plus du simple affichage.
export function hasTrait(p, id) { return activeTags(p).some(t => t.id === id); }

// Détecte les traits qui viennent de passer actifs POUR LA PREMIÈRE FOIS depuis le dernier
// contrôle (comparé à p.lastActiveTagIds, mis à jour ici) -- appelé depuis applyChoice() juste
// après application des effets d'un choix, pour déclencher l'animation "Trait débloqué"
// (renderTraitUnlockCard(), voir showDeltaFlash() dans screens.js) au moment précis où ça arrive,
// pas seulement de façon rétrospective à l'affichage.
export function checkTraitUnlocks(p) {
  const current = new Set(activeTags(p).map(t => t.id));
  const before = new Set(p.lastActiveTagIds || []);
  const newly = [...current].filter(id => !before.has(id));
  p.lastActiveTagIds = [...current];
  return newly.map(id => TAG_DEFS.find(t => t.id === id)).filter(Boolean);
}

// Reconstitue les définitions complètes à partir d'une liste d'id sauvegardés (voir rec.tags
// dans endCareer()/hof.js) -- une carrière du Panthéon ne garde que les id, pas les objets.
export function tagsByIds(ids) {
  if (!ids || !ids.length) return [];
  return TAG_DEFS.filter(t => ids.includes(t.id));
}

// Effet de saison, appelé une fois par postSeason() pour chaque trait actif. Volontairement
// petit et borné (voir commentaire d'en-tête) : jamais appliqué aux attributs ni aux probabilités
// de récompense, seulement à des jauges molles déjà sujettes à bien plus de variance via les
// choix d'événements eux-mêmes.
export function applyTagEffects(p) {
  activeTags(p).forEach(t => t.effect(p));
}

function tagIcon(t) {
  return `<svg viewBox="0 0 24 24" width="13" height="13"><path d="${t.icon}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const REGISTRY_COLOR = { jeu: 'var(--orange-soft)', mental: 'var(--plum)', media: 'var(--mint-soft)', finance: 'var(--chalk-dim)', vie: 'var(--orange)' };

// Puces de trait, pour la fiche HUD en cours de carrière et le récap de fin de carrière.
export function renderTagChips(tags, extraClass = '') {
  if (!tags || !tags.length) return '';
  return `<div class="tag-chips${extraClass ? ' ' + extraClass : ''}">${tags.map(t => `<span class="tag-chip" style="color:${REGISTRY_COLOR[t.registry]};border-color:${REGISTRY_COLOR[t.registry]}" title="${t.pro} · ${t.con}">${tagIcon(t)}${t.label}</span>`).join('')}</div>`;
}

// Carte "Trait débloqué" (voir showDeltaFlash() dans screens.js, checkTraitUnlocks() ci-dessus) :
// icône dans la couleur de son registre + nom + le vrai couple avantage/inconvénient, jamais
// juste le bonus -- le joueur voit tout de suite ce qu'il gagne ET ce qu'il concède.
export function renderTraitUnlockCard(t) {
  return `<div class="trait-unlock">
    <div class="tu-icon" style="color:${REGISTRY_COLOR[t.registry]};border-color:${REGISTRY_COLOR[t.registry]}">${tagIcon(t)}</div>
    <div class="tu-body">
      <div class="tu-eyebrow">🔓 Trait débloqué</div>
      <div class="tu-name">${t.label}</div>
      <div class="tu-procon"><span class="tu-pro">+ ${t.pro}</span><span class="tu-con">− ${t.con}</span></div>
    </div>
  </div>`;
}
