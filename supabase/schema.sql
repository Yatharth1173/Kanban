-- Kanban Task Board — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Team Members ───────────────────────────────────────────────────────────
create table public.team_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- ─── Labels ─────────────────────────────────────────────────────────────────
create table public.labels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#8b5cf6',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ─── Tasks ──────────────────────────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Task Assignees (many-to-many) ──────────────────────────────────────────
create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  primary key (task_id, team_member_id)
);

-- ─── Task Labels (many-to-many) ─────────────────────────────────────────────
create table public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

-- ─── Comments ───────────────────────────────────────────────────────────────
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ─── Activity Log ─────────────────────────────────────────────────────────────
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_status_idx on public.tasks(status);
create index comments_task_id_idx on public.comments(task_id);
create index activity_log_task_id_idx on public.activity_log(task_id);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.team_members enable row level security;
alter table public.labels enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_labels enable row level security;
alter table public.comments enable row level security;
alter table public.activity_log enable row level security;

-- Team members policies
create policy "Users manage own team members"
  on public.team_members for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Labels policies
create policy "Users manage own labels"
  on public.labels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tasks policies
create policy "Users manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Task assignees policies (via task ownership)
create policy "Users manage assignees on own tasks"
  on public.task_assignees for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_assignees.task_id
        and tasks.user_id = auth.uid()
    )
  );

-- Task labels policies (via task ownership)
create policy "Users manage labels on own tasks"
  on public.task_labels for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and tasks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tasks
      where tasks.id = task_labels.task_id
        and tasks.user_id = auth.uid()
    )
  );

-- Comments policies (via task ownership)
create policy "Users manage comments on own tasks"
  on public.comments for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
        and tasks.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tasks
      where tasks.id = comments.task_id
        and tasks.user_id = auth.uid()
    )
  );

-- Activity log policies (via task ownership)
create policy "Users manage activity on own tasks"
  on public.activity_log for all
  using (
    exists (
      select 1 from public.tasks
      where tasks.id = activity_log.task_id
        and tasks.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.tasks
      where tasks.id = activity_log.task_id
        and tasks.user_id = auth.uid()
    )
  );

-- ─── Enable anonymous sign-in ─────────────────────────────────────────────────
-- In Supabase Dashboard: Authentication → Providers → Anonymous sign-ins → Enable
