-- Hill Country Estate · shared store schema
--
-- This is a 2-person family tool (Helen + Jon). There is no per-user auth.
-- The Supabase URL + anon key are baked into the static site, and the
-- whole app is gated by deploy-side obscurity (and optionally a shared
-- secret in __HCE_CONFIG.token — see SYNC.md).
--
-- Authorship is asserted by the client via the `author` / `updated_by` /
-- `decided_by` columns. RLS is permissive (anon can read + write all rows)
-- because the only callers are Helen and Jon's browsers.
--
-- Apply via Supabase SQL editor or `supabase db push`.

create extension if not exists "uuid-ossp";

-- ── room_state ──────────────────────────────────────────────────
-- One row per room the user has interacted with. status/react/mood
-- are the room-level reactions; child rows (notes, pins, specs) live
-- in their own tables and reference room_id.
create table if not exists public.room_state (
  room_id     text primary key,
  status      text,
  react       text,
  mood        jsonb default '[]'::jsonb,
  updated_at  timestamptz default now(),
  updated_by  text  -- 'helen' | 'jon'
);

-- ── notes ───────────────────────────────────────────────────────
create table if not exists public.notes (
  id        text primary key,
  room_id   text references public.room_state(room_id) on delete cascade,
  t         bigint not null,
  text      text not null,
  kind      text default 'text',
  pin_id    text,
  author    text  -- 'helen' | 'jon'
);
create index if not exists notes_room_idx on public.notes(room_id);
create index if not exists notes_t_idx    on public.notes(t);

-- ── pins ────────────────────────────────────────────────────────
create table if not exists public.pins (
  id        text primary key,
  room_id   text references public.room_state(room_id) on delete cascade,
  img_slug  text,
  x         double precision,
  y         double precision,
  text      text,
  t         bigint,
  author    text
);
create index if not exists pins_room_idx on public.pins(room_id);

-- ── room_specs ──────────────────────────────────────────────────
create table if not exists public.room_specs (
  room_id     text references public.room_state(room_id) on delete cascade,
  spec_key    text,
  value       text,
  updated_at  timestamptz default now(),
  updated_by  text,
  primary key (room_id, spec_key)
);

-- ── decisions ───────────────────────────────────────────────────
create table if not exists public.decisions (
  id          text primary key,
  pick        text,
  t           bigint,
  decided_by  text
);

-- ── journal ─────────────────────────────────────────────────────
create table if not exists public.journal (
  id       text primary key,
  t        bigint not null,
  room_id  text,
  kind     text,
  text     text,
  extra    jsonb,
  author   text
);
create index if not exists journal_t_idx on public.journal(t);

-- ── wall ────────────────────────────────────────────────────────
-- Helen's saved-image wall. Composite key (room_id + img_slug) so a
-- single image can only be on the wall once.
create table if not exists public.wall (
  room_id   text,
  img_slug  text,
  t         bigint,
  author    text,
  primary key (room_id, img_slug)
);

-- ── Realtime publication ────────────────────────────────────────
-- Enables postgres_changes delivery via the `hce-global` channel.
alter publication supabase_realtime add table
  public.room_state, public.notes, public.pins,
  public.room_specs, public.decisions, public.journal, public.wall;

-- ── RLS ─────────────────────────────────────────────────────────
-- Permissive: anon can do everything. The deployment is the gate.
do $$
declare
  t text;
begin
  for t in select unnest(array['room_state','notes','pins','room_specs','decisions','journal','wall']) loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "anon all"  on public.%I;', t);
    execute format('create policy "anon all" on public.%I for all to anon using (true) with check (true);', t);
  end loop;
end $$;

-- ── room_overrides ──────────────────────────────────────────────
-- The render-forward 3D model's shared dimension edits. One row per
-- room someone has nudged: a sparse override of the base geometry in
-- compound_rooms.json. The base table stays the source of truth.
-- (Added for the render-forward restructuring, 2026-06.)
create table if not exists public.room_overrides (
  room_id     text primary key,
  x           double precision,
  y           double precision,
  w           double precision,
  d           double precision,
  height      double precision,
  updated_at  timestamptz default now(),
  updated_by  text  -- 'helen' | 'jon'
);

alter publication supabase_realtime add table public.room_overrides;

alter table public.room_overrides enable row level security;
drop policy if exists "anon all" on public.room_overrides;
create policy "anon all" on public.room_overrides for all to anon using (true) with check (true);

-- ── decisions: the Open Decisions surface ──────────────────────
-- Extends the original thin `decisions` table (id/pick/t/decided_by) with a
-- status column (open | decided | flagged-for-conversation | deferred-to-site),
-- and adds decision_notes — same shape as `notes`, but keyed to a decision (and
-- optionally one of its options) instead of a room. Content (title/options/
-- context) is NOT stored here — it's static in src/data/decisions.json; only the
-- live choice/status/notes live in the database.
-- (Added for the Open Decisions surface, 2026-07.)
alter table public.decisions add column if not exists status text default 'open';

create table if not exists public.decision_notes (
  id           text primary key,
  decision_id  text references public.decisions(id) on delete cascade,
  option_id    text,
  t            bigint not null,
  text         text not null,
  author       text
);
create index if not exists decision_notes_decision_idx on public.decision_notes(decision_id);

alter publication supabase_realtime add table public.decision_notes;

alter table public.decision_notes enable row level security;
drop policy if exists "anon all" on public.decision_notes;
create policy "anon all" on public.decision_notes for all to anon using (true) with check (true);
