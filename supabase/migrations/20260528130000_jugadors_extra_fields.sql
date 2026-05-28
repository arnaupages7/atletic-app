-- ============================================================
-- MIGRACIÓ 7: Camps addicionals a jugadors
-- genere, dni i adreca no estaven a l'esquema inicial
-- ============================================================

alter table public.jugadors
  add column if not exists genere text,
  add column if not exists dni    text,
  add column if not exists adreca text;

comment on column public.jugadors.genere is 'Gènere del jugador (M/F/A)';
comment on column public.jugadors.dni    is 'DNI o NIE del jugador';
comment on column public.jugadors.adreca is 'Adreça postal del jugador';
