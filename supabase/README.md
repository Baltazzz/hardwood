# Backend Supabase — classements (défi entre amis, défi du jour, carrières)

Voir AGENDA.md pour le contexte complet. Ce dossier contient les migrations SQL à exécuter
manuellement (pas de CLI Supabase configurée pour ce projet), une par lot livré.

## Mise en place (une seule fois par migration)

1. Ouvrir le [dashboard Supabase](https://supabase.com/dashboard) du projet
   (`mqrotkqlqpxtqquxmcxi`).
2. Menu de gauche -> **SQL Editor** -> **New query**.
3. Coller le contenu entier du fichier de migration concerné (voir ci-dessous).
4. **Run**.

Chaque script est idempotent (`create table if not exists`, `drop policy/trigger if exists` avant
recréation) : le ré-exécuter ne casse rien si une partie existe déjà.

## `migrations/0001_challenge_scores.sql` — classement d'un défi entre amis

- Table `public.challenge_scores` : une ligne par (défi, appareil) -- `unique (challenge_id,
  client_id)`, mise à jour par upsert plutôt que dupliquée à chaque nouvelle tentative.
- Contraintes `check` sur le score/le nombre de saisons/la longueur du pseudo -- rejette les
  valeurs manifestement impossibles.
- Trigger `challenge_scores_guard` : un score qui n'améliore pas le meilleur déjà enregistré est
  ignoré silencieusement (jamais de régression du classement) ; une vraie amélioration est limitée
  à une fois toutes les 5 secondes par ligne (anti-spam simple).
- RLS activé, lecture et insertion/mise à jour publiques (`using (true)`) -- pas de comptes
  utilisateurs, cohérent avec le reste du jeu (100% client, aucune donnée personnelle sensible).

Vérifier que ça a marché :

```
curl "https://mqrotkqlqpxtqquxmcxi.supabase.co/rest/v1/challenge_scores?select=*&limit=1" \
  -H "apikey: <clé anon>" -H "Authorization: Bearer <clé anon>"
```

Doit répondre `[]` (tableau vide, table vide mais existante) et non plus une erreur
`PGRST205 Could not find the table`.

## `migrations/0002_world_leaderboards.sql` — classements MONDIAUX (défi du jour + carrières)

Voir AGENDA.md AGD-59. Deux tables, deux classements partagés entre TOUS les joueurs (pas limités
à un défi précis, contrairement à `challenge_scores` ci-dessus) :

- `public.daily_world_scores` : une ligne par (jour, pseudo) -- `unique (date, nickname)`. Remis à
  zéro "gratuitement" chaque jour puisque l'écran filtre toujours sur la date du jour (aucun job de
  purge nécessaire pour ça). **Croissance illimitée assumée** : aucune purge automatique des
  anciennes dates n'est en place -- un nettoyage manuel depuis le SQL Editor reste possible si la
  taille de la table devient un jour gênante.
- `public.career_world_scores` : une ligne par pseudo, pour toujours -- `unique (nickname)`, sa
  MEILLEURE carrière jamais jouée, jamais une ligne par tentative.
- Identité PSEUDO (pas appareil, voir `engine/profile.js`) : contrairement à `challenge_scores`,
  c'est le pseudo de profil qui identifie et dédoublonne chaque joueur ici. Chaque ligne porte aussi
  `client_id` (même UUID d'appareil), mais uniquement comme indice de RÉCONCILIATION côté client :
  si un joueur se renomme, la prochaine soumission met à jour SA MÊME ligne (retrouvée par
  `client_id`) au lieu d'en créer une fantôme sous le nouveau pseudo. Deux personnes différentes
  choisissant le même pseudo restent un cas limite accepté (pas de vrais comptes) -- mais un joueur
  qui se renomme lui-même ne perd jamais sa ligne.
- Même trigger anti-triche que `challenge_scores` (score gardé, throttle 5s), corrigé pour ne
  JAMAIS annuler silencieusement un renommage de pseudo (voir commentaires dans le fichier SQL).
- RLS activé, lecture et insertion/mise à jour publiques -- **volontairement AUCUNE politique de
  suppression** sur ces deux tables : empêche quiconque muni de la seule clé anon de vider le
  classement de tout le monde.

**Supprimer une ligne aberrante (classement des carrières)** : Dashboard Supabase -> **Table
Editor** -> `career_world_scores` -> sélectionner la ligne -> **Delete row**. Cet accès contourne
RLS de toute façon (accès propriétaire) -- aucune fonctionnalité de suppression n'est exposée côté
application, ni besoin de l'être.

Vérifier que ça a marché :

```
curl "https://mqrotkqlqpxtqquxmcxi.supabase.co/rest/v1/career_world_scores?select=*&limit=1" \
  -H "apikey: <clé anon>" -H "Authorization: Bearer <clé anon>"
curl "https://mqrotkqlqpxtqquxmcxi.supabase.co/rest/v1/daily_world_scores?select=*&limit=1" \
  -H "apikey: <clé anon>" -H "Authorization: Bearer <clé anon>"
```

Les deux doivent répondre `[]`, puis `npm run audit:world-leaderboard-live` doit passer au vert.

## `reset_and_seed_career_leaderboard.sql` — nettoyage + profils d'amorce

Script de MAINTENANCE DE DONNÉES (pas une migration -- aucune table/colonne touchée), à lancer
manuellement quand tu le décides. Vide entièrement `career_world_scores`/`daily_world_scores` (les
lignes qui y étaient venaient à 100% de mes propres sessions de test, jamais d'un vrai joueur --
voir AGENDA.md) puis sème 6 profils d'amorce sur `career_world_scores` avec des scores
VOLONTAIREMENT modestes (20-105, sous ou tout juste au-dessus du seuil "Joueur de rotation") --
faciles à dépasser dès une carrière un tant soit peu réussie, pour qu'un classement neuf donne
quelque chose à viser plutôt qu'un vide intimidant. Rien semé sur `daily_world_scores`, qui se
remet à zéro chaque jour par construction -- semer "aujourd'hui" n'aurait plus de sens dès demain.

Les scripts de test (`tests/env.mjs`) bloquent désormais le réseau par défaut pour éviter que
d'autres sessions de test repolluent ces tables à l'avenir -- seuls
`tests/leaderboard_device_check.mjs`/`tests/world_leaderboard_device_check.mjs` (appelés par les
audits `*-live`) y accèdent encore explicitement, avec des scores modestes non plus destinés à
"dominer" le classement.

## Client

- `src/engine/leaderboardApi.js` — classement d'un défi entre amis (identité par appareil).
- `src/engine/worldLeaderboardApi.js` — classements mondiaux (identité par pseudo, voir plus haut).
- `src/engine/supabaseClient.js` — primitives HTTP partagées par les deux (URL/clé/timeout).

Simples appels `fetch()` à l'API REST/PostgREST, pas de dépendance `@supabase/supabase-js`
ajoutée, cohérent avec le reste du projet qui évite les dépendances externes. Toute panne réseau ou
indisponibilité du serveur y est absorbée silencieusement -- jamais d'exception qui remonterait
jusqu'à l'écran, le jeu doit rester utilisable à l'identique hors ligne.
