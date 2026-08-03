-- HARDWOOD -- classements mondiaux : défi du jour + meilleures carrières (voir AGENDA.md AGD-59).
-- À exécuter une seule fois dans l'éditeur SQL du projet Supabase (Dashboard -> SQL Editor ->
-- New query -> coller ce script entier -> Run). Idempotent : peut être ré-exécuté sans risque
-- (create table/policy if not exists, drop trigger/function if exists avant recréation).
--
-- Distinct de challenge_scores (migration 0001) : ici l'identité affichée ET dédoublonnée est le
-- PSEUDO DE PROFIL (voir engine/profile.js), pas l'appareil -- ces deux classements sont MONDIAUX
-- (tous les joueurs du jeu), pas limités à un défi précis entre amis.
--
-- Réconciliation de renommage (voir engine/worldLeaderboardApi.js) : chaque ligne porte aussi
-- client_id (même UUID d'appareil que challenge_scores, engine/leaderboardApi.js), volontairement
-- PAS unique -- sert uniquement côté client à retrouver "ma ligne" si je me suis renommé depuis la
-- dernière soumission, pour la METTRE À JOUR au lieu d'en créer une nouvelle sous mon nouveau
-- pseudo (qui la laisserait orpheline, ou entrerait en collision avec un homonyme).

create table if not exists public.daily_world_scores (
  id           bigint generated always as identity primary key,
  -- Format YYYY-MM-DD (voir engine/dailyChallenge.js getTodayDateStr(), toujours en UTC) --
  -- longueur exacte plutôt qu'un simple plafond : ce champ sert de filtre de classement, une
  -- valeur mal formée casserait silencieusement le tri/la remise à zéro quotidienne.
  date         text        not null check (char_length(date) = 10),
  -- Même plafond que le champ pseudo (voir engine/profile.js NICKNAME_MAXLEN).
  nickname     text        not null check (char_length(nickname) between 1 and 22),
  client_id    uuid        not null,
  -- Plafond identique à challenge_scores (score légende le plus haut jamais observé ~380, seuil
  -- G.O.A.T. à 365) : rejette les valeurs manifestement fabriquées.
  score        integer     not null check (score >= 0 and score <= 600),
  tier         text,
  seasons      integer     check (seasons is null or (seasons between 0 and 30)),
  hof          boolean     not null default false,
  summary      jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Une seule ligne par (jour, pseudo) -- jamais une ligne par tentative.
  unique (date, nickname)
);
create index if not exists daily_world_scores_client_id_idx on public.daily_world_scores (client_id);
-- Index de tri (voir ui/worldLeaderboard.js) : score par défaut, saisons en 2e axe -- sans ces
-- index composites, le tri + le calcul de rang ("count trick" PostgREST côté client) deviendraient
-- lents dès que beaucoup de joueurs participent (contrairement à challenge_scores, où le nombre de
-- participants par défi reste toujours minuscule -- une poignée d'amis).
create index if not exists daily_world_scores_score_rank_idx on public.daily_world_scores (date, score desc, id);
create index if not exists daily_world_scores_seasons_rank_idx on public.daily_world_scores (date, seasons desc, id);

create table if not exists public.career_world_scores (
  id           bigint generated always as identity primary key,
  nickname     text        not null check (char_length(nickname) between 1 and 22),
  client_id    uuid        not null,
  score        integer     not null check (score >= 0 and score <= 600),
  tier         text,
  seasons      integer     check (seasons is null or (seasons between 0 and 30)),
  hof          boolean     not null default false,
  summary      jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Une seule ligne par pseudo, pour toujours -- sa MEILLEURE carrière, jamais une par tentative.
  unique (nickname)
);
create index if not exists career_world_scores_client_id_idx on public.career_world_scores (client_id);
create index if not exists career_world_scores_score_rank_idx on public.career_world_scores (score desc, id);
create index if not exists career_world_scores_seasons_rank_idx on public.career_world_scores (seasons desc, id);

-- Garde-fous anti-triche (même esprit que challenge_scores_guard(), migration 0001), fonction
-- PARTAGÉE par les deux tables ci-dessus (même forme de colonnes exploitée ici) :
--   - score réellement amélioré -> accepté, throttlé à 1 vraie amélioration/5s/ligne (anti-spam).
--   - score pas meilleur, MÊME pseudo -> resoumission inoffensive, aucun changement, pas throttlé.
--   - score pas meilleur MAIS pseudo DIFFÉRENT (renommage, voir engine/profile.js) -> le nouveau
--     pseudo est appliqué QUAND MÊME (jamais silencieusement annulé par cette garde -- un
--     renommage ne doit JAMAIS faire perdre sa ligne à un joueur), score/palier/saisons/résumé
--     restent ceux de la meilleure ligne déjà enregistrée, et ce n'est PAS throttlé (un renommage
--     n'est pas une tentative de triche, même principe qu'une simple resoumission ci-dessus).
create or replace function public.world_scores_guard()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.score > OLD.score then
      if (now() - OLD.updated_at) < interval '5 seconds' then
        raise exception 'too_many_requests';
      end if;
      NEW.updated_at := now();
    else
      NEW.score := OLD.score; NEW.tier := OLD.tier; NEW.seasons := OLD.seasons;
      NEW.hof := OLD.hof; NEW.summary := OLD.summary; NEW.created_at := OLD.created_at;
      if NEW.nickname = OLD.nickname then
        NEW.updated_at := OLD.updated_at;
      else
        NEW.updated_at := now();
      end if;
    end if;
  else
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists daily_world_scores_guard_trigger on public.daily_world_scores;
create trigger daily_world_scores_guard_trigger
  before insert or update on public.daily_world_scores
  for each row execute function public.world_scores_guard();

drop trigger if exists career_world_scores_guard_trigger on public.career_world_scores;
create trigger career_world_scores_guard_trigger
  before insert or update on public.career_world_scores
  for each row execute function public.world_scores_guard();

-- RLS : lecture/insertion/mise à jour publiques via la clé anon (même choix assumé que
-- challenge_scores, voir migration 0001 et supabase/README.md) -- mais AUCUNE politique de
-- suppression sur les deux tables, volontairement : empêche quiconque muni de la seule clé anon
-- de vider le classement mondial de tout le monde. La suppression d'une ligne aberrante (voir
-- AGENDA.md AGD-59) se fait depuis le Dashboard Supabase (Table Editor -> sélectionner la ligne ->
-- Delete row), qui utilise l'accès propriétaire et contourne RLS de toute façon -- aucune route
-- API à exposer pour ça, plus sûr ainsi.
alter table public.daily_world_scores enable row level security;
alter table public.career_world_scores enable row level security;

drop policy if exists "public read" on public.daily_world_scores;
create policy "public read" on public.daily_world_scores for select using (true);
drop policy if exists "public insert" on public.daily_world_scores;
create policy "public insert" on public.daily_world_scores for insert with check (true);
drop policy if exists "public update" on public.daily_world_scores;
create policy "public update" on public.daily_world_scores for update using (true) with check (true);

drop policy if exists "public read" on public.career_world_scores;
create policy "public read" on public.career_world_scores for select using (true);
drop policy if exists "public insert" on public.career_world_scores;
create policy "public insert" on public.career_world_scores for insert with check (true);
drop policy if exists "public update" on public.career_world_scores;
create policy "public update" on public.career_world_scores for update using (true) with check (true);

-- Pas de purge automatique sur daily_world_scores (une ligne par (jour, pseudo) accumulée pour
-- toujours, croissance illimitée assumée) -- même choix que l'absence de politique de suppression
-- ci-dessus : aucune route API de nettoyage exposée. Un nettoyage manuel des vieilles dates reste
-- possible depuis le Dashboard (SQL Editor) si la taille de la table devient un jour gênante.
