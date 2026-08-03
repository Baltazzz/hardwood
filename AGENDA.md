# AGENDA — fonctionnalités demandées, pas encore livrées

Registre des demandes en attente sur HARDWOOD. Chaque entrée porte un identifiant stable,
une description courte du manque, et un **critère de validation observable** : la façon dont
on constatera — sans ambiguïté, via l'audit ou l'usage réel du jeu — que c'est fait.

Règle de mise à jour : voir `CLAUDE.md`. Une ligne n'est cochée que si elle a été réellement
implémentée **et** vérifiée (audit ou test) dans la session qui la coche.

## Ouvert

- [ ] **AGD-54 — Écran de bienvenue : risque de friction pour un nouveau joueur**
  Ajouté au registre le 2026-08-01, constat du point 2 d'AGD-53 (diagnostic demandé explicitement,
  "vérifie... signale-moi", aucune réécriture de contenu faite unilatéralement -- c'est une
  décision éditoriale qui revient à l'utilisateur). Confirmé fonctionnellement solide (parcours
  complet piloté sans erreur, voir `tests/audit_polish.mjs`) et confirmé que l'écran de bienvenue
  EST bien le tout premier écran vu (jamais un écran distinct qui le précède) -- mais deux
  observations concrètes sur le ressenti "quelques secondes, envie immédiate" demandé :
  1. Contenu dense : ~390 mots répartis sur 4 sections (fiche/jauges, choix, trajectoire, guide
     d'installation) avant le bouton principal en bas de page -- plus proche d'un mini-tutoriel que
     d'un accroche de quelques secondes, même si un bouton "Passer →" existe dès le début.
  2. Le bouton "Passer" est délibérément discret (12.5px, `--chalk-dim`, sans fond ni bordure,
     voir `.welcome-skip` dans `styles.css`) -- lisible par convention (coin haut-droit) mais pas
     visuellement mis en avant, ce qui peut donner l'impression que lire les 4 sections est
     attendu plutôt qu'optionnel.
  Non vérifié faute d'outil de rendu réel dans cet environnement (Playwright/Chromium
  indisponibles) : chevauchement possible entre le bandeau cookies (position fixe, bas d'écran) et
  le bouton "Compris, on commence" tout en bas de l'écran de bienvenue sur un petit mobile --
  `.wrap` réserve déjà 60px de marge basse + `.welcome-screen` 50px de plus (110px cumulés), qui
  semblent suffisants sur le papier mais n'ont pas été mesurés contre la hauteur réelle du bandeau
  (texte + boutons, potentiellement 2 lignes sur un écran étroit).
  **Critère** : à définir avec l'utilisateur -- réduire/restructurer le contenu, rendre "Passer"
  plus visible, et/ou vérification en navigateur réel du chevauchement bandeau cookies/CTA sur
  petit mobile.

- [ ] **AGD-49 — Réactiver l'onglet Collection une fois les vrais visuels fournis**
  Ajouté au registre le 2026-07-31, suite directe d'AGD-48 (masquage). L'utilisateur fournira les
  visuels (cartes/maillots à collectionner) plus tard. Quand ce sera fait : remplacer les
  silhouettes SVG de `collectionSlotHTML()` (`ui/shop.js`) par les vrais visuels, passer
  `COLLECTION_TAB_ENABLED` à `true` dans ce même fichier, retirer le statut `comingSoon:true` des
  entrées concernées du catalogue (`engine/cosmetics.js`) une fois qu'elles sont réellement
  achetables/équipables (ou les garder `comingSoon` pour celles pas encore prêtes, l'activation
  peut être progressive item par item).
  **Critère** : à définir avec l'utilisateur au moment où les visuels seront fournis (quels
  visuels pour quels emplacements, prix, éventuelle condition de déblocage).

- [ ] **AGD-46 — Traduction anglaise du corpus narratif (~200 événements de carrière)**
  Ajouté au registre le 2026-07-31, suite explicite d'AGD-44 : l'utilisateur a choisi lui-même le
  périmètre de cette session ("Interface + données d'abord, narratif ensuite") -- ce ticket
  couvre le "ensuite". Concerne `data/events/early.js`, `mid.js`, `late.js`, `shared.js`,
  `attributes.js`, `threads.js`, `traits_payoff.js`, `wellbeing.js`, `nba_flavor.js`,
  `nba_franchise.js` (~2600 lignes, plusieurs milliers de chaînes titre/corps/choix/indice/
  résultat, dont beaucoup en fonctions dynamiques mêlant logique et texte). L'infrastructure
  (`engine/i18n.js`, `i18n/fr.js`/`en.js`) est prête à les recevoir -- repli automatique sur le
  français déjà en place (jamais de texte cassé/manquant en attendant), donc aucune urgence
  technique, seulement un volume de traduction restant. Les commentaires/flaveur des clubs dans
  `data/clubData.js` (noms réels + commentaires en français) restent également hors périmètre de
  ce ticket, à traiter à part si demandé.
  **Critère** : chaque fichier ci-dessus a ses clés `events.<id>.*` dans `i18n/fr.js`/`en.js`,
  chaque événement lit son texte via `t()` au lieu d'un littéral, `npm run audit:i18n` étendu pour
  vérifier qu'aucune clé `events.*` n'est manquante côté anglais, une carrière pilotée en anglais
  ne montre plus aucun texte français dans le corps des événements.

- [ ] **AGD-07 — Enrichissement de la carte de fin et du Panthéon**
  Ajouté au registre le 2026-07-26 (mêmes réserves de provenance que AGD-06). État actuel déjà
  substantiel : citations de presse (`pressReview()`), courbe d'évolution OVR (`sparkline()`),
  classement Panthéon avec détail par carrière (`renderHallOfFame()` / `renderCareerDetail()`
  dans `card.js`), carte canvas partageable et téléchargeable (`renderCareerCard()`), feuille
  de match saison par saison. Aucune demande précise et non satisfaite n'a été retrouvée dans
  l'historique — à clarifier avec l'utilisateur : qu'est-ce qui manque concrètement ?
  **Critère** : à définir avec l'utilisateur une fois le manque précisé.

- [ ] **AGD-33 — Généraliser le nouveau motif de fond aux autres écrans**
  Ajouté au registre le 2026-07-27, en creusant AGD-32 point 2. La direction "plus de présence
  en fond" (motif de terrain agrandi/recentré + trame de parquet, fait main en SVG) a été
  appliquée à 3 écrans seulement comme demandé (titre, événement, bilan de saison), pour
  validation avant généralisation. Tous les autres écrans (création de personnage, choix
  d'académie, Panthéon, Badges, transferts, fin de carrière, écrans de défi...) sont encore sur
  l'ancien traitement (motif minuscule en coin ou rien du tout selon l'écran).
  **Critère** : confirmation de l'utilisateur sur la direction montrée (taille/opacité/motif),
  puis extension aux écrans listés ci-dessus avec le même principe d'opacité (plus discret sur
  les écrans vus souvent, un peu plus affirmé sur ceux vus rarement).

## Coché récemment

