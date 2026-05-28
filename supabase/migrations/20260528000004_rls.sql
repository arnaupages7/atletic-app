-- ============================================================
-- MIGRACIÓ 4: Row Level Security (RLS)
-- Totes les taules tenen RLS activat des del primer moment.
-- Service Role bypassa RLS (usat als webhooks de Stripe).
-- ============================================================

-- ── membres ──────────────────────────────────────────────────
alter table public.membres enable row level security;

-- Soci veu el seu propi membre; gestors veuen tots
create policy "membres_select" on public.membres
  for select using (
    public.is_gestor()
    or id = public.get_my_soci_id()
    or id in (
      select j.id from public.jugadors j
      where j.soci_responsable_id = public.get_my_soci_id()
    )
  );

-- Només service role pot inserir (via webhooks Stripe)
create policy "membres_insert_service" on public.membres
  for insert with check (false); -- bloquejat per a usuaris normals

-- Gestors poden actualitzar
create policy "membres_update" on public.membres
  for update using (public.is_gestor());

-- Només admins poden esborrar
create policy "membres_delete" on public.membres
  for delete using (public.is_admin());


-- ── socis ─────────────────────────────────────────────────────
alter table public.socis enable row level security;

create policy "socis_select" on public.socis
  for select using (
    public.is_gestor()
    or user_id = auth.uid()
  );

create policy "socis_insert_service" on public.socis
  for insert with check (false);

-- Soci pot actualitzar les seves pròpies dades de perfil
create policy "socis_update_own" on public.socis
  for update using (
    public.is_gestor()
    or user_id = auth.uid()
  );

create policy "socis_delete" on public.socis
  for delete using (public.is_admin());


-- ── equips ────────────────────────────────────────────────────
alter table public.equips enable row level security;

-- Equips actius visibles per a tothom (inclòs anònim — formulari públic)
create policy "equips_select_public" on public.equips
  for select using (actiu = true or public.is_gestor());

create policy "equips_insert" on public.equips
  for insert with check (public.is_admin());

create policy "equips_update" on public.equips
  for update using (public.is_gestor());

create policy "equips_delete" on public.equips
  for delete using (public.is_admin());


-- ── jugadors ──────────────────────────────────────────────────
alter table public.jugadors enable row level security;

-- Soci responsable veu els seus jugadors; gestors veuen tots
create policy "jugadors_select" on public.jugadors
  for select using (
    public.is_gestor()
    or soci_responsable_id = public.get_my_soci_id()
  );

create policy "jugadors_insert_service" on public.jugadors
  for insert with check (false);

-- Gestors actualitzen (aprovació/denegació); service role per pagament
create policy "jugadors_update" on public.jugadors
  for update using (public.is_gestor());

create policy "jugadors_delete" on public.jugadors
  for delete using (public.is_admin());


-- ── gestors ───────────────────────────────────────────────────
alter table public.gestors enable row level security;

create policy "gestors_select" on public.gestors
  for select using (public.is_gestor());

create policy "gestors_insert" on public.gestors
  for insert with check (public.is_admin());

create policy "gestors_update" on public.gestors
  for update using (public.is_admin());

create policy "gestors_delete" on public.gestors
  for delete using (public.is_admin());


-- ── pagaments ─────────────────────────────────────────────────
alter table public.pagaments enable row level security;

-- Soci veu els seus pagaments; gestors veuen tots
create policy "pagaments_select" on public.pagaments
  for select using (
    public.is_gestor()
    or membre_id = public.get_my_soci_id()
    or membre_id in (
      select j.id from public.jugadors j
      where j.soci_responsable_id = public.get_my_soci_id()
    )
  );

-- Només service role (webhooks Stripe) pot inserir/actualitzar
create policy "pagaments_insert_service" on public.pagaments
  for insert with check (false);

create policy "pagaments_update_service" on public.pagaments
  for update using (public.is_gestor());


-- ── noticies ──────────────────────────────────────────────────
alter table public.noticies enable row level security;

-- Notícies publicades visibles per a tothom; gestors veuen totes
create policy "noticies_select_public" on public.noticies
  for select using (publicat = true or public.is_gestor());

create policy "noticies_insert" on public.noticies
  for insert with check (public.is_gestor());

create policy "noticies_update" on public.noticies
  for update using (public.is_gestor());

create policy "noticies_delete" on public.noticies
  for delete using (public.is_admin());
