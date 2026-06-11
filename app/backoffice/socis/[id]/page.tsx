import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { EditarSociForm } from './_components/editar-soci-form'
import { AccionsSoci } from './_components/accions-soci'
import type { EstatSoci } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Detall soci' }

const ESTAT_CLASSES: Record<EstatSoci, string> = {
  actiu: 'bg-green-100 text-green-700',
  pendent_pagament: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-red-100 text-red-700',
}
const ESTAT_LABELS: Record<EstatSoci, string> = {
  actiu: 'Actiu',
  pendent_pagament: 'Pendent de pagament',
  baixa: 'Baixa',
}

const GENERE_LABELS: Record<string, string> = {
  home: 'Home', dona: 'Dona', no_binari: 'No binari', ns_nc: 'Prefereixo no dir-ho',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

export default async function SociDetallPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: soci } = await supabase
    .from('socis')
    .select(`
      id,
      estat,
      data_alta,
      dni,
      adreca,
      codi_postal,
      poblacio,
      genere,
      talla_samarreta,
      stripe_customer_id,
      consentiment_privacitat,
      consentiment_comunicacions,
      es_menor,
      tutor_nom,
      tutor_dni,
      tutor_relacio,
      membres!inner(
        id, nom, cognom1, cognom2, email, telefon,
        data_naixement, numero_membre
      )
    `)
    .eq('id', id)
    .single()

  if (!soci) notFound()

  const m = soci.membres as unknown as {
    id: string; nom: string; cognom1: string; cognom2: string | null
    email: string | null; telefon: string | null
    data_naixement: string | null; numero_membre: number
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Capçalera */}
      <div className="space-y-2">
        <Link
          href="/backoffice/socis"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Socis
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {m.nom} {m.cognom1}{m.cognom2 ? ` ${m.cognom2}` : ''}
            </h1>
            <p className="text-muted-foreground text-sm">
              Soci #{m.numero_membre}
              {soci.data_alta && (
                <> · Alta {new Intl.DateTimeFormat('ca-ES', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }).format(new Date(soci.data_alta))}</>
              )}
            </p>
          </div>
          <span className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium shrink-0',
            ESTAT_CLASSES[soci.estat]
          )}>
            {ESTAT_LABELS[soci.estat]}
          </span>
        </div>
      </div>

      {/* Dades resum (lectura) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="DNI / NIE" value={soci.dni} />
          <Row label="Correu" value={m.email} />
          <Row label="Telèfon" value={m.telefon} />
          <Row label="Data de naix." value={m.data_naixement
            ? new Intl.DateTimeFormat('ca-ES').format(new Date(m.data_naixement))
            : null} />
          <Row label="Adreça" value={soci.adreca} />
          <Row label="Població" value={[soci.codi_postal, soci.poblacio].filter(Boolean).join(' ')} />
          <Row label="Gènere" value={soci.genere ? GENERE_LABELS[soci.genere] : null} />
          <Row label="Talla samarreta" value={soci.talla_samarreta} />
          <Row label="Consent. privacitat" value={soci.consentiment_privacitat ? 'Sí' : 'No'} />
          <Row label="Consent. comunicacions" value={soci.consentiment_comunicacions ? 'Sí' : 'No'} />
          {soci.es_menor && (
            <>
              <Row label="Representant legal" value={soci.tutor_nom} />
              <Row label="DNI representant" value={soci.tutor_dni} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Editar dades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Editar dades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditarSociForm
            sociId={id}
            defaults={{
              nom: m.nom,
              cognom1: m.cognom1,
              cognom2: m.cognom2,
              email: m.email,
              telefon: m.telefon,
              data_naixement: m.data_naixement,
              adreca: soci.adreca,
              codi_postal: soci.codi_postal,
              poblacio: soci.poblacio,
              genere: soci.genere,
              talla_samarreta: soci.talla_samarreta,
            }}
          />
        </CardContent>
      </Card>

      {/* Accions perilloses */}
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-destructive/70 uppercase tracking-wide">
            Accions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccionsSoci sociId={id} estatActual={soci.estat} />
        </CardContent>
      </Card>
    </div>
  )
}
