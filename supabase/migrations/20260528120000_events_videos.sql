-- ============================================================
-- MIGRACIÓ 6: Taules events i videos
-- Events del club (exclusius o públics) + vídeos YouTube exclusius
-- ============================================================

-- ── Events ───────────────────────────────────────────────────
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  titol           text not null,
  descripcio      text,
  data_inici      timestamptz not null,
  data_fi         timestamptz,
  lloc            text,
  imatge_url      text,
  exclusiu_socis  boolean not null default false,
  publicat        boolean not null default false,
  autor_id        uuid references public.membres(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.events enable row level security;

-- Events publicats: públics per a tothom; exclusius només per autenticats
create policy "events_select" on public.events
  for select using (
    publicat = true
    and (exclusiu_socis = false or auth.uid() is not null)
  );

-- Gestors veuen tots els events (incl. no publicats)
create policy "events_select_gestor" on public.events
  for select using (public.is_gestor());

-- Escriptura: gestors poden inserir/actualitzar; admins esborrar
create policy "events_insert_gestor" on public.events
  for insert with check (public.is_gestor());

create policy "events_update_gestor" on public.events
  for update using (public.is_gestor());

create policy "events_delete_admin" on public.events
  for delete using (public.is_admin());


-- ── Videos ───────────────────────────────────────────────────
create table if not exists public.videos (
  id              uuid primary key default gen_random_uuid(),
  titol           text not null,
  descripcio      text,
  url_youtube     text not null,
  exclusiu_socis  boolean not null default true,
  publicat        boolean not null default false,
  autor_id        uuid references public.membres(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "videos_select" on public.videos
  for select using (
    publicat = true
    and (exclusiu_socis = false or auth.uid() is not null)
  );

create policy "videos_select_gestor" on public.videos
  for select using (public.is_gestor());

create policy "videos_insert_gestor" on public.videos
  for insert with check (public.is_gestor());

create policy "videos_update_gestor" on public.videos
  for update using (public.is_gestor());

create policy "videos_delete_admin" on public.videos
  for delete using (public.is_admin());


-- ── Seed: events de prova ────────────────────────────────────
insert into public.events (titol, descripcio, data_inici, data_fi, lloc, exclusiu_socis, publicat) values
  (
    'Sopar de temporada 2025-26',
    'Sopar anual del club per a tots els socis i famílies. Música en viu, sorteigs i molt bona companyia. Places limitades.',
    '2025-12-14 20:30:00+01',
    '2025-12-14 23:59:00+01',
    'Restaurant Can Jordi, Banyoles',
    true,
    true
  ),
  (
    'Presentació equips 2025-26',
    'Presentació oficial de tots els equips de la temporada davant dels socis, famílies i l''afició del club.',
    '2025-09-06 11:00:00+02',
    '2025-09-06 13:00:00+02',
    'Camp Municipal de Futbol, Banyoles',
    false,
    true
  ),
  (
    'Torneig de Nadal Benjamins',
    'Torneig intern de futbol 7 per a les categories benjamí A i B. Trofeus per als tres primers classificats.',
    '2025-12-27 10:00:00+01',
    '2025-12-27 18:00:00+01',
    'Camp Municipal de Futbol, Banyoles',
    false,
    true
  ),
  (
    'Assemblea de Socis 2026',
    'Assemblea general ordinària de socis. Es presentarà el balanç de la temporada i el pressupost per a 2026-27.',
    '2026-06-15 19:00:00+02',
    '2026-06-15 21:00:00+02',
    'Seu social del club, Banyoles',
    true,
    true
  );


-- ── Seed: vídeos de prova ────────────────────────────────────
insert into public.videos (titol, descripcio, url_youtube, exclusiu_socis, publicat) values
  (
    'Resum temporada 2024-25',
    'Els millors moments de la temporada 2024-25 resumits en 10 minuts. Gols, celebracions i records.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    true,
    true
  ),
  (
    'Entrenament tàctic — Juvenils A',
    'Sessió d''entrenament tàctic del primer equip juvenil. Exclusiu per als socis del club.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    true,
    true
  );
