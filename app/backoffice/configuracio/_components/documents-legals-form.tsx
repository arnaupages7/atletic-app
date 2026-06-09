'use client'

import { useActionState } from 'react'
import { desarDocumentsLegalsAction } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'

type Props = {
  urlPrivacitat: string
  urlAvisLegal: string
  urlReglament: string
}

export function DocumentsLegalsForm({ urlPrivacitat, urlAvisLegal, urlReglament }: Props) {
  const [state, action, pending] = useActionState(desarDocumentsLegalsAction, undefined)

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="url_privacitat">Política de privacitat</Label>
        <Input
          id="url_privacitat"
          name="url_privacitat"
          type="url"
          placeholder="https://exemple.com/privacitat"
          defaultValue={urlPrivacitat}
        />
        <p className="text-xs text-muted-foreground">
          Enllaç al document de política de privacitat del club. Accessible a{' '}
          <span className="font-mono">/privacitat</span>.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="url_avis_legal">Avís legal</Label>
        <Input
          id="url_avis_legal"
          name="url_avis_legal"
          type="url"
          placeholder="https://exemple.com/avis-legal"
          defaultValue={urlAvisLegal}
        />
        <p className="text-xs text-muted-foreground">
          Enllaç al document d&apos;avís legal. Accessible a{' '}
          <span className="font-mono">/avis-legal</span>.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="url_reglament">Reglament de règim intern</Label>
        <Input
          id="url_reglament"
          name="url_reglament"
          type="url"
          placeholder="https://exemple.com/reglament"
          defaultValue={urlReglament}
        />
        <p className="text-xs text-muted-foreground">
          Enllaç al reglament intern del club. Accessible a{' '}
          <span className="font-mono">/reglament</span>. Els jugadors l&apos;han d&apos;acceptar
          obligatòriament a la inscripció.
        </p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Desant…' : 'Desar documents'}
        </Button>
        {state?.success && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            Desat
          </span>
        )}
      </div>
    </form>
  )
}
