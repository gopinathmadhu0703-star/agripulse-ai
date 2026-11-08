-- =============================================================================
-- AgriPulse AI — Migration 001: Initial Schema (hardened)
--
-- Apply in: Supabase Dashboard → SQL Editor → Run
--
-- Repeatability
-- • All CREATE TABLE / CREATE INDEX statements use IF NOT EXISTS.
-- • All CREATE OR REPLACE FUNCTION statements are idempotent.
-- • DROP TRIGGER IF EXISTS / DROP POLICY IF EXISTS guards every recreated object.
-- • The trigger on auth.users (on_auth_user_created) is safe to re-run because
--   DROP TRIGGER IF EXISTS precedes CREATE TRIGGER.
-- • GRANTs are additive and safe to re-run.
-- • Column-level UPDATE grants on community_posts replace the previous broad
--   table-level UPDATE grant.  Re-running is safe because GRANT is additive.
--
-- NOT yet executed against any Supabase project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";   -- uuid_generate_v4()
create extension if not exists "pg_trgm";     -- trigram text search on posts

-- ---------------------------------------------------------------------------
-- TABLE: user_profiles
-- One row per authenticated user (mirrors auth.users).
-- Created automatically on first sign-in by the trigger below.
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  display_name   text        not null default '',
  preferred_lang text        not null default 'en'
                             check (preferred_lang in ('en','ta','hi')),
  district       text        not null default '',
  village        text        not null default '',
  interests      text[]      not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Trigger: auto-create profile on sign-up ──────────────────────────────────
-- SECURITY DEFINER so it can write to user_profiles regardless of RLS.
-- SET search_path locks the function's schema resolution to prevent
-- search_path injection attacks.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'User'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TABLE: farms
-- Strictly private to the owning user.
-- ---------------------------------------------------------------------------
create table if not exists public.farms (
  id                    uuid             primary key default uuid_generate_v4(),
  user_id               uuid             not null references auth.users(id) on delete cascade,
  name                  text             not null check (char_length(name) between 1 and 200),
  location_name         text             not null,
  latitude              double precision not null check (latitude  between -90  and 90),
  longitude             double precision not null check (longitude between -180 and 180),
  location_display_name text             not null,
  field_area_ha         numeric(10,4)    not null check (field_area_ha > 0),
  crop                  text             not null
                        check (crop in ('wheat','maize','rice','tomato','potato',
                                        'soybean','cotton','sugarcane')),
  growth_stage          text             not null check (growth_stage in ('initial','mid','end')),
  soil_type             text             not null check (soil_type in ('sandy','loamy','clay','silty')),
  irrigation_method     text             not null
                        check (irrigation_method in ('drip','sprinkler','furrow','flood')),
  is_active             boolean          not null default false,
  created_at            timestamptz      not null default now(),
  updated_at            timestamptz      not null default now()
);

create index if not exists farms_user_id_idx on public.farms(user_id);

-- Enforce at most one active farm per user at the database level.
create unique index if not exists farms_one_active_per_user
  on public.farms(user_id) where is_active = true;

