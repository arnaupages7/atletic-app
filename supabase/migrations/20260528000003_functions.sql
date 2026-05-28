-- ============================================================
-- MIGRACIÓ 3: Funcions helper per a RLS i lògica de negoci
-- ============================================================

-- ── Helpers de rol ────────────────────────────────────────────

create or replace function public.is_gestor()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.gestors
    where user_id = auth.uid()
    and actiu = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.gestors
    where user_id = auth.uid()
    and rol = 'admin'
    and actiu = true
  );
$$;

-- Retorna l'id del soci associat a l'usuari autenticat
create or replace function public.get_my_soci_id()
returns uuid
language sql
security definer
stable
as $$
  select id from public.socis
  where user_id = auth.uid()
  limit 1;
$$;

-- ── Lògica de descàrrega germà/na ────────────────────────────
-- Comprova si el soci responsable ja té un altre jugador actiu
-- inscrit en qualsevol equip. Si és així, s'aplica el -25€.
create or replace function public.te_germa_actiu(p_soci_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.jugadors j
    join public.membres m on m.id = j.id
    where j.soci_responsable_id = p_soci_id
    and j.estat = 'actiu'
  );
$$;

comment on function public.te_germa_actiu is
  'Retorna true si el soci ja té almenys un jugador actiu inscrit. '
  'Usada per determinar si s''aplica el descompte de germà/na (-25€).';

-- ── Funció per obtenir el proper número de membre ─────────────
-- Retorna el valor actual de la sequence sense consumir-lo
create or replace function public.proper_numero_membre()
returns integer
language sql
security definer
stable
as $$
  select last_value from public.membre_number_seq;
$$;
