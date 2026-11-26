-- Octo database schema
-- Run this once in the Supabase SQL editor.
--
-- Design notes
--  * Every table is owned through businesses.owner_id = auth.uid().
--  * Row-level security is ON for every table, so one business can never read
--    another business's customers, messages or bookings.
--  * Only what's needed is stored: phone numbers, messages and bookings.
--  * The WhatsApp webhook writes with the service role key from the server only.

-- ---------------------------------------------------------------- tables

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  type text not null default 'other'
    check (type in ('salon', 'clinic', 'school', 'shop', 'restaurant', 'other')),
  location text not null default '',
  whatsapp_number text,
  whatsapp_phone_id text unique,
  whatsapp_connected boolean not null default false,
  tone text not null default 'friendly'
    check (tone in ('friendly', 'professional', 'casual')),
  language text not null default 'english'
    check (language in ('english', 'swahili', 'mixed')),
  plan text not null default 'starter'
    check (plan in ('starter', 'growth', 'pro')),
  notify_new_booking boolean not null default true,
  notify_escalation boolean not null default true,
  notify_daily_summary boolean not null default false,
  hours jsonb not null default '{}'::jsonb,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on public.businesses (owner_id);

create table if not exists public.services (
  id text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  price integer not null default 0,
  duration_min integer not null default 30
);

create table if not exists public.faqs (
  id text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  question text not null default '',
  answer text not null default '',
  enabled boolean not null default true
);

create table if not exists public.conversations (
  id text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_name text not null default 'Customer',
  customer_phone text not null,
  last_message_at timestamptz not null default now(),
  ai_paused boolean not null default false,
  needs_attention boolean not null default false,
  unread integer not null default 0
);

create index if not exists conversations_business_idx
  on public.conversations (business_id, last_message_at desc);

create table if not exists public.messages (
  id text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  conversation_id text not null references public.conversations (id) on delete cascade,
  author text not null check (author in ('customer', 'ai', 'owner')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);

create table if not exists public.bookings (
  id text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  conversation_id text references public.conversations (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  service_name text not null,
  price integer not null default 0,
  starts_at timestamptz not null,
  duration_min integer not null default 30,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_by text not null default 'ai' check (created_by in ('ai', 'owner')),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bookings_business_idx
  on public.bookings (business_id, starts_at);

-- ------------------------------------------------------- row level security

alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.faqs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.bookings enable row level security;

-- One business per owner in v1.
create policy "owners manage their business"
  on public.businesses for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Child tables: access is granted only through an owned business.
create policy "owners manage their services"
  on public.services for all
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = services.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = services.business_id and b.owner_id = auth.uid()
  ));

create policy "owners manage their faqs"
  on public.faqs for all
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = faqs.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = faqs.business_id and b.owner_id = auth.uid()
  ));

create policy "owners manage their conversations"
  on public.conversations for all
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = conversations.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = conversations.business_id and b.owner_id = auth.uid()
  ));

create policy "owners read their messages"
  on public.messages for all
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = messages.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = messages.business_id and b.owner_id = auth.uid()
  ));

create policy "owners manage their bookings"
  on public.bookings for all
  to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = bookings.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = bookings.business_id and b.owner_id = auth.uid()
  ));

-- The service role key used by the webhook and cron jobs bypasses RLS by
-- design, so no extra policy is needed for server-side automation.
