-- RoleReady schema v0.1 (owner: Person B)
-- Put at supabase/migrations/0001_init.sql and run with `supabase db push`
-- (or paste into the Supabase SQL editor).
-- Every table carries user_id so one simple RLS rule covers it.
-- Edge functions call the database with the user's own token, so RLS applies there too.

create table public.sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role_title      text,
  company         text,
  jd_text         text not null,
  resume_path     text,
  resume_text     text,
  resume_lines    jsonb,
  jd_requirements jsonb,
  status          text not null default 'draft'
                  check (status in ('draft', 'ready', 'in_progress', 'completed')),
  overall_score   smallint check (overall_score between 0 and 100),
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create table public.questions (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position    smallint not null check (position between 1 and 6),
  text        text not null,
  type        text not null check (type in ('behavioural', 'technical', 'role_fit', 'situational')),
  why_asking  text not null,
  resume_refs text[] not null default '{}',
  jd_refs     text[] not null default '{}',
  unique (session_id, position)
);

create table public.answers (
  id                 uuid primary key default gen_random_uuid(),
  question_id        uuid not null unique references public.questions(id) on delete cascade,
  session_id         uuid not null references public.sessions(id) on delete cascade,
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answer_text        text not null,
  scores             jsonb not null,
  overall            smallint not null check (overall between 0 and 100),
  what_worked        text not null,
  one_fix            text not null,
  stronger_answer    text not null,
  unsupported_claims text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index on public.sessions (user_id, created_at desc);
create index on public.questions (session_id);
create index on public.answers (session_id);

alter table public.sessions  enable row level security;
alter table public.questions enable row level security;
alter table public.answers   enable row level security;

create policy "own sessions"  on public.sessions  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own questions" on public.questions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own answers"   on public.answers   for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Private bucket for resume PDFs, stored as {user_id}/{session_id}.pdf
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "resumes: read own"   on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "resumes: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "resumes: replace own" on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

