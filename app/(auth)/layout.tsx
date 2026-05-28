import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s — Atlètic Club Banyoles',
    default: 'Accés — Atlètic Club Banyoles',
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
