'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  User,
  Users,
  Calendar,
  CreditCard,
  IdCard,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { logoutAction } from '@/app/(auth)/login/actions'
import type { EstatSoci } from '@/lib/supabase/types'

export type SociInfo = {
  id: string
  estat: EstatSoci
  nom: string
  cognom1: string
  numero_membre: number
}

const navItems = [
  { href: '/portal', label: 'Inici', icon: Home, exact: true },
  { href: '/portal/perfil', label: 'Perfil', icon: User, exact: false },
  { href: '/portal/carnet', label: 'El meu carnet', icon: IdCard, exact: false },
  { href: '/portal/jugadors', label: 'Els meus jugadors', icon: Users, exact: false },
  { href: '/portal/events', label: 'Events i partits', icon: Calendar, exact: false },
  { href: '/portal/pagaments', label: 'Pagaments', icon: CreditCard, exact: false },
]

const ESTAT_LABELS: Record<EstatSoci, string> = {
  actiu: 'Actiu',
  pendent_pagament: 'Pendent',
  baixa: 'Baixa',
}

const ESTAT_CLASSES: Record<EstatSoci, string> = {
  actiu: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pendent_pagament: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  baixa: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function NavSidebar({ soci }: { soci: SociInfo }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <Link href="/portal" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Atlètic Club Banyoles"
            width={36}
            height={36}
            className="shrink-0"
          />
          <span className="font-bold text-sm tracking-tight text-sidebar-foreground leading-tight">
            Atlètic Club<br />
            <span className="font-normal text-xs text-muted-foreground">Banyoles</span>
          </span>
        </Link>
        <button
          className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
          onClick={() => setOpen(false)}
          aria-label="Tancar menú"
        >
          <X className="size-4 text-sidebar-foreground" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-sidebar-foreground leading-tight">
            {soci.nom} {soci.cognom1}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Soci #{soci.numero_membre}</p>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ESTAT_CLASSES[soci.estat])}>
              {ESTAT_LABELS[soci.estat]}
            </span>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'w-full justify-start gap-2 text-sidebar-foreground'
            )}
          >
            <LogOut className="size-3.5" />
            Tancar sessió
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile header ─────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-20 flex items-center justify-between h-14 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Atlètic Club Banyoles" width={28} height={28} />
          <span className="font-bold tracking-tight text-sm">Atlètic Club</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Obrir menú"
          className="p-2 rounded-md hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* ── Mobile backdrop ───────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ───────────────────────────────── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
