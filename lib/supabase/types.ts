// Tipus generats automàticament per Supabase CLI
// Per actualitzar: npx supabase gen types typescript --project-id PROJECTID > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TipusMembre = 'soci' | 'jugador'
export type EstatSoci = 'pendent_pagament' | 'actiu' | 'baixa'
export type EstatJugador = 'pendent_aprovacio' | 'aprovada' | 'denegada' | 'pendent_pagament' | 'actiu' | 'baixa'
export type EstatPagament = 'pendent' | 'completat' | 'fallat' | 'reemborsat'
export type RolGestor = 'admin' | 'gestor'
export type TallaSamarreta = 'Miss' | 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'

// Slugs oficials dels equips (extrets del WordPress)
export const EQUIPS_SLUGS = [
  'Escoleta',
  'PreBenFem',
  'PreBen2020_S7',
  'PreBen2019_S8',
  'Ben2018_S9',
  'Ben2017_S10_A',
  'Ben2017_S10_B',
  'Al2016_S11',
  'Al2015_S12',
  'Inf2014_S13',
  'Inf2013_S14',
  'Cad2012_S15',
  'Cad2011_S16',
  'JuvA',
  'JuvB',
  'PrimerEquip',
] as const

export type EquipSlug = typeof EQUIPS_SLUGS[number]

// Tipus de la BD (s'omplirà quan generi els tipus amb Supabase CLI)
export interface Database {
  public: {
    Tables: {
      membres: {
        Row: {
          id: string
          numero_membre: number
          tipus: TipusMembre
          nom: string
          cognom1: string
          cognom2: string | null
          email: string | null
          telefon: string | null
          data_naixement: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['membres']['Row'], 'id' | 'numero_membre' | 'created_at'>
        Update: Partial<Database['public']['Tables']['membres']['Insert']>
      }
      socis: {
        Row: {
          id: string
          user_id: string | null
          dni: string | null
          adreca: string | null
          codi_postal: string | null
          poblacio: string | null
          genere: string | null
          talla_samarreta: TallaSamarreta | null
          stripe_customer_id: string | null
          data_alta: string | null
          estat: EstatSoci
        }
        Insert: Omit<Database['public']['Tables']['socis']['Row'], never>
        Update: Partial<Database['public']['Tables']['socis']['Insert']>
      }
      jugadors: {
        Row: {
          id: string
          soci_responsable_id: string
          equip_id: string | null
          equip_slug: EquipSlug | null
          temporada: string
          foto_fitxa_url: string | null
          document_dni_url: string | null
          num_catsalut: string | null
          talla_samarreta: TallaSamarreta | null
          stripe_session_id: string | null
          estat: EstatJugador
          motiu_denegacio: string | null
        }
        Insert: Omit<Database['public']['Tables']['jugadors']['Row'], never>
        Update: Partial<Database['public']['Tables']['jugadors']['Insert']>
      }
      equips: {
        Row: {
          id: string
          nom: string
          slug: EquipSlug
          categoria: string | null
          temporada: string
          places_disponibles: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['equips']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['equips']['Insert']>
      }
      pagaments: {
        Row: {
          id: string
          membre_id: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          concepte: string
          import: number
          estat: EstatPagament
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pagaments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['pagaments']['Insert']>
      }
      noticies: {
        Row: {
          id: string
          titol: string
          cos: string
          slug: string
          publicat: boolean
          imatge_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['noticies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['noticies']['Insert']>
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
