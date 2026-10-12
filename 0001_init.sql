-- CICT Collaborative Review Board and Resource Hub
-- Run in the Supabase SQL editor, or with `supabase db push`.

-- =====================================================================
-- Tables
-- =====================================================================

-- Roster of active CICT students. Loaded by an admin (Table Editor / CSV import).
-- Registration is only allowed for Student IDs that appear here.
create table public.enrolled_students (
  student_id text primary key,
  is_active  boolean not null default true,
  added_at   timestamptz not null default now()
);

-- App profile for each auth user (1:1 with auth.users).
create table public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  student_id  text not null unique,
  program     text not null check (program in ('BSCS', 'BSIS')),
  year_level  int  not null check (year_level between 1 and 4),
  created_at  timestamptz not null default now()
);

create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 3 and 150),
  description text check (char_length(description) <= 1000),
  course_code text not null check (course_code = upper(course_code) and char_length(course_code) between 2 and 20),
  program     text not null check (program in ('BSCS', 'BSIS')),
  year_level  int  not null check (year_level between 1 and 4),
  -- Storage object path inside the private "resources" bucket: <uploader uuid>/<uuid>-<filename>
  file_url    text not null,
  file_type   text not null check (file_type in ('pdf', 'markdown', 'code')),
  uploader_id uuid not null references public.users (id) on delete cascade,
  upvotes     int not null default 0,
  downvotes   int not null default 0,
  score       int generated always as (upvotes - downvotes) stored,
  created_at  timestamptz not null default now()
);

create table public.ratings (
  resource_id uuid not null references public.resources (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  vote_type   text not null check (vote_type in ('up', 'down')),
  created_at  timestamptz not null default now(),
  primary key (resource_id, user_id)
);

create index resources_curriculum_idx on public.resources (program, year_level, course_code);
create index resources_score_idx      on public.resources (score desc, created_at desc);
create index ratings_user_idx         on public.ratings (user_id);

-- =====================================================================
-- Registration: enforce the roster and create the profile row
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id text := upper(trim(new.raw_user_meta_data ->> 'student_id'));
  v_program    text := new.raw_user_meta_data ->> 'program';
  v_year       int  := (new.raw_user_meta_data ->> 'year_level')::int;
begin
  if v_student_id is null or v_student_id = '' then
    raise exception 'Student ID is required';
  end if;

  if not exists (
    select 1 from public.enrolled_students e
    where e.student_id = v_student_id and e.is_active
  ) then
    raise exception 'Student ID % is not on the active CICT enrollment roster', v_student_id;
  end if;

  insert into public.users (id, student_id, program, year_level)
  values (new.id, v_student_id, v_program, v_year);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Keep resources.upvotes / downvotes in sync with ratings
-- =====================================================================
create or replace function public.sync_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.resources
       set upvotes   = upvotes   - (old.vote_type = 'up')::int,
           downvotes = downvotes - (old.vote_type = 'down')::int
     where id = old.resource_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.resources
       set upvotes   = upvotes   + (new.vote_type = 'up')::int,
           downvotes = downvotes + (new.vote_type = 'down')::int
     where id = new.resource_id;
  end if;

  return null;
end;
$$;

create trigger ratings_sync_counts
  after insert or update or delete on public.ratings
  for each row execute function public.sync_vote_counts();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.enrolled_students enable row level security; -- no policies: admin/service role only
alter table public.users             enable row level security;
alter table public.resources         enable row level security;
alter table public.ratings           enable row level security;

-- users: any signed-in student can read profiles (the UI only shows program/year).
-- Inserts happen through the handle_new_user trigger, not from the client.
create policy "users_read" on public.users
  for select to authenticated using (true);

-- resources: read all, insert/delete only your own.
-- There is deliberately no UPDATE policy, so nobody can tamper with vote counts.
create policy "resources_read" on public.resources
  for select to authenticated using (true);

create policy "resources_insert_own" on public.resources
  for insert to authenticated
  with check (
    uploader_id = auth.uid()
    and upvotes = 0
    and downvotes = 0
    and file_url like auth.uid()::text || '/%'
  );

create policy "resources_delete_own" on public.resources
  for delete to authenticated using (uploader_id = auth.uid());

-- ratings: you only ever see and change your own votes, and not on your own uploads.
create policy "ratings_read_own" on public.ratings
  for select to authenticated using (user_id = auth.uid());

create policy "ratings_insert_own" on public.ratings
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.resources r
      where r.id = resource_id and r.uploader_id = auth.uid()
    )
  );

create policy "ratings_update_own" on public.ratings
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.resources r
      where r.id = resource_id and r.uploader_id = auth.uid()
    )
  );

create policy "ratings_delete_own" on public.ratings
  for delete to authenticated using (user_id = auth.uid());

-- =====================================================================
-- Storage: private "resources" bucket, files live under <user uuid>/
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('resources', 'resources', false, 10485760)
on conflict (id) do nothing;

create policy "resources_bucket_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'resources');

create policy "resources_bucket_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resources_bucket_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);
