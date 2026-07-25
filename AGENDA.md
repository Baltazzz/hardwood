# AGENDA — fonctionnalités demandées, pas encore livrées

Registre des demandes en attente sur HARDWOOD. Chaque entrée porte un identifiant stable,
une description courte du manque, et un **critère de validation observable** : la façon dont
on constatera — sans ambiguïté, via l'audit ou l'usage réel du jeu — que c'est fait.

Règle de mise à jour : voir `CLAUDE.md`. Une ligne n'est cochée que si elle a été réellement
implémentée **et** vérifiée (audit ou test) dans la session qui la coche.

## Ouvert

- [ ] **AGD-03 — Système de trophées**
  Au-delà du compteur d'accolades actuel (MVP/All-Star/Champion en nombre brut dans
  `p.accolades`), pas de vitrine de trophées nommés ni de rétrospective par saison.
  **Critère** : provisoire — portée exacte (trophées nommés ? vitrine dédiée ? cérémonie de
  fin de saison ?) à préciser avec l'utilisateur avant implémentation. Ne pas coder sur la
  base de cette seule ligne sans validation du périmètre en session.

- [ ] **AGD-04 — Contexte de compétition par saison**
  Partiellement fait, précisé par l'audit du 2026-07-26 : le titre (champion) et le MVP sont
  déjà déterminés et affichés par saison (`simulateSeason()` dans `season.js`, accolades
  visibles dans le bilan de saison et la feuille de match carrière). Manque : classement/
  position finale du club dans sa ligue (aucune notion de standings — `wins` existe mais
  n'est comparé à personne d'autre) ; playoffs (aucun bracket réel, seulement 2 événements
  avec du texte d'ambiance sans mécanique — `playoff_push` dans `mid.js`, `load_mgmt` dans
  `late.js`) ; montée/descente au niveau du **club** (ce qui existe est la progression
  individuelle du joueur entre paliers de ligue selon sa propre performance —
  `resolveMovement()` / moves `promo` / `demote` dans `season.js` — un concept différent d'un
  classement d'équipe qui monterait ou descendrait collectivement, indépendamment du joueur).
  **Critère** : provisoire — portée exacte (classement de conférence ? bracket de playoffs ?
  simple ligne de classement ? montée/descente de club distincte de la progression du joueur ?)
  à préciser avec l'utilisateur avant implémentation. Ne pas coder sur la base de cette seule
  ligne sans validation du périmètre en session.

- [ ] **AGD-05 — Étiquettes de joueur**
  Le moteur d'événements pose déjà des flags internes (`bust`, `clutchHero`, `rival`,
  `loyalOne`, etc. — voir `src/data/events/threads.js` et `applyChoice()` dans `season.js`)
  mais rien n'est visible pour le joueur : aucune étiquette/badge affiché sur la fiche ou le HUD.
  **Critère** : au moins une étiquette de joueur (ex. « Clutch », « Bust », « Fidèle au club »)
  est visible dans l'interface une fois le seuil de flag correspondant atteint.

- [ ] **AGD-06 — Animations des moments forts**
  Ajouté au registre le 2026-07-26 (item signalé comme possiblement oublié par l'utilisateur —
  provenance non retrouvée dans l'historique git accessible ni dans `AGENDA.md` avant cette
  date ; peut-être demandé lors d'une session antérieure non couverte par l'historique
  consulté, à confirmer). Progrès adjacent le 2026-07-26 : les catégories "grand moment"
  (clutch/défense/duel/finale) ont désormais un pictogramme SVG fait maison dans le chip
  d'événement (`CAT_ICON` dans `events.js`) à la place de l'emoji générique — mais ça reste
  une icône statique, pas une animation/mise en scène du moment lui-même. Toujours aucune
  animation spécifique à un moment fort (tir décisif, dunk, titre remporté...) au-delà des
  2 animations génériques déjà en place (`@keyframes enter`, flash `fu`/`fd`).
  **Critère** : à définir avec l'utilisateur (quels moments ? quel type d'animation ? respect
  de `prefers-reduced-motion`, déjà en place globalement).

- [ ] **AGD-07 — Enrichissement de la carte de fin et du Panthéon**
  Ajouté au registre le 2026-07-26 (mêmes réserves de provenance que AGD-06). État actuel déjà
  substantiel : citations de presse (`pressReview()`), courbe d'évolution OVR (`sparkline()`),
  classement Panthéon avec détail par carrière (`renderHallOfFame()` / `renderCareerDetail()`
  dans `card.js`), carte canvas partageable et téléchargeable (`renderCareerCard()`), feuille
  de match saison par saison. Aucune demande précise et non satisfaite n'a été retrouvée dans
  l'historique — à clarifier avec l'utilisateur : qu'est-ce qui manque concrètement ?
  **Critère** : à définir avec l'utilisateur une fois le manque précisé.

## Coché récemment

- [x] **AGD-01 — Blocks et steals** _(implémenté et vérifié cette session)_
  Calculées par `simulateSeason()` selon poste, def/qi, temps de jeu et niveau de ligue
  (`blk36`/`stl36`). Affichées dans le bilan de saison (cellules CTR/INT) et la feuille de
  match carrière complète. **Non fait** : pas ajoutées à la carte de carrière canvas (grille
  fixe à 6 cellules de totaux/pics de carrière, pas de moyenne carrière trackée pour blk/stl —
  périmètre volontairement réduit, à rouvrir si voulu).
  Vérifié : moyennes par poste cohérentes sur 60 carrières pilotées (pivot ~1.6-2.2 ctr,
  arrière/meneur ~1.3-1.7 int, décroissance monotone par poste dans les deux sens) ; 0% crash.

- [x] **AGD-02 — Calendrier réaliste par ligue** _(implémenté et vérifié cette session)_
  Chaque ligue a son nombre de matchs de référence (`LEAGUES[x].games` : NBA 82, EuroLeague 34,
  G League 50, NCAA 31, etc.). `wins` et les seuils MVP/titre EuroLeague sont recalculés
  proportionnellement à cette échelle. Matchs joués affichés en "X/Y" dans le bilan de saison et
  la feuille de match carrière.
  Vérifié sur 300 carrières (`scripts/deep-audit.mjs`) : aucune anomalie wins/matchs joués >
  total ligue, PPG/RPG/APG par ligue dans la même fourchette historique qu'avant ce chantier,
  indicateurs de récompense (MVP/titre/phénomène/HOF/GOAT) stables. Une régression a été
  détectée et corrigée en session (pénalité de blessure sur les minutes qui devenait
  disproportionnée dans les saisons courtes, faisait chuter le taux de "jeune phénomène" de
  2.7% à 0.3%) — désormais dissociée de l'affichage du calendrier, revérifiée à 3.3%.
