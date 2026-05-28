import type { Metadata } from 'next'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Resultat del pagament',
}

interface Props {
  searchParams: Promise<{ status?: string; session_id?: string }>
}

export default async function CheckoutExitPage({ searchParams }: Props) {
  const { status } = await searchParams
  const isSuccess = status === 'success'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {isSuccess ? (
          <>
            <div className="text-5xl" aria-hidden>✓</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Benvingut al club!</h1>
              <p className="text-muted-foreground text-sm">
                El teu pagament s&apos;ha processat correctament. Ja ets soci
                de l&apos;Atlètic Club Banyoles.
              </p>
            </div>
            <Link
              href="/portal"
              className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
            >
              Accedir al portal del soci
            </Link>
          </>
        ) : (
          <>
            <div className="text-5xl" aria-hidden>×</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Pagament cancel·lat</h1>
              <p className="text-muted-foreground text-sm">
                No s&apos;ha completat el pagament. El teu compte ha quedat
                reservat — pots reprendre el procés quan vulguis.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
              >
                Accedir i pagar
              </Link>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                Tornar a l&apos;inici
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
