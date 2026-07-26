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
  courants. Progrès adjacent le 2026-07-29 (lot création et immersion nationale, voir AGD-12) :
  une vraie animation d'entrée (`.nation-announce`, échelle + fondu) existe désormais, mais
  seulement pour les événements de sélection nationale, pas pour les grands moments de club
  (clutch/défense/duel/finale) qui restent en mise en forme statique.
  **Critère** : à définir avec l'utilisateur (quels moments côté club ? même traitement que
  `.nation-announce` ou différent ? respect de `prefers-reduced-motion`, déjà en place
  globalement).

- [ ] **AGD-07 — Enrichissement de la carte de fin et du Panthéon**
  Ajouté au registre le 2026-07-26 (mêmes réserves de provenance que AGD-06). État actuel déjà
  substantiel : citations de presse (`pressReview()`), courbe d'évolution OVR (`sparkline()`),
  classement Panthéon avec détail par carrière (`renderHallOfFame()` / `renderCareerDetail()`
  dans `card.js`), carte canvas partageable et téléchargeable (`renderCareerCard()`), feuille
  de match saison par saison. Aucune demande précise et non satisfaite n'a été retrouvée dans
  l'historique — à clarifier avec l'utilisateur : qu'est-ce qui manque concrètement ?
  **Critère** : à définir avec l'utilisateur une fois le manque précisé.

## Coché récemment

- [x] **AGD-14 — Tuto : installer le lien comme une app sur téléphone** _(implémenté et vérifié le 2026-07-26)_
  Micro-ajout demandé en session : nouvelle 4e section ("04 · Sur ton téléphone") sur l'écran de
  bienvenue/tuto (`screenWelcome()` dans `screens.js`), qui explique en 3 étapes génériques
  (partager → ajouter à l'écran d'accueil → lancer comme une app) comment transformer le lien
  internet en icône d'application sur le téléphone -- réutilise le style "étapes numérotées" déjà
  en place pour la bande de trajectoire (`.ws-traj`), pas de nouveau CSS. Aucun manifest/PWA
  ajouté : juste l'explication du geste navigateur, qui fonctionne déjà tel quel (iOS/Android).
  Vérifié : rendu contrôlé directement (le HTML de `screenWelcome()` contient bien la nouvelle
  section et ses 3 étapes), montré à l'utilisateur via le showcase. Audit de non-régression à 100
  carrières : 0% crash (changement purement textuel, sans risque de régression gameplay).

