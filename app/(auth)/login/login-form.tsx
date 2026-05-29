'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { loginAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex flex-col items-center gap-2 mb-2">
          <Image
            src="/logo.png"
            alt="Atlètic Club Banyoles"
            width={72}
            height={72}
          />
          <p className="text-xs text-muted-foreground tracking-wider uppercase font-medium">
            Atlètic Club Banyoles
          </p>
        </div>
        <CardTitle className="text-xl text-center">Accés al portal</CardTitle>
        <CardDescription className="text-center">
          Introdueix les teves dades per entrar
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {/* Error general */}
          {state?.error && !state.field && (
            <div
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correu electrònic</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nom@exemple.cat"
              aria-invalid={state?.field === 'email'}
              required
            />
            {state?.field === 'email' && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contrasenya</Label>
              <Link
                href="/esquida-contrasenya"
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                Has oblidat la contrasenya?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={state?.field === 'password'}
              required
            />
            {state?.field === 'password' && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending} size="lg">
            {pending ? 'Entrant…' : 'Entrar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No tens compte?{' '}
            <Link
              href="/registre"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Fes-te soci
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
