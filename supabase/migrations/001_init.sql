-- Wordle game — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) before
-- using the app with sync enabled.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ---------------------------------------------------------------------------
-- game_states (one row per user per UTC date)
-- ---------------------------------------------------------------------------
create table if not exists public.game_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  board_state jsonb not null default '[]'::jsonb,
  evaluations jsonb not null default '[]'::jsonb,
  game_status text not null default 'IN_PROGRESS'
    check (game_status in ('IN_PROGRESS', 'WIN', 'LOSE')),
  hard_mode boolean not null default false,
  day_offset integer not null,
  num_guesses integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, date)
);

create index if not exists game_states_user_idx on public.game_states (user_id);
create index if not exists game_states_user_date_idx on public.game_states (user_id, date desc);

-- ---------------------------------------------------------------------------
-- user_stats (aggregate)
-- ---------------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  games_played integer default 0 not null,
  games_won integer default 0 not null,
  current_streak integer default 0 not null,
  max_streak integer default 0 not null,
  guess_distribution jsonb default '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}'::jsonb not null,
  last_completed_date date,
  last_won_date date,
  updated_at timestamptz default now() not null
);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_game_states_updated_at on public.game_states;
create trigger set_game_states_updated_at before update on public.game_states
  for each row execute function public.handle_updated_at();

drop trigger if exists set_user_stats_updated_at on public.user_stats;
create trigger set_user_stats_updated_at before update on public.user_stats
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.game_states enable row level security;
alter table public.user_stats enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users manage own game states" on public.game_states;
create policy "Users manage own game states"
  on public.game_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own stats" on public.user_stats;
create policy "Users manage own stats"
  on public.user_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- New auth.users -> profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
