-- 0001_init.sql
-- Lightning Lessons — initial schema

-- ── Enums ────────────────────────────────────────────────────────────
create type user_role as enum ('student', 'instructor', 'admin');
create type lesson_status as enum ('draft', 'pending', 'approved', 'rejected');
create type resource_type as enum ('link', 'slide', 'note');

-- ── Profile table, 1:1 with Supabase auth.users ─────────────────────
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'student',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  description text,
  status lesson_status not null default 'draft',
  rejection_reason text,
  mux_asset_id text,
  mux_playback_id text,
  thumbnail_url text,
  duration_seconds int,
  view_count int not null default 0,
  reviewed_by uuid references users(id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lesson_resources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  type resource_type not null,
  title text not null,
  url_or_content text not null,
  created_at timestamptz not null default now()
);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  progress_seconds int not null default 0,
  completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table lesson_views (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  viewed_at timestamptz not null default now()
);

-- ── Helpful indexes ──────────────────────────────────────────────────
create index on lessons (status);
create index on lessons (category_id);
create index on lessons (instructor_id);
create index on lesson_views (lesson_id);

-- ── Keep updated_at fresh automatically ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at
  before update on users
  for each row execute procedure public.set_updated_at();

create trigger set_lessons_updated_at
  before update on lessons
  for each row execute procedure public.set_updated_at();
