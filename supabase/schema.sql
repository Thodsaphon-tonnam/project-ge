-- Run this in the Supabase SQL editor (safe to re-run).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  year int not null default 1 check (year between 1 and 4)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  category text not null,
  term_year text not null,
  year int not null default 1 check (year between 1 and 4),
  file_url text not null,
  uploader_name text not null default 'anonymous',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.subjects add column if not exists year int;
alter table public.documents add column if not exists year int;
alter table public.documents add column if not exists user_id uuid references auth.users (id) on delete set null;
alter table public.documents alter column status set default 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'documents_status_check'
  ) then
    alter table public.documents
      add constraint documents_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'anonymous',
  username text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  author_name text not null default 'anonymous',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_document_id_idx on public.comments (document_id, created_at);

-- ---------------------------------------------------------------------------
-- Auth: create a profile row for every new user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, username, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(coalesce(new.raw_user_meta_data->>'username', '')), ''),
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1),
      'anonymous'
    ),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'username', '')), ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, display_name, username, role)
select
  u.id,
  u.email,
  coalesce(
    nullif(btrim(coalesce(u.raw_user_meta_data->>'username', '')), ''),
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1),
    'anonymous'
  ),
  nullif(btrim(coalesce(u.raw_user_meta_data->>'username', '')), ''),
  'user'
from auth.users u
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.subjects enable row level security;
alter table public.documents enable row level security;
alter table public.profiles enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Public can read subjects" on public.subjects;
drop policy if exists "Public can insert subjects" on public.subjects;
drop policy if exists "Public can update subjects" on public.subjects;
drop policy if exists "Authenticated can insert subjects" on public.subjects;
drop policy if exists "Authenticated can update subjects" on public.subjects;

create policy "Public can read subjects"
  on public.subjects for select
  using (true);

create policy "Authenticated can insert subjects"
  on public.subjects for insert
  to authenticated
  with check (true);

create policy "Authenticated can update subjects"
  on public.subjects for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read approved documents" on public.documents;
drop policy if exists "Public can insert documents" on public.documents;
drop policy if exists "Authenticated can insert documents" on public.documents;
drop policy if exists "Admins can update documents" on public.documents;
drop policy if exists "Admins can delete documents" on public.documents;
drop policy if exists "Users can read own documents" on public.documents;

create policy "Public can read approved documents"
  on public.documents for select
  using (status = 'approved' or public.is_admin() or user_id = auth.uid());

create policy "Authenticated can insert documents"
  on public.documents for insert
  to authenticated
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "Admins can update documents"
  on public.documents for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete documents"
  on public.documents for delete
  using (public.is_admin());

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select p.role from public.profiles p where p.id = auth.uid()));

drop policy if exists "Public can read comments" on public.comments;
drop policy if exists "Authenticated can insert comments" on public.comments;
drop policy if exists "Authors can delete own comments" on public.comments;
drop policy if exists "Admins can delete comments" on public.comments;

create policy "Public can read comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = comments.document_id
        and (d.status = 'approved' or public.is_admin() or d.user_id = auth.uid())
    )
  );

create policy "Authenticated can insert comments"
  on public.comments for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.status = 'approved'
    )
  );

create policy "Authors can delete own comments"
  on public.comments for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('exam-files', 'exam-files', true)
on conflict (id) do nothing;

drop policy if exists "Public can read exam files" on storage.objects;
drop policy if exists "Public can upload exam files" on storage.objects;
drop policy if exists "Authenticated can upload exam files" on storage.objects;
drop policy if exists "Admins can delete exam files" on storage.objects;

create policy "Public can read exam files"
  on storage.objects for select
  using (bucket_id = 'exam-files');

create policy "Authenticated can upload exam files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'exam-files');

create policy "Admins can delete exam files"
  on storage.objects for delete
  using (bucket_id = 'exam-files' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Unique usernames + bind document credit to the signed-in account
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists username text;

-- Usernames may include spaces and punctuation. Uniqueness is case-insensitive after trim.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (
    username is null
    or (
      char_length(btrim(username)) between 3 and 24
      and username !~ '[[:cntrl:]]'
    )
  );

drop index if exists public.profiles_username_unique_idx;
create unique index profiles_username_unique_idx
  on public.profiles (lower(btrim(username)))
  where username is not null;

create index if not exists documents_user_id_idx on public.documents (user_id);

update public.documents d
set user_id = null
where d.user_id is not null
  and not exists (select 1 from public.profiles p where p.id = d.user_id);

alter table public.documents drop constraint if exists documents_user_id_fkey;
alter table public.documents
  add constraint documents_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;

create or replace function public.username_taken(uname text, exclude_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where lower(btrim(username)) = lower(btrim(uname))
      and (exclude_id is null or id <> exclude_id)
  );
$$;

grant execute on function public.username_taken(text, uuid) to anon, authenticated;

create or replace function public.documents_assign_uploader()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  if auth.uid() is null then
    raise exception 'กรุณาเข้าสู่ระบบก่อนอัปโหลด';
  end if;

  if new.user_id is distinct from auth.uid() and not public.is_admin() then
    raise exception 'ไม่สามารถบันทึกเอกสารในนามผู้ใช้อื่นได้';
  end if;

  select p.username into uname
  from public.profiles p
  where p.id = new.user_id;

  if uname is null or btrim(uname) = '' then
    raise exception 'กรุณาตั้ง Username ก่อนอัปโหลดเอกสาร';
  end if;

  new.uploader_name := uname;
  return new;
end;
$$;

drop trigger if exists documents_assign_uploader on public.documents;
create trigger documents_assign_uploader
  before insert on public.documents
  for each row execute procedure public.documents_assign_uploader();

create or replace function public.comments_assign_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  if new.user_id is distinct from auth.uid() then
    raise exception 'ไม่สามารถแสดงความคิดเห็นในนามผู้ใช้อื่นได้';
  end if;

  select p.username into uname
  from public.profiles p
  where p.id = new.user_id;

  if uname is null or btrim(uname) = '' then
    raise exception 'กรุณาตั้ง Username ก่อนแสดงความคิดเห็น';
  end if;

  new.author_name := uname;
  return new;
end;
$$;

drop trigger if exists comments_assign_author on public.comments;
create trigger comments_assign_author
  before insert on public.comments
  for each row execute procedure public.comments_assign_author();

-- ---------------------------------------------------------------------------
-- Promote an admin (run once after you sign up):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