- [x] **AGD-13 — Identité de club (vraies couleurs officielles, tuile "maillot", pastille d'initiales)** _(implémenté et vérifié le 2026-07-26)_
  Trois volets liés, maintenant que les couleurs réelles de marque sont disponibles :
  1. *Ingestion de `data-source/clubcolor.xlsx`*. `scripts/gen-club-data.mjs` étendu pour lire ce
     fichier (452 lignes club/académie sur 8 nations) et enrichir chaque club/académie de
     `clubData.js` avec `primary`/`secondary` (hex ou `null`), plus un nouveau
     `GLOBAL_CLUB_COLORS` pour les paliers NBA/EuroLeague (hors structure par nation). Matching
     tolérant par nom générique (normalisation accents/casse/ponctuation) : règle découverte et
     appliquée sans hardcoder les divisions — un libellé de division répété sur plusieurs lignes
     désigne toujours le vrai nom dans la colonne Club ; un libellé unique désigne le vrai nom
     dans la colonne Division elle-même (cas des académies nommées séparément de leur club
     parent), avec repli sur le nom du parent si l'académie elle-même n'a pas de couleur propre.
     Table d'alias limitée (25 entrées) pour les écarts de nommage NBA (noms courts type
     "Boston") et quelques clubs EuroLeague à orthographe alternative (FC Barcelone/Barcelona,
     Olympiakos/Olympiacos, etc.), sans toucher `leagues.js`.
     **Écarts de nommage signalés (aucun n'est un vrai trou à corriger)** : 7 clubs/académies du
     jeu sans couleur trouvée — 6 attendus (Fenerbahçe, Maccabi, Žalgiris, Anadolu Efes, Olimpia
     Milano, Virtus Bologne : nations Turquie/Israël/Lituanie/Italie sans fichier source dédié,
     déjà en repli par teinte dérivée du nom avant ce lot) + 1 vrai trou confirmé (South East
     Melbourne Phoenix, NBL australien, aucune ligne de couleur nulle part dans le fichier). 16
     entrées de `clubcolor.xlsx` sans club correspondant dans le jeu, toutes bénignes (libellés
     parents génériques déjà couverts par une couleur directe côté club réel, ex. "Nanterre" vs
     notre "Nanterre 92" déjà coloré directement, ou libellés purement descriptifs sans homologue
     "France", "USA Basketball", "Duke", etc.).
  2. *Tuile profil "maillot"*. L'écusson-bouclier générique est retiré. `.player-card` (styles.css)
     est désormais teintée d'un dégradé diagonal 3 tons aux couleurs réelles du club courant
     (primaire + secondaire pré-calculés en `rgba()` à faible opacité via le nouvel export
     `hexToRgba()`, seule façon fiable de faire varier l'opacité d'une couleur dynamique en CSS),
     change à chaque transfert, garde la structure de lavis déjà en place pour les deux autres
     tuiles principales (fiche technique en or/donnée, choix en cours en prune) — cohérence de
     famille conservée. Bande latérale épaissie (6px→10px) et repli de coin ajoutés en couleurs
     pleines (primaire/secondaire), sans risque de lisibilité car aucun texte ne les recouvre.
  3. *Pastille d'initiales*. Nouvelle fonction `clubInitials()` (`engine/utils.js`) extrait 2-3
     lettres pertinentes d'un nom de club (gère sigles tout capitales type "LA"/"OKC", accents
     Unicode type "Žalgiris", mots grammaticaux filtrés type "Le"/"La"/"of"). Remplace l'écusson
     par une pastille sobre : fond couleur primaire, petit repli de coin en secondaire (écho du
     maillot), encre choisie automatiquement (`textColorOn()`) entre chalk sombre et crème selon
     la luminance du fond pour rester lisible même sur un fond très clair ou très sombre.
  Rendu montré à l'utilisateur via le showcase sur un échantillon volontairement extrême de
  couleurs officielles (Brooklyn Nets noir/blanc, San Antonio Spurs gris clair/noir, Denver
  Nuggets bleu marine/or, Boston Celtics vert/or, ASVEL noir, Real Madrid or/bleu), plus
  Fenerbahçe pour illustrer le repli par teinte dérivée sur un club sans couleur officielle.
  Vérifié : lisibilité calculée exhaustivement sur les 470 clubs réellement colorés (pas un
  échantillon) — pire contraste texte de tuile 8.47:1 pour ASVEL (cible ≥4.5:1, 0 échec sur 470),
  pire contraste encre de pastille 3.88:1 pour Helios Suns Domžale (cible ≥3:1 pour texte
  gras/grand, 0 échec sur 470). Audit de non-régression (aucune logique de jeu touchée, seuls
  rendu/données) : 0% crash sur 100+300 carrières, 0 violation d'intégrité des événements uniques
  (66 événements marqués `once`, contrôle f)), taux de titre élite 13.3% sur 300 carrières —
  dans la bande de bruit déjà établie (7.7-21.7%).

