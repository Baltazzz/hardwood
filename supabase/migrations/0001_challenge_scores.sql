-- HARDWOOD -- classement des défis entre amis (voir AGENDA.md, lot backend Supabase).
-- À exécuter une seule fois dans l'éditeur SQL du projet Supabase (Dashboard -> SQL Editor ->
-- New query -> coller ce script entier -> Run). Idempotent : peut être ré-exécuté sans risque
-- (create table/policy if not exists, drop trigger/function if exists avant recréation).

create table if not exists public.challenge_scores (
  id           bigint generated always as identity primary key,
  challenge_id text        not null check (char_length(challenge_id) between 1 and 20),
  -- Identifiant d'appareil stable (UUID généré une fois côté client, jamais un compte réel --
  -- voir engine/leaderboardApi.js getClientId()) : sert à retrouver "sa propre ligne" et à borner
  -- une personne à UNE seule ligne par défi (upsert sur (challenge_id, client_id) ci-dessous),
  -- jamais une simple insertion qui s'empilerait à chaque nouvelle tentative.
  client_id    uuid        not null,
  player_name  text        not null check (char_length(player_name) between 1 and 40),
  -- Plafond très généreux (le score légende le plus haut jamais observé sur des centaines de
  -- carrières pilotées est ~380, seuil G.O.A.T. à 365) : rejette les valeurs manifestement
  -- fabriquées sans jamais pouvoir bloquer un score légitime.
  score        integer     not null check (score >= 0 and score <= 600),
  tier         text,
  seasons      integer     check (seasons is null or (seasons between 0 and 30)),
  hof          boolean     not null default false,
  -- Résumé de carrière optionnel (titres/MVP/All-Star/pic OVR...) -- structure libre, jamais
  -- relu par une contrainte SQL, purement pour un éventuel affichage plus riche côté client.
  summary      jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (challenge_id, client_id)
);

create index if not exists challenge_scores_challenge_id_idx on public.challenge_scores (challenge_id);

-- Garde-fous anti-triche SIMPLES (voir AGENDA.md) : un score qui n'améliore pas le précédent
-- n'écrase jamais le meilleur déjà enregistré (même principe que recordMyChallengeResult() côté
-- client, appliqué ici en défense supplémentaire côté serveur -- jamais confiance aveugle dans le
-- client) ; une mise à jour RÉELLE (score amélioré) est en plus limitée à une fois toutes les 5
-- secondes par ligne, pour empêcher un script de marteler l'API. Un score qui n'améliore pas est
-- silencieusement ignoré (pas d'erreur qui remonterait au joueur), pas throttlé (ne compte pas
-- comme une "vraie" tentative de triche, juste une resoumission inoffensive).
create or replace function public.challenge_scores_guard()
returns trigger as $$
begin
  if TG_OP = 'UPDATE' then
    if NEW.score <= OLD.score then
      -- Pas mieux : garde intégralement l'ancienne ligne, ne déclenche jamais le throttle
      -- ci-dessous pour une simple resoumission du même score (ex. rejouer sans faire mieux).
      NEW.player_name := OLD.player_name; NEW.score := OLD.score; NEW.tier := OLD.tier;
      NEW.seasons := OLD.seasons; NEW.hof := OLD.hof; NEW.summary := OLD.summary;
      NEW.updated_at := OLD.updated_at; NEW.created_at := OLD.created_at;
      return NEW;
    end if;
    if (now() - OLD.updated_at) < interval '5 seconds' then
      raise exception 'too_many_requests';
    end if;
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists challenge_scores_guard_trigger on public.challenge_scores;
create trigger challenge_scores_guard_trigger
  before insert or update on public.challenge_scores
  for each row execute function public.challenge_scores_guard();

-- RLS : pas de comptes utilisateurs (voir AGENDA.md, décision assumée) -- lecture et insertion
-- publiques via la clé anon, protégées uniquement par les contraintes/triggers ci-dessus. Un
-- visiteur techniquement motivé pourrait appeler l'API directement et fausser un score dans les
-- bornes autorisées -- limite acceptée pour un classement social sans friction de compte,
-- cohérente avec l'esprit "défi entre amis" (aucune donnée sensible en jeu).
alter table public.challenge_scores enable row level security;

drop policy if exists "public read" on public.challenge_scores;
create policy "public read" on public.challenge_scores
  for select using (true);

drop policy if exists "public insert" on public.challenge_scores;
create policy "public insert" on public.challenge_scores
  for insert with check (true);

drop policy if exists "public update" on public.challenge_scores;
create policy "public update" on public.challenge_scores
  for update using (true) with check (true);
