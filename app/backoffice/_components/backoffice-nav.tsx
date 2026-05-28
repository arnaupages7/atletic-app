'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  PlayCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { logoutAction } from '@/app/(auth)/login/actions'
import type { RolGestor } from '@/lib/supabase/types'

export type GestorInfo = {
  nom: string
  email: string
  rol: RolGestor
}

const navItems = [
  { href: '/backoffice', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/backoffice/jugadors', label: 'Jugadors', icon: UserCheck, exact: false },
  { href: '/backoffice/socis', label: 'Socis', icon: Users, exact: false },
  { href: '/backoffice/events', label: 'Events', icon: Calendar, exact: false },
  { href: '/backoffice/videos', label: 'Vídeos', icon: PlayCircle, exact: false },
]

const adminItems = [
  { href: '/backoffice/gestors', label: 'Gestors', icon: Settings, exact: false },
]

export function BackofficeNav({ gestor }: { gestor: GestorInfo }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const NavLink = ({
    href,
    label,
    icon: Icon,
    exact,
  }: (typeof navItems)[number]) => {
    const active = isActive(href, exact)
    return (
      <Link
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
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-sidebar-primary" />
          <span className="font-bold text-sm tracking-tight text-sidebar-foreground">
            Backoffice
          </span>
        </div>
        <button
          className="lg:hidden p-1 rounded-md hover:bg-sidebar-accent"
          onClick={() => setOpen(false)}
          aria-label="Tancar menú"
        >
          <X className="size-4 text-sidebar-foreground" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {gestor.rol === 'admin' && adminItems.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Admin
              </p>
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-sidebar-border p-4 space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-sidebar-foreground">{gestor.nom}</p>
          <p className="text-xs text-muted-foreground capitalize">{gestor.rol}</p>
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
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-20 flex items-center justify-between h-14 px-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" />
          <span className="font-bold text-sm">Backoffice</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Obrir menú"
          className="p-2 rounded-md hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-sidebar border-r border-sidebar-border',
          'transition-transform duration-200 ease-in-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
