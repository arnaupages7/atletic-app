import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, Printer, ExternalLink } from 'lucide-react'
import { ResolucioForm } from './_components/resolucio-form'
import { CanviEquipForm } from './_components/canvi-equip-form'
import type { EstatJugador } from '@/lib/supabase/types'

export const metadata: Metadata = { title: 'Detall jugador' }

const ESTAT_CLASSES: Record<EstatJugador, string> = {
  pendent_aprovacio: 'bg-yellow-100 text-yellow-700',
  aprovada: 'bg-blue-100 text-blue-700',
  denegada: 'bg-red-100 text-red-700',
  pendent_pagament: 'bg-orange-100 text-orange-700',
  actiu: 'bg-green-100 text-green-700',
  baixa: 'bg-muted text-muted-foreground',
}
const ESTAT_LABELS: Record<EstatJugador, string> = {
  pendent_aprovacio: "Pendent d'aprovació",
  aprovada: 'Aprovada — pendent de pagament',
  denegada: 'Denegada',
  pendent_pagament: 'Pendent de pagament',
  actiu: 'Actiu',
  baixa: 'Baixa',
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  )
}

export default async function JugadorDetallPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()
  const serviceSupabase = await createServiceClient()

  // Jugador + membre + equip + soci responsable
  const { data: jugador } = await supabase
    .from('jugadors')
    .select(`
      id,
      estat,
      temporada,
      num_catsalut,
      talla_samarreta,
      genere,
      dni,
      adreca,
      foto_fitxa_url,
      document_dni_url,
      document_dni_darrere_url,
      motiu_denegacio,
      consentiment_privacitat,
      consentiment_comunicacions,
      compromis_desplacaments,
      created_at,
      equip_id,
      soci_responsable_id,
      membres!inner(nom, cognom1, cognom2, telefon, data_naixement, numero_membre),
      equips(nom, slug)
    `)
    .eq('id', id)
    .single()

  if (!jugador) notFound()

  // Membre del soci responsable
  const { data: sociMembre } = await serviceSupabase
    .from('membres')
    .select('nom, cognom1, email, telefon')
    .eq('id', jugador.soci_responsable_id)
    .single()

  // Llista d'equips actius (per canviar d'equip)
  const { data: equipsActius } = await serviceSupabase
    .from('equips')
    .select('id, nom')
    .eq('actiu', true)
    .order('nom')

  // URLs signades per a totes les imatges (vàlides 1h)
  const signUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null
    const { data } = await serviceSupabase.storage.from('documents').createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }

  const [fotoUrl, dniDavantUrl, dniDarrereUrl] = await Promise.all([
    signUrl(jugador.foto_fitxa_url),
    signUrl(jugador.document_dni_url),
    signUrl(jugador.document_dni_darrere_url),
  ])

  const jm = jugador.membres as unknown as {
    nom: string; cognom1: string; cognom2: string | null
    telefon: string | null; data_naixement: string | null; numero_membre: number
  }
  const equip = jugador.equips as unknown as { nom: string; slug: string } | null
  const esPendent = jugador.estat === 'pendent_aprovacio'

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Capçalera */}
      <div className="space-y-2">
        <Link
          href="/backoffice/jugadors"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Jugadors
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {jm.nom} {jm.cognom1}
              {jm.cognom2 ? ` ${jm.cognom2}` : ''}
            </h1>
            <p className="text-muted-foreground text-sm">
              Membre #{jm.numero_membre} · Sol·licitud{' '}
              {new Intl.DateTimeFormat('ca-ES', {
                day: 'numeric', month: 'long', year: 'numeric',
              }).format(new Date(jugador.created_at))}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium',
              ESTAT_CLASSES[jugador.estat]
            )}>
              {ESTAT_LABELS[jugador.estat]}
            </span>
            {jugador.estat === 'actiu' && (
              <Link
                href={`/backoffice/jugadors/${id}/fitxa`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
              >
                <Printer className="size-3.5" />
                Fitxa
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna esquerra: foto fitxa + DNI */}
        <div className="md:col-span-1 space-y-5">
          {/* Foto fitxa */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Foto fitxa</p>
            {fotoUrl ? (
              <div className="space-y-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoUrl}
                  alt={`Foto de ${jm.nom}`}
                  className="w-full aspect-[3/4] object-cover rounded-lg border"
                />
                <a
                  href={fotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                  Obrir a mida completa
                </a>
              </div>
            ) : (
              <div className="w-full aspect-[3/4] rounded-lg border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                Sense foto
              </div>
            )}
          </div>

          {/* DNI / NIE */}
          {(dniDavantUrl || dniDarrereUrl) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">DNI / NIE</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Cara davantera */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Davant</p>
                  {dniDavantUrl ? (
                    <a href={dniDavantUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dniDavantUrl}
                        alt="DNI cara davantera"
                        className="w-full aspect-[3/2] object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div className="w-full aspect-[3/2] rounded border bg-muted" />
                  )}
                </div>
                {/* Cara posterior */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">Darrere</p>
                  {dniDarrereUrl ? (
                    <a href={dniDarrereUrl} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dniDarrereUrl}
                        alt="DNI cara posterior"
                        className="w-full aspect-[3/2] object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div className="w-full aspect-[3/2] rounded border bg-muted" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Si no hi ha cap document */}
          {!dniDavantUrl && !dniDarrereUrl && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">DNI / NIE</p>
              <div className="rounded-lg border bg-muted p-3 text-center text-xs text-muted-foreground">
                No s&apos;han pujat fotos del DNI
              </div>
            </div>
          )}
        </div>

        {/* Dades */}
        <div className="md:col-span-2 space-y-6">
          {/* Dades del jugador */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Dades del jugador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Nom complet" value={`${jm.nom} ${jm.cognom1}${jm.cognom2 ? ` ${jm.cognom2}` : ''}`} />
              <Row label="Data de naix." value={jm.data_naixement
                ? new Intl.DateTimeFormat('ca-ES').format(new Date(jm.data_naixement))
                : null} />
              <Row label="Gènere" value={
                jugador.genere === 'M' ? 'Masculí' :
                jugador.genere === 'F' ? 'Femení' :
                jugador.genere === 'A' ? 'Altre' : null
              } />
              <Row label="DNI / NIE" value={jugador.dni} />
              <Row label="Num. CATSalut" value={jugador.num_catsalut} />
              <Row label="Adreça" value={jugador.adreca} />
              <Row label="Telèfon" value={jm.telefon} />
              <Row label="Talla samarreta" value={jugador.talla_samarreta} />
            </CardContent>
          </Card>

          {/* Inscripció */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Inscripció
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <Row label="Equip" value={equip?.nom} />
              <Row label="Temporada" value={jugador.temporada} />
              <Row label="Consentiment privacitat" value={jugador.consentiment_privacitat ? 'Sí' : 'No'} />
              <Row label="Consentiment comunicacions" value={jugador.consentiment_comunicacions ? 'Sí' : 'No'} />
              <Row
                label="Compromís desplaçaments"
                value={
                  jugador.compromis_desplacaments
                    ? 'Sí ✓'
                    : <span className="text-amber-600 font-medium">No marcat</span>
                }
              />
              {/* Canviar equip */}
              {jugador.estat !== 'baixa' && jugador.estat !== 'denegada' && (equipsActius?.length ?? 0) > 0 && (
                <div className="pt-4 mt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Canviar equip
                  </p>
                  <CanviEquipForm
                    jugadorId={id}
                    equipActualId={jugador.equip_id}
                    equips={equipsActius ?? []}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tutor legal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tutor legal (soci responsable)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="Nom" value={sociMembre ? `${sociMembre.nom} ${sociMembre.cognom1}` : null} />
              <Row label="Correu" value={sociMembre?.email} />
              <Row label="Telèfon" value={sociMembre?.telefon} />
            </CardContent>
          </Card>

          {/* Motiu denegació */}
          {jugador.estat === 'denegada' && jugador.motiu_denegacio && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-destructive uppercase tracking-wide">
                  Motiu de denegació
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{jugador.motiu_denegacio}</p>
              </CardContent>
            </Card>
          )}

          {/* Resolució */}
          <ResolucioForm jugadorId={id} esPendent={esPendent} />
        </div>
      </div>
    </div>
  )
}
