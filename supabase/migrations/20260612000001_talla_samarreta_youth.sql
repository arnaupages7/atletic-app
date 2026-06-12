-- Afegir mides infantils a l'enum talla_samarreta
-- Les noves mides van BEFORE 'Miss' per mantenir l'ordre de menor a major

ALTER TYPE public.talla_samarreta ADD VALUE IF NOT EXISTS '5-6' BEFORE 'Miss';
ALTER TYPE public.talla_samarreta ADD VALUE IF NOT EXISTS '6-8' BEFORE 'Miss';
ALTER TYPE public.talla_samarreta ADD VALUE IF NOT EXISTS '8-10' BEFORE 'Miss';
ALTER TYPE public.talla_samarreta ADD VALUE IF NOT EXISTS '10-12' BEFORE 'Miss';
ALTER TYPE public.talla_samarreta ADD VALUE IF NOT EXISTS '12-14' BEFORE 'Miss';
