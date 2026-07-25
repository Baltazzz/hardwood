# AGENDA — fonctionnalités demandées, pas encore livrées

Registre des demandes en attente sur HARDWOOD. Chaque entrée porte un identifiant stable,
une description courte du manque, et un **critère de validation observable** : la façon dont
on constatera — sans ambiguïté, via l'audit ou l'usage réel du jeu — que c'est fait.

Règle de mise à jour : voir `CLAUDE.md`. Une ligne n'est cochée que si elle a été réellement
implémentée **et** vérifiée (audit ou test) dans la session qui la coche.

## Ouvert

- [ ] **AGD-01 — Blocks et steals**
  Aucun attribut ni stat de contres/interceptions n'existe dans le moteur (`simulateSeason()`
  ne calcule que pts/ast/reb/minutes/wins). Oublié depuis plusieurs lots.
  **Critère** : les contres et interceptions apparaissent dans les stats de saison affichées
  (bilan de saison, fiche de carrière, carte de carrière canvas).

- [ ] **AGD-02 — Calendrier réaliste par ligue**
  Toutes les ligues jouent un nombre de matchs implicite identique ; `wins` est calculé sans
  notion de longueur de saison propre à chaque championnat (NBA = 82 matchs, EuroLeague ~34-38,
  etc. dans la réalité). Oublié depuis plusieurs lots.
  **Critère** : le nombre de matchs joués diffère entre NBA et EuroLeague (et plus largement
  entre paliers), et ce nombre est visible dans l'interface (bilan de saison a minima).

- [ ] **AGD-03 — Système de trophées**
  Au-delà du compteur d'accolades actuel (MVP/All-Star/Champion en nombre brut dans
  `p.accolades`), pas de vitrine de trophées nommés ni de rétrospective par saison.
  **Critère** : provisoire — portée exacte (trophées nommés ? vitrine dédiée ? cérémonie de
  fin de saison ?) à préciser avec l'utilisateur avant implémentation. Ne pas coder sur la
  base de cette seule ligne sans validation du périmètre en session.

- [ ] **AGD-04 — Contexte de compétition par saison**
  Le joueur ne voit que ses propres stats individuelles ; aucune notion de classement
  d'équipe, de course aux playoffs, ni de position finale du club dans sa ligue.
  **Critère** : provisoire — portée exacte (classement de conférence ? bracket de playoffs ?
  simple ligne de classement ?) à préciser avec l'utilisateur avant implémentation. Ne pas
  coder sur la base de cette seule ligne sans validation du périmètre en session.

- [ ] **AGD-05 — Étiquettes de joueur**
  Le moteur d'événements pose déjà des flags internes (`bust`, `clutchHero`, `rival`,
  `loyalOne`, etc. — voir `src/data/events/threads.js` et `applyChoice()` dans `season.js`)
  mais rien n'est visible pour le joueur : aucune étiquette/badge affiché sur la fiche ou le HUD.
  **Critère** : au moins une étiquette de joueur (ex. « Clutch », « Bust », « Fidèle au club »)
  est visible dans l'interface une fois le seuil de flag correspondant atteint.

## Coché récemment

_(vide — rien coché pour l'instant)_
