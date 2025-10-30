-- Add feedback_given flag to users table
alter table if exists public.users
  add column if not exists feedback_given boolean null default false;

-- Optional index for querying by flag (lightweight)
create index if not exists idx_users_feedback_given on public.users (feedback_given);

