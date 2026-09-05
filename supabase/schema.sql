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
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

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
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'anonymous'),
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

insert into public.profiles (id, email, display_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1), 'anonymous'),
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
  with check (auth.uid() is not null);

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
-- Promote an admin (run once after you sign up):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
