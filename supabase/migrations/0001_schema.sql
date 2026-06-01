-- 0001_schema.sql
create extension if not exists "pgcrypto";

create type user_role           as enum ('client','architect','admin');
create type architect_status    as enum ('pending','verified','rejected','paused');
create type project_status      as enum ('new','matched','in_review','closed');
create type project_type        as enum ('residential','hospitality','commercial','urban','cultural','other');
create type availability_status as enum ('available','busy','unavailable');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'client',
  full_name   text,
  locale      text        not null default 'fr',
  created_at  timestamptz not null default now()
);

create table architect_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references profiles(id) on delete cascade,
  full_name         text not null,
  email             text not null,
  phone             text,
  country           text not null default 'Côte d''Ivoire',
  city              text not null,
  specialties       text[] not null default '{}',
  years_experience  int not null check (years_experience between 0 and 70),
  project_types     project_type[] not null default '{}',
  description       text not null,
  portfolio_url     text,
  photo_url         text,
  languages         text[] not null default '{FR}',
  rating            numeric(2,1),
  availability      availability_status not null default 'available',
  fee_from          text,
  status            architect_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on architect_profiles (status);
create index on architect_profiles (availability);

create table client_projects (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references profiles(id) on delete set null,
  client_name          text not null,
  email                text not null,
  phone                text,
  project_location     text not null,
  project_type         project_type not null,
  project_description  text not null,
  required_specialties text[] not null default '{}',
  budget_range         text,
  timeline             text,
  notes                text,
  status               project_status not null default 'new',
  created_at           timestamptz not null default now()
);

create index on client_projects (status);

create table match_results (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references client_projects(id) on delete cascade,
  architect_id  uuid not null references architect_profiles(id) on delete cascade,
  score         int  not null,
  reasons       jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  unique(project_id, architect_id)
);

create index on match_results (project_id, score desc);
