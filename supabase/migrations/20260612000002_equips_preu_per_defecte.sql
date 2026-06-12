-- Columna per indicar que l'equip usa el preu per defecte de configuració
-- Quan és true, el preu s'actualitza automàticament quan canvia preu_defecte_jugador

ALTER TABLE public.equips
  ADD COLUMN IF NOT EXISTS preu_per_defecte boolean NOT NULL DEFAULT true;

-- Equips que ja tenien preu_inscripcio = null → ja usaven el defecte implícitament
-- Equips que ja tenien preu_inscripcio != null → els deixem amb preu_per_defecte = false
UPDATE public.equips
  SET preu_per_defecte = false
  WHERE preu_inscripcio IS NOT NULL;