- [x] **AGD-12 — Création et immersion nationale (nationalités, académies, sélection)** _(implémenté et vérifié le 2026-07-26)_
  Trois volets :
  1. *Beaucoup plus de nationalités*. `src/data/nations.js` passe de 14 à **35 nations**,
     couvrant les nationalités réellement représentées en NBA et les nations phares du basket
     mondial (Croatie, Lettonie, Monténégro, Bosnie-Herzégovine, Finlande, Suisse, Ukraine,
     Pologne, Israël -- Europe ; République dominicaine, Bahamas, Îles Vierges -- Amérique du
     Nord ; Argentine, Brésil -- Amérique du Sud ; **Sénégal**, Cameroun, Soudan du Sud, RD Congo
     -- Afrique ; Chine, Japon, Philippines -- Asie), toutes vérifiées par recherche web pour la
     cohérence des noms/forces. Nouveau champ `continent` par nation, utilisé pour la zone de
     tournoi de sélection (`Coupe d'Afrique` ajoutée) et la génération d'académies (point 2).
     Le pays choisi n'affiche plus de championnat de départ associé (texte retiré de l'écran de
     création) : `p.nation.path` n'a plus aucun rôle dans le point de départ sportif, remplacé
     partout où c'était le cas (`season.js` x9, `screens.js` x3, `events/early.js`) par un
     nouveau `p.startPath`, fixé uniquement par l'académie choisie (point 2). Nationalité et
     point de départ sont désormais entièrement découplés.
  2. *Nouveau modèle de départ par académies*. L'ancien point de départ automatique (déduit de
     la nationalité) est remplacé par un vrai écran de choix (`renderAcademyChoice()`,
     `engine/academies.js`) : "les académies s'intéressent à ton profil", 5-6 offres, réparties
     avec au moins une par grand continent doté de données de championnat (Amérique du Nord,
     Europe, Océanie -- les 3 voies jouables), plusieurs sur le continent d'origine du joueur
     s'il en a une localement, et un tirage entièrement aléatoire pour les joueurs venus d'un
     continent sans donnée (Afrique, Asie, Amérique du Sud). Chaque offre porte un vrai club
     d'académie réel (`pickClub('academy', ...)`) ; choisir fixe `p.playNation`/`p.startPath`
     sur le pays de l'académie, pas sur la nationalité -- un prospect sénégalais peut très bien
     démarrer aux États-Unis ou en Europe.
  3. *Sélection nationale beaucoup plus marquante*. Fenêtre de sélection (`p.seasonMods.natWindow`,
     fixée en tête de saison) : bascule complète de thème visuel pour toute la saison de
     tournoi (liseré + chip "Fenêtre sélection" à l'accent dynamique du pays), pas seulement
     l'événement national lui-même. Petite animation d'annonce dédiée (`.nation-announce`) quand
     l'événement national survient. Nouveau choix contextuel (`nation_stakes`, adapté au niveau
     réel du joueur -- star attendue au sommet vs role player du groupe) dont l'issue pèse
     concrètement sur le résultat via `natBonus`. Résultat de tournoi déplacé sur un **écran
     dédié** (`renderNationalResult()`) plutôt qu'une ligne noyée dans le bilan de club : rapide
     et sobre en cas d'élimination, vraie séquence de célébration (médaille agrandie animée,
     halo, motif de fond, mention MVP) en cas de médaille -- une parenthèse à part, pas une
     saison de club de plus.
  Rendu montré à l'utilisateur (écran d'académies, bascule de thème + annonce, résultat rapide
  et célébration or/bronze) via le showcase avant livraison.
  Vérifié : 0% crash sur 80+150+300+300 carrières pilotées après les changements (les deux
  harnais de test, `tests/harness.mjs` et `scripts/deep-audit.mjs`, ont dû être mis à jour pour
  gérer les deux nouveaux écrans -- choix d'académie et résultat national -- insérés dans le
  flux normal de carrière). 0% repli "Club libre". 0 violation d'intégrité des événements
  uniques (66 événements marqués `once`, contrôle f) toujours actif) sur deux runs à 300
  carrières. Taux de titre élite non affecté par ce lot (aucune formule de récompense touchée) :
  13.7%/14.3% sur deux runs à 300, dans la bande de bruit déjà établie. Génération d'académies
  vérifiée directement (script dédié, 200 tirages par profil) : 0 tirage sans les 3 voies pour
  un joueur d'un continent doté de données, tirage bien non garanti pour un joueur d'un
  continent sans donnée (Sénégal/Chine/Argentine testés).

