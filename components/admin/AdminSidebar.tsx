'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Car, Settings, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

interface Props {
  store: { id: string; name: string; slug: string }
  slug: string
}

const navItems = (slug: string) => [
  { href: `/${slug}/admin`,              label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: `/${slug}/admin/estoque`,      label: 'Estoque',       icon: Car },
  { href: `/${slug}/admin/configuracoes`,label: 'Configurações', icon: Settings },
]

export default function AdminSidebar({ store, slug }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try { await supabase.auth.signOut() } catch (e) {}
    }
    toast.success('Você saiu do painel!')
    router.push(`/${slug}/admin/login`)
    router.refresh()
  }

  const items = navItems(slug)

  return (
    <>
      {/* 1. Header Mobile com Menu Hamburger */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200/80 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2 font-bold text-sm text-zinc-900">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
            <Car className="h-4 w-4" />
          </div>
          <span className="truncate max-w-[160px]">{store.name}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href={`/${slug}`} target="_blank">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-zinc-500 gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              Vitrine
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Drawer Mobile Aberto */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs pt-14" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white p-4 space-y-2 border-b border-zinc-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-1">Navegação</p>
            {items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all',
                    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <div className="pt-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" /> Sair do Painel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Barra de Navegação Inferior Fixa no Mobile (Bottom Nav) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 py-1.5 px-6 z-40 flex justify-around items-center">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-3 rounded-lg transition-all',
                isActive ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-zinc-900' : 'text-zinc-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* 3. Sidebar Desktop Clássica */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-zinc-200/80 flex-col">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-900">
            <Car className="h-5 w-5" />
            AutoCatálogo
          </div>
          <p className="text-xs text-zinc-500 mt-1 truncate">{store.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {items.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs rounded-xl">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver vitrine
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs text-zinc-500 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}