import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft } from 'lucide-react'
import { PrintButton } from './_components/print-button'

export const metadata: Metadata = { title: 'Fitxa jugador' }

export default async function FitxaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServiceClient()
  const serviceSupabase = await createServiceClient()

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
      consentiment_privacitat,
      consentiment_comunicacions,
      created_at,
      equip_id,
      soci_responsable_id,
      membres!inner(nom, cognom1, cognom2, telefon, data_naixement, numero_membre),
      equips(nom)
    `)
    .eq('id', id)
    .single()

  if (!jugador || jugador.estat !== 'actiu') notFound()

  const { data: sociMembre } = await serviceSupabase
    .from('membres')
    .select('nom, cognom1, email, telefon')
    .eq('id', jugador.soci_responsable_id)
    .single()

  let fotoUrl: string | null = null
  if (jugador.foto_fitxa_url) {
    const { data: signed } = await serviceSupabase.storage
      .from('documents')
      .createSignedUrl(jugador.foto_fitxa_url, 3600)
    fotoUrl = signed?.signedUrl ?? null
  }

  const jm = jugador.membres as unknown as {
    nom: string; cognom1: string; cognom2: string | null
    telefon: string | null; data_naixement: string | null; numero_membre: number
  }
  const equip = jugador.equips as unknown as { nom: string } | null

  const nomComplet = `${jm.nom} ${jm.cognom1}${jm.cognom2 ? ` ${jm.cognom2}` : ''}`
  const dataNaix = jm.data_naixement
    ? new Intl.DateTimeFormat('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(jm.data_naixement))
    : '—'

  return (
    <>
      {/* Controls — ocults a impressió */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print\\:ml-0 { margin-left: 0 !important; }
          .pt-14 { padding-top: 0 !important; }
          nav, aside, header { display: none !important; }
        }
      `}</style>

      <div className="no-print space-y-4 mb-6 max-w-3xl">
        <Link
          href={`/backoffice/jugadors/${id}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Tornar al detall
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Fitxa imprimible</h1>
          <PrintButton />
        </div>
        <p className="text-sm text-muted-foreground">
          Premeu el botó &quot;Imprimir&quot; o useu Ctrl+P per imprimir o desar com a PDF.
        </p>
      </div>

      {/* Fitxa */}
      <div className="max-w-[700px] mx-auto bg-white border rounded-xl shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        {/* Capçalera club */}
        <div className="bg-[#1a1a2e] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-white/60">Atlètic Club Banyoles</p>
            <h2 className="text-lg font-bold mt-0.5">Fitxa de Jugador</h2>
            <p className="text-sm text-white/70 mt-0.5">Temporada {jugador.temporada}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 uppercase tracking-wide">Núm. membre</p>
            <p className="text-3xl font-mono font-bold">{jm.numero_membre}</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-[140px_1fr] gap-6">
          {/* Foto */}
          <div className="flex flex-col gap-2">
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fotoUrl}
                alt={`Foto de ${jm.nom}`}
                className="w-[140px] h-[186px] object-cover rounded-lg border"
              />
            ) : (
              <div className="w-[140px] h-[186px] rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground text-center px-2">
                Sense foto
              </div>
            )}
            {/* QR placeholder */}
            <div className="w-[140px] h-[140px] border rounded flex items-center justify-center text-xs text-muted-foreground text-center">
              [QR]
            </div>
          </div>

          {/* Dades */}
          <div className="space-y-4">
            {/* Nom i equip */}
            <div className="border-b pb-3">
              <p className="text-xl font-bold leading-tight">{nomComplet}</p>
              {equip && (
                <p className="text-sm font-medium text-muted-foreground mt-0.5">{equip.nom}</p>
              )}
            </div>

            {/* Taula dades */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <FitxaRow label="Data de naix." value={dataNaix} />
              <FitxaRow label="Gènere" value={
                jugador.genere === 'M' ? 'Masculí' :
                jugador.genere === 'F' ? 'Femení' :
                jugador.genere === 'A' ? 'Altre' : '—'
              } />
              <FitxaRow label="DNI / NIE" value={jugador.dni ?? '—'} />
              <FitxaRow label="Num. CATSalut" value={jugador.num_catsalut ?? '—'} />
              <FitxaRow label="Telèfon" value={jm.telefon ?? '—'} />
              <FitxaRow label="Talla samarreta" value={jugador.talla_samarreta ?? '—'} />
            </div>

            {/* Adreça */}
            {jugador.adreca && (
              <div className="text-sm">
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Adreça</span>
                <p className="mt-0.5">{jugador.adreca}</p>
              </div>
            )}

            {/* Tutor */}
            {sociMembre && (
              <div className="border-t pt-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                  Tutor legal
                </p>
                <p className="font-medium">{sociMembre.nom} {sociMembre.cognom1}</p>
                {sociMembre.telefon && <p className="text-muted-foreground">{sociMembre.telefon}</p>}
                {sociMembre.email && <p className="text-muted-foreground">{sociMembre.email}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Peu */}
        <div className="border-t px-6 py-3 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Atlètic Club Banyoles — portal.atletic.cat</span>
          <span>
            Emès el {new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </span>
        </div>
      </div>
    </>
  )
}

function FitxaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground uppercase tracking-wide block">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
