import type { Metadata } from 'next'
import { UpdatePasswordForm } from './update-form'

export const metadata: Metadata = {
  title: 'Nova contrasenya',
}

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />
}
