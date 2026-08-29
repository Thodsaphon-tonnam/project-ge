-- Run this in the Supabase SQL editor if the tables / bucket are not set up yet.

create extension if not exists "pgcrypto";

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  category text not null,
  term_year text not null,
  file_url text not null,
  uploader_name text not null default 'anonymous',
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.documents enable row level security;

create policy "Public can read subjects"
  on public.subjects for select
  using (true);

create policy "Public can insert subjects"
  on public.subjects for insert
  with check (true);

create policy "Public can read approved documents"
  on public.documents for select
  using (status = 'approved');

create policy "Public can insert documents"
  on public.documents for insert
  with check (true);

insert into storage.buckets (id, name, public)
values ('exam-files', 'exam-files', true)
on conflict (id) do nothing;

create policy "Public can read exam files"
  on storage.objects for select
  using (bucket_id = 'exam-files');

create policy "Public can upload exam files"
  on storage.objects for insert
  with check (bucket_id = 'exam-files');
