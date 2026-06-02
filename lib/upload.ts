'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const BUCKET = 'uploads'

export async function uploadFitxerAction(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  // Verificar autenticació
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Cap fitxer rebut.' }

  // Validar tipus
  if (!file.type.startsWith('image/')) return { error: 'Només es permeten imatges.' }

  // Nom únic
  const ext = file.name.split('.').pop() ?? 'jpg'
  const carpeta = (formData.get('carpeta') as string | null) ?? 'general'
  const nom = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const serviceSupabase = await createServiceClient()

  // Intentar crear el bucket si no existeix (idempotent)
  await serviceSupabase.storage.createBucket(BUCKET, { public: true }).catch(() => {
    // El bucket ja existeix, ignorar error
  })

  const { error: uploadError } = await serviceSupabase.storage
    .from(BUCKET)
    .upload(nom, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[upload] Error:', uploadError)
    return { error: `Error pujant el fitxer: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = serviceSupabase.storage.from(BUCKET).getPublicUrl(nom)

  return { url: publicUrl }
}
