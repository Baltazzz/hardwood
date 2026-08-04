-- HARDWOOD -- nettoyage + profils d'amorce du classement mondial des carrières (voir AGENDA.md).
-- À exécuter UNE FOIS dans l'éditeur SQL du dashboard Supabase (comme les migrations). Pas une
-- migration de schéma (aucune table/colonne touchée) : un script de MAINTENANCE DE DONNÉES, à
-- lancer manuellement quand tu le décides, pas à ré-exécuter automatiquement.
--
-- POURQUOI : les lignes actuellement dans career_world_scores/daily_world_scores viennent à 100%
-- de mes propres sessions de test/vérification de cette semaine (Alice/BobCareer*, Joueur####,
-- etc. -- confirmé en relisant la table entière, aucune ne correspond à un vrai joueur externe, la
-- fonctionnalité vient tout juste d'être livrée). Certaines avaient des scores délibérément très
-- élevés (450-580) pensés pour "rester en tête" pendant mes tests -- avec le recul, ça laissait de
-- faux comptes trôner en haut d'un classement encore vide de vrais joueurs, signalé à raison.
-- Corrigé à la source pour l'avenir (tests/env.mjs bloque désormais le réseau par défaut dans les
-- scripts de test -- seuls les 2 scripts qui vérifient RÉELLEMENT le serveur y accèdent encore
-- explicitement, avec des scores modestes désormais, voir tests/audit_world_leaderboard_live.mjs).
--
-- CE SCRIPT (v3, ajusté sur demande explicite -- v2 était allée trop bas) : vide entièrement les
-- deux tables (aucune ligne actuelle ne mérite d'être conservée), puis sème 15 profils d'amorce
-- sur career_world_scores. Scores ÉCHELONNÉS de 65 à 250 (traverse les 4 premiers paliers de
-- endCareer() dans ui/screens.js -- Parcours de combattant / Joueur de rotation / All-Star /
-- Superstar -- pour une variété crédible, sans jamais atteindre Légende·Hall of Fame à 280+) :
-- une bonne carrière garde de quoi les dépasser tous, mais ça demande un vrai effort pour les
-- plus hauts, contrairement à une version précédente jugée trop timide. Pseudos mélangés à
-- dessein : certains restent au format par défaut jamais personnalisé ("JoueurXXXX", voir
-- suggestNickname() dans engine/profile.js -- réaliste, la plupart des joueurs occasionnels ne
-- changent jamais leur pseudo), d'autres sont personnalisés comme un vrai joueur le ferait. Rien
-- semé sur daily_world_scores : ce classement se remet à zéro chaque jour par construction
-- (filtré sur la date du jour), semer "aujourd'hui" n'aurait plus de sens dès demain.

delete from public.career_world_scores;
delete from public.daily_world_scores;

insert into public.career_world_scores (nickname, client_id, score, tier, seasons, hof, summary) values
  ('Joueur4127',     '82432f1d-e5ee-46b9-a951-79da83fb16e2', 65,  'Parcours de combattant', 8,  false, null),
  ('MarcoB',         'bb64d71e-ca87-44e9-a106-90676473a0e5', 78,  'Parcours de combattant', 9,  false, null),
  ('Joueur8853',     'fd061985-7194-466b-8abb-5c9b316e9174', 92,  'Joueur de rotation',     10, false, null),
  ('hoopsofia',      '922409ea-407b-4921-8612-5a78ed55d4e0', 105, 'Joueur de rotation',     11, false, null),
  ('kenji_23',       '1e2cd211-f431-4675-85a4-344d29021b93', 118, 'Joueur de rotation',     12, false, null),
  ('Joueur2091',     '3d62d2e6-fc79-44ce-a4ee-77e66554dbbf', 132, 'Joueur de rotation',     13, false, null),
  ('AmaraP',         'e2a1ca5c-df3d-451b-86e9-3a9f2c00d7b1', 145, 'Joueur de rotation',     14, false, null),
  ('tballer',        '11ad778d-a5cc-4aee-84d9-db96583f9427', 158, 'All-Star',               15, false, null),
  ('Joueur6642',     '77e4684b-169d-47f4-beb6-0f996eb628c2', 172, 'All-Star',               16, false, null),
  ('lucas.mvp',      '968faf30-6992-4696-aea3-94b47720e07d', 185, 'All-Star',               17, false, null),
  ('zoe_courtside',  '0f6c8911-8960-4ce3-a191-f0eda695aa6e', 198, 'All-Star',               18, false, null),
  ('Joueur5308',     '3dcb75ad-3204-43f8-b182-989aeaf8acf9', 212, 'All-Star',               19, false, null),
  ('diego99',        '6ef72683-f8fc-4948-b288-be5fbd3d41b0', 225, 'Superstar',              20, false, null),
  ('NoahRuns',       'd72399b6-6892-4c12-8909-925048b13c1a', 238, 'Superstar',              21, false, null),
  ('Joueur9174',     '2f97117f-74b9-48cb-81ca-ded1231e94b7', 250, 'Superstar',              22, false, null);
