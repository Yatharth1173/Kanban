-- Run this in Supabase SQL Editor if you already applied the original schema.sql

create table if not exists public.board_shares (
  user_id uuid primary key references auth.users(id) on delete cascade,
  share_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create index if not exists board_shares_token_idx on public.board_shares(share_token);

create or replace function public.can_access_board(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = target_user_id
      or exists (
        select 1 from public.board_shares
        where user_id = target_user_id
      );
$$;

create or replace function public.get_board_owner_by_token(token text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from public.board_shares where share_token = token limit 1;
$$;

grant execute on function public.get_board_owner_by_token(text) to anon, authenticated;

alter table public.board_shares enable row level security;

drop policy if exists "Users manage own board share" on public.board_shares;
create policy "Users manage own board share"
  on public.board_shares for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own team members" on public.team_members;
drop policy if exists "Users manage accessible team members" on public.team_members;
create policy "Users manage accessible team members"
  on public.team_members for all
  using (public.can_access_board(user_id))
  with check (public.can_access_board(user_id));

drop policy if exists "Users manage own labels" on public.labels;
drop policy if exists "Users manage accessible labels" on public.labels;
create policy "Users manage accessible labels"
  on public.labels for all
  using (public.can_access_board(user_id))
  with check (public.can_access_board(user_id));

drop policy if exists "Users manage own tasks" on public.tasks;
drop policy if exists "Users manage accessible tasks" on public.tasks;
create policy "Users manage accessible tasks"
  on public.tasks for all
  using (public.can_access_board(user_id))
  with check (public.can_access_board(user_id));

drop policy if exists "Users manage assignees on own tasks" on public.task_assignees;
drop policy if exists "Users manage assignees on accessible tasks" on public.task_assignees;
create policy "Users manage assignees on accessible tasks"
  on public.task_assignees for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and public.can_access_board(tasks.user_id)
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and public.can_access_board(tasks.user_id)
    )
  );

drop policy if exists "Users manage labels on own tasks" on public.task_labels;
drop policy if exists "Users manage labels on accessible tasks" on public.task_labels;
create policy "Users manage labels on accessible tasks"
  on public.task_labels for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and public.can_access_board(tasks.user_id)
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and public.can_access_board(tasks.user_id)
    )
  );

drop policy if exists "Users manage comments on own tasks" on public.comments;
drop policy if exists "Users manage comments on accessible tasks" on public.comments;
create policy "Users manage comments on accessible tasks"
  on public.comments for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
        and public.can_access_board(tasks.user_id)
    )
  )
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
        and public.can_access_board(tasks.user_id)
    )
  );

drop policy if exists "Users manage activity on own tasks" on public.activity_log;
drop policy if exists "Users manage activity on accessible tasks" on public.activity_log;
create policy "Users manage activity on accessible tasks"
  on public.activity_log for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = activity_log.task_id
        and public.can_access_board(tasks.user_id)
    )
  )
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tasks
      where tasks.id = activity_log.task_id
        and public.can_access_board(tasks.user_id)
    )
  );
