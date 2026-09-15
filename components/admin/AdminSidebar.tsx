'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Car, Settings, LogOut, ExternalLink, Menu, X, Sparkles } from 'lucide-react'
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
  { href: `/${slug}/admin`,              label: 'Início',        icon: LayoutDashboard, exact: true },
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
    window.location.reload()
  }

  const items = navItems(slug)

  return (
    <>
      {/* 1. Top Bar Mobile (Sticky) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 text-white fixed top-0 left-0 right-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            <Car className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs leading-tight truncate">{store.name}</p>
            <span className="text-[10px] text-zinc-400 font-medium">Painel Administrativo</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link href={`/${slug}`} target="_blank">
            <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1 rounded-xl">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Vitrine</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 2. Bottom Nav Mobile (Fixed Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 py-2 px-4 z-40 flex justify-around items-center shadow-2xl">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all',
                isActive
                  ? 'text-zinc-950 font-bold bg-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 font-medium'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-zinc-950 stroke-[2.5]' : 'text-zinc-400')} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 3. Sidebar Desktop Clássica */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-zinc-200/80 flex-col justify-between shadow-xs">
        <div>
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center gap-2.5 font-black text-lg text-zinc-900">
              <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
                <Car className="h-5 w-5 text-emerald-400" />
              </div>
              AutoCatálogo
            </div>
            <p className="text-xs text-zinc-500 mt-2 truncate font-medium">{store.name}</p>
          </div>

          <nav className="p-4 space-y-1.5">
            {items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all',
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
        </div>

        <div className="p-4 border-t border-zinc-100 space-y-2">
          <Link href={`/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs rounded-xl font-semibold text-zinc-700">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver vitrine da loja
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs text-zinc-500 hover:text-red-600 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair do Painel
          </Button>
        </div>
      </aside>
    </>
  )
}