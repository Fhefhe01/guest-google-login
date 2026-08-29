create table if not exists public.profiles (
  id uuid primary key,
  alias text not null default 'anonymous',
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by all" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.upgrades (
  id text primary key,
  name text not null,
  per_click integer not null default 0,
  per_sec integer not null default 0,
  base_cost integer not null,
  growth numeric not null default 1.55,
  sort_order integer not null default 0
);
grant select on public.upgrades to authenticated, anon;
grant all on public.upgrades to service_role;
alter table public.upgrades enable row level security;
create policy "upgrades public read" on public.upgrades for select using (true);

insert into public.upgrades (id,name,per_click,per_sec,base_cost,growth,sort_order) values
  ('informant','Paid Informant',1,0,25,1.55,1),
  ('eyes','Extra Eyes',2,0,120,1.6,2),
  ('intern','Burner Intern',0,1,60,1.55,3),
  ('redact','Redaction Desk',0,5,450,1.6,4),
  ('bunker','Signal Bunker',0,25,3000,1.65,5)
on conflict (id) do nothing;

create table if not exists public.players (
  user_id uuid primary key,
  score bigint not null default 0,
  owned jsonb not null default '{}'::jsonb,
  best_combo integer not null default 0,
  perfect_taps integer not null default 0,
  critical_taps integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.players to authenticated;
grant select on public.players to anon;
grant all on public.players to service_role;
alter table public.players enable row level security;
create policy "players public read" on public.players for select using (true);
create policy "own player insert" on public.players for insert to authenticated with check (auth.uid() = user_id);
create policy "own player update" on public.players for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);