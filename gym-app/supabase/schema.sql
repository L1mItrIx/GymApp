-- =========================================================================
-- FitForge — Supabase schema
-- Run this in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- =========================================================================

-- 1. PROFILES (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  goal text not null check (goal in ('hypertrophy','strength','weight_loss','endurance','general_fitness')),
  experience text not null check (experience in ('beginner','intermediate','advanced')),
  days_per_week int not null check (days_per_week between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PLANS (the user's persistent weekly plan; may have multiple, one active)
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists plans_user_idx on public.plans(user_id);

-- 3. PLAN_DAYS (Monday=0 ... Sunday=6) — exactly 7 rows per plan
create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  is_rest boolean not null default false,
  name text,
  focus text[] not null default '{}',
  unique (plan_id, day_of_week)
);
create index if not exists plan_days_plan_idx on public.plan_days(plan_id);

-- 4. PLAN_EXERCISES (prescription for a day)
create table if not exists public.plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days on delete cascade,
  exercise_id text not null, -- references hard-coded catalog in lib/exercises.ts
  sets int not null default 3 check (sets between 1 and 12),
  reps text not null default '8-12',
  rir int default 2 check (rir between 0 and 6),
  notes text,
  position int not null default 0
);
create index if not exists plan_exercises_day_idx on public.plan_exercises(plan_day_id);

-- 5. WORKOUT_SESSIONS (one per user per date)
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  plan_day_id uuid references public.plan_days on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, date);

-- 6. SESSION_EXERCISES (per-exercise within a session)
create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions on delete cascade,
  exercise_id text not null,
  position int not null default 0
);
create index if not exists session_exercises_session_idx on public.session_exercises(session_id);

-- 7. SET_LOGS (per-set entry within a session_exercise)
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references public.session_exercises on delete cascade,
  set_number int not null check (set_number > 0),
  weight_kg numeric(6,2),
  reps int,
  rir int
);
create index if not exists set_logs_session_exercise_idx on public.set_logs(session_exercise_id);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table public.profiles          enable row level security;
alter table public.plans             enable row level security;
alter table public.plan_days         enable row level security;
alter table public.plan_exercises    enable row level security;
alter table public.workout_sessions  enable row level security;
alter table public.session_exercises enable row level security;
alter table public.set_logs          enable row level security;

-- profiles: user owns their own row
drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- plans: user owns their plans
drop policy if exists "plans_owner_all" on public.plans;
create policy "plans_owner_all" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- plan_days: scoped via parent plan
drop policy if exists "plan_days_via_plan" on public.plan_days;
create policy "plan_days_via_plan" on public.plan_days
  for all using (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.plans p where p.id = plan_id and p.user_id = auth.uid()));

-- plan_exercises: scoped via plan_day -> plan
drop policy if exists "plan_exercises_via_day" on public.plan_exercises;
create policy "plan_exercises_via_day" on public.plan_exercises
  for all using (exists (
    select 1 from public.plan_days d join public.plans p on p.id = d.plan_id
    where d.id = plan_day_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.plan_days d join public.plans p on p.id = d.plan_id
    where d.id = plan_day_id and p.user_id = auth.uid()
  ));

-- workout_sessions: user owns
drop policy if exists "sessions_owner_all" on public.workout_sessions;
create policy "sessions_owner_all" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- session_exercises: scoped via session
drop policy if exists "session_exercises_via_session" on public.session_exercises;
create policy "session_exercises_via_session" on public.session_exercises
  for all using (exists (
    select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()
  ));

-- set_logs: scoped via session_exercise -> session
drop policy if exists "set_logs_via_session_exercise" on public.set_logs;
create policy "set_logs_via_session_exercise" on public.set_logs
  for all using (exists (
    select 1 from public.session_exercises se
    join public.workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.session_exercises se
    join public.workout_sessions s on s.id = se.session_id
    where se.id = session_exercise_id and s.user_id = auth.uid()
  ));

-- =========================================================================
-- TRIGGERS
-- =========================================================================
-- Keep updated_at fresh on profiles and plans
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.tg_set_updated_at();

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans
for each row execute function public.tg_set_updated_at();

-- Ensure only one active plan per user
create or replace function public.tg_single_active_plan()
returns trigger language plpgsql as $$
begin
  if new.is_active then
    update public.plans
       set is_active = false
     where user_id = new.user_id
       and id <> new.id
       and is_active = true;
  end if;
  return new;
end$$;

drop trigger if exists plans_single_active on public.plans;
create trigger plans_single_active before insert or update on public.plans
for each row execute function public.tg_single_active_plan();

-- =========================================================================
-- FUNCTION: create_default_plan(user_id) — seeds 7 plan_days for a fresh plan
-- =========================================================================
create or replace function public.create_default_plan(p_user_id uuid, p_name text default 'Mi semana')
returns uuid language plpgsql security definer as $$
declare
  v_plan_id uuid;
  v_day int;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  insert into public.plans (user_id, name, is_active)
  values (p_user_id, p_name, true)
  returning id into v_plan_id;

  for v_day in 0..6 loop
    insert into public.plan_days (plan_id, day_of_week, is_rest, name)
    values (v_plan_id, v_day, true, null);
  end loop;

  return v_plan_id;
end$$;

grant execute on function public.create_default_plan(uuid, text) to authenticated;
