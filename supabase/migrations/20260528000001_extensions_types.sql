-- ============================================================
-- MIGRACIÓ 1: Extensions + Enums + Sequence compartida
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
create type public.tipus_membre as enum ('soci', 'jugador');

create type public.estat_soci as enum (
  'pendent_pagament',
  'actiu',
  'baixa'
);

create type public.estat_jugador as enum (
  'pendent_aprovacio',
  'aprovada',
  'denegada',
  'pendent_pagament',
  'actiu',
  'baixa'
);

create type public.estat_pagament as enum (
  'pendent',
  'completat',
  'fallat',
  'reemborsat'
);

create type public.rol_gestor as enum ('admin', 'gestor');

create type public.talla_samarreta as enum (
  'Miss', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'
);

-- ── Sequence compartida membres ───────────────────────────────
-- CRÍTICA: socis i jugadors comparteixen la mateixa numeració.
-- Mai hi haurà un soci #5 i un jugador #5 alhora.
create sequence public.membre_number_seq
  start with 1
  increment by 1
  no minvalue
  no maxvalue
  cache 1;
