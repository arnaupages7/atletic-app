'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from './actions'
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

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined)

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Comprova el correu</CardTitle>
          <CardDescription className="text-center">
            Si l&apos;adreça és correcta, rebràs un enllaç per restablir la
            contrasenya en pocs minuts.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Tornar a l&apos;accés
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-center">Restablir contrasenya</CardTitle>
        <CardDescription className="text-center">
          Introdueix el teu correu i t&apos;enviarem un enllaç
        </CardDescription>
      </CardHeader>

      <form action={action}>
        <CardContent className="space-y-4">
          {state?.error && (
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
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending} size="lg">
            {pending ? 'Enviant…' : 'Enviar enllaç'}
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Tornar a l&apos;accés
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
