// Tipus generats automàticament per Supabase CLI
// Per actualitzar: npx supabase gen types typescript --project-id bzpeazbxvbsmuzfmkyny > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TipusMembre = 'soci' | 'jugador'
export type EstatSoci = 'pendent_pagament' | 'actiu' | 'baixa'
export type EstatJugador =
  | 'pendent_aprovacio'
  | 'aprovada'
  | 'denegada'
  | 'pendent_pagament'
  | 'actiu'
  | 'baixa'
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

export type EquipSlug = (typeof EQUIPS_SLUGS)[number]

export interface Database {
  public: {
    Tables: {
      migracio_socis: {
        Row: {
          dni: string
          numero_membre: number
          nom: string | null
          cognom1: string | null
          creat_at: string
          assignat: boolean
          assignat_at: string | null
        }
        Insert: {
          dni: string
          numero_membre: number
          nom?: string | null
          cognom1?: string | null
          creat_at?: string
          assignat?: boolean
          assignat_at?: string | null
        }
        Update: {
          dni?: string
          numero_membre?: number
          nom?: string | null
          cognom1?: string | null
          assignat?: boolean
          assignat_at?: string | null
        }
        Relationships: []
      }
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
        Insert: {
          id?: string
          numero_membre?: number
          tipus: TipusMembre
          nom: string
          cognom1: string
          cognom2?: string | null
          email?: string | null
          telefon?: string | null
          data_naixement?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          numero_membre?: number
          tipus?: TipusMembre
          nom?: string
          cognom1?: string
          cognom2?: string | null
          email?: string | null
          telefon?: string | null
          data_naixement?: string | null
          created_at?: string
        }
        Relationships: []
      }
      socis: {
        Row: {
          id: string
          user_id: string | null
          dni: string | null
          adreca: string | null
          codi_postal: string | null
          poblacio: string | null
          provincia: string | null
          pais: string | null
          genere: string | null
          talla_samarreta: TallaSamarreta | null
          stripe_customer_id: string | null
          consentiment_privacitat: boolean
          consentiment_comunicacions: boolean
          data_alta: string | null
          estat: EstatSoci
          es_menor: boolean
          tutor_nom: string | null
          tutor_dni: string | null
          tutor_relacio: string | null
        }
        Insert: {
          id: string
          user_id?: string | null
          dni?: string | null
          adreca?: string | null
          codi_postal?: string | null
          poblacio?: string | null
          provincia?: string | null
          pais?: string | null
          genere?: string | null
          talla_samarreta?: TallaSamarreta | null
          stripe_customer_id?: string | null
          consentiment_privacitat?: boolean
          consentiment_comunicacions?: boolean
          data_alta?: string | null
          estat?: EstatSoci
          es_menor?: boolean
          tutor_nom?: string | null
          tutor_dni?: string | null
          tutor_relacio?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          dni?: string | null
          adreca?: string | null
          codi_postal?: string | null
          poblacio?: string | null
          provincia?: string | null
          pais?: string | null
          genere?: string | null
          talla_samarreta?: TallaSamarreta | null
          stripe_customer_id?: string | null
          consentiment_privacitat?: boolean
          consentiment_comunicacions?: boolean
          data_alta?: string | null
          estat?: EstatSoci
          es_menor?: boolean
          tutor_nom?: string | null
          tutor_dni?: string | null
          tutor_relacio?: string | null
        }
        Relationships: []
      }
      jugadors: {
        Row: {
          id: string
          soci_responsable_id: string
          equip_id: string | null
          temporada: string
          foto_fitxa_url: string | null
          document_dni_url: string | null
          num_catsalut: string | null
          talla_samarreta: TallaSamarreta | null
          genere: string | null
          dni: string | null
          adreca: string | null
          consentiment_privacitat: boolean
          consentiment_comunicacions: boolean
          stripe_session_id: string | null
          estat: EstatJugador
          motiu_denegacio: string | null
          created_at: string
        }
        Insert: {
          id: string
          soci_responsable_id: string
          equip_id?: string | null
          temporada: string
          foto_fitxa_url?: string | null
          document_dni_url?: string | null
          num_catsalut?: string | null
          talla_samarreta?: TallaSamarreta | null
          genere?: string | null
          dni?: string | null
          adreca?: string | null
          consentiment_privacitat?: boolean
          consentiment_comunicacions?: boolean
          stripe_session_id?: string | null
          estat?: EstatJugador
          motiu_denegacio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          soci_responsable_id?: string
          equip_id?: string | null
          temporada?: string
          foto_fitxa_url?: string | null
          document_dni_url?: string | null
          num_catsalut?: string | null
          talla_samarreta?: TallaSamarreta | null
          genere?: string | null
          dni?: string | null
          adreca?: string | null
          consentiment_privacitat?: boolean
          consentiment_comunicacions?: boolean
          stripe_session_id?: string | null
          estat?: EstatJugador
          motiu_denegacio?: string | null
          created_at?: string
        }
        Relationships: []
      }
      equips: {
        Row: {
          id: string
          nom: string
          slug: string
          categoria: string | null
          temporada: string
          places_disponibles: number | null
          actiu: boolean
          preu_inscripcio: number | null
          soci_automatic: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          slug: string
          categoria?: string | null
          temporada: string
          places_disponibles?: number | null
          actiu?: boolean
          preu_inscripcio?: number | null
          soci_automatic?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
          slug?: string
          categoria?: string | null
          temporada?: string
          places_disponibles?: number | null
          actiu?: boolean
          preu_inscripcio?: number | null
          soci_automatic?: boolean
          created_at?: string
        }
        Relationships: []
      }
      gestors: {
        Row: {
          id: string
          user_id: string
          nom: string
          email: string
          rol: RolGestor
          actiu: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nom: string
          email: string
          rol?: RolGestor
          actiu?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nom?: string
          email?: string
          rol?: RolGestor
          actiu?: boolean
          created_at?: string
        }
        Relationships: []
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
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          membre_id: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          concepte: string
          import: number
          estat?: EstatPagament
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          membre_id?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          concepte?: string
          import?: number
          estat?: EstatPagament
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      noticies: {
        Row: {
          id: string
          titol: string
          cos: string
          slug: string
          publicat: boolean
          imatge_url: string | null
          autor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titol: string
          cos: string
          slug: string
          publicat?: boolean
          imatge_url?: string | null
          autor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titol?: string
          cos?: string
          slug?: string
          publicat?: boolean
          imatge_url?: string | null
          autor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          titol: string
          descripcio: string | null
          data_inici: string
          data_fi: string | null
          lloc: string | null
          imatge_url: string | null
          embed_url: string | null
          notificacio_enviada: boolean
          exclusiu_socis: boolean
          publicat: boolean
          autor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titol: string
          descripcio?: string | null
          data_inici: string
          data_fi?: string | null
          lloc?: string | null
          imatge_url?: string | null
          embed_url?: string | null
          notificacio_enviada?: boolean
          exclusiu_socis?: boolean
          publicat?: boolean
          autor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titol?: string
          descripcio?: string | null
          data_inici?: string
          data_fi?: string | null
          lloc?: string | null
          imatge_url?: string | null
          embed_url?: string | null
          notificacio_enviada?: boolean
          exclusiu_socis?: boolean
          publicat?: boolean
          autor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          titol: string
          descripcio: string | null
          url_youtube: string
          exclusiu_socis: boolean
          publicat: boolean
          autor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titol: string
          descripcio?: string | null
          url_youtube: string
          exclusiu_socis?: boolean
          publicat?: boolean
          autor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titol?: string
          descripcio?: string | null
          url_youtube?: string
          exclusiu_socis?: boolean
          publicat?: boolean
          autor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          id: string
          codi: string
          descripcio: string | null
          tipus: 'percentatge' | 'import_fix'
          valor: number
          usos_maxims: number | null
          usos_actuals: number
          actiu: boolean
          stripe_coupon_id: string | null
          data_expiracio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          codi: string
          descripcio?: string | null
          tipus: 'percentatge' | 'import_fix'
          valor: number
          usos_maxims?: number | null
          usos_actuals?: number
          actiu?: boolean
          stripe_coupon_id?: string | null
          data_expiracio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          codi?: string
          descripcio?: string | null
          tipus?: 'percentatge' | 'import_fix'
          valor?: number
          usos_maxims?: number | null
          usos_actuals?: number
          actiu?: boolean
          stripe_coupon_id?: string | null
          data_expiracio?: string | null
          created_at?: string
        }
        Relationships: []
      }
      configuracio: {
        Row: {
          clau: string
          valor: string | null
          actualitzat_el: string
        }
        Insert: {
          clau: string
          valor?: string | null
          actualitzat_el?: string
        }
        Update: {
          clau?: string
          valor?: string | null
          actualitzat_el?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          id: string
          nom: string
          assumpte: string
          cos_html: string
          updated_at: string
        }
        Insert: {
          id: string
          nom: string
          assumpte: string
          cos_html: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          assumpte?: string
          cos_html?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_gestor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_my_soci_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      te_germa_actiu: {
        Args: { p_soci_id: string }
        Returns: boolean
      }
      proper_numero_membre: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      tipus_membre: TipusMembre
      estat_soci: EstatSoci
      estat_jugador: EstatJugador
      estat_pagament: EstatPagament
      rol_gestor: RolGestor
      talla_samarreta: TallaSamarreta
    }
    CompositeTypes: Record<string, never>
  }
}
