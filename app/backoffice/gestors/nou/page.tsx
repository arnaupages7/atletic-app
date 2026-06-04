'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { crearGestorAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field]
  if (!msgs?.length) return null
  return <p className="text-xs text-destructive mt-1">{msgs[0]}</p>
}

export default function NouGestorPage() {
  const [state, action, pending] = useActionState(crearGestorAction, undefined)

  return (
    <div className="max-w-lg space-y-6">
      <Link
        href="/backoffice/gestors"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}
      >
        <ChevronLeft className="size-4" />
        Tornar
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nou gestor</CardTitle>
          <CardDescription>
            Crea un accés al backoffice per a un membre de l&apos;equip del club.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom">Nom complet <span className="text-destructive">*</span></Label>
              <Input id="nom" name="nom" placeholder="Joan García" autoComplete="off" />
              <FieldError errors={state?.errors} field="nom" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correu electrònic <span className="text-destructive">*</span></Label>
              <Input id="email" name="email" type="email" placeholder="joan@atletic.cat" autoComplete="off" />
              <FieldError errors={state?.errors} field="email" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contrasenya inicial <span className="text-destructive">*</span></Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">Mínim 8 caràcters. El gestor la podrà canviar.</p>
              <FieldError errors={state?.errors} field="password" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rol">Rol <span className="text-destructive">*</span></Label>
              <Select name="rol" defaultValue="gestor">
                <SelectTrigger id="rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor" label="Gestor">Gestor — accés estàndard al backoffice</SelectItem>
                  <SelectItem value="admin" label="Admin">Admin — accés total + gestió de gestors</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={state?.errors} field="rol" />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? 'Creant…' : 'Crear gestor'}
              </Button>
              <Link
                href="/backoffice/gestors"
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Cancel·lar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
