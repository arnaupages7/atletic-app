-- ============================================================
-- MIGRACIÓ 2: Taules principals
-- ============================================================

-- ── membres ──────────────────────────────────────────────────
-- Taula base compartida per socis i jugadors.
-- numero_membre és únic entre TOTS els tipus.
create table public.membres (
  id               uuid          primary key default gen_random_uuid(),
  numero_membre    integer       unique not null default nextval('public.membre_number_seq'),
  tipus            public.tipus_membre not null,
  nom              text          not null,
  cognom1          text          not null,
  cognom2          text,
  email            text,
  telefon          text,
  data_naixement   date,
  created_at       timestamptz   not null default now()
);

comment on table public.membres is
  'Taula base per a tots els membres del club. '
  'numero_membre és únic i compartit entre socis i jugadors.';

-- ── equips ───────────────────────────────────────────────────
create table public.equips (
  id                  uuid    primary key default gen_random_uuid(),
  nom                 text    not null,
  slug                text    not null unique,  -- slug oficial del WP (ex: Ben2018_S9)
  categoria           text,                     -- F7 | F11
  temporada           text    not null,         -- ex: '2025-26'
  places_disponibles  integer,
  actiu               boolean not null default true,
  created_at          timestamptz not null default now()
);

-- ── socis ─────────────────────────────────────────────────────
create table public.socis (
  id                          uuid        primary key references public.membres(id) on delete cascade,
  user_id                     uuid        references auth.users(id) on delete set null,
  dni                         text,
  adreca                      text,
  codi_postal                 text,
  poblacio                    text,
  provincia                   text,
  pais                        text        default 'ES',
  genere                      text,
  talla_samarreta             public.talla_samarreta,
  stripe_customer_id          text        unique,
  consentiment_privacitat     boolean     not null default false,
  consentiment_comunicacions  boolean     not null default false,
  data_alta                   date,
  estat                       public.estat_soci not null default 'pendent_pagament'
);

comment on column public.socis.user_id is
  'Referència a auth.users. NULL si el soci va ser migrat del WP sense compte digital.';

-- ── jugadors ──────────────────────────────────────────────────
create table public.jugadors (
  id                          uuid        primary key references public.membres(id) on delete cascade,
  soci_responsable_id         uuid        not null references public.socis(id) on delete restrict,
  equip_id                    uuid        references public.equips(id) on delete set null,
  temporada                   text        not null,
  foto_fitxa_url              text,       -- Supabase Storage (bucket privat)
  document_dni_url            text,       -- Supabase Storage (bucket privat)
  num_catsalut                text,       -- Número targeta sanitària individual
  talla_samarreta             public.talla_samarreta,
  consentiment_privacitat     boolean     not null default false,
  consentiment_comunicacions  boolean     not null default false,
  stripe_session_id           text,
  estat                       public.estat_jugador not null default 'pendent_aprovacio',
  motiu_denegacio             text,
  created_at                  timestamptz not null default now()
);

comment on column public.jugadors.soci_responsable_id is
  'El soci adult responsable (tutor legal) que ha inscrit el jugador.';
comment on column public.jugadors.num_catsalut is
  'Número de la Targeta CATSalut - requerit per a jugadors menors.';
comment on column public.jugadors.foto_fitxa_url is
  'URL signada al bucket privat de Supabase Storage. No és pública.';

-- ── gestors ───────────────────────────────────────────────────
create table public.gestors (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null unique references auth.users(id) on delete cascade,
  nom         text        not null,
  email       text        not null unique,
  rol         public.rol_gestor not null default 'gestor',
  actiu       boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ── pagaments ─────────────────────────────────────────────────
create table public.pagaments (
  id                        uuid        primary key default gen_random_uuid(),
  membre_id                 uuid        not null references public.membres(id) on delete restrict,
  stripe_session_id         text        unique,
  stripe_payment_intent_id  text        unique,
  concepte                  text        not null, -- 'quota_soci' | 'quota_jugador' | 'descompte_germa'
  import                    numeric(10,2) not null,
  estat                     public.estat_pagament not null default 'pendent',
  metadata                  jsonb,
  created_at                timestamptz not null default now()
);

-- ── noticies ──────────────────────────────────────────────────
create table public.noticies (
  id          uuid        primary key default gen_random_uuid(),
  titol       text        not null,
  cos         text        not null,
  slug        text        not null unique,
  publicat    boolean     not null default false,
  imatge_url  text,
  autor_id    uuid        references public.gestors(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger updated_at per noticies
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger noticies_updated_at
  before update on public.noticies
  for each row execute function public.set_updated_at();
