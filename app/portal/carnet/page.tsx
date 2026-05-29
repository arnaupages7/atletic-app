import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrintButton } from './_components/print-button'

export const metadata: Metadata = { title: 'El meu carnet' }

function temporadaActual() {
  const ara = new Date()
  const any = ara.getFullYear()
  const mes = ara.getMonth() + 1
  return mes >= 7 ? `${any}-${any + 1}` : `${any - 1}-${any}`
}

// Estils comuns per forçar impressió de fons
const printColorStyle: React.CSSProperties = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
  colorAdjust: 'exact' as never,
}

interface CarnetProps {
  nom: string
  cognom1: string
  cognom2?: string | null
  numeroMembre: number
  temporada: string
  subtitol?: string
  tipus: 'soci' | 'jugador'
  qrDataUrl?: string
}

function Carnet({ nom, cognom1, cognom2, numeroMembre, temporada, subtitol, tipus, qrDataUrl }: CarnetProps) {
  const nomComplet = `${nom} ${cognom1}${cognom2 ? ` ${cognom2}` : ''}`
  const etiquetaTipus = tipus === 'soci' ? 'SOCI' : 'JUGADOR FUTBOL BASE'

  return (
    <div
      className="carnet"
      style={{
        ...printColorStyle,
        width: '340px',
        height: '213px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #ff6600 0%, #cc4400 100%)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    >
      {/* Decoració de fons */}
      <div style={{
        ...printColorStyle,
        position: 'absolute', right: '-30px', bottom: '-30px',
        width: '190px', height: '190px', borderRadius: '50%',
        background: 'rgba(0,0,0,0.15)',
      }} />
      <div style={{
        ...printColorStyle,
        position: 'absolute', right: '30px', bottom: '20px',
        width: '130px', height: '130px', borderRadius: '50%',
        background: 'rgba(0,0,0,0.1)',
      }} />
      <div style={{
        ...printColorStyle,
        position: 'absolute', top: '-50px', left: '120px',
        width: '160px', height: '160px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
      }} />

      {/* Contingut */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: '16px 18px',
        height: '100%', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Capçalera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" width={26} height={26} style={{ display: 'block' }} />
            <span style={{
              color: 'rgba(255,255,255,0.9)', fontSize: '9px',
              fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase',
            }}>
              Atlètic Club Banyoles
            </span>
          </div>
          <span style={{
            ...printColorStyle,
            background: 'rgba(0,0,0,0.25)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '8px', fontWeight: 700,
            letterSpacing: '0.8px', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: '20px',
          }}>
            {etiquetaTipus}
          </span>
        </div>

        {/* Nom */}
        <div>
          <p style={{
            color: 'white', fontSize: '20px', fontWeight: 800,
            lineHeight: 1.1, margin: 0, letterSpacing: '-0.3px',
          }}>
            {nomComplet}
          </p>
          {subtitol && (
            <p style={{
              color: 'rgba(255,255,255,0.75)', fontSize: '11px',
              fontWeight: 500, margin: '3px 0 0 0',
            }}>
              {subtitol}
            </p>
          )}
        </div>

        {/* Peu */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Número */}
          <div>
            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '8px',
              textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px 0',
            }}>
              Número de {tipus === 'soci' ? 'soci' : 'membre'}
            </p>
            <p style={{
              color: 'white', fontSize: '22px', fontWeight: 900,
              fontFamily: 'monospace', margin: 0, letterSpacing: '1px',
            }}>
              #{String(numeroMembre).padStart(4, '0')}
            </p>
          </div>

          {/* QR (només soci) o Temporada */}
          {qrDataUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <p style={{
                color: 'rgba(255,255,255,0.6)', fontSize: '8px',
                textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0,
              }}>
                {temporada}
              </p>
              <div style={{
                ...printColorStyle,
                background: 'white',
                borderRadius: '6px',
                padding: '4px',
                display: 'flex',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR" width={52} height={52} style={{ display: 'block' }} />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <p style={{
                color: 'rgba(255,255,255,0.6)', fontSize: '8px',
                textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px 0',
              }}>
                Temporada
              </p>
              <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: 0 }}>
                {temporada}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function CarnetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()

  // Dades del soci
  const { data: soci } = await supabase
    .from('socis')
    .select('id, estat')
    .eq('user_id', user.id)
    .single()
  if (!soci) redirect('/login')

  // Membre del soci
  const { data: membre } = await serviceSupabase
    .from('membres')
    .select('nom, cognom1, cognom2, numero_membre')
    .eq('id', soci.id)
    .single()
  if (!membre) redirect('/login')

  // Jugadors actius del soci
  const { data: jugadors } = await serviceSupabase
    .from('jugadors')
    .select(`
      id, temporada, estat,
      membres!inner(nom, cognom1, cognom2, numero_membre),
      equips(nom)
    `)
    .eq('soci_responsable_id', soci.id)
    .eq('estat', 'actiu')

  const temporada = temporadaActual()

  // Opcions QR comunes
  const qrOpcions = { width: 60, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } }

  // QR carnet soci
  const qrDataUrl = await QRCode.toDataURL(
    `ATLETIC-SOCI-${String(membre.numero_membre).padStart(4, '0')}`,
    qrOpcions
  )

  // QRs carnets jugadors (en paral·lel)
  const jugadorsAmbQr = await Promise.all(
    (jugadors ?? []).map(async (jugador) => {
      const jm = jugador.membres as unknown as {
        nom: string; cognom1: string; cognom2: string | null; numero_membre: number
      }
      const qr = await QRCode.toDataURL(
        `ATLETIC-JUGADOR-${String(jm.numero_membre).padStart(4, '0')}`,
        qrOpcions
      )
      return { ...jugador, qrDataUrl: qr }
    })
  )

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white !important; }
          nav, aside, header { display: none !important; }
          .pt-14 { padding-top: 0 !important; }
          .lg\\:ml-64 { margin-left: 0 !important; }
          .carnet-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 24px !important;
            padding: 0 !important;
          }
          .carnet {
            box-shadow: none !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .carnet * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print space-y-4 mb-6 max-w-2xl">
        <Link
          href="/portal"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
        >
          <ChevronLeft className="size-4" />
          Tornar a l&apos;inici
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">El meu carnet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Carnet de soci{jugadors && jugadors.length > 0 ? ` i ${jugadors.length} jugador${jugadors.length !== 1 ? 's' : ''}` : ''}.
            </p>
          </div>
          <PrintButton />
        </div>
        <p className="text-xs text-muted-foreground">
          Useu <kbd className="px-1.5 py-0.5 rounded border text-xs font-mono">Ctrl+P</kbd> o el botó
          per imprimir o desar com a PDF. Activeu &quot;Gràfics de fons&quot; a les opcions d&apos;impressió
          per mantenir els colors.
        </p>
      </div>

      {/* Carnets */}
      <div className="carnet-grid flex flex-wrap gap-6">
        {/* Carnet soci */}
        <div className="flex flex-col gap-2">
          <p className="no-print text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Soci
          </p>
          <Carnet
            nom={membre.nom}
            cognom1={membre.cognom1}
            cognom2={membre.cognom2}
            numeroMembre={membre.numero_membre}
            temporada={temporada}
            tipus="soci"
            qrDataUrl={qrDataUrl}
          />
        </div>

        {/* Carnets jugadors */}
        {jugadorsAmbQr.map((jugador) => {
          const jm = jugador.membres as unknown as {
            nom: string; cognom1: string; cognom2: string | null; numero_membre: number
          }
          const equip = jugador.equips as unknown as { nom: string } | null

          return (
            <div key={jugador.id} className="flex flex-col gap-2">
              <p className="no-print text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Jugador/a
              </p>
              <Carnet
                nom={jm.nom}
                cognom1={jm.cognom1}
                cognom2={jm.cognom2}
                numeroMembre={jm.numero_membre}
                temporada={jugador.temporada}
                subtitol={equip?.nom}
                tipus="jugador"
                qrDataUrl={jugador.qrDataUrl}
              />
            </div>
          )
        })}

        {jugadorsAmbQr.length === 0 && soci.estat === 'actiu' && (
          <div className="no-print text-sm text-muted-foreground italic self-center">
            No tens jugadors actius. Els carnets apareixeran aquí un cop completin el pagament.
          </div>
        )}
      </div>
    </>
  )
}
