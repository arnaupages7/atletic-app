import type { Metadata } from 'next'
import { RegistreForm } from './registre-form'

export const metadata: Metadata = {
  title: 'Alta de soci',
}

export default function RegistrePage() {
  return <RegistreForm />
}
