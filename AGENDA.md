# AGENDA — fonctionnalités demandées, pas encore livrées

Registre des demandes en attente sur HARDWOOD. Chaque entrée porte un identifiant stable,
une description courte du manque, et un **critère de validation observable** : la façon dont
on constatera — sans ambiguïté, via l'audit ou l'usage réel du jeu — que c'est fait.

Règle de mise à jour : voir `CLAUDE.md`. Une ligne n'est cochée que si elle a été réellement
implémentée **et** vérifiée (audit ou test) dans la session qui la coche.

## Ouvert

- [ ] **AGD-07 — Enrichissement de la carte de fin et du Panthéon**
  Ajouté au registre le 2026-07-26 (mêmes réserves de provenance que AGD-06). État actuel déjà
  substantiel : citations de presse (`pressReview()`), courbe d'évolution OVR (`sparkline()`),
  classement Panthéon avec détail par carrière (`renderHallOfFame()` / `renderCareerDetail()`
  dans `card.js`), carte canvas partageable et téléchargeable (`renderCareerCard()`), feuille
  de match saison par saison. Aucune demande précise et non satisfaite n'a été retrouvée dans
  l'historique — à clarifier avec l'utilisateur : qu'est-ce qui manque concrètement ?
  **Critère** : à définir avec l'utilisateur une fois le manque précisé.

- [ ] **AGD-24 — Handle/@ à ajouter à la signature auteur**
  Ajouté au registre le 2026-07-27, en creusant AGD-23 point 1. La signature « Créé par
  Gaspard G » est en place en pied de l'écran titre (`.credit` dans `styles.css`,
  `screenTitle()` dans `screens.js`), mais l'utilisateur a explicitement indiqué vouloir y
  accoler un handle/@ qu'il préciserait plus tard — jamais fourni dans la session AGD-23.
  **Critère** : le handle fourni apparaît accolé à la signature (ex. « Créé par Gaspard G ·
  @handle »), vérifié par rendu direct de l'écran titre.

## Coché récemment

