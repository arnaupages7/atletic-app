-- Afegim restricció de producte als cupons
alter table public.cupons
  add column aplicable_a text not null default 'tots'
    check (aplicable_a in ('soci', 'jugador', 'tots')),
  add column equip_id uuid references public.equips(id) on delete set null;

comment on column public.cupons.aplicable_a is
  'A quin producte s''aplica el cupó: soci, jugador o tots';
comment on column public.cupons.equip_id is
  'Restricció opcional a un equip concret (només rellevant quan aplicable_a = ''jugador'')';