- [x] **AGD-60 — Dernier lot avant diffusion : vérification + partage/social/légendes/couleurs nationales** _(implémenté et vérifié le 2026-08-04)_
  Demande en deux temps : vérifier d'abord ("preuve à l'appui") si quatre points antérieurs étaient
  déjà livrés, puis implémenter seulement ce qui manquait réellement, plus quatre ajustements
  demandés dans tous les cas.
  **Partie A -- vérification, preuve à l'appui (rien à implémenter, tout déjà en place)** :
  1. *Anecdotes NBA "plus mordantes"* : déjà fait (AGD-36 + AGD-38). Les 23 événements existent
     dans `data/events/nba_franchise.js`, réécrits à un ton plus mordant -- MAIS 3 escalades
     explicitement demandées à l'époque (Memphis/Miami/Charlotte, identification possible d'une
     personne réelle commettant un acte dangereux/illégal) avaient été refusées et communiquées à
     l'utilisateur, pas silencieusement édulcorées. Non retouché cette session, aucune nouvelle
     instruction ne revenant sur ce refus.
  2. *Lot rétention* (AGD-52) : les 5 points (rareté, prochain badge, suggestion de défi, 41 badges
     dont 6 à seuils cumulés inter-carrières, identité propre du défi du jour) reconfirmés présents
     par lecture directe de `engine/retention.js`/`engine/badges.js`/`engine/dailyChallenge.js`.
  3. *Prix boutique* (AGD-53) : 3 paliers (`common`/`rare`/`prestige`) et plancher à 10 000 k€
     reconfirmés dans `engine/cosmetics.js`.
  4. *"Tirer sa révérence"* : AGENDA.md intégralement relu (2255 lignes) -- AUCUNE trace d'une
     demande de modification de cette formule. AGD-26 est au contraire la session qui l'a
     introduite (en remplacement de "Raccrocher les baskets") et avait explicitement clos le sujet
     ("formulations déjà idiomatiques"). Signalé tel quel à l'utilisateur, rien modifié faute de
     savoir ce qui serait visé -- pas de nouvelle instruction reçue depuis.
  **Partie B -- ajustements livrés dans tous les cas** :
  1. *Invitations discrètes au partage*, aux moments d'enthousiasme uniquement, jamais répétées
     sans condition. Fin de grande carrière (`ui/screens.js` `endCareer()`) : un bouton
     "📤 Partager cette carrière" apparaît UNIQUEMENT sous le bandeau de rareté déjà existant (top
     25%, `rarityPct()` non nul), réutilise `shareOrFallback()` (déjà utilisé ailleurs dans le jeu,
     `ui/share.js`) avec le résumé de carrière déjà généré. Victoire en défi entre amis
     (`ui/challenge.js` `renderChallengeLeaderboard()`) : un bandeau "🏆 Tu es en tête du
     classement !" apparaît UNIQUEMENT quand `results[0].mine` est vrai ET qu'il y a au moins 2
     participants (rien à "gagner" tout seul), rafraîchi après réception du classement serveur.
  2. *Lien vers le compte X du jeu* (`https://x.com/Hardwoodgame`, fourni par l'utilisateur),
     présenté comme le moyen de donner un retour ou suivre les nouveautés -- accroché au pied de
     l'écran d'accueil (`.credit`, emplacement déjà préparé par AGD-24/AGD-23) ET dans un nouveau
     bloc dédié des réglages (`ui/settings.js`, 3e `.recap-block`).
  3. *Légende "idole" adaptée à la nationalité*. Nouveau `NATION_LEGENDS` (`data/legends.js`,
     33 nations sur 34 -- 'US' exclu délibérément, le pool par poste `LEGENDS` existant est déjà
     100% américain) : un nom réel et réellement originaire de chaque nation (ex. France -> Tony
     Parker, Allemagne -> Dirk Nowitzki, Nigeria -> Hakeem Olajuwon, Chine -> Yao Ming...). Nouvelle
     fonction partagée `legendFor(p, fallback)` (`data/events/_helpers.js`) : priorité à la
     nationalité, repli sur le pool par poste (`LEGENDS[p.pos]`) sinon -- utilisée aux 3 endroits où
     une légende était citée (`data/events/early.js` "Ton idole de jeunesse",
     `data/events/mid.js` "comparison"/"legend_hot_take"), texte de repli propre à chaque site
     préservé à l'identique (aucun changement de comportement en dehors du choix du nom).
  4. *Couleurs de sélection nationale corrigées*. `engine/accent.js` `NATION_ACCENT` entièrement
     réécrit : les DEUX couleurs réellement les plus présentes sur le drapeau de chacune des 34
     nations jouables (primaire + secondaire quand pertinent, blanc exclu par principe -- illisible
     en aplat sur le fond crème, secondaire alors dérivée algorithmiquement comme pour un club sans
     couleur officielle). Corrige un vrai bug signalé : l'Australie ressortait en VERT
     (`#00843D`, couleur des "Boomers", jamais présente sur le drapeau réel) -- désormais bleu/rouge
     (Union Jack + Croix du Sud). `emblemColors()` mis à jour pour utiliser cette secondaire curatée
     par nation plutôt que de toujours la dériver algorithmiquement.
  **Vérifié directement** : nouveau `npm run audit:finishing-touches` (21 vérifications) --
  les 34 nations ont toutes une couleur curatée distincte (aucune sur le repli générique), rendu
  réel sans exception sur un échantillon diversifié (France/Allemagne/Brésil/Nigeria/Japon/
  Australie/Turquie/États-Unis), Australie confirmée ne plus être verte ; légende adaptée à la
  nationalité testée sur plusieurs nations (prime sur le poste) + repli pool-par-poste pour les
  États-Unis/nation inconnue/nation absente, les 34 nations couvertes ; invitation au partage de
  défi testée présente à 2 participants avec "mine" en tête, absente si en retard ou seul
  participant ; invitation de fin de carrière testée sur 15 carrières réelles pilotées (invariant
  bandeau/bouton jamais désaccordé) PUIS déterministement forcée au-dessus et en dessous du seuil
  de rareté sur le même joueur réel (couvre les deux branches, pas seulement l'absence -- les choix
  aléatoires de test franchissent trop rarement le seuil pour s'y fier seuls). Non-régression :
  suite complète existante tous verts, `scripts/deep-audit.mjs` 300 carrières -- 0% crash, 0
  violation d'intégrité `once`, taux de titre élite 9% (bande normale 7,7-21,7%) ; `npm run build`
  vert.

- [x] **AGD-24 — Handle/@ à ajouter à la signature auteur** _(clos le 2026-08-04, décision de l'utilisateur)_
  Décision explicite : pas de handle -- la signature reste « Créé par Gaspard G » seule, sans rien
  y accoler. Ticket refermé sur cette base, aucun changement de code nécessaire (le texte n'a
  jamais été modifié depuis sa mise en place initiale, voir AGD-23).

- [x] **AGD-59 — Classements mondiaux (défi du jour + carrières), Supabase + pseudo de profil** _(implémenté et vérifié le 2026-08-04)_
  Quatre volets demandés explicitement, plan détaillé validé avec l'utilisateur avant exécution
  (voir `/Users/gaspard/.claude/plans/snug-jumping-walrus.md`).
  1. *Nettoyage de l'accueil*. Puce Panthéon retirée du menu principal (`ui/screens.js`) -- déjà
     accessible depuis la tuile de profil (`renderProfile()`, AGD-58) et depuis l'écran de fin de
     carrière (bouton `hofView`), les deux chemins confirmés intacts avant retrait. Clé i18n
     `home.hofBtn` devenue orpheline retirée (fr.js + en.js).
  2. *Classement mondial du défi du jour*. Nouvelle table `daily_world_scores`
     (`supabase/migrations/0002_world_leaderboards.sql`) -- une ligne par (jour, pseudo), remise à
     zéro "gratuitement" chaque jour (l'écran filtre toujours sur la date du jour, aucun job de
     purge nécessaire). Mêmes garde-fous anti-triche que `challenge_scores` (AGD-57) : bornes de
     score (0-600), throttle 5s entre deux vraies améliorations, meilleur score gardé.
  3. *Classement mondial des carrières*. Nouvelle table `career_world_scores` -- une seule ligne
     par pseudo, pour toujours (sa meilleure carrière, jamais une par tentative). Suppression d'une
     ligne aberrante possible directement depuis le Dashboard Supabase (Table Editor, accès
     propriétaire qui contourne RLS) -- aucune route de suppression exposée à la clé anon,
     volontairement, pour qu'un visiteur ne puisse jamais vider le classement de tout le monde.
     **Identité hybride pseudo+appareil**, décision actée avec l'utilisateur après qu'une revue
     croisée a détecté qu'un simple `unique(nickname)` casserait silencieusement la progression
     d'un joueur qui se renomme (fonctionnalité de première classe depuis AGD-58) : chaque ligne
     reste identifiée par le pseudo (fidèle à la demande), mais porte aussi `client_id` (même UUID
     d'appareil que `challenge_scores`, jamais unique, un simple indice de réconciliation) --
     `engine/worldLeaderboardApi.js` vérifie avant toute soumission si CET appareil a déjà une
     ligne sous un pseudo différent et, si oui, met à jour CETTE MÊME ligne plutôt que d'upserter
     par pseudo (qui créerait une ligne fantôme ou entrerait en collision avec un homonyme). Trigger
     SQL partagé `world_scores_guard()` corrigé en conséquence pour ne JAMAIS annuler
     silencieusement un renommage, même sans amélioration de score.
  4. *Affichage scalable*. Nouveau `ui/worldLeaderboard.js` : moteur de rendu paginé partagé par les
     deux classements -- pagination "Charger plus" (20/page, jamais tout charger d'un coup), tri
     Score/Saisons (re-fetch page 1 au changement), mise en évidence de sa propre ligne où qu'elle
     soit -- surlignée directement si déjà chargée, sinon bandeau séparé "Ta position" calculé via
     le "count trick" PostgREST (`Prefer: count=exact` + `Range: 0-0`, jamais besoin de tout
     charger pour savoir son rang). Podium réutilisé tel quel (`rankGlyph()`, `ui/card.js`) --
     correction importante appliquée : le rang GLOBAL (`offset + index`) est passé à `rankGlyph()`,
     jamais l'index local d'une page (sinon la page 2 afficherait une couronne sur son propre rang
     local 0). Index SQL composites (`score desc, id` / `seasons desc, id`) ajoutés pour que tri et
     calcul de rang restent rapides même avec beaucoup de joueurs.
  5. *Robustesse identique*. `engine/supabaseClient.js` (nouveau) extrait les primitives HTTP
     partagées (URL/clé/timeout) d'`engine/leaderboardApi.js`, réutilisées par
     `engine/worldLeaderboardApi.js` -- même contrat : jamais d'exception, timeout 6s, file
     d'attente locale + retry au chargement (`flushPendingWorldScores()`, appelée dans `main.js`
     à côté de l'existant), repli propre + message clair si le serveur est injoignable.
  **Vérifié directement, contre le vrai serveur Supabase** (`npm run audit:world-leaderboard-live`,
  24 vérifications) : deux appareils/pseudos distincts voient bien les deux scores partagés (jour
  ET carrières) sans rien échanger, `mine` jamais confondu, tri par score décroissant correct, une
  resoumission plus faible n'écrase jamais le meilleur score, une resoumission meilleure (après la
  fenêtre anti-spam) remplace bien l'ancienne, score aberrant (999999) rejeté des deux classements
  -- et le scénario clé de ce lot : un appareil qui se RENOMME (même `client_id`, nouveau pseudo,
  même score) voit sa ligne mise à jour, l'ANCIEN pseudo n'a plus aucune ligne (pas de doublon
  fantôme), le NOUVEAU porte le score préservé. Non-régression : nouveau
  `npm run audit:world-leaderboard` (23 vérifications hors-ligne, timeout/erreur HTTP/hors-ligne
  jamais levés pour les deux classements) vert ; suite complète existante
  (`audit`/`audit:meta`/`audit:i18n`/`audit:coherence`/`audit:cosmetics`/`audit:link`/
  `audit:challenge`/`audit:challenge-revisit`/`audit:retention`/`audit:polish`/`audit:leaderboard`/
  `audit:profile-identity`) tous verts ; `scripts/deep-audit.mjs` 300 carrières -- 0% crash, 0
  violation d'intégrité `once`, taux de titre élite 11,7% (bande normale 7,7-21,7%) ; `npm run
  build` vert.

- [x] **AGD-58 — Lot identité de joueur : profil persistant, tuile regroupée, équité du défi entre amis** _(implémenté et vérifié le 2026-08-03)_
  Trois volets demandés explicitement, plan détaillé validé avec l'utilisateur avant exécution.
  1. *Profil de joueur persistant*. Nouveau module `engine/profile.js` (`hardwood_profile_v1`,
     même gabarit robuste que badges/wallet/cosmetics) : un pseudo est auto-généré et persisté
     SILENCIEUSEMENT dès le tout premier accès (`getProfile()`), sans écran bloquant -- ajustement
     demandé explicitement en cours de session (la conversion depuis un lien de défi partagé exige
     de pouvoir démarrer une carrière immédiatement). Modifiable à 3 endroits, chacun au moment où
     il prend du sens : réglages (`ui/settings.js`, nouveau bloc), tuile de profil (`ui/profile.js`),
     et écran de défi entre amis (`ui/challenge.js` -- hub/création/atterrissage, édition en ligne
     sans redirection qui casserait le geste en cours).
  2. *Tuile de profil regroupée*. Nouvel écran `renderProfile()` (`ui/profile.js`) remplace
     `renderProgress()` (retiré de `ui/card.js`) : pseudo + statistiques cumulées + résumé de hauts
     faits (compteur + icônes, lien vers la grille complète inchangée) + progression, personnalisable
     via les cadres/titres déjà achetables en boutique (repris tel quel de l'ancien écran). Nouvelle
     tuile visuelle sur l'accueil (remplace les puces séparées "Ma progression"/"Hauts faits"), fond
     SVG dédié (sceau/médaillon festonné fait main, jamais réutilisé ailleurs dans le jeu, opacité
     discrète -- même convention que les motifs existants de `styles.css`).
  3. *Équité totale du défi entre amis* (le point le plus sensible). `generateChallengeDef()`
     (`engine/challenges.js`) impose désormais AUSSI le nom du personnage et le mode de vie (déjà
     seedé pour le nom via `rollTalent()`, nouveau tirage seedé pour le mode de vie), et centralise
     le calcul de l'académie imposée (`forcedAcademyIndex`, partagé avec le défi du jour). Comme un
     lien de défi n'encode que sa graine, ces nouveaux champs voyagent gratuitement -- aucun impact
     sur la longueur du lien (AGD-42 préservé). `joinChallenge()` (`ui/challenge.js`) impose
     désormais mode de vie/nom/académie en plus du reste, et roule explicitement l'archétype de
     développement (`rollArchetypeAndName()`, sans quoi `p.devArchetype` -- qui influence réellement
     la simulation, vérifié dans `engine/season.js` -- resterait `null`). L'assistant de création
     est entièrement court-circuité pour un joueur de défi (`screenCreate()` : `startCareer()`
     immédiat si `p.challengeId`), et `engine/season.js` saute l'écran de choix d'académie pour les
     défis entre amis comme il le faisait déjà pour le défi du jour. Le classement utilise désormais
     le PSEUDO DE COMPTE (`profileNickname()`) plutôt que le nom du personnage pour identifier chaque
     participant (`endCareer()`) -- indispensable puisque le nom de personnage est maintenant
     identique pour tous. Défi du jour non touché (mode de vie/nom restent libres, comme demandé).
  **Vérifié directement** : nouveau `npm run audit:profile-identity` (16 vérifications, deux process
  Node indépendants simulant deux appareils distincts) -- pseudo auto-généré silencieusement dès le
  premier accès sans action explicite, premier lancement confirmé mener directement à l'écran titre
  normal (aucun écran de configuration interposé), pseudo modifiable confirmé aux 3 endroits prévus,
  et surtout : deux appareils rejoignant le MÊME défi obtiennent un nom de personnage, un mode de vie
  et une académie (même club de départ) STRICTEMENT identiques, tout en affichant deux pseudos de
  classement bien DISTINCTS. Non-régression : `npm run audit`/`audit:meta`/`audit:i18n`/
  `audit:coherence`/`audit:cosmetics`/`audit:link`/`audit:retention`/`audit:polish`/`audit:leaderboard`
  tous verts ; `audit:challenge`/`audit:challenge-revisit` mis à jour (l'ancien pilotage de
  l'assistant de création pour un défi entre amis n'a plus lieu d'être, remplacé par la vérification
  du nouveau flux direct) et repassent au vert ; `scripts/deep-audit.mjs` 300 carrières -- 0% crash,
  0 violation d'intégrité `once`, taux de titre élite 13,3% (bande normale 7,7-21,7%). `npm run build`
  et rendu réel démarré (`npm run dev`) pour inspection visuelle -- **limite transparente** : aucun
  outil d'automatisation navigateur disponible cette session (extension Claude in Chrome déclinée,
  pas de Playwright/chromium-cli installé) pour capturer des captures d'écran ; le serveur a été
  ouvert dans le navigateur de l'utilisateur pour une vérification visuelle manuelle, la correction
  fonctionnelle repose sur les audits DOM ci-dessus (présence des éléments, contenu HTML, zéro
  erreur JS), pas sur une inspection visuelle automatisée.
  **Limite acceptée, documentée** : une carrière de défi entre amis sauvegardée pile au milieu de
  l'ancien assistant de création (entre les anciennes étapes 3 et 5), au moment précis où cette mise
  à jour est déployée, reprendrait directement dans la saison avec un nom/mode de vie potentiellement
  encore vide -- fenêtre extrêmement étroite, acceptée plutôt que sur-corrigée (même tolérance que
  d'autres évolutions de schéma passées, ex. AGD-56).

- [x] **AGD-57 — Backend Supabase pour le classement des défis entre amis** _(implémenté et vérifié le 2026-08-03)_
  Suite du lot backend Supabase (migration SQL + client REST + branchement dans `endCareer()`/le
  podium, déjà commités en 4 commits précédents) : la table `challenge_scores` était absente du
  projet Supabase distant (clé "anon" fournie, sans droits DDL -- impossible de la créer moi-même,
  étape manuelle documentée dans ce ticket). L'utilisateur a exécuté
  `supabase/migrations/0001_challenge_scores.sql` dans l'éditeur SQL du dashboard.
  Relancé `npm run audit:leaderboard-live` contre le VRAI serveur (aucun mock) : la table existe
  désormais, mais 3 vérifications sur 15 échouaient -- **pas un défaut du code de production**, un
  défaut du harnais de test lui-même. Diagnostic : `tests/audit_leaderboard_live.mjs` simule
  chaque "appareil" via un process Node séparé (`tests/leaderboard_device_check.mjs`), correct pour
  isoler les singletons de module (même raison qu'AGD-51) -- mais chaque process recrée un jsdom
  avec un `localStorage` EN MÉMOIRE VIDE, donc un `client_id` neuf à chaque appel, y compris pour
  plusieurs appels censés représenter le MÊME appareil (ex. "A" qui se resoumet). Conséquence :
  `mine` ne correspondait jamais côté client (client_id différent à chaque lecture) et l'upsert
  serveur `on_conflict=(challenge_id, client_id)` ne pouvait jamais fusionner (client_id différent
  à chaque soumission), empilant une ligne par tentative au lieu de mettre à jour la même.
  Corrigé dans le harnais de test (`leaderboardApi.js` inchangé côté logique, seul `CLIENT_ID_KEY`
  exporté pour permettre au test de le préremplir) : `leaderboard_device_check.mjs` accepte
  désormais un `deviceId` explicite et persiste le `client_id` de cet appareil dans un fichier
  d'état temporaire (`HARDWOOD_DEVICE_STATE_DIR`, propre à chaque exécution de l'audit, nettoyé à
  la fin) -- deux appels successifs avec le même `deviceId` sont enfin le même appareil aux yeux du
  serveur, exactement comme deux appels sur le même téléphone.
  Une fois ce vrai bug de simulation corrigé, une 4e vérification a d'abord échoué à son tour
  (resoumission à un MEILLEUR score rejetée) -- pas un bug non plus : le trigger SQL anti-spam de
  la migration (`challenge_scores_guard`, throttle à 5s entre deux vraies améliorations de la même
  ligne, voir `0001_challenge_scores.sql`) fonctionnait EXACTEMENT comme prévu, l'audit enchaînait
  simplement les soumissions plus vite qu'un joueur réel ne le ferait jamais (un défi se joue en
  bien plus de 5 secondes). Corrigé en ajoutant une pause de 5.2s dans l'audit avant cette étape,
  pas en affaiblissant la garde anti-triche.
  **Vérifié directement, contre le vrai serveur Supabase** (`npm run audit:leaderboard-live`, 15
  vérifications, toutes vertes après les deux corrections ci-dessus) : deux appareils/process
  indépendants voient bien les deux scores partagés sans échange de lien, `mine` jamais confondu
  entre eux dans les deux sens, tri par score décroissant correct, une resoumission plus faible
  n'écrase jamais le meilleur score enregistré, une resoumission meilleure (après la fenêtre
  anti-spam) remplace bien l'ancienne ligne SANS empiler (toujours exactement 2 lignes après 3
  soumissions du même appareil), score aberrant (999999) rejeté par le serveur et absent de tout
  classement. Non-régression : `npm run audit` (100 carrières, 0% crash), `npm run
  audit:leaderboard` (14 vérifications hors-ligne, repli local/timeout/erreur HTTP toujours sans
  exception), `npm run audit:challenge` (23 vérifications, parcours à 3 appareils via lien de
  défi/résultat toujours intact) tous verts.

- [x] **AGD-56 — Ajustement du défi entre amis : classements dans le hub, filtrés, purgeables** _(implémenté et vérifié le 2026-08-03)_
  Suite directe d'AGD-55, quatre ajustements demandés explicitement le jour même.
  1. *Classements déplacés dans l'onglet "Défi entre amis"*. La tuile d'accueil "🔗 Défi entre
     amis" (`id="challengeCreate"`, inchangé) n'ouvre plus directement la création -- elle ouvre
     désormais un écran d'entrée dédié, `renderChallengeHub()` (`ui/challenge.js`), avec deux choix
     nets et explicites : "🆕 Nouveau défi" et "🏆 Mes classements" (nom choisi pour refléter le
     contenu réel -- des SCORES, pas une simple liste de défis). Le bouton autonome "🔗 Mes défis"
     du groupe accueil "Suivi & records" (ajouté par AGD-55) est retiré -- un seul point d'entrée
     désormais, sous la tuile du mode lui-même, plus cohérent qu'une entrée dupliquée à deux
     endroits. Garde-fou de confirmation d'écrasement de sauvegarde déplacé en conséquence : plus
     sur la tuile (qui ne fait plus que naviguer vers le hub, jamais destructeur), mais sur le
     bouton "Nouveau défi" DANS le hub -- la seule action qui démarre réellement une carrière.
  2. *Filtré aux défis réellement joués*. `renderMyChallenges()` ne liste plus QUE les défis où
     `results.some(r => r.mine)` -- un défi créé ou rejoint mais jamais mené à son terme n'a aucun
     score à montrer, il n'a "pas de sens" dans un classement (tel que demandé). Un défi encore
     "en cours" (rejoint, jamais fini) reste bien connu du moteur (`engine/challenges.js`, pour
     pouvoir reprendre la carrière normalement via la sauvegarde) -- seul l'AFFICHAGE dans "Mes
     classements" l'exclut.
  3. *Purge*. Deux mécanismes complémentaires, comme demandé ("clean la page OU clean
     automatiquement au bout d'un mois") :
     - Manuelle : bouton "🗑️ Vider mes classements" sur l'écran (visible seulement si la liste
       n'est pas vide), avec confirmation, réutilise `clearChallenges()` (déjà existant, même
       fonction que le Panthéon/les badges).
     - Automatique : nouveau champ `updatedAt` par défi (déjà posé par AGD-55 pour le tri), lu par
       `pruneStale()` (`engine/challenges.js`) au chargement du module -- tout défi non retouché
       depuis plus de 30 jours est supprimé silencieusement du stockage, sans action de l'utilisateur.
       Aucune donnée "importante" n'est concernée (jamais relu par la simulation, purement le
       classement social d'un défi entre amis dont la fenêtre d'usage naturelle est de toute façon
       courte).
  Navigation resserrée en cohérence : "Retour" depuis l'écran de création d'un défi et depuis "Mes
  classements" ramènent désormais au hub (leur parent logique direct) plutôt qu'à l'accueil --
  évite de perdre le fil en deux clics quand on hésite entre les deux choix.
  **Vérifié directement** (`tests/audit_challenge_revisit.mjs`, réécrit pour ce nouveau parcours,
  30 vérifications ; nouveau `tests/challenge_prune_check.mjs`, process dédié pour la purge
  automatique -- le cache mémoire du module n'étant peuplé qu'une fois par process, la donnée
  pré-expirée doit être en place avant le tout premier appel, exactement comme un vrai
  redémarrage) : la tuile d'accueil ouvre bien le hub avec ses deux choix ; un défi créé mais
  jamais joué confirmé ABSENT de "Mes classements" avant et après avoir joué d'autres défis ;
  parcours complet terminer -> quitter -> revenir via le hub -> rejouer (même id, score remplacé
  seulement si meilleur) -> nouveau défi (id distinct, entrée séparée) -> les deux défis joués
  listés, le défi jamais terminé toujours absent ; purge manuelle confirmée vider la liste ET le
  moteur ; purge automatique confirmée sur un défi à 40 jours d'inactivité (supprimé) contre un
  défi à 2 jours (conservé), dans `listChallenges()` ET dans le localStorage brut. Non-régression :
  `tests/audit_challenge_flow.mjs`/`tests/challenge_flow_device.mjs` (AGD-51) mis à jour pour
  passer par le hub, toujours verts ; suite complète (`audit`/`audit:meta`/`audit:i18n`/
  `audit:coherence`/`audit:cosmetics`/`audit:link`/`audit:retention`/`audit:polish`) tous verts ;
  `scripts/deep-audit.mjs` 300 carrières -- 0% crash, 0 violation d'intégrité `once`, taux de titre
  élite 13,7% (bande normale 7,7-21,7%).

- [x] **AGD-55 — Correction prioritaire : accès permanent au podium du défi entre amis** _(implémenté et vérifié le 2026-08-03)_
  Bug confirmé : une fois l'écran de classement quitté ("Retour à l'accueil" -> `screenTitle()`),
  il n'existait plus AUCUN moyen d'y revenir -- `renderChallengeLeaderboard()` n'était appelée que
  depuis le bouton "Comparer avec mes amis" de l'écran de fin de carrière (disparaît dès qu'on
  quitte cet écran) ou depuis l'ouverture d'un lien de résultat reçu. Le classement restait pourtant
  bien intact en mémoire (`localStorage`, `hardwood_challenges_v1`) -- seul l'ACCÈS manquait, pas
  la donnée.
  1. *Accès permanent*. Nouvelle fonction `listChallenges()` (`engine/challenges.js`) : tous les
     défis connus sur l'appareil (créés, rejoints, ou même seulement reçus par un lien de résultat
     sans avoir jamais eu le lien de défi original), triés du plus récemment actif au plus ancien
     (nouveau champ `updatedAt`, posé à la création et retouché à chaque résultat ajouté). Nouvel
     écran "Mes défis" (`renderMyChallenges()`, `ui/challenge.js`) : une ligne par défi (profil de
     départ + meilleur score personnel + nombre de participants), cliquable, ramène directement sur
     le classement de CE défi précis. Entrée ajoutée au groupe "Suivi & records" de l'accueil
     (`🔗 Mes défis`, à côté de Panthéon/Hauts faits/Ma progression), toujours visible même sans
     aucun défi joué (état vide géré, comme le Panthéon).
  2. *Rejouer ou nouveau défi, choix explicite*. Deux boutons nets ajoutés sur l'écran de
     classement, mis en avant (rang au-dessus des actions secondaires partager/inviter) : "🔁
     Rejouer ce défi" (réutilise `joinChallenge(entry.def)` -- même id de défi, même profil de
     départ imposé, uniquement si le défi est réellement connu localement) et "🆕 Nouveau défi"
     (réutilise `startChallengeCreation()` -- graine fraîche, nouveau profil, nouvel id, devient
     une entrée séparée dans "Mes défis"). Même garde-fou de confirmation qu'à l'accueil pour
     toute action qui écraserait une carrière en cours (`hasSavedGame()`/`confirm()`,
     `home.confirmOverwriteChallenge` réutilisé tel quel).
     Effet de bord nécessaire, découvert en concevant "rejouer" : l'ancien `addResult()` empilait
     une nouvelle ligne "mine" à chaque tentative de la MÊME personne sur le MÊME défi -- rejouer
     plusieurs fois aurait fini par noyer le classement sous ses propres essais. Nouvelle fonction
     dédiée `recordMyChallengeResult()` (`engine/challenges.js`, même principe que
     `recordDailyResult()` du défi du jour) : une seule ligne "mine" par défi, REMPLACÉE seulement
     si la nouvelle tentative fait mieux -- "retenter un meilleur score" au sens propre, jamais un
     historique qui s'accumule. `addResult()` reste inchangée pour les résultats REÇUS d'amis (voir
     `handleIncomingLink()`), où plusieurs personnes différentes doivent bien coexister.
     `screens.js` `endCareer()` mis à jour pour appeler `recordMyChallengeResult()` au lieu
     d'`addResult()` sur le résultat du joueur local.
  **Vérifié directement, parcours complet** (`tests/audit_challenge_revisit.mjs`, nouveau,
  `npm run audit:challenge-revisit`, 20 vérifications) : défi terminé -> retour à l'accueil -> plus
  aucun bouton direct vers le classement (bug reproduit tel que rapporté) -> "Mes défis" depuis
  l'accueil -> le défi précis y apparaît avec le bon score -> clic -> classement fidèle retrouvé,
  rien perdu ; "Rejouer ce défi" confirmé démarrer avec le MÊME id de défi et le MÊME profil imposé,
  une 2e tentative confirmée ne PAS dupliquer la ligne "mine" (toujours 1 seule) et conserver le
  MEILLEUR des deux scores ; "Nouveau défi" confirmé générer un lien et un id VRAIMENT différents,
  qui devient une 2e entrée séparée et indépendante dans "Mes défis" (les deux défis restent
  accessibles individuellement) ; 0 erreur JS sur l'ensemble du parcours. Non-régression :
  `tests/audit_challenge_flow.mjs` (AGD-51, toujours vert -- le remplacement d'`addResult()` par
  `recordMyChallengeResult()` ne change rien à un scénario à une seule tentative par personne) ;
  suite complète (`audit`/`audit:meta`/`audit:i18n`/`audit:coherence`/`audit:cosmetics`/
  `audit:link`/`audit:retention`/`audit:polish`) tous verts ; `scripts/deep-audit.mjs` 300
  carrières -- 0% crash, 0 violation d'intégrité `once`, taux de titre élite 10% (bande normale
  7,7-21,7%).

- [x] **AGD-53 — Lot de finitions avant diffusion (prix boutique, première impression, carte de partage)** _(implémenté et vérifié le 2026-08-01)_
  Trois points.
  1. *Rééquilibrage des prix de la boutique*. Ancien système à 2 paliers flous ("cheap" 1 500-
     8 000 k€, "prestige" 150 000-260 000 k€ presque sans hiérarchie interne -- ex. les 6 thèmes
     originaux et les 10 thèmes de franchises NBA n'étaient séparés que de 4 000 vs 7 000 k€,
     quasiment le même prix). Recalibré sur une distribution RÉELLE de gain par carrière
     RE-mesurée sur l'état actuel du jeu (300 carrières pilotées, `earnFromCareer` = trésorerie +
     primes de titres -- a monté depuis le calibrage d'AGD-47, suite aux lots cohérence/confort et
     rétention) : médiane ~20 600 k€, p75 ~41 800 k€, max observé sur une seule carrière
     ~112 400 k€. Trois paliers nommés et nettement séparés (`tier:'common'|'rare'|'prestige'`,
     `engine/cosmetics.js`) : commun 10 000-12 000 k€ (plancher relevé x6.7 par rapport à l'ancien
     1 500 k€, comme demandé -- reste sous la médiane, "une carrière correcte" y suffit), rare
     32 000-40 000 k€ (au-dessus de p75, réclame une très bonne carrière isolée ou deux carrières
     cumulées), prestige 230 000-320 000 k€ (AU-DESSUS du maximum observé sur une seule carrière --
     aucune carrière, même exceptionnelle, n'y suffit seule). Chaque item des 4 familles (thèmes/
     cartes/titres/cadres) reclassé selon son degré d'élaboration relative (ex. thèmes de
     franchises NBA vs palettes originales, cadres à pierres précieuses vs cadres bois/bronze).
     Puce de rareté explicite ajoutée sur chaque tuile de la boutique (`rarityChipHTML()`,
     `ui/shop.js`) + traitement visuel dédié au palier "rare" (`.shop-tile.rare`, bordure
     terracotta) en plus du traitement "prestige" déjà existant (lavis or) -- la hiérarchie se
     voit au premier coup d'œil, pas seulement au prix affiché.
  2. *Première impression*. Diagnostic demandé explicitement ("vérifie... signale-moi"), traité
     comme tel -- aucune réécriture de contenu unilatérale. Confirmé : l'écran de bienvenue EST le
     tout premier écran vu par un nouveau joueur (`screenTitle()` redirige immédiatement vers
     `screenWelcome()` tant qu'aucun choix n'est mémorisé, jamais un écran distinct avant) ;
     parcours complet piloté (bienvenue -> "Passer" OU "Compris, on commence" -> écran titre ->
     geste principal -> création de personnage) sans la moindre erreur JS. Deux frictions
     potentielles identifiées et documentées dans un nouveau ticket dédié (voir AGD-54, section
     Ouvert) plutôt que corrigées sans validation : contenu dense (~390 mots) avant le bouton
     principal, bouton "Passer" visuellement discret. Décision éditoriale laissée à l'utilisateur.
  3. *Carte de fin de carrière*. Manque réel trouvé : AUCUN lien vers le jeu nulle part -- ni dans
     les pixels de la carte (canvas), ni dans le texte de partage. Le nom "HARDWOOD" était déjà
     bien présent (titre en haut + pied de carte), mais un curieux qui tombe sur l'image seule
     (repost, capture d'écran, aperçu de conversation sans le texte d'origine) n'avait aucun moyen
     de retrouver le jeu -- exactement le scénario que "chaque partage doit ramener des curieux"
     cherche à éviter. Corrigé à la source, pas seulement en apparence :
     - Pied de carte (`drawCard()`, `ui/card.js`) : porte désormais `🏀 HARDWOOD · {domaine}`
       (`window.location.host`, jamais un domaine codé en dur qui se périmerait au moindre
       changement d'hébergement), avec la même réduction dynamique de police que le reste de la
       carte si la combinaison dépassait la largeur sûre -- remplace l'ancien texte fixe
       "🏀 HARDWOOD" sans lien.
     - Texte de partage (`careerCard.shareText`, i18n fr/en) : le lien complet
       (`window.location.origin`) est désormais intégré AU TEXTE lui-même, pas passé comme champ
       `url` séparé -- `shareOrFallback()` (`ui/share.js`) ignore ce champ dès que des fichiers
       sont partagés (cas normal ici, l'image de la carte), et la copie presse-papiers de dernier
       recours perdrait le lien si celui-ci n'était que dans `url`. Un seul endroit porte le lien,
       il survit donc à TOUS les chemins de partage identiquement.
     Le reste de la revue ("irréprochable dans tous les cas") a confirmé le système déjà en place
     plutôt que trouvé de nouveaux défauts : curseur Y dynamique (aucune position codée en dur),
     troncature par largeur réelle sur le nom, réduction de police dynamique sur les lignes de
     stats/citation, gestion des champs optionnels (HOF, totaux cumulés, sparkline) -- déjà audité
     lors de sessions précédentes (AGD-32/35), re-testé ici sur des cas volontairement extrêmes
     plutôt que simplement relu.
  **Vérifié directement** (`tests/audit_polish.mjs`, nouveau, `npm run audit:polish`, 33
  vérifications) : les 36 items payants confirmés répartis sur 3 paliers sans chevauchement (max
  commun 12 000 < min rare 32 000 < max rare 40 000 < min prestige 230 000), plancher de prix
  vérifié à 10 000 k€ (>= 1 500 k€ x6.7) ; parcours de première impression piloté deux fois (via
  "Passer" et via "Compris, on commence") sans erreur JS ; carte de fin de carrière testée avec un
  contexte canvas instrumenté à métriques PROPORTIONNELLES (measureText réaliste, contrairement au
  stub global à largeur fixe des autres tests -- seul moyen d'exercer réellement les boucles de
  troncature/réduction de police) sur un cas extrême riche (nom de 60 caractères, score à 6
  chiffres, citation de presse démesurée x2) ET un cas extrême pauvre (nom d'1 caractère, carrière
  d'1 saison, aucune statistique cumulée/citation) : aucune exception, aucune coordonnée de texte
  hors des bornes du canvas dans les deux cas, nom tronqué avec ellipse sur le cas riche jamais sur
  le cas pauvre, pied de carte (nom du jeu + domaine) toujours présent et jamais recouvert par la
  citation de presse même démesurée, domaine confirmé présent dans le texte de partage. Les 6
  styles de carte de la boutique retestés sur le cas riche (le plus contraignant), tous
  fonctionnels. Audit de non-régression : `npm run audit`/`audit:meta`/`audit:i18n`/
  `audit:coherence`/`audit:cosmetics`/`audit:link`/`audit:challenge`/`audit:retention` tous verts ;
  `scripts/deep-audit.mjs` 300 carrières -- 0% crash, 0 violation d'intégrité `once`, taux de titre
  élite 9% (bande normale 7,7-21,7%).

- [x] **AGD-52 — Lot rétention (rareté, prochain objectif, suggestion de défi, refonte des badges, identité du défi du jour)** _(implémenté et vérifié le 2026-08-01)_
  Cinq points, tous vérifiés par exécution réelle (pas seulement lecture de code).
  1. *Message de rareté en fin de carrière*. Nouveau module `engine/retention.js`
     (`rarityPct(score)`), seuils calibrés sur une distribution RÉELLE de 300 carrières pilotées
     (p75~149, p90~227, p95~274, p99~331 de score légende) -- arrondis délibérément AU-DESSUS du
     percentile mesuré, jamais en dessous (mieux vaut sous-promettre la rareté que la dépasser en
     pratique). N'affiche RIEN sous le seuil "top 25%" (score < 150) : réservé aux "grandes
     carrières" comme demandé, pas un message sur chaque partie. Bandeau visuel dédié
     (`.rarity-banner`, lavis or) affiché juste après le résumé de tier, avant les tags -- premier
     élément marquant de l'écran de fin.
  2. *Prochain objectif à débloquer*. `nextBadgeHints(p, state, 2)` (`engine/retention.js`) :
     jusqu'à 2 hauts faits pas encore débloqués mais déjà à 50% ou plus de leur seuil, triés par
     proximité. Repose sur un nouveau champ optionnel `progress(p,state)->{value,target,unit}`
     ajouté à 14 badges (les critères numériques qui s'y prêtent -- clutch, triple-doubles, MVP,
     titres de meilleur marqueur/défenseur, tournois internationaux, paliers de titre multiple,
     score G.O.A.T., et les 6 nouveaux badges à seuil cumulé) ; les badges à conditions multiples/
     qualitatives (fidélité à un club, renaissance après bust...) n'en ont délibérément PAS --
     mieux vaut n'afficher aucun indice qu'un chiffre trompeur. Message concret conforme à la
     demande : "Encore 1 titre pour débloquer « Champion à tous les étages »."
  3. *Suggestion de nouveau défi personnel*. `suggestChallenge(state)` (`engine/retention.js`),
     ordre de priorité poste jamais joué -> nation sans championnat local jamais représentée ->
     voie de développement (US/Europe/Australie) jamais empruntée -> repli générique une fois tout
     exploré. Nouveau suivi persistant "de fond" dans `engine/badges.js`
     (`everPositions`/`everStartPaths`/`everNoHomeLeague`, mis à jour à CHAQUE carrière sans
     condition de niveau atteint -- distinct des compteurs "collection" existants qui exigent
     Superstar+, ici on veut savoir ce qui a été ESSAYÉ, pas seulement réussi). Préservé par
     `badgesClear()` comme `totalCareers` (même raisonnement qu'AGD-39 : pas un badge, une trace
     du joueur lui-même).
  4. *Refonte des badges* (`engine/badges.js`, 30 -> 41 badges). Trois badges recalibrés après
     avoir mesuré leur taux de déclenchement réel sur 300 carrières indépendantes (état frais
     chacune) : `marathon_career` (16 saisons -> 100% de déclenchement, quasi aucune valeur
     différenciante -- la longévité brute est presque garantie par le jeu dès qu'on évite une
     retraite forcée, médiane observée 23 saisons) devient "Marathonien", 20 saisons ET aucune
     blessure sur toute la carrière (RE-mesuré après correctif : 30.3%) ; `tier_explorer`
     (4 paliers -> 79.3%) relevé à 6 paliers (RE-mesuré : 24.3%), exige un vrai changement de
     SYSTÈME (US<->Europe<->Australie) plutôt que de monter les échelons d'un seul ; `last_dance`
     (37 ans -> 77%, le jeu retraite quasi tout le monde vers 38 ans) exige en plus de rester un
     vrai rotationnaire (20 min/match) lors de la toute dernière saison (RE-mesuré : 36%). 5
     nouveaux badges "carrière" exploitant des données déjà calculées mais jamais
     récompensées (Sniper attitré/Verrou défensif : titres de meilleur marqueur/défenseur ;
     Sensation rookie : Rookie de l'année ; Retour aux sources : même club au départ et à la
     retraite ; Phénix : retour au niveau Superstar la saison suivant une blessure). 6 NOUVEAUX
     badges à seuil CUMULÉ INTER-CARRIÈRES comme demandé explicitement (points/titres/carrières,
     2 paliers chacun) : `lifetimePts`/`lifetimeTitles` (nouveaux compteurs persistants dans
     `badgesState()`, incrémentés à chaque `evaluateBadges()`, jamais remis à zéro par un reset de
     badges) + `totalCareers` (déjà existant) -- seuils calibrés sur la même distribution de 300
     carrières (médiane ~11 800 pts/carrière, ~0.2 titre/carrière en moyenne) : 50 000/250 000
     points, 5/15 titres, 25/75 carrières.
  5. *Identité propre du défi du jour*. Jusqu'ici quasi identique au défi entre amis (même écran,
     même choix d'académie). Nouvelle disposition : l'académie de départ n'est PLUS choisie par le
     joueur mais IMPOSÉE (`def.forcedAcademyIndex`, dérivé de la même graine que le profil du
     jour -- déterministe, identique pour tout le monde ce jour-là), `startCareer()`
     (`engine/season.js`) saute directement l'écran de choix pour `p.dailyDate` et démarre la
     saison -- contrairement au défi entre amis, qui garde le choix libre, non touché. Habillé
     d'un "thème du jour" purement narratif (8 thèmes tournants, `DAILY_THEMES` dans
     `engine/dailyChallenge.js`, dérivé de la même graine par un modulo différent pour ne pas
     coïncider avec l'académie imposée), affiché en badge dédié (`.daily-theme-badge`) sur les
     deux écrans du défi du jour. Volontairement SANS toucher à la simulation elle-même (aucun
     risque d'équilibrage) : seule la présentation + UNE décision en moins changent.
  **Vérifié directement** (`tests/audit_retention.mjs`, nouveau, `npm run audit:retention`, 47
  vérifications) : seuils de rareté testés aux bornes exactes ; badges "presque atteints" détectés
  correctement (7/8 moments clutch) et jamais pour un badge trop loin (1/8) ou déjà débloqué ;
  ordre de priorité des 4 branches de suggestion testé une par une ; les 3 badges recalibrés
  refusent explicitement l'ancien seuil trivial et acceptent le nouveau ; les 5 nouveaux badges
  "carrière" et les 6 badges à seuil cumulé testés déclenché/refusé sur des joueurs synthétiques ;
  cumul `lifetimePts`/`lifetimeTitles`/`totalCareers` vérifié sur 5 évaluations enchaînées (pas
  supposé) puis confirmé PRÉSERVÉ après `badgesClear()` (même garde-fou qu'AGD-39) ; déterminisme
  du défi du jour vérifié sur deux appels à la même date (même académie imposée, même thème) et
  variété confirmée entre deux dates différentes ; parcours réel piloté confirme qu'AUCUN écran de
  choix d'académie n'apparaît pour le défi du jour (contrairement au défi entre amis, testé juste
  à côté dans le même script pour confirmer l'absence de régression) ; carrière complète pilotée
  jusqu'à l'écran de fin sans erreur JS avec tous les nouveaux blocs inclus. Non-régression :
  `npm run audit` 150 carrières (0% crash), `npm run audit:i18n`/`audit:coherence`/
  `audit:cosmetics`/`audit:link`/`audit:challenge` tous verts, `scripts/deep-audit.mjs` 300
  carrières -- 0% crash, 0 violation d'intégrité `once`, taux de titre élite 13.7% (bande normale
  7.7-21.7%). Recalibrage des 3 badges resserrés reconfirmé sur un second échantillon indépendant
  de 300 carrières après correctif : marathon_career 100%->30.3%, tier_explorer 79.3%->24.3%,
  last_dance 77%->36% -- les trois redevenus de vrais badges différenciants sans devenir
  inatteignables.

- [x] **AGD-51 — Vérification et complétion du défi entre amis de bout en bout** _(implémenté et vérifié le 2026-08-01)_
  Demande explicite : répondre d'abord aux 3 questions de diagnostic (sans coder), puis compléter
  ce qui manquait. Vérification menée par exécution réelle, PAS par lecture de code seule -- deux
  puis trois "appareils" simulés en process Node RÉELLEMENT séparés (`tests/challenge_flow_device.mjs`),
  volontairement PAS deux instances jsdom dans le même process : `ui/dom.js` expose `stage` comme
  une constante de module figée à l'import (liée au premier `document` global rencontré) et
  `engine/challenges.js` cache son état en mémoire (`mem`) -- deux "appareils" partageant le même
  process partageraient ces singletons et ne prouveraient rien sur un cas réel à deux téléphones,
  qui eux ne partagent QUE ce qui transite explicitement par un lien.
  **Réponses aux 3 questions (diagnostic avant tout code) :**
  1. *Partage d'un lien de résultat en fin de carrière ?* Déjà en place et fonctionnel avant cette
     session : `renderChallengeLeaderboard()` (`ui/challenge.js`) expose un bouton "📤 Partager mon
     score" branché sur `shareOrFallback()` (partage natif déjà existant) avec `buildResultUrl(myResult)`,
     et `handleIncomingLink()` décode un lien `?result=...` reçu pour l'ajouter au classement local
     (`mine:false` forcé). Confirmé par exécution réelle : lien produit, décodé, mêmes valeurs.
  2. *Vrai écran de comparaison/podium ?* Un écran de classement réel existait déjà
     (`renderChallengeLeaderboard()`, trié par score décroissant côté `engine/challenges.js`
     `addResult()`), MAIS son rendu était une liste à numéros nus (`<span class="rk">${i+1}</span>`)
     -- pas un podium, contrairement au Panthéon qui a déjà son propre traitement couronne/médaille
     (`rankGlyph()` dans `ui/card.js`, `crownIcon()`/`medalIcon()` dans `ui/trophies.js`). **Manque
     confirmé et corrigé** : `rankGlyph()` exporté depuis `ui/card.js` et réutilisé tel quel dans
     `renderChallengeLeaderboard()` (même traitement visuel que le Panthéon : couronne 1er, médailles
     or/argent 2e/3e, classe `.podium`/`.top` sur les 3 premières lignes). Ajouté au passage (pas
     demandé explicitement mais nécessaire à une "comparaison claire") : ma propre ligne repérée par
     un indicateur "(toi)" + un liseré `.hof-row.mine` (`styles.css`), pour qu'on distingue sa place
     dans le classement même hors podium.
  3. *Score rattaché à l'id du défi et conservé ?* Oui, déjà correct avant cette session :
     `screens.js` `endCareer()` appelle `addResult(p.challengeId, {...})` avec le même garde-fou
     anti-double-comptage que la cagnotte/le Panthéon (`p.savedChallengeResult`), et
     `engine/challenges.js` stocke `{ [challengeId]: { def, results: [...] } }` en localStorage
     (`hardwood_challenges_v1`, même robustesse repli-mémoire que Panthéon/badges/cagnotte).
     Confirmé directement : résultat retrouvé sous le bon id, dédoublonnage fonctionnel, trié par
     score décroissant.
  **Donc un seul manque réel** : le rendu "podium" du classement -- corrigé comme décrit au point 2,
  rien d'autre à implémenter côté logique (partage + persistance déjà solides).
  **Vérifié directement, parcours complet à deux joueurs réels sur le MÊME défi** (nouveau script
  permanent `tests/audit_challenge_flow.mjs`, `npm run audit:challenge`, 3 process Node indépendants) :
  appareil A crée le défi, joue sa carrière jusqu'au bout sans erreur JS, génère un lien de résultat
  court (<200 caractères) ; appareil B (process totalement distinct) décode ce même lien de défi
  (même id régénéré depuis la graine), joue sa PROPRE carrière, ne voit d'abord que son propre score,
  puis ouvre le lien de résultat de A -- classement fusionné contient bien les 2 scores, triés par
  score décroissant, `mine` JAMAIS confondu entre les deux joueurs, podium (couronne/médaille SVG)
  réellement rendu dans le HTML, "(toi)" affiché sur la bonne ligne ; vérifié symétriquement (appareil
  A ouvre ensuite le lien de résultat de B) avec le même résultat. 21 vérifications, toutes passées.
  Audit de non-régression : `npm run audit` (100 carrières, 0% crash), `npm run audit:i18n`,
  `npm run audit:coherence`, `npm run audit:cosmetics`, `npm run audit:link` (tous verts, la
  réutilisation de `rankGlyph()` ne touche aucun de ces parcours) ; `scripts/deep-audit.mjs`
  300 carrières -- 0% crash, 0 violation d'intégrité `once`, aucune régression détectée (lot
  purement UI, aucune logique de jeu touchée).

- [x] **AGD-50 — Lot cohérence et confort (suite à des tests réels)** _(implémenté et vérifié le 2026-08-01)_
  Cinq points remontés en testant le jeu.
  1. *Cohérence de l'arborescence des choix*. Deux incohérences précises, reproduites puis
     corrigées, et une vraie brique de "mémoire de situation" pour prévenir la classe de bug :
     nouvelle fonction `hasFormerClub(p)` (`data/events/_helpers.js`), dérivée de l'historique
     RÉEL des saisons (`p.seasons[].club`) plutôt que d'un compteur proxy -- `revenge_game`
     ("Retrouvailles avec ton ancien club", `mid.js`) se déclenchait pour un joueur resté à son
     tout premier club depuis le début de sa carrière : `clubTenure>=1` et `seasons.length>=2`
     restent vrais dans ce cas alors qu'aucun "ancien club" n'a jamais existé. Corrigé en ajoutant
     `hasFormerClub(p)` à son `when()`. `benched` ("Le coach te laisse sur le banc", `shared.js`)
     se basait uniquement sur les minutes de la SAISON PASSÉE (`last.minutes<16`), pouvant encore
     se déclencher pour un joueur devenu titulaire entre-temps (progression d'attributs à
     l'intersaison) : corrigé en exigeant EN PLUS que le rôle structurel ACTUEL (`roleOf(p)`,
     déjà déterministe et réutilisé tel quel depuis `engine/player.js`, jamais dupliqué) soit
     `'bench'` ou `'rotation'`, jamais `'starter'`/`'star'`/`'franchise'`.
  2. *Débordement d'écran*. Cause trouvée : depuis qu'HARDWOOD est réellement installable en PWA
     plein écran (AGD-25), l'appli peut s'étendre sous l'encoche/la caméra frontale/la barre de
     statut translucide (`apple-mobile-web-app-status-bar-style:black-translucent`, déjà en place)
     sans qu'aucune règle CSS ne réserve cet espace -- le bouton accueil (position fixe, coin
     supérieur gauche) pouvait donc se retrouver sous la caméra, presque inatteignable.
     `env(safe-area-inset-*)` (repli 0px si non supporté, donc aucun changement sur le reste)
     ajouté à `.wrap` (conteneur principal, réserve l'espace pour tous les écrans en une seule
     fois) et individuellement aux éléments à position fixe qui échappent à ce conteneur
     (`.home-fab`, `.consent-banner`).
  3. *Récap de fin de carrière*. Bouton "Retour au menu principal" ajouté (`id="backToMenu"`,
     réinitialise le joueur et retourne à l'écran titre, même logique que "Nouvelle carrière").
     Statistiques cumulées de carrière (points/passes/rebonds/contres/interceptions, déjà
     calculées pour la carte partageable et le Panthéon) désormais affichées directement sur cet
     écran aussi -- `fmtNum()` exporté depuis `ui/card.js` plutôt que dupliqué.
  4. *Matchs joués par saison*. Cause trouvée : un joueur en bonne santé et non mis à l'écart
     jouait mécaniquement 100% du calendrier de la ligue (`gamesPlayed === leagueGames`) chaque
     saison -- seules les blessures narratives (`missedInjury`) et la mise à l'écart d'un joueur
     de banc (`dnp`, minutes<10) réduisaient ce total. Nouveau terme `routineAbsence`
     (`engine/season.js`) TOUJOURS présent (contrairement aux deux autres, conditionnels) : au
     moins 1 match manqué, jusqu'à ~4.5% du calendrier réel de la ligue -- repos, petit pépin,
     maladie, réalistes même pour un titulaire increvable. Se répercute automatiquement sur les
     statistiques cumulées de carrière, qui pondèrent déjà chaque saison par `gamesPlayed` (voir
     AGD-39) : aucun changement nécessaire côté calcul des totaux.
  5. *Forme*. Rééquilibrage mesuré de `applyRecovery()` (`engine/vitals.js`) : taux de base relevé
     de 0.5 à 0.56 (+12% relatif) -- comble un peu plus l'écart vers la cible chaque intersaison.
     La cible elle-même (plafonnée à 82, jamais 100) reste inchangée : c'est elle qui garantit
     qu'une récupération plus généreuse ne peut pas recréer le défaut d'origine (forme bloquée en
     haut), un simple ajustement de taux ne peut pas la contourner.
  Rendu vérifié en navigateur réel (Playwright, viewport 390×844) : bouton accueil positionné
  correctement (repli 8px propre en l'absence de zone de sécurité réelle, comme attendu sur desktop) ;
  carrière complète pilotée jusqu'à l'écran de fin, bloc "Statistiques cumulées de carrière" et
  bouton "Retour au menu principal" confirmés visibles à l'écran, dans cet ordre, avant l'armoire à
  trophées.
  **Vérifié directement** (`tests/audit_coherence.mjs`, nouveau, `npm run audit:coherence`) :
  `revenge_game.when()` testé directement contre un joueur synthétique resté à un seul club
  (refusé) et un joueur ayant réellement changé de club (accepté) ; `benched.when()` testé contre
  un joueur au rôle actuel largement titulaire malgré un signal de minutes passées bas (refusé) ;
  présence des règles `env(safe-area-inset-*)` vérifiée directement dans `styles.css` (haut pour
  `.wrap`/`.home-fab`, bas pour `.consent-banner`) ; carrière pilotée jusqu'au bout confirme le
  bouton "retour au menu" présent et fonctionnel (ramène bien à l'écran titre) et deux grilles
  `.legend-grid` distinctes affichées (paliers + cumulées) ; sur 23 saisons observées lors d'une
  carrière pilotée, 0/23 saison jouée à 100% du calendrier, moyenne de matchs manqués modeste
  (1.4-3.0 selon les runs, toujours dans la fourchette "quelques matchs" attendue). Audit de
  non-régression : `scripts/deep-audit.mjs` 300 carrières -- 0% crash, 0 violation d'intégrité
  `once`, taux de titre élite 10.3% (bande normale) ; forme moyenne passée de ~62.6-63.2 à 66.8
  (amélioration mesurée, comme demandé), quasi-plafond (>=97) resté bas à 0.1% (en baisse, pas en
  hausse -- confirmé ne PAS recréer le défaut d'origine "forme bloquée en haut").

- [x] **AGD-48 — Masquer l'onglet Collection (rendu pas assez satisfaisant sans vrais visuels)** _(implémenté et vérifié le 2026-07-31)_
  Suite directe d'AGD-47 point 5 : l'utilisateur a jugé le rendu de l'onglet Collection (silhouettes
  SVG faites maison + "Bientôt disponible") pas assez satisfaisant en l'état, sans les vrais
  visuels à venir. Demande explicite : garder le code en place, rendre l'onglet invisible et
  inaccessible. Nouveau drapeau `COLLECTION_TAB_ENABLED = false` en tête de `ui/shop.js` : filtre
  l'onglet hors de la liste affichée (`TABS`), et garde-fou supplémentaire dans `renderShop()` qui
  retombe sur l'onglet "Thèmes" si `currentTab` pointait quand même sur `'collection'` (état
  résiduel improbable mais couvert). AUCUN code supprimé : catalogue `family:'collection'`
  (`engine/cosmetics.js`, toujours `comingSoon:true`, toujours refusé à l'achat/l'équipement),
  `collectionSlotHTML()`, CSS `.collection-slot` -- tout reste en place, prêt à être réactivé
  (voir AGD-49) par un seul changement de drapeau une fois les vrais visuels fournis.
  **Vérifié** : test dédié mis à jour (`tests/audit_cosmetics.mjs`) confirme l'absence du bouton
  d'onglet `[data-tab="collection"]` sur l'écran boutique ; rendu vérifié en navigateur réel
  (Playwright) -- seuls 3 onglets visibles (Thèmes/Cartes/Profil), confirmé par lecture directe du
  DOM (`.shop-tab` -> 3 éléments, "Collection" absent). Audit de non-régression : `npm run audit`
  150 carrières + audits dédiés (i18n, lien de défi/traits) : 0% crash, tout passe.

- [x] **AGD-47 — Refonte économie boutique (monnaie réelle, primes de titres, descriptifs, onglet Collection)** _(implémenté et vérifié le 2026-07-31)_
  Cinq points, en creusant AGD-41 juste après sa livraison.
  1. *Abandon des jetons*. `engine/wallet.js` réécrit : la cagnotte cumule DIRECTEMENT la
     trésorerie de fin de carrière (`p.money`, même unité k€ que partout ailleurs dans le jeu --
     salaire/fortune du HUD, totaux de la carte), sans plus aucune courbe de conversion opaque.
     `tokensFromMoney()` supprimée. Icône remplacée : 🪙 (jugée trop proche d'une lune) -> 💰
     partout (accueil, boutique, fin de carrière, Ma progression) -- réutilise l'emoji déjà présent
     ailleurs dans le jeu pour l'argent (`💰 ${money(p.salary)}/an`, season.js), pas un nouveau
     symbole. Affichage systématiquement formaté via `money()` (déjà utilisé par le HUD/la carte --
     "X k€"/"X M€"), plus jamais un entier brut.
  2. *Prix recalibrés*. Les ~50 cosmétiques passent d'une échelle de jetons abstraite à des prix en
     k€, calibrés sur la distribution RÉELLE de trésorerie déjà mesurée cette session (médiane
     ~13 900 k€, p90 ~54 300 k€, max observé sur 300 carrières ~89 200 k€) : cosmétiques réguliers
     1 500-8 000 k€ (accessibles dès une carrière correcte), prestige 150 000-260 000 k€. Calibrage
     RE-VÉRIFIÉ par une simulation dédiée de 30 vraies carrières enchaînées (pas une estimation) :
     médiane par carrière ~15 800 k€ (largement au-dessus du cosmétique le plus cher hors
     prestige), cumul après 30 carrières ~881 M€, ~14 carrières médianes ou ~2-3 très bonnes
     carrières pour un item prestige à 220 000 k€ -- cohérent avec "plusieurs grosses carrières,
     au besoin des centaines de millions" demandé.
  3. *Primes de titres*. Nouvelle fonction `titleBonusFor(accolades)` (`engine/wallet.js`) : chaque
     trophée/titre de la carrière qui vient de se terminer ajoute un montant modéré à la cagnotte
     (barème par type d'accolade -- Champion NBA 3 000 k€, MVP 2 500 k€, All-Star 250 k€, médaille
     d'or 1 000 k€, etc., paliers mineurs à un tarif réduit), lu directement depuis `p.accolades`
     déjà calculé par `endCareer()`. Volontairement mesuré : même une carrière très décorée reste
     dominée par la trésorerie de base (vérifié -- la prime cumulée d'un profil élite type reste
     sous la médiane de trésorerie d'une carrière, jamais la source dominante).
  4. *Descriptifs réécrits*. Les ~50 descriptions de cosmétiques (thèmes, cartes, titres, cadres)
     réécrites avec du ton et de l'humour cohérent avec le reste du jeu (registre déjà utilisé
     dans les événements narratifs -- adresse directe "tu", private jokes basket : "Prévois de
     shooter à 3 points depuis le parking" pour le thème Warriors, "Trust the process, même pour
     choisir un thème d'interface" pour Philadelphie, etc.), en français ET en anglais (paires
     traduites, pas juste transposées littéralement).
  5. *Onglet Collection*. Quatrième onglet de la boutique (`ui/shop.js`), nouvelle famille
     `collection` dans le catalogue (`engine/cosmetics.js`, `comingSoon:true`) : 4 emplacements
     "carte" + 2 "maillot", jamais achetables/équipables tant qu'aucun visuel réel n'est fourni
     (refusés explicitement par `purchase()`/`equip()`, pas juste cachés). Rendu volontairement
     "propre mais en attente" (bordure pointillée, silhouette SVG faite maison, badge "Bientôt
     disponible") plutôt qu'un onglet vide ou une erreur -- prêt à recevoir les vrais visuels
     (cartes/maillots) sans reprendre la structure.
  Rendu vérifié en navigateur réel (Playwright) : accueil avec la nouvelle icône et le nouveau
  format M€, onglet Thèmes avec prix/descriptions recalibrés, onglet Collection avec les 6
  emplacements réservés correctement affichés.
  **Vérifié directement** (`tests/audit_cosmetics.mjs`, réécrit) : `earnFromCareer()` confirmé
  égal à trésorerie + primes exactement (formule directe, plus de courbe) sur une vraie carrière
  pilotée ; primes de titres calculées et strictement positives, différenciées majeur/mineur,
  restent modérées ; ré-invocation d'`endCareer()` ne recrédite pas ; les 36 items achetables
  (hors Collection) s'achètent/s'équipent tous ; les 6 emplacements Collection refusés à l'achat
  ET à l'équipement (`reason:'coming_soon'`) ; état localStorage inspecté directement ; parcours
  cliqué réel couvrant les 4 onglets, y compris Collection (aucun bouton acheter/équiper actif
  dedans) ; aucune fuite vers les défis/classements (structurel, inchangé) ; les 6 styles de carte
  se dessinent toujours sans exception. Audit de non-régression : `npm run audit` 150 carrières
  et `scripts/deep-audit.mjs` 300 carrières, 0% crash, 0 violation d'intégrité `once`, taux de
  titre élite 10.7% (bande normale).

- [x] **AGD-42 — Lien de défi entre amis trop long** _(implémenté et vérifié le 2026-07-31)_
  Le lien encodait tout le profil complet (attributs + offres d'académie) en JSON+base64
  (~1200 caractères de JSON, ~1600 caractères encodés, mesuré directement). Remplacé par
  l'encodage d'une simple GRAINE (`engine/challenges.js generateChallengeDef(seed)` +
  `engine/prng.js`, même mécanisme déterministe que le défi du jour) : le profil complet est
  régénéré à l'identique côté destinataire à partir de cette seule graine, jamais transmis.
  Lien de résultat compacté en tableau positionnel + palier réduit à un index (`engine/badges.js`
  `TIER_RANK`, déjà existant, exporté pour l'occasion) plutôt qu'un objet à clés nommées.
  **Vérifié** : lien de défi réel créé via le vrai flux UI = 34 caractères (contre ~1600 avant,
  calculé sur le même profil) ; deux décodages indépendants de la même graine produisent un
  profil strictement identique (attributs + offres d'académie inclus) ; lien corrompu/vide/non-
  string -> `null` sans exception ; lien de résultat décodé fidèlement, `mine` toujours exclu.
  Script dédié permanent `tests/audit_challenge_link.mjs` (`npm run audit:link`).

- [x] **AGD-43 — Développer le système de traits** _(implémenté et vérifié le 2026-07-31)_
  9 -> 17 traits (`engine/tags.js`). Six proviennent de flags narratifs déjà nourris par de
  nombreux événements existants mais jamais promus en trait visible (Noctambule/Héros des
  finales/Mentor/Grande rivalité/Chasseur de bagues/Loyaliste) -- chacun avait déjà son propre
  "fil narratif" de paiement dans `data/events/threads.js`, parfois sur plusieurs paliers
  (ex. `clutch_payoff` puis `clutch_legend_status`) : les rendre visibles leur donne une vraie
  identité de trait sans dupliquer le travail narratif déjà écrit. Deux entièrement nouveaux
  (Showman/Bosseur) avec leurs propres événements nourriciers (`highlight_reel`/
  `brand_highlight_deal`/`extra_reps`/`preserve_you`, `data/events/shared.js`). Comblé les deux
  seuls traits d'origine sans AUCUN scénario dédié (Tête brûlée, Chouchou des médias) avec un
  vrai arc en deux temps (événement récurrent `hasTrait()`-gated dans `traits_payoff.js` + palier
  "légende" `once:true` à seuil élevé dans `threads.js`), même structure que les traits
  historiques les mieux dotés. Couple avantage/inconvénient conservé pour les 8 nouveaux, jamais
  d'effet sur les attributs/probabilités de récompense (jauges molles seulement, comme les 9
  d'origine). Nouvelle opposition thématique `ringChaser`/`loyalOne` dans `OPPOSES`.
  **Vérifié** : `scripts/deep-audit.mjs` 300 carrières confirme les 17 traits actifs avec des
  fréquences de déblocage mesurées (5%-37% pour la plupart, quelques traits volontairement rares
  comme les 3 traits d'origine déjà connus pour l'être) ; script dédié confirme les 17 ids
  uniques, couple pro/con non vide pour chacun, et qu'aucun flag de trait n'est orphelin (nourri
  par au moins un événement réel du jeu) ; 0% crash, 0 violation d'intégrité `once`.

- [x] **AGD-44 — Réglages + traduction anglaise (interface et données)** _(implémenté et vérifié le 2026-07-31, périmètre narratif restant : voir AGD-46)_
  Infrastructure i18n complète et extensible (`engine/i18n.js` + `i18n/fr.js`/`en.js`,
  dictionnaires imbriqués en miroir) : `t(clé, variables)` résout dans la langue courante, retombe
  TOUJOURS sur le français si la clé manque côté anglais (jamais de texte cassé/clé brute
  affichée), langue persistée comme le Panthéon/les badges (`hardwood_locale_v1`), français par
  défaut tant qu'aucun choix explicite n'a été fait (décision utilisateur en session). Écran
  Réglages (`ui/settings.js`) accessible depuis l'accueil (groupe "Suivi & records"), sélecteur de
  langue FR/EN, note explicite sur le périmètre narratif restant.
  **Portée de session, choisie explicitement par l'utilisateur** ("Interface + données d'abord,
  narratif ensuite") : traduction à 100% de tout ce qui n'est pas narratif -- écran titre,
  bienvenue, création de personnage (5 étapes + choix d'académie), fin de carrière, Panthéon,
  fiche carrière, hauts faits, Ma progression, boutique (catalogue complet), carte de carrière
  (canvas ET partage), armoire à trophées, HUD (jauges/attributs), bandeau cookies, bouton
  accueil, écrans de défi (profil/palier). Catalogues de données traduits : postes, attributs,
  styles, modes de vie, 35 nations, ligues (dont le nouveau palier lycée), paliers de score
  (`TIER_RANK`), 30 hauts faits, ~50 cosmétiques, libellés de trophées/accolades (y compris les
  titres/MVP de palier mineur, un par palier de `leagues.js`). Cette dernière catégorie
  (accolades) reste stockée en français en interne (format de sauvegarde partagé avec le
  Panthéon/les défis, jamais changé) -- traduite uniquement à l'affichage via un index stable
  (même principe que `TIER_RANK`), jamais en touchant les enregistrements déjà sauvegardés.
  **Non couvert cette session** (voir AGD-46) : les ~200 événements narratifs de carrière, les
  commentaires/flaveur des clubs (`clubData.js`), quelques écrans secondaires (résultat de saison,
  transferts/draft, tournoi national) -- tous restent en français quelle que soit la langue
  choisie, sans casser l'affichage (repli français déjà démontré fonctionnel).
  **Vérifié directement** (`tests/audit_i18n.mjs`, nouveau, `npm run audit:i18n`) : les deux
  dictionnaires sont parfaitement en miroir (0 clé manquante des deux côtés) ; `t()` résout
  correctement en anglais et retombe sur le français pour une clé absente ; langue persistée en
  localStorage ; parcours cliqué réel accueil -> réglages -> anglais -> retour accueil (bouton
  Boutique confirmé traduit) -> re-français, sans erreur JS ; **une carrière complète pilotée
  entièrement en anglais de bout en bout, sans exception**. Rendu vérifié en navigateur réel
  (Playwright) : écran Réglages, accueil et étape "Ton pays" (35 nations) confirmés visuellement
  corrects en anglais. Audit de non-régression standard : 0% crash.

- [x] **AGD-45 — Retours de testeurs américains** _(implémenté et vérifié le 2026-07-31)_
  Deux points.
  1. *Stats non traduites*. Résolu comme conséquence directe d'AGD-44 : toutes les statistiques et
     libellés (attributs, postes, styles, paliers, trophées, cagnotte, cadres de boutique) passent
     désormais par `t()`. Vérification ciblée : recherche de tout affichage direct de `.name`/
     `.desc` de catalogue sans passer par `t()` dans les écrans touchés -- aucun trouvé.
  2. *Lycée distinct de l'université pour la voie US*. Cause trouvée : `chooseAcademy()`
     (`engine/season.js`) plaçait un joueur US directement en `college` (NCAA) dès la première
     saison, sans jamais passer par le lycée -- confirmé par un `CLUB_DATA.US.academy` existant
     mais mal aligné (10 entrées "pipeline" haut-prestige jamais utilisées par le moteur,
     reliquat d'un ancien lot). Nouveau palier `highschool` (`data/leagues.js`, tier 5, seuils
     sous ceux de la NCAA) avec un vrai roster de 14 lycées (programmes réels reconnus -- Montverde,
     IMG, Oak Hill, Sierra Canyon... -- plus deux lycées publics génériques pour la texture),
     `CLUB_DATA.US.highschool`. `generateAcademyOffers()` route désormais les offres US vers ce
     palier (`engine/academies.js`), `chooseAcademy()` démarre un joueur US en lycée (salaire 0,
     amateur), nouvelle promotion lycée -> NCAA en jeu (`engine/season.js`, seuil de niveau OU âge
     18 ans, jamais éligible à la draft directement depuis le lycée). Bug latent corrigé au
     passage : le compteur de saisons "à la fac" pour l'éligibilité anticipée à la draft comptait
     PAR ERREUR les saisons de lycée (`p.seasons.length` au lieu d'un filtre par ligue) -- aurait
     rendu un joueur éligible après une seule vraie saison de fac.
  **Vérifié** : script dédié forçant la voie US sur 60 carrières pilotées -- 54/54 carrières ayant
  choisi une offre US confirmées passer par `highschool` PUIS `college` dans cet ordre exact,
  jamais l'inverse, jamais `college` sans `highschool` au préalable ; 0 crash ; progression
  observée jusqu'en NBA/G League/EuroLeague sans accroc. Audit de non-régression standard (150
  carrières) et approfondi (300 carrières) : 0% crash, 0 violation d'intégrité `once`.

- [x] **AGD-41 — Cagnotte persistante + boutique cosmétique** _(implémentée et vérifiée le 2026-07-30)_
  Placeholder réservé depuis AGD-40 (groupe "Suivi & records" de l'accueil, conçu pour l'absorber
  sans rien bousculer), jamais commencé avant cette session -- premier diagnostic de session
  confirmé qu'aucun code de boutique/cagnotte n'existait, malgré une session utilisateur évoquant
  un chantier "cagnotte et boutique cosmétique" interrompu : aucune trace trouvée nulle part
  (AGENDA, code, historique git), on est reparti de zéro sur la base d'AGD-41. Portée cadrée par
  l'utilisateur en session : purement cosmétique, aucun effet sur gameplay/équilibrage/défis.
  1. *Cagnotte* (`engine/wallet.js`, stockage `hardwood_wallet_v1`, même robustesse localStorage
     + repli mémoire que le Panthéon/les badges). Convertit la trésorerie de fin de carrière
     (`p.money`, k€) en jetons via une courbe SUR-linéaire (exposant 1.5), volontairement exigeante
     comme demandé ("mieux vaut trop dur que trop facile") -- calibrée sur un échantillon RÉEL de
     300 carrières pilotées (pas une estimation) : carrière médiocre médiane -> ~5 jetons, All-Star
     -> ~88, Hall of Fame -> ~184, meilleure carrière observée sur l'échantillon (G.O.A.T.,
     89 200 k€) -> ~280. Créditée une fois par carrière terminée (`endCareer()` dans `screens.js`),
     avec le même garde-fou anti-double-comptage que `p.savedHOF` (endCareer() peut être
     ré-invoqué, ex. retour depuis "Ma carte") -- vérifié directement, pas supposé. Affichée dans
     le menu (écran titre, chip `.wallet-chip`) comme demandé.
  2. *Boutique* (`engine/cosmetics.js` + `ui/shop.js`), 3 familles strictement décoratives (aucune
     ne touche un champ lu par la simulation -- vérifié structurellement : `challengeCodec.js`/
     `challenges.js`/`dailyChallenge.js`/`season.js`/`player.js` n'importent jamais wallet.js ni
     cosmetics.js) :
     - *Thèmes de couleur d'interface* : reskinne les variables CSS d'accent (`--orange`/`--mint`
       et leurs nuances, + nouvelle `--btn-glow` extraite d'un literal rgba en dur pour que la
       lueur des boutons suive le thème) -- décision de scope assumée : le fond/panneaux
       (`--court`/`--panel`) et les ~25 lavis décoratifs `rgba()` en dur dispersés dans
       `styles.css` restent inchangés quel que soit le thème (ambiance de fond, pas l'identité de
       marque ; les retoucher tous aurait multiplié le risque de régression visuelle pour un gain
       marginal). 6 palettes originales + 10 thèmes de grandes franchises NBA réutilisant
       `GLOBAL_CLUB_COLORS` tel quel (`data/clubData.js`, sans logo ni marque) + 1 thème prestige
       ("Or Champion"). Génération de palette réutilisant les primitives de contraste déjà
       éprouvées d'`engine/accent.js` (`ensureContrast`/`deriveSecondary`, exportées pour
       l'occasion) plutôt que de les dupliquer -- les 17 thèmes vérifiés par script dédié contre
       les mêmes seuils de contraste AA que la palette d'origine. Bug trouvé et corrigé en session
       sur une couleur de marque proche du noir pur (Brooklyn) : `--orange-deep`/
       `--orange-deep-hover` convergeaient tous deux vers #000000 (survol de bouton sans aucun
       effet visuel) -- corrigé par un plancher de luminosité avant dérivation.
     - *Styles de carte de fin de carrière* (`CARD_STYLES` dans `card.js`) : 5 variantes + 1
       prestige ("Édition Légende", fond or + ornements d'angle). Implémentées en ne touchant
       QUE les couleurs/décors (fond, cadre, motif) -- le curseur Y qui positionne tout le texte
       (audité et sécurisé lors d'AGD-32/35) reste identique caractère pour caractère, aucune
       position ni aucun contenu ne change avec le style.
     - *Cadres + titres honorifiques de profil* : affichés sur "Ma progression" (`.profile-header`,
       nouveau bloc), 5 cadres + 1 prestige ("Cadre des Légendes"), 8 titres. Emplacements
       indépendants, "aucun équipé" par défaut, jamais aucune donnée de carrière associée.
  3. *Économie à deux vitesses* comme demandé : cosmétiques réguliers 10-45 jetons (accessibles
     dès une carrière décente), 3 items prestige à 420-520 jetons chacun (aucune carrière unique
     observée sur l'échantillon de calibration n'y suffit seule -- réclame plusieurs bonnes
     carrières ou une carrière exceptionnelle, comme demandé).
  4. *Intégration accueil* : bouton "🛍️ Boutique" ajouté au groupe "Suivi & records", exactement
     la place réservée par AGD-40/AGD-41, aucune réorganisation nécessaire.
  Rendu vérifié en conditions réelles (pas seulement en tests headless) : serveur de dev +
  Chromium piloté (Playwright), captures d'écran de l'accueil, des 3 onglets de la boutique,
  d'un thème NBA équipé en direct (reskin confirmé propagé immédiatement à toute l'interface,
  y compris après retour à l'écran d'accueil), d'un cadre + titre équipés sur "Ma progression",
  et d'une vraie carrière jouée de bout en bout jusqu'à la carte de fin en style "Édition
  Légende" (fond or + étoiles d'angle, layout intact) -- zéro erreur JS sur l'ensemble du
  parcours cliqué.
  **Vérifié directement** (`tests/audit_cosmetics.mjs`, nouveau, `npm run audit:cosmetics`) :
  formule de conversion monotone/jamais négative ; carrière pilotée réelle (harnais partagé)
  confirmée créditer exactement `tokensFromMoney(p.money)` jetons, solde localStorage cohérent ;
  ré-invocation d'`endCareer()` confirmée ne PAS recréditer (garde-fou testé, pas supposé) ;
  achat refusé si solde insuffisant (rien débité/possédé) ; rachat d'un item déjà possédé refusé ;
  `equip()` refuse une mauvaise famille et un item non possédé ; les 36 items payants du
  catalogue s'achètent et s'équipent tous sans exception ; état localStorage inspecté
  directement (pas seulement l'état mémoire) après achat/équipement ; les 6 styles de carte se
  dessinent sans exception sur un vrai contexte canvas ; aucune fuite structurelle vers les
  modules de défi/simulation (grep positif recherché, zéro trouvé) ; parcours cliqué complet
  écran titre -> boutique -> onglets -> achat -> équipement -> retour sans crash.
  Audit de non-régression : `npm run audit` 150 carrières (0% crash) ; `scripts/deep-audit.mjs`
  300 carrières (0% crash, 0 violation d'intégrité sur les 73 événements `once`, taux de titre
  élite 14.3% -- dans la bande normale 12-16%, cohérent avec un lot qui ne touche aucune logique
  de jeu).

- [x] **AGD-37 — Iconographie premium SVG (écran titre + écran de création)** _(ABANDONNÉ le 2026-07-30, jamais intégré)_
  Ajouté au registre le 2026-07-28. Remplacer les emojis par des icônes SVG faites maison,
  uniquement sur l'écran titre (menu principal) et l'écran de création (poste, style de jeu) --
  drapeaux nationaux non touchés.
  17 icônes conçues (`src/ui/icons.js`), jamais branchées sur les écrans -- restées bloquées en
  attente de l'accord explicite de l'utilisateur sur le style (aperçu publié pour validation,
  jamais confirmé). Décision explicite de l'utilisateur le 2026-07-30 : chantier abandonné avant
  d'avoir jamais commencé côté jeu (aucun fichier du jeu n'avait été modifié). `src/ui/icons.js`
  supprimé -- aucune trace à conserver, ce n'était qu'un brouillon non branché.

- [x] **AGD-40 — Refonte accueil et palmarès** _(implémentée et vérifiée le 2026-07-28)_
  Trois points.
  1. *Réorganiser l'accueil*. Passé d'une rangée unique de tuiles identiques à trois groupes
     visuellement distincts, avec l'ajout futur de la Boutique explicitement en tête (voir
     AGD-41) : geste principal SEUL en haut (gros bouton "Commencer"/"Reprendre ma carrière",
     `.home-cta`) ; "Modes de jeu" en cartes (`.mode-card`, même famille visuelle que les tuiles
     de création `.opt` mais teinte propre à chaque mode -- terracotta pour le défi entre amis,
     or/mint pour le défi du jour, la variation de couleur demandée n'est pas arbitraire, chaque
     mode garde SA teinte partout ailleurs dans le jeu) ; "Suivi & records" en puces compactes
     (Panthéon/Hauts faits/Ma progression) -- délibérément le format le plus scalable des trois,
     conçu pour absorber la Boutique et d'autres entrées futures sans bousculer la hiérarchie.
  2. *Refondre le palmarès (Panthéon)*. Cause du problème "chiffres mal centrés" trouvée
     précisément : `.lg` (tuiles de statistiques, réutilisées par la fiche Panthéon ET "Ma
     progression") ne posait jamais son propre `text-align:center` -- correct par accident sur
     l'écran de fin de carrière (dont le conteneur `.end` est centré par défaut), RÉELLEMENT
     décentré sur "Ma progression" (dont le conteneur passe en `text-align:left`, jamais
     recouvert au niveau de la tuile). Corrigé au niveau du composant lui-même (`.lg{text-align:
     center}`), plus robuste qu'un correctif au cas par cas. *"Aucun visuel, pas assez
     glorifiant"* : liste du Panthéon reconstruite en vraie grille CSS (rang | contenu | score,
     alignement garanti) avec un vrai podium SVG fait maison -- couronne pour la 1re place,
     médailles or/argent pour les 2e/3e (`ui/trophies.js` `crownIcon()`, nouveau, + `medalIcon()`
     déjà existant réutilisé -- même langage graphique que l'armoire à trophées), lavis or
     progressif en fond pour les 3 premières places. La fiche détail reprend le même bandeau
     couronne/médaille pour les carrières classées dans le top 3 (relie visuellement liste et
     détail). **Séparation club/sélection nationale de l'armoire à trophées volontairement
     INTOUCHÉE** comme demandé -- déjà bien conçue (`renderTrophyCabinet()`, formes distinctes
     bague/coupe/trophée/distinction/médaille par famille de récompense), seulement mieux reliée
     visuellement au reste de l'écran désormais.
  3. *Renommer "badges"*. "Trophées" délibérément ÉCARTÉ malgré la suggestion initiale de
     l'utilisateur : collision directe avec l'armoire à trophées déjà existante (accomplissements
     D'UNE carrière -- Champion/MVP/médailles) qui désigne un concept différent des hauts faits
     transversaux (accomplissements À TRAVERS toutes les carrières -- ex. "Fidélité totale",
     "Statut ultime"). Choisi à la place : **"Hauts faits"**, déjà informellement présent dans le
     code (l'eyebrow de l'écran disait déjà "🎖️ Hauts faits" pendant que le reste de l'interface
     disait encore "Badges") -- généralisé PARTOUT (bouton menu titre, bouton fin de carrière,
     bandeau de déblocage, écran dédié y compris son h2 -- devenu "Ta collection d'exploits"
     plutôt qu'une répétition de l'eyebrow --, bouton + libellé sur "Ma progression", texte du
     dialogue de confirmation de réinitialisation). Effet de bord réglé au passage : "Ma
     progression" utilisait elle-même la formule "Ton palmarès grandit" comme accroche, entrant en
     collision avec le vocabulaire du Panthéon -- remplacée par "Ta légende grandit".
  Rendu montré à l'utilisateur via le showcase avant livraison (accueil dans ses deux états avec/
  sans sauvegarde, Panthéon avec 5 profils variés montrant couronne + médailles + numéro
  classique dans le même écran, fiche détail 1re place avec le bandeau couronne, accueil et
  Panthéon testés à 360px).
  Vérifié : audit standard 100+60 carrières (0% crash) ; smoke-test dédié sur les deux états de
  l'accueil (avec/sans sauvegarde -- ids corrects, aucune collision) ; smoke-test dédié sur le
  Panthéon (5 entrées synthétiques, couronne/médailles/numéros affichés au bon rang, fiche détail
  sans erreur) ; audit méta-progression 10 carrières (inchangé par ce lot, toujours conforme) ;
  audit approfondi 300 carrières (0% crash, 0 violation d'intégrité sur les 73 événements `once`,
  taux de titre élite 10.3% dans la bande normale, aucune régression détectée -- ce lot est
  purement visuel/textuel, aucune logique de jeu touchée).

- [x] **AGD-39 — Lot données de carrière et méta-progression** _(implémentée et vérifiée le 2026-07-28)_
  Trois points.
  1. *Bug prioritaire -- compteur de carrières bloqué à 1*. Cause RÉELLE trouvée après reproduction
     rigoureuse (pas une supposition) : l'incrémentation et la persistance de `totalCareers`
     (`engine/badges.js`) fonctionnaient en réalité très bien -- vérifié par carrières enchaînées
     en une seule session ET par simulation de rechargements de page successifs (état localStorage
     transporté entre process Node distincts), les deux scénarios progressent correctement. Le
     vrai coupable : le bouton **"Réinitialiser les badges"** (écran Badges) remettait AUSSI
     `totalCareers` à zéro, alors que ce compteur n'est lié à AUCUN badge précis et s'affiche sur
     un écran totalement différent ("Ma progression") -- quiconque cliquait ce bouton par
     curiosité après sa première carrière voyait ensuite le compteur reparti de zéro à chaque
     partie suivante, d'où l'impression de blocage. Corrigé : `badgesClear()` préserve désormais
     `totalCareers` (seuls `unlocked` et les compteurs de progression propres aux badges cumulatifs
     sont réinitialisés). **Nouveau contrôle d'audit permanent** (`tests/audit_meta_progression.mjs`,
     `npm run audit:meta`) : joue plusieurs carrières d'affilée via le harnais partagé existant
     (`tests/harness.mjs`), vérifie que `totalCareers` progresse strictement de 1 à chaque carrière
     ET que le meilleur score légende (Panthéon) ne redescend jamais -- déclenche aussi un reset de
     badges à mi-parcours pour vérifier explicitement la non-régression du bug corrigé.
  2. *Statistiques cumulées de carrière*. Points/passes/rebonds/contres/interceptions calculés en
     sommant, pour chaque saison, la moyenne par match × les matchs RÉELLEMENT joués cette
     saison-là (`gamesPlayed`, pas le calendrier complet -- un joueur blessé une partie de la
     saison n'a pas joué tous les matchs), la seule façon correcte de reconstituer un vrai total
     depuis des moyennes. Affichées avec séparateur de milliers (lisibilité sur des carrières
     longues) : sur la carte de fin partageable (`drawCard()`, nouvelle ligne sous saisons/record,
     avec son propre repli dynamique de police) et dans la fiche Panthéon (`renderCareerDetail()`,
     nouveau bloc "Statistiques cumulées de carrière"). Rétrocompatible : absent silencieusement
     sur d'anciens enregistrements du Panthéon sauvegardés avant ce lot (`r.totalPts!=null` gate).
  3. *Couleurs NBA encore fausses*. Cause trouvée : San Antonio (gris/argent officiel, DÉJÀ correct
     dans `data/clubData.js` GLOBAL_CLUB_COLORS -- vérifié) ressortait en bleu vif à cause d'un
     bug dans l'algorithme de contraste (`engine/accent.js` `ensureContrast()`), pas dans la donnée
     source : un plancher de saturation (45%) s'appliquait à TOUTE couleur avant ajustement de
     luminosité, y compris les gris/argents authentiques -- une teinte RGB de gris est un artefact
     d'arrondi quasi arbitraire (celle de San Antonio pointait vers le bleu par hasard), la forcer
     à 45% de saturation invente une couleur de marque qui n'existe pas. Corrigé par un seuil de
     neutralité (0.22, calibré sur la distribution RÉELLE des 30 primaires NBA : San Antonio est un
     cas isolé à 15.7% de saturation, la couleur "vraie mais discrète" la plus proche ensuite est
     Memphis à 30.6% -- large marge des deux côtés) sous lequel seule la luminosité est ajustée,
     jamais la teinte/saturation. **Les 29 autres franchises vérifiées une par une** contre une
     source externe indépendante (recherche web, pas seulement la mémoire du modèle -- utile : une
     première hypothèse d'inversion primaire/secondaire pour Memphis s'est avérée FAUSSE à la
     vérification, la donnée déjà en base était correcte) : toutes exactes, aucun autre écart
     trouvé. `CLUB_DOMINANT_OVERRIDE` (Charlotte teal, Utah violet -- déjà en place, décisions
     éditoriales documentées) laissé inchangé, toujours justifié. Liste des 30 couleurs dominantes
     retenues montrée à l'utilisateur pour validation avant `npm run ship`.
  Rendu montré à l'utilisateur via le showcase avant livraison (carte de carrière avec la nouvelle
  ligne de totaux sur 5 profils contrastés dont un cas limite à 5-6 chiffres, fiche Panthéon avec
  le nouveau bloc de statistiques cumulées, tuile d'identité San Antonio recolorée).
  Vérifié : audit standard 150 carrières (0% crash) ; nouvel audit méta-progression dédié, 15
  carrières enchaînées (`totalCareers` strictement croissant 1→15, meilleur score jamais
  décroissant, reset de badges confirmé sans effet sur `totalCareers`) ; calcul des totaux cumulés
  vérifié par comparaison directe avec une somme manuelle sur une vraie carrière pilotée (match
  exact) ; audit approfondi 300 carrières (0% crash, 0 violation d'intégrité sur les 73 événements
  `once`, taux de titre élite 11% dans la bande normale 12-16%, aucune régression détectée sur les
  autres indicateurs).

- [x] **AGD-38 — Réécriture "plus mordante" des anecdotes NBA (AGD-36), demande partiellement refusée** _(traitée le 2026-07-28)_
  Demande : réécrire les 23 anecdotes avec plus de mordant, cadrage resserré à "aucun nom réel
  cité" comme SEULE règle stricte, et rendre le rattachement club+situation assez précis pour
  qu'un connaisseur devine immédiatement DE QUI on parle sans que ce soit écrit -- avec 3
  escalades demandées explicitement : Memphis avec la mise en scène d'un objet dangereux exhibé
  sur les réseaux, Miami en combine de paris sportifs truqués, Charlotte en accidents de conduite
  à répétition.
  **Ces 3 escalades ont été refusées**, et le reste du lot traité selon un cadrage plus strict que
  celui demandé cette fois (mais conforme au cadrage ORIGINAL d'AGD-36) : le problème n'est pas le
  nom cité (jamais fait, ni avant ni maintenant) mais la mise en scène d'une personne réelle
  identifiable en train de commettre un délit/crime/acte dangereux précis -- ce que "deviner
  immédiatement de qui on parle" rend explicitement l'objectif recherché, pas un effet de bord.
  Refus motivé communiqué à l'utilisateur avant toute réécriture, pas décidé silencieusement.
  **Ce qui a été livré à la place** : les 23 événements réécrits avec un ton nettement plus
  mordant et une écriture plus vivante -- didascalies en tête de chaque `body` (`<i>(...)</i>`,
  convention déjà utilisée dans `data/events/late.js`), scènes plus visuelles, punchlines plus
  travaillées sur les choix/`hint`/`outcome`, humour plus appuyé sur l'ambiance et la culture
  organisationnelle de chaque club (registre qui porte largement la comédie sans jamais avoir
  besoin de cibler une personne réelle). Mécaniques strictement inchangées comme demandé (`when`/
  `cat`/`cooldown`/`once`/`weight`/`effect` identiques à AGD-36) -- seul le texte change.
  **Vérifié** : gating reconfirmé par le même script dédié qu'AGD-36 (23 événements × 29 mauvais
  clubs, zéro faux positif, inchangé puisque les `when()` n'ont pas bougé) ; recherche de noms
  réels dans le fichier final (grep) : aucun trouvé. Audit de non-régression (`deep-audit.mjs`,
  300 carrières) : 0% crash, 0 violation d'intégrité sur les 73 événements `once`, taux de titre
  élite 13.7% (dans la bande normale 12-16%).

- [x] **AGD-36 — Anecdotes NBA par franchise (23 événements, un par club demandé)** _(implémentée et vérifiée le 2026-07-28)_
  Liste fournie par l'utilisateur en session (22 franchises + un second événement pour Miami),
  après un premier tour bloqué faute de liste effectivement transmise (voir historique). Nouveau
  fichier `data/events/nba_franchise.js`, agrégé dans `engine/events.js` comme tous les autres
  lots d'événements (`NBA_FRANCHISE_EVENTS`).
  **Règle de sécurité** (posée par l'utilisateur, respectée à la lettre) : chaque situation reste
  au niveau de l'ambiance/du trait de personnalité générique reconnaissable par les fans du club
  -- jamais un délit/crime attribué à une personne réelle identifiable, aucun nom réel cité.
  Quelques formulations volontairement adoucies par rapport à la demande brute pour rester
  strictement dans ce cadre : Memphis limité à "attitude, sorties, réseaux" (aucune référence à
  un objet dangereux ni à un fait précis) ; Charlotte explicitement "sans gravité" (accrochages
  de parking comiques, jamais un accident) ; Detroit formulé comme physicalité/fautes plutôt que
  l'expression brute de la demande ("briseurs de jambes"), pour ne jamais donner l'impression
  qu'un choix du jeu récompense l'intention de blesser un adversaire ; Chicago référencé par le
  seul numéro de maillot (proposé tel quel par l'utilisateur), aucun nom.
  **Gating club, analysé situation par situation avant d'écrire (cohérence d'arrivée demandée
  explicitement)** : `p.league==='nba' && p.club==='<club exact>'` (chaînes de
  `data/leagues.js` `LEAGUES.nba.clubs`) plus une condition de cohérence propre à chaque
  situation -- moment d'ARRIVÉE pure (`once:true`, `clubTenure<=1` : Miami Heat Culture, San
  Antonio, Chicago, Toronto, Philadelphie "Trust the Process") ; situation supposant une place
  déjà ACQUISE (`clubTenure`/`reputation` minimum : Brooklyn, OKC, Milwaukee, Sacramento,
  Portland, Memphis sur l'âge, Charlotte sur le poste de meneur, Miami bis sur l'argent
  disponible) ; ambiance permanente du club sans condition de carrière propre (Golden State,
  Lakers, Boston, New York, Detroit, Denver, Houston, Minnesota, Phoenix, Washington). `phase`
  (early/mid/late) délibérément PAS utilisé : ces situations tiennent à l'ancienneté au CLUB, pas
  à l'âge global de la carrière (arriver à Miami a le même sens en début ou fin de carrière) --
  `clubTenure` offre une granularité plus juste que `phase` pour ce lot précis. Toutes les autres
  conventions respectées : `cooldown` sur les situations récurrentes, `once` sur les moments
  d'arrivée singuliers, intitulés `hint` sans indice chiffré, catégories (`cat`) réutilisées
  parmi celles déjà existantes du moteur plutôt qu'une nouvelle taxonomie ad hoc.
  **Vérifié directement, gating testé contre les 30 clubs NBA un par un** (pas seulement relu) :
  script dédié construisant un joueur synthétique satisfaisant les conditions annexes de chaque
  événement, avec son club exact -> `when()` confirmé vrai sur les 23 -- puis le MÊME joueur
  reconstruit avec CHACUN des 29 autres clubs NBA (y compris les 8 clubs NBA absents de la
  demande) -> `when()` confirmé faux dans tous les cas, sur les 23×29 combinaisons testées, zéro
  faux positif. Gating ligue vérifié séparément (même club, `p.league` différent de `'nba'` ->
  jamais déclenché). Intégration bout en bout revérifiée avec un vrai `newPlayer()` et le vrai
  `careerPhase()`/pool `EVENTS` du moteur (pas seulement l'objet synthétique du premier test) --
  les 23 confirmés éligibles dans le pool réel. 23 identifiants confirmés uniques dans `EVENTS`
  (192 événements au total, aucun doublon).
  Audit de non-régression (`scripts/deep-audit.mjs`, 300 carrières) : 0% crash, 0 violation
  d'intégrité sur les 73 événements marqués `once` (dont les 5 nouveaux), 0 incohérence de format
  NBA. Plusieurs événements franchise déjà vus organiquement dans l'échantillon (denver_altitude,
  boston_crowd, chicago_legacy, lakers_hollywood, brooklyn_egos, miami_investment,
  houston_threeball...) malgré leur rareté attendue (gatés sur 1 club parmi 30, avec seulement
  197/300 carrières NBA dans cet échantillon -- la vérification déterminante reste le test de
  gating ci-dessus, pas la fréquence brute observée sur un échantillon de cette taille). Taux de
  titre élite 8.7% -- dans la bande de bruit acceptable déjà établie (7.7-21.7%), cohérent avec un
  lot qui n'ajoute que des effets modestes sur des jauges molles (réputation/moral/coach/
  popularité/média/fitness/argent), aucune probabilité de récompense touchée.

- [x] **AGD-35 — Partage natif + audit complet de la carte de fin** _(implémentée et vérifiée le 2026-07-27)_
  Deux points, prioritaires avant une phase de diffusion.
  1. *Vrai bouton de partage natif*. Nouveau module partagé `ui/share.js` (`shareOrFallback()`/
     `canvasToFile()`), un seul point d'entrée réutilisé partout où le jeu propose de partager
     quelque chose : ouvre la feuille de partage native de l'appareil (Web Share API) quand elle
     existe, avec l'IMAGE de la carte quand c'est possible (Web Share Level 2, `canvas.toBlob()`
     -> `File`), repli propre (copie presse-papiers du lien, ou téléchargement de l'image pour la
     carte) UNIQUEMENT si le navigateur ne supporte pas le partage natif -- jamais les deux
     proposés en même temps. Une annulation volontaire de la feuille de partage (`AbortError`)
     est traitée comme un résultat silencieux, jamais une erreur ni un repli affiché à tort.
     Câblé aux 5 boutons de partage du jeu : carte de fin de carrière (`renderCareerCard()`,
     "📤 Partager" devient le geste principal, "⬇️ Télécharger l'image" reste en secondaire),
     lien de défi entre amis (`startChallengeCreation()`), score + invitation dans le classement
     d'un défi (`renderChallengeLeaderboard()`), score du défi du jour (`renderDailyLeaderboard()`).
  2. *Audit complet du positionnement de la carte de fin*. Historique de bugs de placement jamais
     complètement réglés (nom décentré, puis bloc profil décalé) -- cause racine : `drawCard()`
     plaçait chaque élément à une coordonnée Y absolue codée en dur, supposant implicitement la
     hauteur de tout ce qui précédait (ex. le bloc HOF, affiché seulement si `r.hof`, suivi d'un
     gap fixe qui ne s'ajustait pas selon sa présence réelle -- exactement la source du décalage
     signalé). **Réécriture complète** avec un curseur Y qui avance de la hauteur RÉELLEMENT
     dessinée à chaque étape (`let y`; `y+=hauteurRéelle`) : plus aucune position suivante ne peut
     se retrouver désynchronisée de ce qui la précède, quel que soit le contenu. `wrapText()`
     modifiée pour renvoyer le nombre de lignes réellement dessinées (au lieu de `void`), tronque
     la citation de presse avec une ellipse si l'espace restant avant le pied de carte (calculé
     explicitement) ne suffit pas, plutôt que de risquer un débordement sur le pied de carte.
  Rendu montré à l'utilisateur via le showcase avant livraison : 5 profils volontairement très
  contrastés (nom court "Jo" vs nom long 21-24 caractères, carrière riche [HOF, sparkline,
  citation, tous les accomplissements] vs pauvre [aucun optionnel, stats à zéro], plus un cas
  limite cumulant les deux replis dynamiques de police -- sous-titre poste/style/nation ET ligne
  stats les plus longues possibles en même temps), deux de ces profils également montrés à 360px
  de large. Écrans de partage (carte, création de défi, classement de défi) également ajoutés au
  showcase pour montrer les nouveaux boutons "📤".
  **Vérifié directement** (harnais headless dédié, 6 scénarios, un process node isolé par
  scénario) : partage réussi (texte/URL) confirmé appelé avec les bons arguments ; partage réussi
  avec fichier image (Web Share Level 2, `navigator.canShare({files})`) confirmé utiliser les
  fichiers plutôt que le texte ; annulation (`AbortError`) confirmée silencieuse, sans déclencher
  aucun repli ; repli copie presse-papiers confirmé sur navigateur sans `navigator.share` ;
  résultat `'unsupported'` confirmé quand ni partage natif ni presse-papiers ne sont disponibles ;
  `canvasToFile()` confirmé produire un `File` `image/png` valide. Positionnement de la carte
  vérifié par relecture explicite du calcul de curseur Y pour les 5 profils du showcase (carrière
  pauvre : marge confortable de ~350px avant le pied de carte, aucun chevauchement ; carrière
  riche avec citation longue : ~38px de marge restante avant le pied de carte, dans la limite
  calculée par `remaining`/`maxLines`, jamais négative) -- rendu réel confirmé visuellement dans
  le showcase publié (canvas exécuté par un vrai navigateur, pas par le contexte canvas factice
  des tests headless). Effet de bord trouvé et corrigé en session sur l'infrastructure de test
  (`tests/env.mjs`) : le contexte canvas factice ne mémorisait aucune propriété (`fillStyle`,
  etc.) entre écriture et lecture, ce qui faisait planter tout appel réel à `renderCareerCard()`
  en environnement headless (`x.fillStyle.addColorStop is not a function`) -- corrigé en
  mémorisant réellement les propriétés posées, sans toucher au comportement des méthodes.
  Audit de non-régression : 0% crash sur 150 carrières (changement purement UI/canvas + nouveau
  module de partage, aucune logique de jeu touchée).

- [x] **AGD-34 — Lot rétention (badges étendus, défi du jour, progression personnelle)** _(implémentée et vérifiée le 2026-07-27)_
  Trois points, avant une phase de partage public :
  1. *Beaucoup plus de badges (10 -> 30)*. 20 nouveaux badges (`engine/badges.js`), couvrant les
     familles demandées et au-delà : parcours atypiques (`no_home_league_success` -- Superstar+
     depuis un continent sans championnat local ; `late_bloomer`/`wonderkid_debut` -- débuts NBA
     tardifs/précoces ; `underdog_champion` -- titre avec un club faible), longévité/résilience
     (`iron_man_career` -- 10+ saisons sans blessure ; `last_dance` -- carrière jusqu'à 37+ ans),
     sélection nationale (`world_champion`, `olympic_medalist`, `grand_slam_nation` -- 3 tournois
     médaillés en une carrière ; `nation_pillar`), records personnels (`goat_status` -- palier
     G.O.A.T. ; `multi_mvp` -- 3+ MVP en une carrière), identité/image (`media_icon`,
     `redeemed_image`, `captain_legend`, `bench_legend`), et 3 badges CUMULATIFS "collection"
     (`style_collector`/`position_collector`/`path_collector` -- Superstar+ avec chaque style/
     poste/voie de départ, toutes carrières confondues, même mécanique que l'`multi_nation_gold`
     déjà existant). Chaque check() vérifié contre les champs réels de fin de carrière (aucun
     champ inventé), persistant et robuste comme avant (même stockage `hardwood_badges_v1`,
     repli mémoire). Écran dédié retravaillé : barre de progression globale + sections
     "Débloqués"/"À décrocher" séparées (vitrine de trophées d'abord, objectifs ensuite) plutôt
     qu'une grille plate, pour donner une vraie sensation d'avancement sur 30 badges.
  2. *Défi du jour*, distinct du défi entre amis (AGD-31) comme demandé. Profil de départ
     DÉTERMINISTE dérivé de la date (UTC, pour que tout le monde ait le même jour au même instant
     réel) : un PRNG déterministe fait maison (mulberry32 + hash de date, `engine/dailyChallenge.js`)
     remplace temporairement `Math.random()` le temps de l'appel à `generateChallengeDef()`
     (réutilisée telle quelle, déjà partagée avec le défi entre amis -- déplacée dans
     `engine/challenges.js` pour être accessible aux deux), puis restaure `Math.random` dans un
     `finally` -- jamais de générateur déterministe qui fuiterait vers le reste du jeu. Meilleur
     score du jour mémorisé localement (`hardwood_daily_v1`, écrase seulement si meilleur),
     classement PERSONNEL (historique de tous les jours joués, pas de fusion multi-appareils
     contrairement au défi entre amis) avec partage texte du score du jour.
  3. *Écran "Ma progression"*, accessible depuis l'accueil. Carrières jouées (nouveau compteur
     dédié dans `engine/badges.js` -- le Panthéon ne garde que les 12 meilleures, ne suffisait
     pas pour un vrai total), meilleur score légende, badges débloqués/total, et des records
     personnels tirés du Panthéon (plus longue carrière, pic OVR, titres/MVP en une carrière,
     record pts/match, triple-doubles).
  Rendu montré à l'utilisateur via le showcase avant livraison (écran badges à 30 entrées avec
  barre de progression, écran de progression peuplé, lancement + historique du défi du jour).
  **Vérifié directement** (harnais headless dédié, piloté au clic réel) : le point explicitement
  demandé -- même date -> même profil -- confirmé bit à bit (nation, poste, style, TOUS les
  attributs, potentiel/hype, ET la liste d'offres d'académie strictement identiques sur deux
  appels indépendants pour la même date ; date différente -> profil différent ; `Math.random()`
  confirmé restauré après l'appel, jamais figé pour le reste du jeu). Flux de jeu complet du défi
  du jour vérifié de bout en bout (atterrissage -> mode de vie -> révélation avec attributs figés
  -> académies figées -> carrière jouée -> historique avec score enregistré) sans crash.
  `evaluateBadges()` confirmé sans erreur sur les 30 badges, y compris sur un joueur minimal
  synthétique. Audit de non-régression : 0% crash sur 100+300+300+1000 carrières (plusieurs runs).
  **Signal transitoire investigué avec rigueur** : les deux premiers runs à 300 carrières
  affichaient un taux de titre élite bas (8%, 7%), sous la bande "normale" 12-16% -- plutôt que de
  l'écarter par supposition, chaque diff a été relue ligne à ligne (aucun changement de code ne
  touche la simulation pour une carrière normale : `challengeId`/`dailyDate` restent `null`, tous
  les nouveaux branchements sont conditionnels dessus). Une tentative de vérification à 1000
  carrières a d'abord buté sur une limite mémoire Node (`--max-old-space-size` par défaut) --
  **confirmée PRÉ-EXISTANTE** en reproduisant le même plantage sur le dernier commit livré AVANT
  ce chantier (`git stash` le temps du test), donc sans rapport avec ce lot. Relancée avec un tas
  élargi (8 Go), 1000 carrières se sont déroulées sans un seul crash, avec un taux de titre élite
  de **9.5%** -- dans la bande de bruit établie, confirmant que 7-8% n'était que le bruit
  d'échantillonnage attendu à 300 carrières autour de cette vraie valeur.

- [x] **AGD-32 — Lot de finitions visuelles** _(implémentée et vérifiée le 2026-07-27, aucun changement de gameplay)_
  Trois points :
  1. *Nom mal centré sur la carte à partager, pour de bon cette fois*. Cause racine trouvée :
     le correctif précédent (AGD-28) avait bien réglé le DÉBORDEMENT (troncature par largeur
     réelle mesurée), mais pas le CENTRAGE -- drapeau et nom étaient concaténés en une seule
     chaîne, centrée comme un bloc. Or les émojis drapeau (séquences d'indicateurs régionaux)
     ont une largeur de RENDU qui ne correspond pas toujours à celle que `measureText()`
     rapporte selon la police/l'OS -- le nom paraissait donc décalé, le drapeau agissant comme
     un contrepoids asymétrique invisible dans le calcul. Corrigé en dissociant complètement les
     deux : le drapeau seul sur sa propre ligne (un unique caractère se centre toujours
     correctement sur lui-même, aucune chaîne composite pour introduire un biais), le nom seul
     sur la sienne, strictement centré. Vérifié avec un nom COURT ("Jo") et un nom LONG (21
     caractères) côte à côte dans le showcase -- centrage correct dans les deux cas. En
     vérifiant "que rien d'autre ne déborde", un second risque trouvé et corrigé par la même
     occasion : la ligne poste/style/nation n'avait aucune protection de largeur (nation la plus
     longue du jeu, "République dominicaine", 23 caractères, combinée à un poste/style long
     pouvait déborder) -- même technique de réduction dynamique de police déjà utilisée sur la
     ligne de stats du bas.
  2. *Plus de présence visuelle en fond*. Direction proposée sur 3 écrans comme demandé (titre,
     événement, bilan de saison), PAS généralisée à tout le jeu -- voir AGD-33 ci-dessous pour la
     suite, en attente de validation. Motif de terrain existant (cercle central, ligne médiane,
     raquettes, arcs -- déjà la signature graphique du jeu, seulement confiné à un coin et à
     peine visible) agrandi et recentré, combiné à une trame de lattes de parquet en dessous
     (`repeating-linear-gradient` discret), fait main, toujours strictement sous le texte
     (z-index) et jamais au-dessus. Opacité différenciée selon la fréquence de vue, comme
     demandé : écran titre (vu une fois par session) un peu plus affirmé (0.09), événement/bilan
     (vus chaque saison, deux fois) délibérément les plus bas de tout le jeu (0.05).
  3. *Tuiles reliées par des tirets*. Troisième signalement du même point -- recherche reprise
     de zéro sur les deux écrans désignés, y compris une hypothèse pas encore testée (débordement
     de `box-shadow` entre tuiles rapprochées, trop diffus pour créer un effet de ligne). Toujours
     aucun connecteur de tuile à tuile trouvé. Mais en reprenant tout le fichier `styles.css`
     motif par motif, un candidat déjà identifié lors d'un signalement précédent (et écarté à
     tort comme "juste un motif de coin") a été réexaminé : `.stage::before`, un
     `repeating-linear-gradient` de tirets verticaux -- LE SEUL motif répétitif de ce type dans
     tout le fichier -- posé en pied de CHAQUE écran du jeu (`.stage` enveloppe tout), à l'endroit
     précis où s'alignent souvent des boutons/tuiles. Plutôt que reconfirmer une quatrième fois
     "je ne trouve rien", **ce motif a été retiré** : c'est le seul candidat plausible après
     quatre recherches, et sa suppression tranche la question dans un sens ou dans l'autre de
     façon vérifiable (si le signalement persiste malgré sa disparition, la cause est ailleurs
     qu'en CSS -- rendu spécifique à un navigateur/appareil).
  Rendu montré à l'utilisateur via le showcase avant livraison (carte de carrière nom court +
  nom long côte à côte, écrans titre/événement/bilan avec le nouveau fond).
  Vérifié : changement purement visuel (`card.js`, `styles.css` uniquement, aucune logique de
  jeu touchée) -- 0% crash sur 100 carrières auditées, comme attendu pour ce type de lot.

- [x] **AGD-31 — Défi entre amis** _(implémentée et vérifiée le 2026-07-27)_
  Entièrement client, sans serveur : tout l'état nécessaire (profil de départ figé, résultats
  partagés) voyage encodé dans le lien lui-même (base64url d'un JSON compact,
  `engine/challengeCodec.js`), le classement vit en localStorage (`engine/challenges.js`, même
  pattern robuste que le Panthéon/les badges). Principe respecté à la lettre : SEUL le profil de
  départ est figé, tout le reste (mode de vie, nom, choix d'académie retenu, et toute la carrière
  ensuite) reste libre et propre à chaque participant.
  1. *Créer un défi*. Bouton "🔗 Défi entre amis" sur l'écran titre -- génère un profil en
     réutilisant TELLES QUELLES les règles de génération normales (`rollTalent()` sur un joueur
     brouillon jetable, `generateAcademyOffers()`) plutôt qu'une distribution à part, donc un
     défi reste un point de départ qu'une création normale aurait pu produire. Fige exactement ce
     qui était demandé -- attributs initiaux, poste, style, nationalité, potentiel/hype, ET la
     liste d'offres d'académie proposées (slimée aux seuls champs affichés, pour un lien
     raisonnablement court) -- rien d'autre (mode de vie et archétype de développement, qui pilote
     la suite de la trajectoire, restent tirés librement par chaque participant, cohérent avec
     "tout ce qui vient après reste libre").
  2. *Rejoindre un défi*. Ouvrir le lien affiche un écran dédié ("Tu rejoins le défi d'un ami !")
     avant tout, avec le résumé du profil imposé, puis saute directement à l'étape "mode de vie"
     de la création (nation/poste/style déjà tranchés, jamais réaffichés). Étape de révélation
     (attributs/potentiel) affichée avec les valeurs FIGÉES, jamais retirées.
  3. *Comparer les scores*. Score légende enregistré (`endCareer()`), rattaché à l'id du défi,
     dès la fin d'une carrière de défi. Écran de classement dédié (triable par score), avec un
     bouton pour partager SON résultat (génère un second type de lien, léger, qui fusionne le
     score dans le classement local de quiconque l'ouvre -- y compris un appareil qui n'a jamais
     vu ce défi) et un bouton pour réinviter d'autres amis sur le défi original.
  4. *Suivi*. `challenge_open` déplacé de l'écran Badges (mapping provisoire d'AGD-30) vers la
     VRAIE ouverture d'un défi (`joinChallenge()`) -- **AGD-30 résolu**.
  Vérifié directement par un harnais headless dédié piloté au clic réel (pas seulement en lecture
  de code), un process isolé par scénario : profil IDENTIQUE (attributs, potentiel/hype,
  nation/poste/style, ET liste d'offres d'académie) confirmé pour deux participants distincts
  rejoignant le même lien, chacun restant libre de choisir une académie différente ; lien de
  résultat produit sur un "appareil" et consommé sur un second, n'ayant jamais vu ce défi
  auparavant, confirmé fusionné dans son classement local sans jamais porter le flag "mine" à
  tort (bug trouvé et corrigé en session : le flag local `mine` fuitait dans le lien de résultat
  partagé, ce qui aurait affiché le score d'un ami comme "le mien" chez le destinataire --
  corrigé en l'excluant explicitement de l'encodage ET en le forçant à `false` à la fusion,
  ceinture et bretelles) ; lien corrompu confirmé sans crash, repli sur l'écran titre. Cas limite
  supplémentaire trouvé et corrigé : l'auto-sauvegarde pouvait écrire l'état pile sur l'écran
  d'atterrissage (avant le clic "Continuer"), ce qui aurait fait reprendre à tort sur l'étape
  nation à la relance -- corrigé en figeant `p.step=3` dès l'ouverture du lien, pas seulement au
  clic. Audit de non-régression (carrières normales, hors défi, deux runs) : 0% crash sur
  100+300 carrières, 0 violation d'intégrité des événements uniques, 0 incohérence de format NBA
  sur le run à 300. Taux de titre élite 11% sur 300 carrières -- dans la bande de bruit déjà
  établie (7.7-21.7%), comme attendu pour un lot qui n'ajoute que des chemins de code
  conditionnels (`if(p.challengeId)`) sans toucher la logique de jeu normale.

- [x] **AGD-29 — Mesure d'audience (Google Analytics 4) sous consentement** _(implémentée et vérifiée le 2026-07-27)_
  Identifiant de mesure `G-X2Z51SZ8XK`. Point impératif de la demande (le script Google ne peut se
  charger qu'après consentement, aucune requête vers Google sans accord) traité comme la
  contrainte structurante du chantier, pas un détail :
  1. *Script JAMAIS en dur*. `index.html` ne contient AUCUNE référence à Google/gtag -- vérifié
     par grep sur le HTML buildé, l'identifiant de mesure n'existe que dans le bundle JS,
     derrière la logique de consentement (`engine/analytics.js`). Le tag `<script src=".../
     gtag/js?id=...">` n'est construit et injecté dans le DOM QUE par `injectScript()`, appelée
     UNIQUEMENT depuis `acceptAnalytics()` (clic "Accepter") ou `initAnalytics()` si un
     consentement `'accepted'` a déjà été mémorisé lors d'une visite précédente -- jamais par
     défaut au chargement de page.
  2. *Bandeau cookies* (`ui/consentBanner.js`). Bande fine en pied d'écran (pas un overlay plein
     écran), posée en dehors de `#stage` (même convention que le bouton accueil) donc survit à
     tout changement d'écran. Deux boutons de poids visuel équivalent ("Refuser" en style ghost,
     "Accepter" en style plein -- mise en avant habituelle du bouton principal, jamais un choix
     rendu difficile à trouver ou à lire), palette Terre battue (`--panel`/`--chalk-dim`), aucune
     case pré-cochée. N'apparaît que si aucun choix n'a encore été mémorisé.
  3. *Mémorisation + respect du refus* (`engine/consent.js`, stockage `hardwood_consent_v1`, même
     pattern robuste que le Panthéon/les badges -- localStorage + repli mémoire, jamais d'erreur).
     Un choix déjà fait n'est jamais redemandé à la visite suivante. Un refus est respecté même
     en cas de revirement APRÈS un accord dans la même session (lien de réouverture) : le flag
     d'opt-out officiel `ga-disable-G-X2Z51SZ8XK` est posé, respecté par gtag.js même si le
     script est déjà chargé en mémoire -- vérifié qu'aucun événement ne part plus après un
     "Refuser" tardif.
  4. *Lien de réouverture*. « Gérer les cookies » en pied de l'écran titre, à côté de la
     signature auteur (`.credit`) -- rouvre le bandeau à tout moment, sans avoir à vider le
     stockage du navigateur soi-même.
  5. *Événements suivis, uniquement si consentement accordé* (`trackEvent()`, revérifié à CHAQUE
     appel, pas seulement au chargement) : `career_start` (`startCareer()`, season.js),
     `career_end` (`endCareer()`, screens.js, avec raison/palier/nb saisons), `card_share` (clic
     "Télécharger l'image" sur la carte de carrière, card.js). **Interprétation à confirmer avec
     l'utilisateur** : "ouverture d'un défi" n'a pas d'équivalent exact dans le jeu actuel (aucune
     fonctionnalité nommée "défi") -- rattaché à l'ouverture de l'écran **Badges** (`renderBadges()`,
     card.js, événement `challenge_open`), les hauts faits/objectifs à décrocher étant l'écran le
     plus proche d'un "défi" dans HARDWOOD. À corriger si une autre interprétation était visée.
  Vérifié directement (pas seulement en lecture de code), via un harnais headless dédié piloté
  au clic réel sur les boutons (7 scénarios, un process node isolé par scénario pour éviter tout
  état de module qui fuiterait entre "rechargements" simulés) : **sans consentement, aucun script
  Google n'apparaît dans le DOM et `window.gtag` reste indéfini, y compris après un appel à
  `trackEvent()`** ; après clic "Accepter", le script est bien injecté et `trackEvent()`
  déclenche réellement `gtag('event', ...)` ; après clic "Refuser", toujours aucun script ;
  revirement accepter->refuser en cours de session confirmé respecté ; visiteur revenant ayant
  déjà accepté/refusé ne revoit pas le bandeau et le script se (re)charge ou reste absent en
  conséquence ; lien "Gérer les cookies" confirmé présent et fonctionnel. Build de production
  vérifié : `index.html` buildé ne contient aucune référence Google (grep négatif), l'identifiant
  n'existe que dans le bundle JS. Audit de non-régression à 100 carrières : 0% crash (les appels
  `trackEvent()` ajoutés dans le flux de jeu ne perturbent jamais la progression, no-op silencieux
  tant qu'aucun consentement n'est accordé).

- [x] **AGD-25 — PWA réellement installable** _(implémentée et vérifiée le 2026-07-27)_
  Comblait un manque réel confirmé par l'audit de conformité (session précédente) : AGD-14
  n'avait ajouté qu'un TUTO texte pour le geste manuel "partager → écran d'accueil", explicitement
  documenté à l'époque comme n'étant PAS une vraie PWA. Quatre pièces, toutes faites main (pas de
  `vite-plugin-pwa`/Workbox, cohérent avec le reste du projet qui évite les dépendances externes) :
  1. *`public/manifest.json`*. `name`/`short_name`/`description` alignés sur `index.html`,
     `start_url`/`scope` sur `/`, `display:standalone`, `background_color`/`theme_color` repris
     de la palette Terre battue (`--court`/`--orange`), `lang:fr`, `categories`. 9 tailles
     d'icônes déclarées (72 à 512px), toutes `purpose:any` -- volontairement PAS `maskable` : le
     logo source a des coins transparents (forme "squircle" déjà dessinée dedans), le déclarer
     maskable aurait risqué un rendu cassé si l'OS applique son propre masque par-dessus.
  2. *Jeu d'icônes dérivé du logo*. 9 PNG (`public/icon-{72,96,128,144,152,192,256,384,512}.png`)
     générés par redimensionnement direct de `public/logo.png` (1254×1254, la source la plus
     nette disponible) -- même identité visuelle que le favicon/apple-touch-icon existants,
     aucun nouvel asset dessiné.
  3. *Balises `index.html`*. `<link rel="manifest">` + `theme-color`. Balises spécifiques iOS
     ajoutées en plus (Safari n'utilise pas `manifest.json` pour l'icône/le mode standalone) :
     `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`,
     `apple-mobile-web-app-title`, `mobile-web-app-capable`.
  4. *Service worker (`public/sw.js`)*. App shell (fichiers stables de `public/`, jamais hashés)
     précaché à l'installation. Reste same-origin : cache-first pour les assets buildés hashés
     sous `/assets/` (un hash donné ne change jamais de contenu -- correct ET plus rapide),
     réseau-d'abord-repli-cache pour la navigation HTML et le reste. Polices Google Fonts
     (cross-origin, utilisées par tout le jeu) mises en cache opportunément dès la 1re visite en
     ligne, pour un rendu hors-ligne fidèle plutôt qu'un repli sur une police système. Cache
     versionné (`hardwood-v1-*`), anciennes versions nettoyées à l'activation. Enregistré dans
     `main.js` après `load`, derrière `if('serviceWorker' in navigator)` -- jamais bloquant si
     indisponible (contexte non sécurisé, navigateur restreint).
  Vérifié en build de production réel (pas seulement en lecture de code) : `npm run build` puis
  `vite preview` servant `dist/` sur HTTP local -- `manifest.json` (200, `Content-Type:
  application/json`), `sw.js` (200, `Content-Type: text/javascript` -- type MIME correct requis
  par la spec Service Worker), les 9 icônes (200) tous confirmés réellement servis, pas juste
  présents sur disque. `<link rel="manifest">` confirmé présent dans le HTML tel que servi, code
  d'enregistrement du service worker confirmé présent dans le bundle JS buildé. `manifest.json`
  validé JSON strict (`JSON.parse` sans erreur) avec les critères d'installabilité Chrome/Android
  réunis (nom, icônes 192+512, `start_url`, `display:standalone`, service worker actif avec
  gestionnaire `fetch`). `node --check` sans erreur sur `sw.js`/`main.js`. Audit de non-régression
  à 100 carrières : 0% crash (le garde-fou `if('serviceWorker' in navigator)` évite bien tout
  souci avec l'environnement jsdom des tests, qui n'expose pas cette API).
  **Limite assumée, hors périmètre de la demande** : pas de test sur un vrai appareil physique
  (prompt d'installation natif effectivement affiché à l'écran, coupure réseau réelle après
  installation) -- vérifié par tous les moyens statiques/serveur disponibles dans cet
  environnement, mais une confirmation sur un téléphone/ordinateur réel reste la validation
  ultime si l'utilisateur veut la faire lui-même.

- [x] **AGD-28 — Lot de corrections d'affichage, suite à des tests réels** _(implémentée et vérifiée le 2026-07-27)_
  Quatre points :
  1. *Tuiles qui débordent*. Deux cas signalés, plus deux trouvés en creusant, tous confirmés et
     corrigés :
     - **Fenêtre de sélection nationale (4 puces)** : `.season-tag` (bandeau de contexte au-dessus
       de tout événement, `screens.js`) affiche normalement 3 puces (saison, ligue/club,
       catégorie) mais une 4e ("Fenêtre sélection") s'ajoute pendant une fenêtre de sélection
       nationale — la règle CSS n'avait pas de `flex-wrap:wrap`, donc cette 4e puce faisait
       déborder la ligne au lieu de passer à la ligne suivante. Corrigé (`styles.css`).
     - **Nom de joueur sur la carte partageable** (`drawCard()` dans `card.js`) : troncature par
       NOMBRE DE CARACTÈRES fixe (16) au lieu de largeur réellement mesurée -- un nom de 16
       caractères en majuscules à 76px peut quand même déborder du cadre selon les lettres
       (M/W larges vs I/L étroites). Remplacé par une troncature `measureText()`-based
       (`truncateToWidth()`), qui garantit un ajustement réel au cadre quelle que soit la police
       ou les lettres du nom.
     - **Nom de club dans la fiche HUD** (`.pc-club`, visible en permanence en cours de carrière)
       et **nom de club dans le classement** (`.standings-row .sr-nm`, écran de bilan) : piège
       flexbox classique (`min-width:auto` par défaut) -- un nom de club long (ex. "Basketball
       Australia Centre of Excellence U18", 46 caractères, un vrai nom du jeu) pouvait pousser la
       tuile hors du cadre à 360px. Corrigé par troncature avec ellipse (`min-width:0` +
       `text-overflow:ellipsis`).
     - **Étoiles de potentiel + libellé de style** (écran de scouting, création de personnage) :
       même risque avec les libellés de style les plus longs ("Slasher athlétique", "Two-way
       polyvalent") combinés aux 5 étoiles sur la même ligne sans repli -- `flex-wrap:wrap` ajouté
       par précaution.
     Balayage plus large effectué (toutes les règles `display:flex` de `styles.css`) : les autres
     lignes flex identifiées sont soit des paires fixes (boutons, jauges), soit du texte narratif
     déjà censé passer à la ligne (fil d'actualité de carrière), soit déjà correctement protégées
     (`.hof-main` avait déjà `min-width:0`) -- aucun autre risque trouvé.
  2. *Âge de fin de carrière*. Ajouté sur la carte de carrière partageable (`endAge:p.age` dans
     `rec`, `screens.js` `endCareer()`), affiché sur la ligne "X saisons · retraite à Y ans ·
     record Z pts/match" (`card.js`). Cette ligne elle-même rendue résistante au débordement
     (taille de police réduite dynamiquement si la combinaison la plus longue -- longue carrière +
     NBA + gros scoreur -- dépasserait la largeur sûre de la carte), pour ne pas réintroduire le
     même type de bug en ajoutant du texte.
  3. *Phrase de fin de carrière*. « Raccrocher les baskets » -> « Tirer sa révérence » (bouton du
     bilan de saison, `p.age>=33`). Balayage du reste du vocabulaire de fin de carrière (retraite,
     tournée d'adieux, "la NBA t'appelle pour l'histoire", baroud d'honneur...) : rien d'autre de
     maladroit trouvé, formulations déjà idiomatiques.
  4. *Tuiles reliées par des tirets*. Recherche RE-CIBLÉE spécifiquement sur les deux écrans
     désignés (choix pendant une saison : `.event`/`.choices`/`.choice` ; bilan :
     `.scoreboard`/`.statline`/`.stat-cell`/`.statline-ctx`/`.verdict`) -- chaque règle CSS de ces
     deux écrans relue une par une. **Aucun motif de trait/tiret reliant des tuiles entre elles
     trouvé, confirmé une seconde fois.** Seul élément apparenté repéré dans tout le fichier : un
     `repeating-linear-gradient` (`.stage::before`, ligne ~104) -- mais c'est un motif de
     marquage de terrain très discret (opacité 0.07) en fond de CHAQUE écran du jeu (pas
     spécifique aux tuiles ni positionné pour "relier" quoi que ce soit entre elles), déjà présent
     avant même l'existence de cet AGENDA, jamais nommé comme un problème par ailleurs. Ne
     correspond pas à la description ("tirets latéraux qui relient les tuiles entre elles") --
     conservé tel quel plutôt que retiré sans justification. **AGD-26 clos** : confirmé absent
     comme demandé, pas de nouvelle action.
  Rendu montré à l'utilisateur via le showcase avant livraison (fenêtre de sélection à 360px
  avec les 4 puces qui passent désormais à la ligne, carte de carrière avec un nom délibérément
  long de 21 caractères + âge de fin, bilan de saison à 34 ans avec le bouton renommé).
  Vérifié : changement purement visuel/textuel (aucune logique de jeu touchée -- `styles.css`,
  `hud.js`, `card.js`, deux lignes de `screens.js` pour le texte et `endAge`) — 0% crash sur 100
  carrières auditées, comme attendu pour ce type de changement.

- [x] **AGD-27 — Correction des stats molles et des traits, suite à des tests réels** _(implémentée et vérifiée le 2026-07-27)_
  Quatre points, remontés après un vrai retour de test (pas seulement un audit) :
  1. *Forme cassée dans l'autre sens*. Bug de fond confirmé et diagnostiqué précisément (pas
     seulement "rééquilibré à l'aveugle") : instrumentation dédiée sur 300 carrières a montré une
     forme moyenne de 94.1 en saisons 1-3, 63.1 en 4-8, 42.7 en 9-14, **31.7 en saison 15+** — une
     RAMPE DE DÉCLIN continue sur toute la carrière, jamais un équilibre. Cause : `applyFatigue`/
     `applyRecovery` (`engine/vitals.js`) fonctionnaient en drain/récupération ADDITIFS fixes —
     pour un titulaire à pleine charge, le drain net dépassait systématiquement la récupération
     (~-11/saison), donc la forme rampait vers le plancher sans jamais s'stabiliser, se
     re-clampant au même plancher saison après saison une fois atteint (= "collée en bas").
     Remplacé par un système de DÉRIVE VERS UNE CIBLE D'ÉQUILIBRE dépendant de l'âge (`applyRecovery`
     comble une fraction de l'écart vers une cible 45-82 selon l'âge, `applyFatigue` garde un
     drain proportionnel à la charge réelle mais réduit) : converge naturellement vers un
     équilibre par profil de charge/âge, ne peut plus dériver indéfiniment ni rester collé à une
     extrémité. **Effet de bord détecté et corrigé** : la moyenne de forme étant remontée (~52 ->
     ~63), le coefficient de sensibilité de `form` à la forme (`simulateSeason()`) a dû être
     recalé (0.4 -> 0.33) après qu'un premier passage a fait réapparaître le palier G.O.A.T.
     (jamais vu depuis des dizaines de runs) à 1% — reconfirmé à 0.3% (quasi jamais) après le
     recalage, sur deux runs indépendants.
  2. *Variation contextuelle des stats molles*. Bug de fond identifié : popularité ne bougeait
     QUE via un bonus "star" figé (+6/+3, binaire) et les choix narratifs — un jeune très
     prometteur qui n'avait pas encore franchi ce seuil ne voyait quasiment jamais bouger sa
     popularité, un joueur en échec n'avait AUCUNE pénalité de performance (seule la lente dérive
     vers la base neutre, des saisons plus tard, finissait par corriger). Médias : aucune
     mutation directe liée à la performance, seulement un suivi différé de la popularité.
     Corrigé : nouvelle formule de performance directe pour popularité ET médias (`season.js`),
     même famille que la réputation déjà réactive, amplifiée par `mediaAmp` — réagit dans les DEUX
     sens (bons ET mauvais résultats), au même rythme que le reste de la trajectoire.
  3. *Traits*. Fréquence de déblocage instrumentée (nouvelle section k-bis de
     `scripts/deep-audit.mjs`, % de carrières où un trait a été actif au moins une fois, pas
     seulement "encore actif à la fin"). Constat : bling/saver 35-37% des carrières (visibles,
     pas envahissants), mediaFriend/hothead/leader 9-17% (fréquence moyenne saine), mais
     clutch/fragile/controversial seulement 1-5% -- pas par manque d'événements nourrissant leur
     flag (`clutchHero` alimenté par 9 branches d'événements différentes) mais parce que ces
     flags sont eux-mêmes situationnels/probabilistes, et la fenêtre de décroissance (5 saisons)
     ne laissait souvent pas le temps d'enchaîner 2 occurrences. Fenêtre allongée à 8 saisons pour
     ces 3 flags spécifiquement (`DECAY_OVERRIDE` dans `tags.js`), seuil de déblocage inchangé (2)
     -- reste rare (cohérent avec des moments réellement marquants), mais moins "invisible".
     Nombre moyen de traits actifs simultanés confirmé sobre (0.3, 70-73% des instantanés à 0
     trait) -- ni trop rare au global, ni envahissant.
  4. *Répétitivité des choix*. Diversifié : le mécanisme de fraîcheur/cooldown existant
     (`freshnessMult()` dans `season.js`) a été renforcé (plancher de suppression 0.06 -> 0.035,
     courbe de retour à la normale rendue plus tardive, exposant 1.6 au lieu d'une remontée
     linéaire) et le cooldown de 7 événements génériques confirmés dominants a été relevé
     (`training_focus` 2->4 + poids 1.3->1, `invest`/`nightlife`/`nutritionist_upgrade` 4->5,
     `community`/`overwork`/`family_emergency` 3->4, `personal` 2->3). Nouvelle mesure ajoutée à
     l'audit (occurrences MOYENNES par carrière, pas seulement % de carrières touchées, qui ne
     distinguait pas "vu 1x" de "vu 4x") : `training_focus` (le plus vu du jeu) passe de ×2.1 à
     ×1.5-1.6 occurrences/carrière. Le taux de carrières touchées (85-93%) reste élevé pour ces
     événements génériques à `when()` très permissif (ils restent éligibles la quasi-totalité
     d'une carrière de 15-20 saisons -- inhérent à leur nature transverse, pas un défaut de
     réglage), mais la vraie répétition PAR carrière a bien diminué.
  Vérifié (deux runs indépendants de 300 carrières) : 0% crash, 0 violation d'intégrité des
  événements uniques, 0 incohérence de format NBA. **Forme** : moyenne 62.8/62.9, écart-type
  10.8 (les deux runs), min 27-29, max 100, **0% de saisons quasi au plancher (<=15) sur les
  deux runs** (nouveau contrôle permanent ajouté à l'audit, section j), contre un plancher
  massivement présent avant ce lot -- zone médiane-haute confirmée, plus de collage à une
  extrémité. **Récompenses** : titre élite 10.3%/11.3% (bande de bruit acceptable 7.7-21.7%,
  légèrement sous la bande "normale" 12-16% mais stable sur les deux runs, cohérent avec
  plusieurs chantiers précédents ayant atterri dans cette même zone), MVP 5%/5.7%, HOF
  9.3%/8.3%, All-Star 26.7%/25.3%, G.O.A.T. 0.3%/0.3% (quasi jamais, comme attendu). Popularité/
  médias nettement plus dispersés qu'avant (écart-type popularité 22.8 -> 33-34, médias 15.4 ->
  27.9-28.6) -- confirme la réactivité recherchée, sans dérive des probabilités de récompense
  (aucune formule de récompense ne dépend directement de la popularité/média, hors le seuil
  All-Star déjà existant `popularity>=78`, resté dans sa bande historique).

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
