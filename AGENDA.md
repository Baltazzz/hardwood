# AGENDA — fonctionnalités demandées, pas encore livrées

Registre des demandes en attente sur HARDWOOD. Chaque entrée porte un identifiant stable,
une description courte du manque, et un **critère de validation observable** : la façon dont
on constatera — sans ambiguïté, via l'audit ou l'usage réel du jeu — que c'est fait.

Règle de mise à jour : voir `CLAUDE.md`. Une ligne n'est cochée que si elle a été réellement
implémentée **et** vérifiée (audit ou test) dans la session qui la coche.

## Ouvert

- [ ] **AGD-04 — Contexte de compétition par saison** _(avancé le 2026-07-29 : voir ci-dessous)_
  Avancée cette session : le palmarès de fin de carrière et la fiche Panthéon séparent
  désormais nettement les récompenses de club/ligue (titre, MVP, trophées individuels) de
  celles de sélection nationale (médailles, MVP de tournoi), dans deux sections hiérarchisées
  de l'armoire à trophées (`renderTrophyCabinet()` dans `src/ui/trophies.js`, classification
  par `classifyAccolade()`). Prépare l'affichage du contexte de compétition mais ne le
  complète pas : reste manquant le classement/position finale du club dans sa ligue (aucune
  notion de standings — `wins` existe mais n'est comparé à personne d'autre) ; playoffs (aucun bracket
  réel, seulement 2 événements avec du texte d'ambiance sans mécanique — `playoff_push` dans
  `mid.js`, `load_mgmt` dans `late.js`) ; montée/descente au niveau du **club** (ce qui existe
  est la progression individuelle du joueur entre paliers de ligue selon sa propre
  performance — `resolveMovement()` / moves `promo`/`demote` dans `season.js` — un concept
  différent d'un classement d'équipe qui monterait ou descendrait collectivement,
  indépendamment du joueur).
  **Critère** : provisoire — portée exacte (classement de conférence ? bracket de playoffs ?
  simple ligne de classement ? montée/descente de club distincte de la progression du joueur ?)
  à préciser avec l'utilisateur avant implémentation. Ne pas coder sur la base de cette seule
  ligne sans validation du périmètre en session.

- [ ] **AGD-06 — Animations des moments forts**
  Ajouté au registre le 2026-07-26 (item signalé comme possiblement oublié par l'utilisateur —
  provenance non retrouvée dans l'historique git accessible ni dans `AGENDA.md` avant cette
  date ; peut-être demandé lors d'une session antérieure non couverte par l'historique
  consulté, à confirmer). Progrès adjacent le 2026-07-26 : pictogramme SVG dans le chip
  d'événement (`CAT_ICON` dans `events.js`). Progrès adjacent le 2026-07-27 : ces mêmes
  événements ("grand moment" — clutch/défense/duel/finale) ont désormais une cartouche visuelle
  dédiée (`.grand-moment` dans `styles.css` : liseré + motif ballon agrandi, recoloré en prune
  le 2026-07-28 avec la bascule de palette), pour se distinguer visuellement des événements
  courants. Ça reste une mise en forme statique, pas une animation/mise en scène du moment
  lui-même au moment de la résolution du choix.
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

- [x] **AGD-03 — Système de trophées** _(implémenté et vérifié le 2026-07-29)_
  Armoire à trophées (`src/ui/trophies.js`), chaque famille de récompense avec sa vraie forme :
  bague de champion (titre NBA uniquement), coupe collective (tous les autres titres de ligue),
  trophées individuels distincts par forme/couleur (MVP = étoile dorée, MVP des finales = coupe
  + sash prune, Meilleur défenseur = bouclier terracotta, Rookie de l'année/Meilleur jeune =
  chevron prune), distinctions (rosette à rubans, All-Star/meilleur marqueur — pas un trophée),
  médailles or/argent/bronze pour la sélection nationale. Nouvelle accolade "MVP des finales"
  ajoutée (`simulateSeason()`), déclenchée uniquement quand le titre est décidé par l'événement
  narratif "match décisif" (`forceFinals`), jamais par le tirage indépendant. Accessible depuis
  l'écran de fin de carrière et la fiche Panthéon (`renderCareerDetail()`).
  Vérifié : rendu synthétique testé avec les 14 types de récompense simultanément (0 valeur
  `undefined`/`NaN`, 17 SVG bien formés), 0% crash sur 100+300 carrières après intégration.

- [x] **AGD-05 — Étiquettes de joueur** _(implémenté et vérifié le 2026-07-29)_
  8 étiquettes sur 4 registres (`src/engine/tags.js`) : jeu (Clutch, Verrou défensif, Fragile),
  mental/vestiaire (Leader, Tête brûlée), médiatique (Chouchou des médias, Sulfureux), finance
  (Bling, Économe). Dérivées des flags narratifs existants (`clutchHero`, `lockdown`,
  `injuryProne`, `controversial`) + 5 nouveaux flags câblés sur des choix existants (`leaderRep`,
  `hothead`, `mediaFriend`, `spender`, `saver`). Une étiquette s'active à partir d'un seuil et
  s'estompe si son flag n'est plus nourri pendant 5 saisons (`p.flagYear`, voir `applyChoice()`)
  — peut donc bien se perdre, pas seulement s'accumuler. Effet mesuré mais volontairement
  modeste par saison (`applyTagEffects()` dans `postSeason()`), jamais sur les attributs ni les
  probabilités de récompense. Affichées sur la fiche HUD en cours de carrière, l'écran de fin,
  et la fiche Panthéon.
  Vérifié par audit comparatif à 300 carrières avant/après : titre 29.3%→29.7%, MVP 4.7%→5.7%,
  phénomène 1.3%→2.3%, All-Star 25.3%→28.7%, HOF 9.3%→10.7% — toutes les variations dans la
  marge de bruit d'échantillonnage déjà observée cette semaine sur ce protocole (le titre élite
  seul a varié de 6.7% à 14.7% selon les runs sans aucun changement de code entre certains
  d'entre eux). Nombre moyen d'étiquettes actives en fin de carrière : 0.8 (sobre, conforme à
  l'objectif "quelques-unes à la fois").

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
