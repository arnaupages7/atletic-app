import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/app/(auth)/login/actions'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Portal del soci',
}

export default async function PortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Portal del soci</h1>
        <p className="text-muted-foreground text-sm">{user.email}</p>
      </div>
      <p className="text-muted-foreground text-sm">
        En construcció — Fase 5
      </p>
      <form action={logoutAction}>
        <Button variant="outline" type="submit">
          Tancar sessió
        </Button>
      </form>
    </div>
  )
}
