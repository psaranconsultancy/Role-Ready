-- RoleReady v0.3: a log of report emails, used only to rate-limit the
-- email-report function (per user and overall). Written and read by the
-- function with the service role; no client access.
create table if not exists public.report_emails (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  sent_at timestamptz not null default now()
);
create index if not exists report_emails_user_sent on public.report_emails (user_id, sent_at desc);
create index if not exists report_emails_sent on public.report_emails (sent_at desc);
alter table public.report_emails enable row level security;
