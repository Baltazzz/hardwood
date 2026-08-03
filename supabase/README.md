# Backend Supabase — classement des défis entre amis

Voir AGENDA.md pour le contexte complet. Ce dossier ne contient qu'une seule migration SQL,
à exécuter manuellement (pas de CLI Supabase configurée pour ce projet).

## Mise en place (une seule fois)

1. Ouvrir le [dashboard Supabase](https://supabase.com/dashboard) du projet
   (`mqrotkqlqpxtqquxmcxi`).
2. Menu de gauche -> **SQL Editor** -> **New query**.
3. Coller le contenu entier de `migrations/0001_challenge_scores.sql`.
4. **Run**.

Le script est idempotent (`create table if not exists`, `drop policy/trigger if exists` avant
recréation) : le ré-exécuter ne casse rien si une partie existe déjà.

## Vérifier que ça a marché

```
curl "https://mqrotkqlqpxtqquxmcxi.supabase.co/rest/v1/challenge_scores?select=*&limit=1" \
  -H "apikey: <clé anon>" -H "Authorization: Bearer <clé anon>"
```

Doit répondre `[]` (tableau vide, table vide mais existante) et non plus une erreur
`PGRST205 Could not find the table`.

## Ce que fait la migration

- Table `public.challenge_scores` : une ligne par (défi, appareil) -- `unique (challenge_id,
  client_id)`, mise à jour par upsert plutôt que dupliquée à chaque nouvelle tentative.
- Contraintes `check` sur le score/le nombre de saisons/la longueur du pseudo -- rejette les
  valeurs manifestement impossibles.
- Trigger `challenge_scores_guard` : un score qui n'améliore pas le meilleur déjà enregistré est
  ignoré silencieusement (jamais de régression du classement) ; une vraie amélioration est limitée
  à une fois toutes les 5 secondes par ligne (anti-spam simple).
- RLS activé, lecture et insertion/mise à jour publiques (`using (true)`) -- pas de comptes
  utilisateurs, cohérent avec le reste du jeu (100% client, aucune donnée personnelle sensible).
  Limite assumée : sans authentification réelle, un visiteur techniquement motivé pourrait appeler
  l'API directement et fausser un score dans les bornes autorisées par les contraintes ci-dessus --
  acceptable pour un classement social entre amis, pas pour une donnée sensible.

## Client

Voir `src/engine/leaderboardApi.js` -- seul fichier du jeu qui parle à Supabase (via de simples
appels `fetch()` à l'API REST/PostgREST, pas de dépendance `@supabase/supabase-js` ajoutée,
cohérent avec le reste du projet qui évite les dépendances externes). Toute panne réseau ou
indisponibilité du serveur y est absorbée silencieusement -- jamais d'exception qui remonterait
jusqu'à l'écran, le jeu doit rester utilisable à l'identique hors ligne.