- [x] **AGD-23 — Lot identité et partage** _(implémenté et vérifié le 2026-07-27)_
  Demande en 3 points. Vérification directe du code AVANT tout ajout (conformément à la
  consigne de ne jamais se fier à une impression) : les points 2 et 3 étaient déjà entièrement
  en place depuis un chantier antérieur (`ffe3bda`, avant l'ouverture de cet AGENDA), reconfirmés
  plutôt que refaits ; seul le point 1 était un vrai manque, comblé cette session.
  1. *Signature auteur*. Nouvelle ligne `.credit` en pied de l'écran titre (`screenTitle()`
     dans `screens.js`), sous la ligne `.kbd` existante ("comment jouer ?") — jamais entre le
     wordmark et le reste, opacité réduite (0.65) pour rester nettement plus discrète que le
     reste du pied de page, cohérente avec la palette Terre battue (`--chalk-dim`,
     'Bricolage Grotesque'). Texte actuel : « Créé par Gaspard G » — **handle/@ pas encore
     fourni par l'utilisateur, voir AGD-24 ci-dessus, laissé ouvert plutôt que d'inventer un
     placeholder visible**.
  2. *Métadonnées Open Graph*. Déjà entièrement en place dans `index.html` (balises
     `og:title`/`og:description`/`og:image`/`og:image:width`/`og:image:height` +
     `twitter:card=summary_large_image`/`twitter:title`/`twitter:description`/`twitter:image`)
     et l'image `public/og-image.png` déjà générée (visuel fait maison, logo + wordmark +
     accroche, sans dépendance externe) — vérifié aux dimensions exactes demandées, **1200×630
     confirmé par lecture directe des pixels**. Aucun changement de code nécessaire.
  3. *Titre et méta-description d'onglet*. Déjà en place et déjà de bonne qualité : `<title>HARDWOOD
     · carrière basket</title>`, meta description vendeuse et distincte du tag de l'écran titre
     ("De 16 à 38 ans, écris ta légende du basket. Une carrière complète, saison après saison,
     où chaque choix compte, jusqu'à la NBA, ou pas."). Aucun changement de code nécessaire.
  Rendu montré à l'utilisateur via le showcase avant livraison (écran titre avec la nouvelle
  signature, nouvelle section dédiée à la vignette de partage affichant `og-image.png` en
  taille réelle).
  Vérifié : changement purement cosmétique/textuel (aucune logique de jeu touchée, seuls
  `styles.css` et `screens.js` modifiés, uniquement le pied de l'écran titre) — 0% crash sur
  100 carrières auditées, comme attendu pour ce type de changement.

- [x] **AGD-22 — Correction du rattachement d'académie** _(implémenté et vérifié le 2026-07-27)_
  Bug de fond identifié : le choix d'académie fonctionnait à l'écran (5-6 offres affichées avec
  un vrai nom de club) mais ne déterminait jamais réellement le point de départ. Deux tirages
  indépendants et non synchronisés : `renderAcademyChoice()` (`screens.js`) appelait
  `pickClub('academy', n.id)` à l'AFFICHAGE pour montrer une carte, puis `chooseAcademy()`
  (`season.js`) appelait un second `pickClubName(p.league, playCountry(p))` complètement
  indépendant au clic -- le joueur démarrait donc systématiquement dans un club différent (tiré
  au hasard dans le même pays) de celui affiché sur la carte qu'il avait choisie.
  Corrigé en 3 points :
  1. *Un seul tirage, attaché à l'offre*. `generateAcademyOffers()` (`engine/academies.js`) tire
     désormais le vrai club UNE FOIS à la génération des offres et l'attache à chaque offre
     (`{...nation, club}`, copie superficielle -- jamais de mutation des objets partagés de
     `NATIONS`). `renderAcademyChoice()` affiche ce club déjà tiré (plus de second tirage à
     l'affichage) ; `chooseAcademy()` fixe `p.club` sur ce même objet au clic. Le club affiché
     EST désormais, à coup sûr, le club de départ réel.
  2. *Niveau et prestige réellement pris en compte*. Bug annexe trouvé en creusant : les
     académies FR/DE/GR/RS/SI/US (source Excel dédiée) notent leur niveau via un champ `rating`
     (et non `strength` comme les autres paliers) -- `clubStrength()` (`engine/competition.js`)
     ne reconnaissait que `strength`, ignorait donc silencieusement `rating` et retombait sur une
     force dérivée du nom (`hashStrength`, 58-95 pseudo-aléatoire stable), sans aucun rapport
     avec le niveau réel défini dans l'Excel. Corrigé par un repli explicite sur `rating` quand
     `strength` est absent -- le niveau/prestige réel de l'académie choisie influence désormais
     vraiment le classement/percentile de la première saison.
  3. *Club pro lié, jusque-là invisible*. Le champ `linkedClub` (ex. `Cholet Formation` ->
     `linkedClub:'Cholet'`) existait dans les données depuis leur ingestion mais n'était utilisé
     nulle part dans le jeu (recherche exhaustive : zéro référence hors `clubData.js`) --
     `flavor()` (`screens.js`) exigeait un `category` non nul pour afficher quoi que ce soit, or
     les académies à `linkedClub` ont justement `category:null`, donc leur texte de couleur
     (`comment`, ex. "Référence nationale") n'apparaissait JAMAIS non plus, en plus du club lié.
     Nouvelle fonction `academyFlavor()`, tolérante aux deux formats de source coexistant dans
     `clubData.js` (FR/DE/GR/RS/SI/US : `linkedClub`+`category:null` ; AU : `category` classique
     sans `linkedClub`) : affiche désormais "Filière {club pro}" quand disponible, sinon la
     catégorie, plus le commentaire dans tous les cas. Répercuté aussi dans le message de début
     de carrière (`pushTL` dans `chooseAcademy()`).
  Rendu montré à l'utilisateur via le showcase avant livraison (carte d'académie avec le texte
  "Filière {club}" désormais visible).
  **Vérifié directement, pas seulement par audit statistique** : script dédié pilotant le DOM
  (lecture du nom affiché sur CHAQUE carte avant clic, comparaison stricte avec `p.club` après
  clic) sur 8 cas -- France/USA/Australie (voie locale garantie), **Sénégal/Chine/RD Congo
  (aucune voie locale dans les données, tirage d'académie 100% aléatoire -- le cas explicitement
  demandé)**, plus 2 nations aléatoires : **8/8 correspondance exacte**, aucun repli "Club
  libre". Exemples observés : Sénégal -> "Perth Wildcats Academy" (Australie, affiché ET réel),
  Chine -> "Spartak Subotica Youth" (Serbie, affiché ET réel), RD Congo -> "FMP Youth Program"
  (Serbie, affiché ET réel) -- confirme qu'un prospect africain/asiatique atterrit bien sur
  l'académie précise qu'il a choisie, à l'étranger, jamais sur un club générique de son pays.
  Audit de non-régression (deux runs indépendants de 300 carrières, ce changement touchant le
  calcul de force de club dès la première saison) : 0% crash, 0% repli "Club libre", 0 violation
  d'intégrité des événements uniques, 0 incohérence de format NBA sur les deux runs. Taux de
  titre élite 16% puis 10.7% sur les deux runs -- moyenne ~13.4%, dans la bande "normale" déjà
  établie (12-16%), confirmé stable (pas de dérive causée par la prise en compte du vrai niveau
  d'académie). Corrélation force de club -> résultat toujours monotone après le changement
  (vérifiée sur les deux runs, NBA et toutes ligues).

- [x] **AGD-21 — Lot sélection nationale, temps fort de carrière** _(implémenté et vérifié le 2026-07-27)_
  Demande en 4 points. Vérification directe du code AVANT tout ajout (conformément à la
  consigne de ne jamais se fier à une impression) : 3 des 4 points étaient déjà entièrement
  satisfaits par le chantier AGD-12 (même session, précédent), reconfirmés plutôt que refaits ;
  un seul point avait un vrai manque, comblé cette session.
  1. *Bascule visuelle complète* : déjà en place (AGD-12) via `p.seasonMods.natWindow` (fixé en
     tête de saison, `beginSeason()` dans `season.js` : `p.reputation>=45 && p.year%2===0`),
     classe `.nation-window` (liseré + motif à l'accent DYNAMIQUE du pays, `engine/accent.js`,
     `NATION_ACCENT`), mode HUD dédié (`renderHUD('nation')`) et chip "Fenêtre sélection" avec
     drapeau -- contraste net avec les écrans de club confirmé par lecture directe de
     `renderEvent()` (`screens.js`). Aucun changement de code nécessaire.
  2. *Animation d'annonce* : déjà en place et déjà GÉNÉRIQUE (AGD-12/AGD-06), pas seulement
     câblée à la première convocation -- `isNatAnnounce = ev.cat==='nation'` dans `renderEvent()`
     applique automatiquement `.nation-announce` (réutilise `@keyframes natAnnounce`) à TOUT
     événement de cette catégorie. Confirmé réutilisable pour les grands rendez-vous
     internationaux : 5 événements `cat:'nation'` en bénéficient déjà, le nouvel événement de
     rivalité (point 3) en hérite automatiquement sans câblage supplémentaire (vérifié par rendu
     forcé). Aucun changement de code nécessaire.
  3. *Choix contextuels* : 3 des 4 thèmes demandés déjà couverts (AGD-12 et sessions antérieures)
     -- statut dans le groupe (`nation_stakes`, star attendue vs role player), pression du pays
     (`nation_stakes`, `nation_leader`), fatigue club/sélection (`federation_club_conflict`,
     `youth_national_call`). Manquait : rivalité INTERNE au groupe (deux joueurs de la même
     sélection visant le même rôle) -- distinct des événements de rivalité existants
     (`rivalry`/`rival_duel`), qui opposent à un adversaire, jamais rencontré en club. Nouvel
     événement `nation_rivalry` (`data/events/shared.js`), gated sur `natWindow` + `p.natCap`
     (déjà été convoqué), résolution `actionRoll` cohérente avec `nation_stakes` (imposer son
     rapport de force, risqué, vs répartition diplomatique des rôles, plus sûre), aucun indice
     chiffré dans les intitulés, `natBonus` en jeu (enjeu mécanique réel sur le résultat du
     tournoi, pas seulement narratif) -- toutes les conventions du moteur respectées.
  4. *Séquence de fin de compétition graduée* : déjà en place (AGD-12) via
     `renderNationalResult()` (écran dédié, `screens.js`), variante `.quick` sobre en quelques
     lignes si élimination, variante `.celebrate` (médaille agrandie animée, halo, mention MVP)
     si médaille -- `NAT_MEDAL_COPY` avec un texte distinct par palier (Or/Argent/Bronze).
     Palmarès national déjà distinct du palmarès club (`classifyAccolade()` dans `trophies.js`).
     Aucun changement de code nécessaire.
  Rendu montré à l'utilisateur via le showcase avant livraison (annonce de convocation,
  bascule de thème fenêtre de sélection, nouveau choix de rivalité interne, résultat rapide
  élimination, résultat célébration or, résultat célébration bronze).
  Vérifié (300 carrières, deux runs indépendants) : 0% crash, 0 violation d'intégrité des
  événements uniques (69 événements marqués `once` désormais, +1), 0 incohérence de format NBA.
  **`nation_rivalry` confirmé reachable et non-dominant** : run dédié de 300 carrières pilotées,
  vu dans 12% des carrières (36/300), sur 71/300 carrières ayant vécu au moins un événement de
  fenêtre nationale -- fréquence cohérente avec son double verrou (`natWindow` + `natCap`).
  Taux de titre élite : 9.7% sur le premier run à 300 (sous la bande "normale" 12-16% mais dans
  la bande de bruit acceptable 7.7-21.7%), **12.7% sur un second run indépendant à 300** --
  confirme qu'il s'agissait de bruit d'échantillonnage, pas d'une dérive : le seul ajout de
  code de ce lot est un événement narratif à effets modestes (`natBonus`/`reputation`/`coach`
  ±2 à ±6), sans logique de récompense touchée.

- [x] **AGD-20 — Lot confort et fin de carrière** _(implémenté et vérifié le 2026-07-27)_
  Trois volets :
  1. *Navigation et reprise de partie*. Bouton accueil persistant (`ui/navbar.js`) : posé UNE
     SEULE fois en dehors de `#stage` (position fixe, coin haut-gauche), survit à chaque
     `stage.innerHTML = ...` au lieu d'avoir besoin d'être réinjecté par chaque écran -- ne casse
     donc jamais la mise en page. Visible uniquement pendant une carrière (`setInCareer()`, posé
     dans les écrans concernés). Sauvegarde automatique persistante (`engine/savegame.js`, même
     stockage robuste que le Panthéon/les badges : localStorage + repli mémoire). Déclenchée par
     un unique écouteur de clic global (`main.js`) plutôt que d'instrumenter chaque point de
     mutation -- tout le jeu étant piloté par clics, ce point d'ancrage couvre fidèlement toute
     la progression -- complété par `visibilitychange`/`pagehide` en filet de sécurité. **Piège
     trouvé et corrigé en session** : `p.curEvents` contient des RÉFÉRENCES aux objets du
     catalogue d'événements, dont `choices`/`body`/`when`/`weight` sont des fonctions --
     `JSON.stringify` les supprime silencieusement (aucune erreur, juste des événements cassés au
     réveil, `ev.choices is not a function`). Corrigé en sauvegardant leurs id et en les
     ré-résolvant dans `EVENTS` au chargement -- vérifié qu'aucun autre champ de l'état joueur ne
     porte de fonction imbriquée (recherche exhaustive sur une carrière complète pilotée).
     Reprise EXACTE de l'écran en pause (`resumeCareer()`) : décision de mouvement/académie en
     attente en priorité (mémorisée telle quelle via `p.pendingMove`/`p.pendingAcademyOffers`,
     posée à l'affichage et effacée au prochain `beginSeason()` -- seul point de sortie commun à
     tous les chemins de résolution), sinon l'événement courant (`p.curEvents`/`p.evIndex`, déjà
     persistants), sinon le bilan de la dernière saison jouée. Bouton "🖊 Reprendre ma carrière"
     sur le titre (principal dès qu'une sauvegarde existe). Deux garde-fous vérifiés : la
     sauvegarde survit à un retour à l'accueil (rien n'est perdu par accident) ; commencer une
     nouvelle carrière quand une sauvegarde existe demande confirmation (`confirm()`) avant de
     l'écraser, annulable. Repli mémoire vérifié directement (stockage localStorage cassé simulé,
     0 erreur levée).
  2. *Fin de carrière anticipée et forcée*. Nouveau risque probabiliste de fin SUBIE (blessure
     grave), distinct du déclin déjà existant (`p.age>=34` + OVR trop bas) : uniquement
     `p.age>=33`, le même seuil que le bouton de retraite volontaire -- jamais sur un jeune.
     Probabilité faible, qui augmente avec l'âge ET l'usure réelle du corps (forme, voir
     `engine/vitals.js` -- une carrière qui a beaucoup drainé sa forme est mécaniquement plus
     exposée), un peu plus pour un profil déjà marqué "fragile". **Rééquilibrage nécessaire en
     session** : un premier calage donnait 30% des carrières terminées ainsi (bien trop, "rare"
     doit rester rare) -- magnitudes réduites d'un facteur ~2,5, reconfirmé à 12%. Mise en scène
     dédiée (`renderForcedRetirement()`), sobre et sombre, volontairement à l'opposé du ton
     festif de la fin volontaire -- un vrai moment, pas une ligne noyée dans le bilan habituel.
     **Bug trouvé et corrigé en session** : ni `tests/harness.mjs` ni `scripts/deep-audit.mjs` ne
     connaissaient ce nouvel écran -- toute occurrence était comptée à tort comme un crash
     (`tests/audit.mjs` levait "État d'écran non reconnu"). Corrigé dans les deux harnais.
  3. *Vocabulaire basket*. Balayage complet du texte à la recherche de résidus football :
     "Raccrocher les crampons" -> "Raccrocher les baskets" (bouton + narration en `late.js`),
     "l'attaquant qui déboule" -> "l'adversaire qui déboule" (`attributes.js`), "le pire
     attaquant adverse" -> "le meilleur scoreur adverse" (`tags.js`, trait verrou défensif),
     "les attaquants adverses" -> "les attaques adverses" / "les meilleurs scoreurs adverses"
     (`attributes.js`/`threads.js`). Vérifié négatif sur un large balayage de termes football
     classiques (pénalty, hors-jeu, carton, gardien, mi-temps, tacle, banc de touche...) --
     aucun autre résidu trouvé. "Milieu de terrain" (position sur le terrain, buzzer-beater),
     "corner" (tir de coin, vocabulaire basket réel), "prolongation" (overtime, existe aussi en
     basket) et "maillot"/"sélectionneur" (universels tous sports) confirmés légitimes, non
     modifiés.
  Rendu montré à l'utilisateur via le showcase avant livraison (titre avec reprise, écran de fin
  subie).
  Vérifié (300 carrières) : 0% crash, 0% repli "Club libre", 0 violation d'intégrité des
  événements uniques, 0 incohérence de format NBA. Taux de titre élite 15% -- dans la bande
  "normale" déjà établie (12-16%), aucune dérive causée par ce lot. **Fréquence des fins subies
  sur blessure : 12% (36/300)**, âge 33-38 ans (moyenne 35.8) -- jamais avant le seuil de
  retraite volontaire, confirmé rare après rééquilibrage (mesuré dans des conditions
  délibérément défavorables : l'audit pilote au hasard et ne clique jamais la retraite
  volontaire, donc chaque carrière testée va au bout de la zone à risque -- le taux réel en jeu,
  où un joueur choisirait souvent de partir avant, sera plus bas encore). Reprise de partie
  vérifiée directement sur les 4 points de pause possibles (événement en cours, bilan de saison,
  offre de transfert en attente, choix d'académie en attente) : dans chaque cas, sauvegarde puis
  rechargement reproduit exactement le même écran, avec les mêmes options.

- [x] **AGD-19 — Rendre les stats et les traits vivants** _(implémenté et vérifié le 2026-07-27)_
  Deux chantiers liés (les stats molles doivent se sentir à l'écran, pas seulement tourner en
  coulisses) :
  1. *Stats molles vivantes*. Nouveau module `engine/vitals.js`. La forme (fitness) ne récupérait
     avant ce lot qu'à la hausse en début de saison (+8 à +20, plancher 30) sans aucun coût réel
     lié à la charge de jeu -- elle plafonnait donc quasiment tout le temps près de 100,
     spécialement en milieu/fin de carrière (le bug signalé). Remplacé par une vraie fatigue :
     `applyFatigue()` (fin de saison, dans `postSeason()`) draine la forme proportionnellement à
     la charge RÉELLE encaissée (minutes x proportion de matchs joués, ramené à la référence d'un
     titulaire à plein temps ; blessure = facture alourdie) ; `applyRecovery()` (début de saison)
     ne restaure plus qu'une récupération modeste et de moins en moins efficace avec l'âge. Moral/
     popularité/médias reçoivent une dérive douce vers une base neutre à chaque intersaison
     (`applySoftStatDrift()`) pour ne plus seulement monter au fil des choix narratifs -- les
     médias suivent une base DYNAMIQUE (notoriété réelle : popularité x0.6 + réputation x0.4,
     pas une base fixe, qui laissait la jauge quasi immobile à l'essai, écart-type 2.2 seulement).
     Lisibilité sans complexité ajoutée, comme demandé : ligne de contexte sous les jauges du HUD
     qui commente la stat la plus notable du moment (`statContextLine()`, une seule à la fois --
     "Corps à plat...", "Vestiaire tendu...", etc.) ; puce discrète sur un choix d'événement dont
     l'effet touche une des 4 stats molles (`statHintDots()` dans `screens.js`) ; 4 nouveaux
     événements de réaction à un seuil marquant (`data/events/wellbeing.js` : crise de forme,
     coup de mou, explosion de popularité, surexposition médiatique).
     **Rééquilibrage nécessaire en session** : le premier calage (forme moyenne ~49, très
     dispersée) a fait chuter le taux de titre élite à 6-8%, sous la bande établie -- la
     sensibilité de `form` à la forme dans `simulateSeason()` (coefficient 0.85) supposait une
     forme quasi toujours proche de 100 ; avec la forme redevenue réellement volatile, cette
     pente donnait un `form` moyen très inférieur à avant, ce qui écrasait la production ET,
     via `growthFactor` (`applyAging()`), la progression d'attributs sur toute la carrière.
     Corrigé en réduisant la sensibilité de `form` à la forme (0.85 -> 0.4, base 0.15 -> 0.6) :
     la jauge affichée reste très vivante, sa traduction mécanique reste contenue.
  2. *Traits visibles et animés*. Unifie le système d'étiquettes déjà en place (`engine/tags.js`,
     4 registres jeu/mental/média/finance, déjà avec seuil + décroissance + couple avantage/
     inconvénient) plutôt que d'en créer un second. Ajouts : `checkTraitUnlocks()` détecte le
     moment précis où un trait franchit son seuil (comparaison avec `p.lastActiveTagIds`),
     déclenchant une animation "Trait débloqué" (`renderTraitUnlockCard()`, même mise en scène
     d'entrée que `.nation-announce`/`.grand-moment-announce` -- réutilisation assumée) dans le
     même bandeau que le retour de choix habituel, jamais un écran/clic supplémentaire. Un trait
     peut désormais se perdre parce qu'un choix suivant le CONTREDIT directement, pas seulement
     par oubli : table `OPPOSES` (bling/saver, sulfureux/chouchou des médias), un flag qui nourrit
     l'un affaiblit activement l'autre s'il est en cours. Trois traits (clutch/verrou défensif/
     fragile) qui n'avaient qu'un effet mécanique à sens unique malgré un couple avantage/
     inconvénient affiché ont été corrigés pour vraiment coûter quelque chose (fitness-1 à chaque
     fois, cohérent avec leur "con"). Effet durable sur la suite de la carrière : 4 nouveaux
     événements gatés sur un trait ACTIF (`data/events/traits_payoff.js`, via `hasTrait()`, pas le
     compteur de flag brut -- un trait perdu ne rouvre plus ces situations) : offre
     d'investissement réservée aux Économes, pression de train de vie pour les Bling, brassard
     officiel pour les Leaders, crise médiatique récurrente pour les Sulfureux.
  Rendu montré à l'utilisateur via le showcase avant livraison (ligne de contexte + puce de choix,
  animation "Trait débloqué", 4 nouveaux événements de seuil).
  Vérifié (300 carrières) : 0% crash, 0% repli "Club libre", 0 violation d'intégrité des
  événements uniques, 0 incohérence de format NBA. **Taux de titre élite 15.7%** -- dans la bande
  "normale" déjà établie (12-16%), confirmé après le rééquilibrage. **Dispersion des stats
  molles (6697 instantanés de fin de saison)** : forme moyenne 52.5 (écart-type 29.2, min 0, max
  100, seulement 11.2% des saisons quasi au plafond -- contre quasiment 100% avant ce lot) ;
  moral moyenne 78.1 (écart-type 17.5) ; popularité moyenne 44.5 (écart-type 22.5) ; médias
  moyenne 41.1 (écart-type 15.3, contre 2.2 à l'essai initial avec une base fixe). **Sobriété des
  traits** : 0.3 trait actif en moyenne simultanément, 97.3% des instantanés à 0 ou 1 trait, 4
  traits actifs en même temps observés seulement 2 fois sur 6697 -- reste bien "quelques traits à
  la fois". Les 8 nouveaux événements confirmés reachable sur un run dédié de 200 carrières
  (`fitness_crisis` 97x, `bling_lifestyle_pressure` 25x, `saver_investment_offer` 28x,
  `media_saturation` 9x après ajustement de seuil -- 0x à l'essai initial, trop haut --, etc.).

- [x] **AGD-18 — Ajustement dominante Charlotte/Utah + re-vérification AGD-06** _(implémenté et vérifié le 2026-07-27)_
  Deux points, le premier déjà satisfait avant cette session (re-vérifié plutôt que refait) :
  1. *AGD-06 (animations des moments forts côté club)* : déjà implémenté et coché lors d'un
     chantier précédent cette même session (`.grand-moment-announce` dans `styles.css`, posé en
     JS dans `renderEvent()` pour clutch/défense/duel/finale, réutilise `@keyframes natAnnounce`
     de l'annonce de sélection nationale). Confirmé intact par lecture directe du code puis par un
     rendu forcé des 4 catégories (`clutch_shot`, `defensive_stand`, `rival_duel`, `finals_moment`)
     : la classe d'animation est bien posée à chaque fois, 0 erreur. Aucun changement de code
     nécessaire.
  2. *Dominante de couleur Charlotte/Utah, corrigée dans `CLUB_DOMINANT_OVERRIDE`
     (`engine/accent.js`)* : Charlotte passe au bleu clair/sarcelle (teal, `#00788C`) en
     dominante (violet en secondaire) -- inverse du choix précédent, sur demande explicite.
     Utah passe au violet emblématique (`#4B2E83`, identité "montagnes" des années 90, absente
     des deux couleurs officielles actuelles ingérées depuis l'Excel -- teinte choisie à la main)
     en dominante, or gardé en secondaire. Table toujours un simple objet `{primary,secondary}`
     par nom de club, ajouter un club supplémentaire ne demande qu'une ligne. Contraste
     exhaustif revérifié sur les 460 clubs réels après ce changement : toujours 0 échec sous
     4.5:1 (texte de tuile) et 0 échec sous 3:1 (encre de pastille). Doublon "Los Angeles
     Lakers" revérifié à l'ingestion (`npm run gen:data`) : toujours absent (une seule ligne NBA
     dans `data-source/clubcolor.xlsx`, la détection de doublons conflictuels ajoutée au chantier
     précédent n'a rien signalé). South East Melbourne Phoenix confirmé toujours pourvu de sa
     couleur de repli manuelle (`MANUAL_COLOR_FALLBACK`, AU/nbl 10/10 clubs colorés).
  Rendu montré à l'utilisateur via le showcase avant livraison (Charlotte et Utah ajoutés en
  exemples dédiés à la section identité de club).
  Vérifié : 0% crash sur 100+200 carrières, 0 violation d'intégrité des événements uniques, 0
  incohérence de format NBA. Taux de titre élite 13% sur 200 carrières, dans la bande de bruit
  déjà établie (7.7-21.7%) -- attendu, aucune logique de jeu touchée (uniquement deux valeurs
  hex dans `accent.js`).

- [x] **AGD-17 — Gros lot contenu et rejouabilité (événements humour/NBA, badges transversaux)** _(implémenté et vérifié le 2026-07-27)_
  Deux volets :
  1. *Références et humour NBA, en événements génériques*. Quatre nouveaux événements dans
     `src/data/events/nba_flavor.js` (nouveau fichier, agrégé dans `engine/events.js`) : la prière
     du milieu de terrain (buzzer-beater désespéré, cat `clutch`), le rebond qui ne pardonne pas
     (tir de la gagne qui tourne sur l'arceau avant de ressortir, putback en une fraction de
     seconde), le tir litigieux (vérification vidéo au buzzer, nouvelle catégorie `review` ajoutée
     à `CAT_TAG`), et un fil narratif de rédemption tardive dans `threads.js` (`clutch_redemption_arc`,
     `phase:'late'`, `once:true`) qui fusionne les deux dernières idées de la demande (rédemption
     après ratés + réputation "pas clutch" qui s'inverse en fin de carrière) en un seul arc
     cohérent, gated sur un nouveau flag `clutchChoker` nourri par les échecs des deux événements
     ci-dessus. Aucun vrai joueur/club nommé dans un scénario négatif : les événements sont
     entièrement génériques (le ballon, l'arbitre, la salle), conformes à `data/legends.js`
     (réservé aux comparaisons positives ailleurs dans le jeu). Toutes les conventions du moteur
     respectées : `phase`/`cooldown`/`weight` calibrés sur les événements clutch existants,
     intitulés de choix sans indice chiffré, ton humoristique déjà en place (ex. "Même l'arceau
     semble s'excuser", célébration prématurée qui tourne mal).
  2. *Badges transversaux*. Nouveau module `engine/badges.js`, même stockage robuste que le
     Panthéon (`hof.js`) : localStorage avec repli mémoire si indisponible, jamais d'erreur levée
     (vérifié explicitement stockage cassé simulé). 10 badges couvrant des profils de carrière
     variés et rejouables : fidélité à un seul club, ambassadeur (or avec ≥2 nations différentes,
     cumulatif à travers les carrières via un compteur persistant dédié), renaissance (étiquette
     "bust" effacée), prodige précoce (MVP avant 23 ans), increvable (16+ saisons), champion à
     tous les étages (titres à ≥2 paliers de ligue), sang-froid légendaire (clutch ≥8),
     globe-trotter (4+ paliers de ligue joués), intronisation au Panthéon, Monsieur Triple-double
     (10+). Écran dédié (`renderBadges()` dans `card.js`), accessible depuis le titre et depuis
     l'écran de fin de carrière, montrant obtenus et à décrocher dans la même grille (état visuel
     seul change). Évalués une fois par carrière terminée (`endCareer()`), avec un bandeau
     "nouveau badge débloqué" sur l'écran de fin quand c'est le cas.
  Rendu montré à l'utilisateur via le showcase avant livraison (4 nouveaux événements + écran
  Badges avec mélange obtenus/à décrocher).
  Vérifié : 0% crash sur 100+300 carrières, 0 violation d'intégrité des événements uniques (67
  événements marqués `once` désormais, +1), 0 incohérence de format NBA. **Diversité des
  nouveaux événements** confirmée sur un run dédié de 200 carrières pilotées : `halfcourt_prayer`
  vu 45 fois, `rim_rattle_putback` 90 fois, `replay_review_drama` 52 fois, `clutch_redemption_arc`
  1 fois (cohérent avec sa rareté voulue : `once`, `phase:'late'`, gated sur un flag cumulatif) —
  58% des carrières ont vu au moins un des 4 nouveaux événements, sans dominer le pool (160
  événements au total). Taux de titre élite 12% sur 300 carrières, dans la bande de bruit déjà
  établie (7.7-21.7%), aucune dérive causée par ce lot. Badges : persistance et repli mémoire
  vérifiés directement (stockage localStorage cassé simulé, 0 erreur levée, badges toujours
  évalués et lisibles), accumulation cumulative inter-carrières vérifiée (`multi_nation_gold` se
  déclenche bien seulement après une 2e nation différente sur une 2e carrière distincte), écran
  de badges et flux de fin de carrière exercés sans erreur sur une carrière réelle driven de bout
  en bout.

- [x] **AGD-06 — Animations des moments forts côté club** _(implémenté et vérifié le 2026-07-27)_
  Les grands moments côté club (money-time/clutch, stop décisif/défense, duel, finale) reçoivent
  désormais une vraie animation d'entrée au rendu de l'événement, réutilisant TEL QUEL le style et
  le code de l'annonce de sélection nationale déjà en place (`@keyframes natAnnounce` dans
  `styles.css`, inchangée) : un nom de classe distinct pour rester lisible (`.grand-moment-announce`
  plutôt que réutiliser `.nation-announce` telle quelle, sémantiquement trompeur hors contexte
  national), mais la même règle d'animation, mot pour mot. Posée en JS dans `renderEvent()`
  (`screens.js`) aux côtés de la classe `.grand-moment` déjà existante (liseré + motif), dès que
  `ev.cat` est `clutch`/`defense`/`duel`/`finals` -- à chaque occurrence de l'événement, pas
  seulement la première de la carrière (même logique que l'annonce nationale). Brève (0.5s, pop
  scale .94→1.015→1 avec fondu), ne bloque rien : les boutons de choix restent cliquables
  immédiatement, l'animation joue en parallèle du rendu. `prefers-reduced-motion` déjà couvert par
  la règle globale existante (`@media (prefers-reduced-motion: reduce){*{animation:none!important}}`),
  aucun code spécifique à ajouter.
  Rendu montré à l'utilisateur via le showcase avant livraison (l'animation se rejoue réellement
  au chargement de la page, CSS authentique capturée depuis le jeu, pas une simulation).
  Vérifié : 0% crash sur 100+300 carrières, 0 violation d'intégrité des événements uniques, 0
  incohérence de format NBA -- taux de titre élite 12.3% sur 300 carrières, dans la bande de bruit
  déjà établie (7.7-21.7%), comme attendu pour un changement purement visuel (aucune logique de
  jeu touchée, seuls `screens.js` et `styles.css` modifiés).

- [x] **AGD-16 — Lot de corrections groupées (identité de club, nationalités)** _(implémenté et vérifié le 2026-07-27)_
  Demande en 8 points. Deux points étaient de vrais chantiers neufs cette session ; les six
  autres décrivaient des problèmes déjà corrigés lors de chantiers précédents (AGD-11, AGD-15,
  certains dans cette même session) — vérifiés à nouveau plutôt que ré-implémentés à l'aveugle,
  conformément à la consigne de ne jamais se fier à une impression.
  1. *Dominante de couleur de club, corrigée*. Un choix AUTOMATIQUE basé sur la saturation
     ("la couleur la plus vive gagne" entre primaire/secondaire) a été essayé puis abandonné en
     session : vérifié cas par cas, il basculait à tort vers l'or secondaire dès qu'il y en
     avait un (L.A. Lakers, Denver Nuggets, ...) car un or est presque toujours plus saturé
     qu'un bleu/violet marine, alors que c'est justement ce bleu/violet qui est l'identité
     reconnaissable de ces clubs — la saturation brute n'est pas un indicateur fiable de
     reconnaissabilité de marque. Conservé : la primaire reste la dominante par défaut (`accent.js`),
     avec une table `CLUB_DOMINANT_OVERRIDE` en dur et extensible pour les exceptions connues
     (Charlotte : violet assumé plutôt que la teinte sarcelle ; Utah : même bleu officiel mais
     éclairci, le marine brut lisant "presque noir" puisque `ensureContrast` ne peut qu'assombrir,
     jamais éclaircir). `gen-club-data.mjs` détecte et signale désormais les doublons de couleurs
     conflictuelles à l'ingestion (aucun trouvé dans le fichier actuel malgré la demande initiale
     de dédoublonner "Los Angeles Lakers" — vérifié ligne par ligne dans `data-source/
     clubcolor.xlsx`, une seule occurrence NBA existe, plus sa franchise G League affiliée "South
     Bay Lakers", nom distinct et non un doublon). South East Melbourne Phoenix (NBL australien,
     aucune couleur nulle part dans l'Excel) reçoit une couleur de repli manuelle explicite en
     attendant que l'Excel soit complété. Contraste revérifié exhaustivement sur les 460 clubs
     réels : 0 échec sous 4.5:1 (texte de tuile) et 0 échec sous 3:1 (encre de pastille).
  2. *Victoires réservées à la NBA*, 3. *playoffs NBA avec conférences/Play-In*, 4. *vrai nombre
     de clubs par championnat*, 5. *performance du joueur vers résultat d'équipe*, 6. *cohérence
     texte de bilan vers rôle réel*, 7. *évolution du rôle dans le club* : déjà implémentés lors
     de chantiers précédents (points 2-3 : AGD-15, cette session même, juste avant ce lot ;
     points 4-7 : AGD-11/AGD-04, sessions antérieures) — confirmé par lecture directe du code
     actuel (formule `teamRating` dans `season.js` combinant bien `clubPercentile` réel + apport
     individuel ; `seasonVerdict()` lisant `roleOf(p).key` ; `simulateNbaStandings`/
     `simulateNbaPlayoffs` avec conférences Est/Ouest et Play-In ; `REAL_LEAGUE_SIZE`/comptes
     réels par ligue), puis reconfirmé par l'audit complet de fin de session (voir ci-dessous) :
     aucune régression, aucun changement de code nécessaire sur ces 6 points.
  8. *Nationalités*. Israël retiré de `src/data/nations.js` (34 nations restantes). Écran de
     choix de nation compacté : nouvelle grille dédiée `.nation-grid`/`.opt.nation-opt` (tuiles
     flag + nom + force en coin, réutilise `.abbr`) remplaçant les cartes pleine taille
     génériques qui forçaient un long défilement avec ~35 entrées.
  Committé par étape logique (3 commits distincts : couleurs de club / nationalités / ce
  registre), pas en un seul bloc, comme demandé.
  Rendu montré à l'utilisateur via le showcase avant livraison (Charlotte/Utah corrigés, grille
  de nations compacte).
  **Audit complet de fin de session** (focus explicite demandé sur le point 5) :
  - 0% crash sur 100+300 carrières, 0% repli "Club libre", 0 violation d'intégrité des
    événements uniques, 0 incohérence de format NBA (2032 saisons NBA auditées).
  - **Taux de titre élite (toutes ligues) : 10% sur 300 carrières** — dans la fourchette de
    bruit déjà établie (7.7-21.7%), aucune dérive détectée après reconfirmation du point 5.
  - **Corrélation force d'équipe -> résultat, NBA (2032 saisons)** : qualification 36.8%
    (Faible) / 66.2% (Moyen) / 79.8% (Fort), titre 0.3% / 1.4% / 2.5% — progression monotone
    nette, les équipes fortes se qualifient et gagnent bien plus que les faibles.
  - **Corrélation force d'équipe -> résultat, toutes ligues (6709 saisons)** : titre 0.2%
    (Faible) / 0.7% (Moyen) / 1.7% (Fort) — même progression monotone hors NBA. Croisement force
    de club x niveau du joueur : une Superstar dans un club Fort atteint 10% de saisons
    championnes (n=50) contre 0.3% pour un Role player dans un club Fort (n=1335) et 0.1% pour
    un Role player dans un club Faible (n=1404) — l'apport individuel pèse nettement, sans
    effacer le signal de force d'équipe (un Role player dans un club Fort reste toujours
    au-dessus d'un Role player dans un club plus faible).