- [x] **AGD-11 — Cohérence de simulation (performance individuelle, tailles de ligue, rôle)** _(implémenté et vérifié le 2026-07-26)_
  Quatre volets liés, le premier touchant l'équilibrage :
  1. *Performance individuelle → résultat d'équipe/sélection*. Bug de fond identifié :
     `simulateStandings()`/`teamRating` (club du joueur) utilisait un prestige générique de
     ligue comme base, jamais la force RÉELLE du club spécifiquement signé (alors que les clubs
     adverses du classement, eux, utilisaient déjà leur vraie force) — une superstar dans un
     club réel faible et un role player dans un club réel fort avaient donc exactement la même
     note de départ. Nouvelle fonction `clubPercentile()` (`engine/competition.js`, pure,
     déterministe) situe le club du joueur dans son vrai vivier de ligue (padding compris, voir
     point 2) ; `teamRating` combine désormais ce percentile réel + l'apport individuel du
     joueur (coefficient recalé 1.2 → 1.25, avec un terme de percentile ±12) + bruit. Sélection
     nationale (`natPower`) déjà structurellement saine (force réelle de la nation + apport
     individuel) — coefficient individuel relevé par cohérence (0.6 → 0.75), pas de bug de fond
     symétrique à corriger là.
     Audité soigneusement comme demandé : taux de titre élite avant ce lot ~12-16% (bande de
     bruit déjà établie), après plusieurs cycles de réglage (premier essai à coefficient 1.9
     → 21%, trop haut, redescendu) : **4 runs à 300 carrières stabilisés à 13.3% / 17% / 14.7% /
     14.7%, moyenne ~14.9%** — dans la fourchette crédible, pas de dérive. Corrélation vérifiée
     directement (pas seulement le taux agrégé) : sur 300 carrières ayant atteint un palier
     élite, taux de titre par pic d'OVR — <80 (role player) 1.1%, 80-87 : 9.3%, 88-93 (star) :
     24.5%, >=94 (superstar) : 33.3%. Écart ~30x entre role player et superstar : le niveau
     individuel pèse désormais nettement, sans effacer le poids de la force réelle d'équipe
     (vérifié séparément : même OVR pile au seuil générique de titulaire → "rotation" dans le
     club le plus fort de sa ligue, "titulaire" dans le plus faible).
  2. *Nombre réel de clubs par championnat*. Nombres vérifiés séance tenante (recherche web,
     saison 2024-25) : NBA 12→30 clubs, EuroLeague 9→18 (listes complètes ajoutées dans
     `data/leagues.js`, les clubs non curés utilisant le repli par hachage déjà prévu pour ce
     cas), Élite 2 France 16→20 et SuperLiga Serbie 6→8 (padding par clubs génériques dédiés au
     seul calcul de classement, jamais sélectionnables comme club du joueur — voir
     `REAL_LEAGUE_SIZE`/`paddedPool()` dans `competition.js`). Les autres paliers vérifiés
     étaient déjà exacts ou à ±1 près (variation normale de saison à saison, non corrigée) :
     BBL Allemagne, Betclic Élite France, ACB Espagne, NBL Australie, G League, Slovénie, Grèce
     (élite), 2e division Allemagne/Grèce.
  3. *Texte de bilan de saison incohérent avec le rôle réel*. `seasonVerdict()` comparait
     l'OVR à des seuils propres (dupliqués, désynchronisés de `roleOf()`) — un titulaire net
     pouvait entendre "tu grappilles ta place dans la rotation" (le cas signalé). Réécrit pour
     appeler `roleOf(p)` directement (source unique du rôle), un message dédié par palier de
     rôle (bench/rotation/starter/star/franchise).
  4. *Évolution du rôle dans le club*. `roleOf()` (engine/player.js) et le calcul des minutes
     (`simulateSeason()`) utilisent désormais le même `clubPercentile()` que le point 1 pour
     ajuster les seuils titulaire/star à la force RÉELLE de l'effectif (pas seulement au seuil
     générique de la ligue) : un effectif fort relève la barre (arriver plus faible que
     l'effectif place sur le banc), un effectif faible l'abaisse. Progression testée
     directement : à club fixe (fort), rôle passe rotation → titulaire → franchise à mesure que
     l'OVR monte (50 → 60 → 69 → 75 → 82 → 90), sans saut ni incohérence.
  Vérifié globalement : 0% crash sur 150+300+300×5 carrières, 0% repli "Club libre", 0
  violation d'intégrité des événements uniques (contrôle f) toujours actif), 0 incohérence
  texte/rôle sur 1771 bilans de saison vérifiés (80 carrières pilotées dédiées).

- [x] **AGD-10 — Correction de cohérence : événements uniques qui se répétaient** _(implémenté et vérifié le 2026-07-26)_
  Revue complète des ~155 événements (`src/data/events/*.js`) pour repérer les décisions
  structurantes/fondations/premières fois qui ne portaient pas le marqueur `once:true`. Trois
  événements corrigés dans `mid.js` (repérés par comparaison avec leurs équivalents déjà
  correctement marqués `once` : `youth_camp_host` vs `charity_foundation`, `nation_leader` vs
  `captaincy_vote`/`union_rep`) :
  - `youth_camp_host` ("Organiser ton propre camp d'été", le cas signalé) : `cooldown:4` → `once:true`.
  - `nation_leader` ("On te veut capitaine de la sélection") : `cooldown:4` → `once:true`.
  - `shoe_deal_upgrade` ("Ta marque veut passer un cap avec toi", négociation de chaussure
    signature à ton nom) : `cooldown:4` → `once:true`.
  Tous les autres événements à connotation "première fois" (early.js quasi entièrement,
  late.js quasi entièrement, threads.js entièrement) portaient déjà correctement le marqueur ;
  aucune autre lacune trouvée. Le mécanisme d'application (`drawEvents()` dans `season.js`,
  exclusion dure `if(ev.once && st.count>=1) continue`) était déjà correct et n'a pas eu besoin
  d'être modifié — seules les métadonnées de contenu manquaient sur ces 3 événements.
  Nouveau contrôle permanent ajouté à `scripts/deep-audit.mjs` (section "f) Intégrité des
  événements uniques") : pour chaque carrière pilotée, compte les occurrences de chaque
  événement dans `eventHistory` et signale tout id marqué `once` vu plus d'une fois dans une
  même carrière (jamais à travers plusieurs carrières différentes, où la répétition est
  normale). Testé positivement sur un historique synthétique avec doublon volontaire (détecté
  correctement) avant d'être validé en conditions réelles.
  Vérifié : 0% crash sur 100+300 carrières après le changement ; audit à 300 carrières,
  section f) : 0 violation sur les 66 événements désormais marqués `once` (63 avant ce
  correctif). Indicateurs de récompense stables dans la bande de bruit déjà établie.

