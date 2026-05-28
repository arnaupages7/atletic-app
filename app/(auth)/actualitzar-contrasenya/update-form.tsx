'use client'

import { useActionState } from 'react'
import { updatePasswordAction } from './actions'
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

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    undefined
  )

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-center">Nova contrasenya</CardTitle>
        <CardDescription className="text-center">
          Escull una contrasenya segura d&apos;almenys 8 caràcters
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
            <Label htmlFor="password">Nova contrasenya</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!state?.errors?.password}
              required
            />
            {state?.errors?.password && (
              <p className="text-xs text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirma la contrasenya</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!state?.errors?.confirm}
              required
            />
            {state?.errors?.confirm && (
              <p className="text-xs text-destructive">
                {state.errors.confirm[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending} size="lg">
            {pending ? 'Guardant…' : 'Actualitzar contrasenya'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