- [x] **AGD-15 — Réalisme NBA (conférences, Play-In, victoires réservées à la NBA)** _(implémenté et vérifié le 2026-07-26)_
  Quatre volets liés, dans l'esprit "la NBA mérite plus de détail que les autres ligues" :
  1. *Total de victoires retiré partout sauf en NBA*. La cellule "VIC" du bilan de saison
     (`renderSeasonResult()` dans `screens.js`) n'est désormais affichée que si `p.league==='nba'`
     — ailleurs (EuroLeague comprise), elle n'apportait que de la confusion (formats de saison
     très variables, aucun repère réel). Le calcul interne de `wins` (`season.js`) reste
     inchangé pour toutes les ligues : il alimente aussi le facteur de progression
     (`winFactor`), retirer son affichage ne devait pas couper ce calcul.
  2. *Format playoffs NBA réaliste*. Nouvelles fonctions dédiées dans `engine/competition.js` :
     `simulateNbaStandings()` classe les 30 clubs réels en deux conférences RÉELLES de 15 (Est/
     Ouest, table `NBA_CONFERENCE` couvrant les 30 noms de `LEAGUES.nba.clubs`), le club du
     joueur situé dans sa vraie conférence. `simulateNbaPlayoffs()` modélise le vrai format
     actuel : les 6 premiers de la conférence qualifiés directement, les places 7-10 disputant
     le Play-In (7e/8e ont deux chances, 9e/10e doivent enchaîner deux victoires) pour les deux
     dernières places, 11e et au-delà : saison terminée. Une fois qualifiée (8 têtes de série),
     l'équipe traverse 4 tours (1er tour, demi-finale de conférence, finale de conférence,
     Finale NBA) — la Finale est une vraie confrontation entre les deux conférences, jamais un
     prolongement du même vivier de 15. Cohérence conservée avec le mécanisme narratif "match
     décisif" (`forceFinals`) : son issue reste la Finale NBA, jamais un second tirage
     contradictoire. Les autres ligues gardent le classement/phase finale génériques existants
     (`simulateStandings`/`simulatePlayoffs`, non touchés).
  3. *Affichage dédié + cohérence de bout en bout*. `renderCompetitionContext()` (`screens.js`)
     a une branche NBA : titre explicite ("NBA · Conférence Est/Ouest"), pastille de zone
     (qualification directe / Play-In / hors playoffs, nouveaux styles `.standings-zone-*` dans
     `styles.css`), résumé de parcours mentionnant le Play-In quand il a été traversé. Nouveau
     contrôle d'audit dédié dans `scripts/deep-audit.mjs` (section g) : vérifie sur chaque
     saison NBA jouée que classement/qualification/parcours/champion restent cohérents entre eux
     (poolSize toujours 15, conférence valide, rang 1-6 toujours qualifié sans Play-In, seed
     Play-In toujours 7 ou 8 quand validé, champion implique finale atteinte, finale atteinte
     implique 4 tours). Un champ `clubStrengthPctile` (force réelle de l'effectif, indépendante
     de l'apport du joueur) a été ajouté à chaque saison pour l'audit de corrélation (point 4).
  4. *Audit de corrélation force d'équipe -> résultat*. Nouvelle section h) dans
     `scripts/deep-audit.mjs`, sur 2411 saisons NBA (300 carrières) : par tertile de force réelle
     de club, qualification 34.2% (Faible) / 60.8% (Moyen) / 86.5% (Fort), finale NBA 2.2% /
     2.9% / 6.9%, titre 0.6% / 1% / 2.9% — progression monotone nette, la force d'équipe prédit
     bien le résultat. Croisement force de club x niveau du joueur (% de saisons championnes) :
     un Superstar dans un club Fort atteint 3.1% (petit échantillon, n=32) contre 0% pour un
     Role player dans un club Faible (n=378) — l'apport individuel module sans effacer le signal
     de force d'équipe, dans toutes les combinaisons observées.
  Vérifié : 0% crash sur 150+300 carrières, 0% repli "Club libre". Section g) de l'audit dédié
  NBA : **0 incohérence détectée sur 2411 saisons NBA** (classement/qualification/parcours/
  champion). Répartition conférence Est 1134 / Ouest 1277 (proche de 50/50, cohérent avec 15/15
  clubs réels). Zone qualification directe (rang 1-6) : 100% qualifiées comme attendu. Zone
  Play-In (rang 7-10) : 36.5% qualifiées via le Play-In (le reste éliminé, cohérent avec un
  format resserré). Hors playoffs (rang 11-15) : 0.2% qualifiées, uniquement via les 6 saisons
  "forcées" par l'événement narratif match décisif sur tout le run (mécanisme documenté, pas une
  incohérence). Taux de titre élite (toutes ligues) 11.3% sur 300 carrières — dans la bande de
  bruit déjà établie (7.7-21.7%), aucune dérive de calibration causée par ce lot. Rendu des 5
  scénarios (tête de série directe championne / éliminée, Play-In validé / éliminé, hors zone)
  montré à l'utilisateur via le showcase avant livraison.

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