- [x] **AGD-09 — Raffinement visuel décor/donnée** _(implémenté et vérifié le 2026-07-26)_
  Lot purement visuel (aucun changement de gameplay), dans la continuité Terre battue. Sept
  volets :
  1. *Décor vs donnée* : nouveau sous-thème visuel pour les blocs de données qui évoluent
     (stats, jauges, OVR, classement) — lavis or discret + bordure un cran plus définie
     (`--data-wash`/`--data-line` dans `styles.css`), appliqué aux jauges du profil, à la fiche
     technique, à l'anneau OVR, aux stats de saison et au contexte de compétition. Le récit
     (texte narratif, choix, motifs d'ambiance) garde le décor crème/terracotta inchangé.
  2. *Trois tuiles principales teintées* : profil (terracotta, accentué), fiche technique
     (or/donnée), carte de choix en cours (prune) — lavis discrets et distincts sur les trois
     cartes de l'écran de jeu principal.
  3. *Forme des tuiles* : bordures adoucies (semi-transparentes plutôt qu'un trait plein
     uniforme), ombre douce dédiée par tuile (`--tile-shadow`), coins arrondis agrandis --
     `.opt`, `.choice`, `.lg`, `.trophy-item`, `.ws-stat`, `.hof-row`, `.best-season`.
  4. *Fond des tuiles assombri* : `--panel` blanc pur → ivoire chaud (#FAF5EA), `--panel2`
     assombri en proportion -- effet global sur la quasi-totalité des cartes de l'appli.
  5. *Vert/rouge classiques* : nouveaux tokens `--green`/`--red` dédiés aux résultats de
     décision (delta OVR, flash-up/down), remplaçant l'ancien `--up` qui pointait en réalité
     vers une teinte or (pas un vert). Contraste AA vérifié (>=4.5:1) sur les trois fonds
     pertinents (`--court`/`--panel`/`--court2`).
  6. *Hiérarchie du bilan de saison* : stats de jeu (PTS/REB/PAS/CTR/INT) dans la grille
     "donnée" existante, MIN/MJ/VIC désormais dans une bande à part (`.statline-ctx`), plus
     petite, sobre, sans lavis -- se lit comme un cadre plutôt qu'une ligne de score.
  7. *Écran titre* : passage à la police condensée 'Big Shoulders Display' (agrandie, ombre
     portée légère pour le caractère), clamp recalé pour une marge de sécurité réelle à 360px.
     Bug trouvé et corrigé en session : cette police était déjà utilisée par endroits
     (`nat-tourn`, `legend-title`) depuis un chantier précédent mais n'était en réalité JAMAIS
     chargée dans le vrai jeu (absente du `@import` Google Fonts de `styles.css`, seul le
     showcase de revue visuelle l'inlinait séparément) -- corrigé, ajoutée à l'`@import`.
  Vérifié : rendu écran par écran montré à l'utilisateur via le showcase avant livraison. Audit
  de non-régression à 300 carrières après les changements : 0% crash, 0% repli "Club libre",
  indicateurs de récompense (titre 18.7%, titre élite 14.7%, MVP 8%, phénomène 1.7%, All-Star
  26%, HOF 12.3%) dans la bande de bruit déjà établie -- attendu, aucune logique de jeu touchée
  (seuls `styles.css` et deux points de rendu HTML/couleur dans `screens.js` modifiés).

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
