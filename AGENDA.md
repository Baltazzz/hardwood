# AGENDA — fonctionnalités demandées, pas encore livrées

Registre des demandes en attente sur HARDWOOD. Chaque entrée porte un identifiant stable,
une description courte du manque, et un **critère de validation observable** : la façon dont
on constatera — sans ambiguïté, via l'audit ou l'usage réel du jeu — que c'est fait.

Règle de mise à jour : voir `CLAUDE.md`. Une ligne n'est cochée que si elle a été réellement
implémentée **et** vérifiée (audit ou test) dans la session qui la coche.

## Ouvert

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

- [x] **AGD-08 — Nationalités et immersion nationale** _(implémenté et vérifié le 2026-07-26)_
  Trois volets, tous vérifiés :
  1. *Choix de nationalité enrichi* : liste de nations (`src/data/nations.js`) passée de 9 à 14
     (ajout Lituanie, Italie, Turquie — voie eu — et Nigeria, Porto Rico — voie us). Le choix du
     championnat de départ reste indépendant (piloté par `nation.path`, inchangé) : la nationalité
     ne joue que sur l'identité et l'éligibilité en sélection.
  2. *Changement de pays après le premier contrat pro* : nouveau champ `p.playNation`
     (`engine/player.js`), distinct et indépendant de `p.nation` (origine, fixe, réservé à la
     sélection nationale). Nouvel helper `playCountry(p)` remplace `p.nation.id` à tous les points
     de tirage de club domestique (23 sites dans `season.js`/`screens.js`/`competition.js`).
     Nouveau type de mouvement `expatriate` : offre venue d'un autre pays de voie Europe aux
     promotions 3e div → pro 2 → élite nationale (30% de chance) et sur l'écran de free agency,
     jamais à la toute première signature pro (formation → 3e div, qui reste domestique). Texte
     dédié ("une expatriation, un vrai tournant de carrière").
     Repli de club (`clubs.js` `getClubPool()`) rendu path-aware (`PATH_FALLBACK_NATION`,
     repli par voie eu/au/us plutôt qu'un repli unique vers les données US, qui cassait les
     paliers third/second/national — 0 club côté US sur ces paliers) : condition nécessaire pour
     ajouter des nations sans données de club propres sans faire réapparaître le bug "Club libre".
  3. *Immersion sélection nationale* : cartouche dédiée (`.nat-cartouche` dans `styles.css`) sur le
     bilan de saison, distincte de la simple ligne de verdict précédente — fond et liseré teintés
     `--mint` (couleur déjà réservée au mode d'accent "nation"), drapeau en grand, médaille en vraie
     icône SVG (réutilise `medalSvg()` de `trophies.js`, nouvel export `medalIcon()`). Enjeux
     (grandes compétitions, médailles) et palmarès national distinct déjà en place avant ce lot,
     non retouchés.
  Vérifié : 0% crash et 0% repli "Club libre" sur 300+300+300+60+60 carrières (plusieurs runs,
  avant/après). Mécanique d'expatriation confirmée déclenchée et cohérente sur 120 carrières
  forcées en voie Europe (41 offres observées sur 34 carrières, `p.nation` jamais muté, `p.playNation`
  correctement divergent). Bug trouvé et corrigé en session : `simulateStandings()`
  (`engine/competition.js`) utilisait encore `p.nation.id` pour le vivier de clubs adverses du
  classement, resté incohérent avec le club réellement joué après une expatriation — corrigé en
  `playCountry(p)`. Comparatif de calibration à 300 carrières (plusieurs runs) : titre élite
  12.3-18.7% (bande de bruit déjà établie 7.7-21.7%), All-Star 19.3-29.3% (retombé à 25.7% au run
  final, proche de la référence pré-lot 25.3%), HOF 7.7-13.7% — écarts entre runs confirmés comme
  du bruit d'échantillonnage normal (non causé par ce lot : un run de contrôle restreint aux 9
  nations d'origine reproduit la même bande).

- [x] **AGD-04 — Contexte de compétition par saison** _(implémenté et vérifié le 2026-07-30)_
  Classement de fin de saison léger (`simulateStandings()` dans `src/engine/competition.js`) :
  une note par club dérivée de sa force réelle (`clubData.js` quand elle existe, estimation
  assumée pour NBA/EuroLeague qui n'ont pas de force par club dans les données sources, sinon
  teinte stable dérivée du nom), le club du joueur reprenant `teamRating` déjà calculé dans
  `simulateSeason()` — jamais de simulation match par match. Phase finale résumée en 2-3 tours
  probabilistes (`simulatePlayoffs()`), en cohérence stricte avec le mécanisme clutch déjà en
  place : si l'événement narratif "match décisif" a tranché la saison, son issue EST la finale,
  sans second tirage contradictoire. Montée/descente du **club** (distincte de la progression
  individuelle du joueur, inchangée) pour les pyramides domestiques européennes et
  australiennes (`checkClubMovement()`), y compris le club du joueur, avec deux nouveaux écrans
  dédiés (relégation/promotion) qui ajustent la ligue jouée et le salaire. Classement + parcours
  affichés en quelques lignes sur le bilan de saison existant, sans nouvel écran obligatoire.
  Vérifié : 0% crash sur 100+300 carrières (deux runs), 0 "Club libre". Bug de calibration
  détecté et corrigé en session : une première version comparait la force brute des clubs
  (échelle propre à `clubData.js`) à `teamRating` (échelle différente, centrée sur
  `prestige*3`), écrasant presque toujours le joueur au classement — corrigé en convertissant
  la force de chaque club en rang relatif au sein de son vivier avant de la reconvertir sur la
  même échelle que `teamRating`. Après correction, audit comparatif à 300 carrières (×2) :
  titre élite 12-12.7% (bande 7.7-14.7% déjà établie cette semaine), MVP 6.7-8%, HOF 10.7-12.3%
  — stable. Vérification de cohérence dédiée sur 1763 saisons pilotées (80 carrières) : 0
  incohérence entre classement/qualification aux playoffs/champion affiché/accolade au
  palmarès (5 contrôles croisés différents). Écrans de relégation/promotion de club vérifiés
  déclenchés sans erreur sur 100 carrières pilotées (13 relégations, 69 promotions observées).
  **Reste non couvert** (hors périmètre annoncé pour ce lot) : classement affiché limité à
  quelques lignes de contexte plutôt qu'un tableau complet consultable à tout moment ; pas de
  bracket de playoffs visuel (texte uniquement) ; montée/descente non modélisée pour les paliers
  hors pyramides EU/AU explicitement listées (academy/college/gleague/euro/nba).

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
