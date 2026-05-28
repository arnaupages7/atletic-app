'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { aprovarJugadorAction, denegarJugadorAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ResolucioForm({ jugadorId, esPendent }: { jugadorId: string; esPendent: boolean }) {
  const router = useRouter()
  const [aproving, startAprova] = useTransition()
  const [aprovatOk, setAprovatOk] = useState(false)
  const [aprovatError, setAprovatError] = useState<string | null>(null)

  const denegarAction = denegarJugadorAction.bind(null, jugadorId)
  const [denegarState, denegarFormAction, denegant] = useActionState(denegarAction, undefined)

  const [showDenegarForm, setShowDenegarForm] = useState(false)

  if (!esPendent) return null

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Resolució
      </h2>

      {/* Feedback aprovar */}
      {aprovatOk && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="size-4" />
          Sol·licitud aprovada. S&apos;ha enviat l&apos;email al soci.
        </div>
      )}
      {aprovatError && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {aprovatError}
        </div>
      )}

      {!aprovatOk && (
        <div className="flex flex-wrap gap-3">
          {/* Botó aprovar */}
          <Button
            variant="default"
            size="sm"
            disabled={aproving || showDenegarForm}
            onClick={() => {
              startAprova(async () => {
                const res = await aprovarJugadorAction(jugadorId)
                if (res.error) {
                  setAprovatError(res.error)
                } else {
                  setAprovatOk(true)
                  router.refresh()
                }
              })
            }}
            className="gap-1.5"
          >
            <CheckCircle2 className="size-4" />
            {aproving ? 'Aprovant…' : 'Aprovar inscripció'}
          </Button>

          {/* Botó denegar */}
          {!showDenegarForm && (
            <Button
              variant="destructive"
              size="sm"
              className={cn('gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20')}
              onClick={() => setShowDenegarForm(true)}
            >
              <XCircle className="size-4" />
              Denegar
            </Button>
          )}
        </div>
      )}

      {/* Formulari denegació */}
      {showDenegarForm && !aprovatOk && (
        <form action={denegarFormAction} className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="motiu" className="text-sm font-medium">
              Motiu de la denegació
            </Label>
            <Textarea
              id="motiu"
              name="motiu"
              placeholder="Explica el motiu de la denegació…"
              rows={3}
              aria-invalid={!!denegarState?.errors?.motiu}
              required
            />
            {denegarState?.errors?.motiu && (
              <p className="text-xs text-destructive">{denegarState.errors.motiu[0]}</p>
            )}
            {denegarState?.error && (
              <p className="text-xs text-destructive">{denegarState.error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={denegant}
            >
              {denegant ? 'Denegant…' : 'Confirmar denegació'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDenegarForm(false)}
            >
              Cancel·lar
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
