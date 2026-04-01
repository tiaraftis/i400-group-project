create extension if not exists pgcrypto;

drop table if exists public.class_registrations cascade;
drop table if exists public.community_classes cascade;
drop table if exists public.skating_classes cascade;
drop table if exists public.logs cascade;

do $$ begin
  drop type public.user_role cascade;
exception
  when others then null;
end $$;

do $$
begin
  create type public.user_role as enum ('admin', 'skater', 'coach');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'skater',
  created_at timestamptz not null default now()
);

create table if not exists public.skating_classes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  level text not null,
  description text not null,
  coach_name text not null,
  rink_location text not null,
  starts_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.class_registrations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.skating_classes(id) on delete cascade,
  skater_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, skater_id)
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists skating_classes_created_idx
  on public.skating_classes (created_at desc);

create index if not exists class_registrations_skater_idx
  on public.class_registrations (skater_id, created_at desc);

create index if not exists logs_created_idx
  on public.logs (created_at desc);

alter table public.users enable row level security;
alter table public.skating_classes enable row level security;
alter table public.class_registrations enable row level security;
alter table public.logs enable row level security;

-- USERS POLICIES
create policy "users_can_read_own_user_row"
  on public.users for select using (auth.uid() = id);

create policy "admins_can_read_all_users"
  on public.users for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "users_can_insert_own_user_row"
  on public.users for insert with check (auth.uid() = id);

-- Allows admins to promote others to admin
create policy "admins_can_update_user_roles"
  on public.users for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- CLASSES POLICIES
create policy "authenticated_users_can_read_classes"
  on public.skating_classes for select to authenticated using (true);

create policy "admins_and_coaches_can_insert_classes"
  on public.skating_classes for insert to authenticated with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'coach'))
  );

-- REGISTRATIONS POLICIES
create policy "skaters_can_read_own_registrations"
  on public.class_registrations for select to authenticated using (skater_id = auth.uid());

create policy "skaters_can_register"
  on public.class_registrations for insert to authenticated with check (
    skater_id = auth.uid()
  );

-- LOGS POLICIES
create policy "admins_can_read_all_logs"
  on public.logs for select to authenticated using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "authenticated_users_can_insert_logs"
  on public.logs for insert to authenticated with check (
    user_id = auth.uid()
  );

-- AUTH TRIGGER
-- Automatically creates a user row in public.users when a skater signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, role)
  values (new.id, 'skater');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA
do $$
declare
  seed_admin_id uuid;
begin
  -- Find an admin to act as created_by
  select id into seed_admin_id from public.users where role = 'admin' limit 1;
  
  if seed_admin_id is null then return; end if;

  if not exists (select 1 from public.skating_classes where title = 'Intro to Edges') then
    insert into public.skating_classes (created_by, title, level, description, coach_name, rink_location, starts_at, capacity)
    values (
      seed_admin_id, 
      'Intro to Edges', 
      'Basic 4', 
      'Master inside and outside edges for better glide and control.', 
      'Coach Sarah', 
      'Main Rink', 
      '2026-04-10T14:00:00Z'::timestamptz, 
      15
    );
  end if;

  if not exists (select 1 from public.skating_classes where title = 'Freestyle Jumps 101') then
    insert into public.skating_classes (created_by, title, level, description, coach_name, rink_location, starts_at, capacity)
    values (
      seed_admin_id, 
      'Freestyle Jumps 101', 
      'Freestyle 1', 
      'Introduction to waltz jumps, half flips, and toe loops.', 
      'Coach Michael', 
      'Studio Rink', 
      '2026-04-12T16:30:00Z'::timestamptz, 
      10
    );
  end if;
end $$;
