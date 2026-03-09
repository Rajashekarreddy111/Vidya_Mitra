-- Supabase table schema for VidyaMitra backend
-- Run this in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  is_verified boolean default false,
  otp_code text,
  otp_expires_at timestamptz,
  otp_attempts int default 0,
  reset_otp text,
  reset_otp_expires_at timestamptz,
  reset_otp_attempts int default 0,
  profile_photo text,
  created_at timestamptz default now()
);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  resume_url text not null,
  resume_text text,
  analysis jsonb,
  created_at timestamptz default now()
);

create table if not exists roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role text,
  job_role text not null,
  roadmap_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists roadmap_topics (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references roadmaps(id) on delete cascade,
  topic_order int not null,
  title text not null,
  level text,
  subtopics jsonb default '[]'::jsonb,
  is_completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  topic text not null,
  questions jsonb,
  quiz_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score numeric(5,2) default 0,
  result_json jsonb,
  created_at timestamptz default now()
);

create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_role text not null,
  interview_type text not null,
  interview_json jsonb not null,
  created_at timestamptz default now()
);

create table if not exists interview_attempts (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references interviews(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score numeric(5,2) default 0,
  submitted_answers jsonb,
  result_json jsonb,
  created_at timestamptz default now()
);

create table if not exists company_preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_name text not null,
  result_json jsonb not null,
  created_at timestamptz default now()
);

-- Safety for existing older tables:
-- if table already existed with older columns, add missing columns before indexes.
alter table if exists users add column if not exists name text;
alter table if exists users add column if not exists email text;
alter table if exists users add column if not exists password_hash text;
alter table if exists users add column if not exists is_verified boolean default false;
alter table if exists users add column if not exists otp_code text;
alter table if exists users add column if not exists otp_expires_at timestamptz;
alter table if exists users add column if not exists otp_attempts int default 0;
alter table if exists users add column if not exists reset_otp text;
alter table if exists users add column if not exists reset_otp_expires_at timestamptz;
alter table if exists users add column if not exists reset_otp_attempts int default 0;
alter table if exists users add column if not exists profile_photo text;
alter table if exists users add column if not exists created_at timestamptz default now();

-- Older modules
alter table if exists resumes add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists resumes add column if not exists resume_url text;
alter table if exists resumes add column if not exists resume_text text;
alter table if exists resumes add column if not exists analysis jsonb;
alter table if exists resumes add column if not exists created_at timestamptz default now();

alter table if exists roadmaps add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists roadmaps add column if not exists role text;
alter table if exists roadmaps add column if not exists job_role text;
alter table if exists roadmaps add column if not exists roadmap_json jsonb;
alter table if exists roadmaps add column if not exists created_at timestamptz default now();

alter table if exists roadmap_topics add column if not exists roadmap_id uuid references roadmaps(id) on delete cascade;
alter table if exists roadmap_topics add column if not exists topic_order int;
alter table if exists roadmap_topics add column if not exists title text;
alter table if exists roadmap_topics add column if not exists level text;
alter table if exists roadmap_topics add column if not exists subtopics jsonb default '[]'::jsonb;
alter table if exists roadmap_topics add column if not exists is_completed boolean default false;
alter table if exists roadmap_topics add column if not exists created_at timestamptz default now();

alter table if exists quizzes add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists quizzes add column if not exists topic text;
alter table if exists quizzes add column if not exists questions jsonb;
alter table if exists quizzes add column if not exists quiz_json jsonb;
alter table if exists quizzes add column if not exists created_at timestamptz default now();

alter table if exists quiz_attempts add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists quiz_attempts add column if not exists quiz_id uuid references quizzes(id) on delete cascade;
alter table if exists quiz_attempts add column if not exists score numeric(5,2) default 0;
alter table if exists quiz_attempts add column if not exists result_json jsonb;
alter table if exists quiz_attempts add column if not exists created_at timestamptz default now();

alter table if exists interviews add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists interviews add column if not exists job_role text;
alter table if exists interviews add column if not exists interview_type text;
alter table if exists interviews add column if not exists interview_json jsonb;
alter table if exists interviews add column if not exists created_at timestamptz default now();

alter table if exists interview_attempts add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists interview_attempts add column if not exists interview_id uuid references interviews(id) on delete cascade;
alter table if exists interview_attempts add column if not exists score numeric(5,2) default 0;
alter table if exists interview_attempts add column if not exists submitted_answers jsonb;
alter table if exists interview_attempts add column if not exists result_json jsonb;
alter table if exists interview_attempts add column if not exists created_at timestamptz default now();

alter table if exists company_preparations add column if not exists user_id uuid references users(id) on delete cascade;
alter table if exists company_preparations add column if not exists company_name text;
alter table if exists company_preparations add column if not exists result_json jsonb;
alter table if exists company_preparations add column if not exists created_at timestamptz default now();

create unique index if not exists uq_users_email on users(email);
create index if not exists idx_resumes_user on resumes(user_id);
create index if not exists idx_roadmaps_user on roadmaps(user_id);
create index if not exists idx_quizzes_user on quizzes(user_id);
create index if not exists idx_quiz_attempts_user on quiz_attempts(user_id);
create index if not exists idx_interviews_user on interviews(user_id);
create index if not exists idx_interview_attempts_user on interview_attempts(user_id);
create index if not exists idx_company_preparations_user on company_preparations(user_id);