-- ---------------------------------------------------------------------------
-- TABLE: irrigation_recommendations (history)
-- ---------------------------------------------------------------------------
create table if not exists public.irrigation_recommendations (
  id             uuid        primary key default uuid_generate_v4(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  farm_id        uuid        not null references public.farms(id) on delete cascade,
  farm_name      text        not null,
  recommendation jsonb       not null,   -- full engine output including formula trace
  input_data     jsonb       not null,   -- engine inputs stored for audit
  created_at     timestamptz not null default now()
);

create index if not exists recs_user_id_idx    on public.irrigation_recommendations(user_id);
create index if not exists recs_farm_id_idx    on public.irrigation_recommendations(farm_id);
create index if not exists recs_created_at_idx on public.irrigation_recommendations(created_at desc);

-- ---------------------------------------------------------------------------
-- TABLE: irrigation_tasks (planner)
-- ---------------------------------------------------------------------------
create table if not exists public.irrigation_tasks (
  id                      uuid          primary key default uuid_generate_v4(),
  user_id                 uuid          not null references auth.users(id) on delete cascade,
  farm_id                 uuid          not null references public.farms(id) on delete cascade,
  scheduled_date          date          not null,
  estimated_volume_liters numeric(12,2) not null check (estimated_volume_liters >= 0),
  notes                   text          not null default '',
  status                  text          not null default 'pending'
                          check (status in ('pending','overdue','completed')),
  created_at              timestamptz   not null default now()
);

create index if not exists tasks_user_id_idx on public.irrigation_tasks(user_id);
create index if not exists tasks_farm_id_idx on public.irrigation_tasks(farm_id);
create index if not exists tasks_status_idx  on public.irrigation_tasks(status);

-- ---------------------------------------------------------------------------
-- TABLE: irrigation_events (actual irrigations recorded)
-- ---------------------------------------------------------------------------
create table if not exists public.irrigation_events (
  id                   uuid          primary key default uuid_generate_v4(),
  user_id              uuid          not null references auth.users(id) on delete cascade,
  farm_id              uuid          not null references public.farms(id) on delete cascade,
  task_id              uuid          references public.irrigation_tasks(id) on delete set null,
  event_date           date          not null,
  actual_volume_liters numeric(12,2) not null check (actual_volume_liters >= 0),
  notes                text          not null default '',
  recorded_at          timestamptz   not null default now()
);

create index if not exists events_user_id_idx on public.irrigation_events(user_id);
create index if not exists events_farm_id_idx on public.irrigation_events(farm_id);

-- ---------------------------------------------------------------------------
-- TABLE: user_settings
-- One row per user, upserted on save.
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id                    uuid        primary key references auth.users(id) on delete cascade,
  temperature_unit           text        not null default 'celsius'
                             check (temperature_unit in ('celsius','fahrenheit')),
  default_horizon_days       smallint    not null default 2
                             check (default_horizon_days in (1,2,3)),
  notif_rain_alert           boolean     not null default true,
  notif_stale_reading        boolean     not null default true,
  notif_task_due             boolean     not null default true,
  onboarding_completed       boolean     not null default false,
  dismissed_notification_ids text[]      not null default '{}',
  language                   text        not null default 'en'
                             check (language in ('en','ta','hi')),
  updated_at                 timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: community_posts
--
-- Publicly readable (non-reported rows only).
-- Only the author may INSERT or DELETE their own posts.
-- Authors may UPDATE only the editable content columns (see column-level
-- GRANT below). helpful_votes, comment_count, reported, author_id, author_name,
-- id and created_at are not in the UPDATE grant and cannot be changed by clients.
-- Those server-maintained columns are updated exclusively by SECURITY DEFINER
-- trigger functions, which execute as the function owner and bypass all RLS
-- and column-level privilege checks.
-- ---------------------------------------------------------------------------
create table if not exists public.community_posts (
  id            uuid        primary key default uuid_generate_v4(),
  author_id     uuid        not null references auth.users(id) on delete cascade,
  author_name   text        not null,
  language      text        not null default 'en'
                check (language in ('en','ta','hi')),
  tag           text        not null default 'self-reported'
                check (tag in ('self-reported','verified')),
                -- 'demo' posts exist only in the client; they are never persisted here.
  experience    jsonb       not null,
  -- Server-maintained counters. Not included in the authenticated UPDATE grant.
  -- Updated only by the SECURITY DEFINER triggers below.
  helpful_votes int         not null default 0 check (helpful_votes >= 0),
  comment_count int         not null default 0 check (comment_count >= 0),
  reported      boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists posts_author_id_idx  on public.community_posts(author_id);
create index if not exists posts_created_at_idx on public.community_posts(created_at desc);
create index if not exists posts_exp_gin_idx
  on public.community_posts using gin (experience jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- TABLE: post_helpful_votes
-- Composite PK prevents duplicate votes at the database level.
-- No SELECT is granted to any role. Vote counts are exposed only through
-- the aggregate in community_posts.helpful_votes, and own-vote status through
-- the has_voted_on_post() SECURITY DEFINER function.
-- ---------------------------------------------------------------------------
create table if not exists public.post_helpful_votes (
  post_id    uuid        not null references public.community_posts(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Trigger function: maintain helpful_votes count ───────────────────────────
--
-- Must be SECURITY DEFINER because:
--   1. The voting user is not the post author.
--   2. The RLS UPDATE policy on community_posts allows only the author to
--      update their own rows (USING auth.uid() = author_id).
--   3. SECURITY DEFINER causes the function to execute as its owner
--      (typically the postgres / service role), which bypasses RLS entirely.
--   4. Column-level UPDATE grants on community_posts also do not apply to
--      SECURITY DEFINER functions running as a superuser role.
--
-- SET search_path = public, pg_temp prevents a malicious user from creating
-- a shadow object in another schema that intercepts this function's calls.
create or replace function public.update_helpful_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts
       set helpful_votes = helpful_votes + 1,
           updated_at    = now()
     where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.community_posts
       set helpful_votes = greatest(helpful_votes - 1, 0),
           updated_at    = now()
     where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_helpful_vote_count on public.post_helpful_votes;
create trigger trg_helpful_vote_count
  after insert or delete on public.post_helpful_votes
  for each row execute procedure public.update_helpful_vote_count();

-- ── Safe function: check own vote status ─────────────────────────────────────
-- Returns true if the calling authenticated user has already voted on the
-- given post. Queries post_helpful_votes as its owner (SECURITY DEFINER) but
-- filters strictly to auth.uid(), so no other user's vote data is disclosed.
create or replace function public.has_voted_on_post(p_post_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
begin
  return exists (
    select 1
      from public.post_helpful_votes
     where post_id = p_post_id
       and user_id = auth.uid()
  );
end;
$$;

-- Revoke default public execute; grant only to authenticated users.
revoke all on function public.has_voted_on_post(uuid) from public;
grant execute on function public.has_voted_on_post(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- TABLE: post_comments
-- ---------------------------------------------------------------------------
create table if not exists public.post_comments (
  id          uuid        primary key default uuid_generate_v4(),
  post_id     uuid        not null references public.community_posts(id) on delete cascade,
  author_id   uuid        not null references auth.users(id) on delete cascade,
  author_name text        not null,
  text        text        not null check (char_length(text) between 1 and 2000),
  language    text        not null default 'en'
              check (language in ('en','ta','hi')),
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_id_idx   on public.post_comments(post_id);
create index if not exists comments_author_id_idx on public.post_comments(author_id);

-- ── Trigger function: maintain comment_count ─────────────────────────────────
-- Same rationale as update_helpful_vote_count: SECURITY DEFINER + locked
-- search_path so the UPDATE on community_posts bypasses the RLS owner check.
create or replace function public.update_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts
       set comment_count = comment_count + 1,
           updated_at    = now()
     where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.community_posts
       set comment_count = greatest(comment_count - 1, 0),
           updated_at    = now()
     where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comment_count on public.post_comments;
create trigger trg_comment_count
  after insert or delete on public.post_comments
  for each row execute procedure public.update_comment_count();

-- ── Trigger function: enforce authorship from auth session ───────────────────
-- Overwrites client-supplied author_id and author_name on every INSERT into
-- community_posts and post_comments with values from the authenticated session.
-- This prevents a client from impersonating another user by supplying a
-- different author_id or fabricating an author_name.
create or replace function public.enforce_post_authorship()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.author_id   := auth.uid();
  new.author_name := coalesce(
    (select display_name from public.user_profiles where id = auth.uid()),
    split_part(
      (select email from auth.users where id = auth.uid()),
      '@', 1
    ),
    'User'
  );
  return new;
end;
$$;

drop trigger if exists trg_enforce_post_authorship on public.community_posts;
create trigger trg_enforce_post_authorship
  before insert on public.community_posts
  for each row execute procedure public.enforce_post_authorship();

drop trigger if exists trg_enforce_comment_authorship on public.post_comments;
create trigger trg_enforce_comment_authorship
  before insert on public.post_comments
  for each row execute procedure public.enforce_post_authorship();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_profiles
-- Users may only read and modify their own row.
-- WITH CHECK on UPDATE prevents changing id to another user's UUID.
-- ---------------------------------------------------------------------------
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;

create policy "user_profiles_select_own" on public.user_profiles
  for select
  using (auth.uid() = id);

create policy "user_profiles_insert_own" on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy "user_profiles_update_own" on public.user_profiles
  for update
  using     (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- farms — strictly private; user_id must equal auth.uid() on every write
-- ---------------------------------------------------------------------------
alter table public.farms enable row level security;

drop policy if exists "farms_owner_all"    on public.farms;
drop policy if exists "farms_owner_select" on public.farms;
drop policy if exists "farms_owner_insert" on public.farms;
drop policy if exists "farms_owner_update" on public.farms;
drop policy if exists "farms_owner_delete" on public.farms;

create policy "farms_owner_select" on public.farms
  for select
  using (auth.uid() = user_id);

create policy "farms_owner_insert" on public.farms
  for insert
  with check (auth.uid() = user_id);

create policy "farms_owner_update" on public.farms
  for update
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "farms_owner_delete" on public.farms
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- irrigation_recommendations — private; append-only (no UPDATE policy)
-- Rows are deleted only via ON DELETE CASCADE from farms, not directly.
-- ---------------------------------------------------------------------------
alter table public.irrigation_recommendations enable row level security;

drop policy if exists "recs_owner_all"    on public.irrigation_recommendations;
drop policy if exists "recs_owner_select" on public.irrigation_recommendations;
drop policy if exists "recs_owner_insert" on public.irrigation_recommendations;
drop policy if exists "recs_owner_delete" on public.irrigation_recommendations;

create policy "recs_owner_select" on public.irrigation_recommendations
  for select
  using (auth.uid() = user_id);

create policy "recs_owner_insert" on public.irrigation_recommendations
  for insert
  with check (auth.uid() = user_id);

-- No UPDATE policy: recommendation records are append-only audit history.
-- No DELETE policy: rows are removed only by FK cascade when a farm is deleted.

-- ---------------------------------------------------------------------------
-- irrigation_tasks — private; user_id must equal auth.uid() on every write
-- ---------------------------------------------------------------------------
alter table public.irrigation_tasks enable row level security;

drop policy if exists "tasks_owner_all"    on public.irrigation_tasks;
drop policy if exists "tasks_owner_select" on public.irrigation_tasks;
drop policy if exists "tasks_owner_insert" on public.irrigation_tasks;
drop policy if exists "tasks_owner_update" on public.irrigation_tasks;
drop policy if exists "tasks_owner_delete" on public.irrigation_tasks;

create policy "tasks_owner_select" on public.irrigation_tasks
  for select
  using (auth.uid() = user_id);

create policy "tasks_owner_insert" on public.irrigation_tasks
  for insert
  with check (auth.uid() = user_id);

create policy "tasks_owner_update" on public.irrigation_tasks
  for update
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_owner_delete" on public.irrigation_tasks
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- irrigation_events — private; append-only (no UPDATE policy)
-- ---------------------------------------------------------------------------
alter table public.irrigation_events enable row level security;

drop policy if exists "events_owner_all"    on public.irrigation_events;
drop policy if exists "events_owner_select" on public.irrigation_events;
drop policy if exists "events_owner_insert" on public.irrigation_events;
drop policy if exists "events_owner_delete" on public.irrigation_events;

create policy "events_owner_select" on public.irrigation_events
  for select
  using (auth.uid() = user_id);

create policy "events_owner_insert" on public.irrigation_events
  for insert
  with check (auth.uid() = user_id);

-- No UPDATE policy: irrigation events are recorded facts; they are not edited.

create policy "events_owner_delete" on public.irrigation_events
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_settings — private; user_id must equal auth.uid()
-- ---------------------------------------------------------------------------
alter table public.user_settings enable row level security;

drop policy if exists "settings_owner_all"    on public.user_settings;
drop policy if exists "settings_owner_select" on public.user_settings;
drop policy if exists "settings_owner_insert" on public.user_settings;
drop policy if exists "settings_owner_update" on public.user_settings;

create policy "settings_owner_select" on public.user_settings
  for select
  using (auth.uid() = user_id);

create policy "settings_owner_insert" on public.user_settings
  for insert
  with check (auth.uid() = user_id);

create policy "settings_owner_update" on public.user_settings
  for update
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- community_posts
--
-- SELECT:  anonymous and authenticated users may read non-reported posts.
-- INSERT:  authenticated users only; author_id and author_name are overwritten
--          by the enforce_post_authorship BEFORE INSERT trigger.
-- UPDATE:  owner only (auth.uid() = author_id).
--          Protected columns (helpful_votes, comment_count, reported, author_id,
--          author_name, id, created_at) are excluded from the UPDATE column
--          grant below, so PostgreSQL rejects any client attempt to set them.
--          The WITH CHECK simply re-asserts owner identity to prevent ownership
--          transfer. No self-referencing subquery is used here.
-- DELETE:  owner only.
-- ---------------------------------------------------------------------------
alter table public.community_posts enable row level security;

drop policy if exists "posts_public_read"   on public.community_posts;
drop policy if exists "posts_author_insert" on public.community_posts;
drop policy if exists "posts_author_update" on public.community_posts;
drop policy if exists "posts_author_delete" on public.community_posts;

-- Anonymous and authenticated users may read non-reported posts.
create policy "posts_public_read" on public.community_posts
  for select
  using (reported = false);

-- Authenticated users may insert; trigger overwrites author_id/author_name.
create policy "posts_author_insert" on public.community_posts
  for insert
  with check (auth.uid() is not null);

-- Owner may update only.  WITH CHECK re-asserts ownership (no self-referencing
-- subquery — protection of individual columns is handled by column-level grants).
create policy "posts_author_update" on public.community_posts
  for update
  using     (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Owner may delete.
create policy "posts_author_delete" on public.community_posts
  for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- post_helpful_votes
--
-- No SELECT policy and no SELECT grant — vote counts are read only through
-- community_posts.helpful_votes or the has_voted_on_post() function.
-- INSERT:  authenticated users may insert only their own vote row.
-- DELETE:  authenticated users may delete only their own vote row.
-- ---------------------------------------------------------------------------
alter table public.post_helpful_votes enable row level security;

drop policy if exists "votes_public_read" on public.post_helpful_votes;
drop policy if exists "votes_user_insert" on public.post_helpful_votes;
drop policy if exists "votes_user_delete" on public.post_helpful_votes;

-- No SELECT policy is intentional: no role may enumerate vote rows.

create policy "votes_user_insert" on public.post_helpful_votes
  for insert
  with check (auth.uid() = user_id);

create policy "votes_user_delete" on public.post_helpful_votes
  for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_comments
--
-- SELECT:  anyone (including anonymous) may read all comments.
-- INSERT:  authenticated users only; authorship overwritten by trigger.
-- DELETE:  comment author only.
-- No UPDATE: comments are immutable once posted.
-- ---------------------------------------------------------------------------
alter table public.post_comments enable row level security;

drop policy if exists "comments_public_read"   on public.post_comments;
drop policy if exists "comments_author_insert" on public.post_comments;
drop policy if exists "comments_author_delete" on public.post_comments;

create policy "comments_public_read" on public.post_comments
  for select
  using (true);

create policy "comments_author_insert" on public.post_comments
  for insert
  with check (auth.uid() is not null);

create policy "comments_author_delete" on public.post_comments
  for delete
  using (auth.uid() = author_id);

-- =============================================================================
-- GRANTS
--
-- Object-level grants define the maximum privilege ceiling.
-- RLS policies enforce row-level restrictions on top.
-- Column-level UPDATE grants on community_posts enforce column-level
-- restrictions on top of that — PostgreSQL enforces these before evaluating
-- RLS policies, so a client cannot even attempt to set a protected column.
--
-- Note on SECURITY DEFINER triggers and column grants:
-- Functions executing as a superuser/owner role (SECURITY DEFINER) bypass
-- both RLS and column-level privilege checks.  The counter-update and
-- authorship-enforcement triggers therefore work correctly regardless of
-- which columns the authenticated role is permitted to update.
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- ── Anonymous: community read only ───────────────────────────────────────────
grant select on public.community_posts to anon;
grant select on public.post_comments   to anon;
-- post_helpful_votes: intentionally no SELECT grant to any role.

-- ── Authenticated: private data (full access constrained by RLS) ─────────────
grant select, insert, update, delete on
  public.user_profiles,
  public.farms,
  public.irrigation_tasks,
  public.irrigation_events,
  public.user_settings
  to authenticated;

-- Recommendations are append-only; no UPDATE grant.
grant select, insert, delete on public.irrigation_recommendations to authenticated;

-- ── Authenticated: community posts ───────────────────────────────────────────
-- SELECT and DELETE are table-level: fine as-is (RLS restricts rows).
-- INSERT is table-level: fine (trigger overwrites author fields; RLS checks uid).
grant select, insert, delete on public.community_posts to authenticated;

-- UPDATE is column-level: only the editable content columns.
-- Protected columns (id, author_id, author_name, helpful_votes, comment_count,
-- reported, created_at) are intentionally excluded.  Any UPDATE statement from
-- a client that references a non-granted column will fail with a permission
-- error before RLS is even evaluated — eliminating the recursion risk entirely.
grant update (language, experience, tag, updated_at)
  on public.community_posts to authenticated;

-- ── Authenticated: community comments ────────────────────────────────────────
grant select, insert, delete on public.post_comments to authenticated;

-- ── Authenticated: votes (insert/delete only, no select) ─────────────────────
grant insert, delete on public.post_helpful_votes to authenticated;

-- has_voted_on_post() was granted near its definition above.
