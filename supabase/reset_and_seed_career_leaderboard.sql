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
-- CE SCRIPT : vide entièrement les deux tables (aucune ligne actuelle ne mérite d'être conservée),
-- puis sème 6 profils d'amorce sur career_world_scores -- des scores VOLONTAIREMENT modestes
-- (20-105, tous sous le seuil "Joueur de rotation" ou tout juste dedans -- voir la distribution
-- réelle mesurée dans engine/retention.js, p75 ~149), faciles à dépasser par n'importe quelle
-- carrière un tant soit peu réussie. Objectif : un classement qui donne quelque chose à viser
-- plutôt qu'un vide intimidant, sans jamais décourager un nouveau joueur qui le dépasserait dès sa
-- première vraie carrière. Rien semé sur daily_world_scores : ce classement se remet à zéro chaque
-- jour par construction (filtré sur la date du jour), semer "aujourd'hui" n'aurait plus de sens dès
-- demain.

delete from public.career_world_scores;
delete from public.daily_world_scores;

insert into public.career_world_scores (nickname, client_id, score, tier, seasons, hof, summary) values
  ('Sam',    '293d76d4-6c90-4bfd-90e7-e3659ce61f27', 20,  'Parcours de combattant', 5,  false, null),
  ('Robin',  '7fa9503a-6e97-40a9-8a96-92eac4590a15', 35,  'Parcours de combattant', 7,  false, null),
  ('Casey',  'f6840c85-0892-4e1a-b051-65b45368b89c', 50,  'Parcours de combattant', 9,  false, null),
  ('Alex',   '25f418f9-4a20-4870-8380-d10c070b4fec', 65,  'Parcours de combattant', 11, false, null),
  ('Jamie',  '84ef0e47-4894-4c19-ae69-a693b9ffe0ac', 85,  'Parcours de combattant', 13, false, null),
  ('Morgan', 'fd29b8a8-2351-450f-9aac-51f807e1168e', 105, 'Joueur de rotation',     15, false, null);
