-- Strong-style workout tracker schema.
-- Run this in the Supabase SQL editor (or via the Supabase CLI) for your project.
-- This migration is additive and does not touch the existing `public.workout_logs`
-- table used by the simple log/progress screens (see supabase/schema.sql).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- exercises: global defaults (user_id is null) plus user-created custom moves
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('barbell', 'dumbbell', 'machine', 'bodyweight')),
  primary_muscle text not null,
  is_custom boolean not null default false,
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "Anyone can read default or own exercises"
  on public.exercises for select
  using (user_id is null or user_id = auth.uid());

create policy "Users can insert their own exercises"
  on public.exercises for insert
  with check (user_id = auth.uid());

create policy "Users can update their own exercises"
  on public.exercises for update
  using (user_id = auth.uid());

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- routines: user-owned workout templates
-- ---------------------------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) default auth.uid(),
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "Users can view their own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert their own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can delete their own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- routine_exercises: ordered exercises within a routine
-- ---------------------------------------------------------------------------
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  sort_order integer not null default 0
);

alter table public.routine_exercises enable row level security;

create policy "Users can view routine exercises for their own routines"
  on public.routine_exercises for select
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

create policy "Users can insert routine exercises for their own routines"
  on public.routine_exercises for insert
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

create policy "Users can update routine exercises for their own routines"
  on public.routine_exercises for update
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

create policy "Users can delete routine exercises for their own routines"
  on public.routine_exercises for delete
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- workout_sessions: an in-progress or finished workout
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) default auth.uid(),
  title text not null default 'Workout',
  start_time timestamptz not null default now(),
  end_time timestamptz,
  notes text
);

alter table public.workout_sessions enable row level security;

create policy "Users can view their own workout sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout sessions"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exercise_logs: an exercise performed within a session
-- ---------------------------------------------------------------------------
create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  sort_order integer not null default 0
);

alter table public.exercise_logs enable row level security;

create policy "Users can view exercise logs for their own sessions"
  on public.exercise_logs for select
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert exercise logs for their own sessions"
  on public.exercise_logs for insert
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can update exercise logs for their own sessions"
  on public.exercise_logs for update
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

create policy "Users can delete exercise logs for their own sessions"
  on public.exercise_logs for delete
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = exercise_logs.session_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- set_logs: individual sets logged against an exercise_log
-- ---------------------------------------------------------------------------
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  exercise_log_id uuid not null references public.exercise_logs (id) on delete cascade,
  set_number integer not null,
  set_type text not null default 'normal' check (set_type in ('warmup', 'normal', 'drop', 'failure')),
  weight_kg numeric,
  reps integer,
  rpe numeric,
  is_completed boolean not null default false
);

alter table public.set_logs enable row level security;

create policy "Users can view set logs for their own sessions"
  on public.set_logs for select
  using (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert set logs for their own sessions"
  on public.set_logs for insert
  with check (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

create policy "Users can update set logs for their own sessions"
  on public.set_logs for update
  using (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

create policy "Users can delete set logs for their own sessions"
  on public.set_logs for delete
  using (
    exists (
      select 1 from public.exercise_logs el
      join public.workout_sessions s on s.id = el.session_id
      where el.id = set_logs.exercise_log_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Seed default (global) exercises. Safe to re-run.
-- ---------------------------------------------------------------------------
insert into public.exercises (name, category, primary_muscle, is_custom, user_id)
select v.name, v.category, v.primary_muscle, false, null
from (
  values
    ('Bench Press', 'barbell', 'Chest'),
    ('Barbell Squat', 'barbell', 'Quads'),
    ('Deadlift', 'barbell', 'Back'),
    ('Overhead Press', 'barbell', 'Shoulders'),
    ('Lat Pulldown', 'machine', 'Back'),
    ('Incline Dumbbell Press', 'dumbbell', 'Chest')
) as v(name, category, primary_muscle)
where not exists (
  select 1 from public.exercises e
  where e.name = v.name and e.user_id is null
);
