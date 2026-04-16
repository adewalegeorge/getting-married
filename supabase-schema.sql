-- Run this in your Supabase SQL Editor to set up the required tables

-- RSVP submissions
create table if not exists rsvps (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text,
  attending       text not null check (attending in ('yes', 'no')),
  guests          int not null default 1,
  relationship    text not null,
  dietary         text,
  message         text
);

-- Prevent duplicate RSVPs from the same email
create unique index if not exists rsvps_email_idx on rsvps (lower(email));

-- Newsletter subscribers
create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email      text not null unique
);

-- Row Level Security (allow inserts from anon key, no reads from client)
alter table rsvps enable row level security;
alter table newsletter_subscribers enable row level security;

create policy "Allow anon insert rsvps"
  on rsvps for insert to anon with check (true);

create policy "Allow anon insert newsletter"
  on newsletter_subscribers for insert to anon with check (true);
