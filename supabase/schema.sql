-- Run this in the Supabase SQL editor for your project.

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) default auth.uid(),
  date date not null,
  exercise_name text not null,
  sets integer,
  reps integer,
  weight_kg numeric,
  distance_meters numeric,
  duration_minutes numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.workout_logs enable row level security;

create policy "Users can view their own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);
