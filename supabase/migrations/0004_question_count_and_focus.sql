-- 31 Oct: the candidate picks how many questions (5, 10 or 15; old sessions
-- keep 6) and what kind (mixed, behavioural, technical or situational).
alter table public.sessions
  add column if not exists question_count smallint not null default 6
    check (question_count between 1 and 15),
  add column if not exists question_focus text not null default 'mixed'
    check (question_focus in ('mixed', 'behavioural', 'technical', 'situational'));

alter table public.questions drop constraint if exists questions_position_check;
alter table public.questions add constraint questions_position_check
  check (position between 1 and 15);
