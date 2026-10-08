'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Car, Settings, LogOut, ExternalLink, Menu, X, Sparkles, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Props {
  store: { id: string; name: string; slug: string; logo_url?: string | null }
  slug: string
}

const navItems = (slug: string) => [
  { href: `/${slug}/admin`,              label: 'Início',        icon: LayoutDashboard, exact: true },
  { href: `/${slug}/admin/estoque`,      label: 'Estoque',       icon: Car },
  { href: `/${slug}/admin/configuracoes`,label: 'Configurações', icon: Settings },
  { href: `/${slug}/admin/melhorias`,    label: 'Melhorias',     icon: Lightbulb },
]

export default function AdminSidebar({ store, slug }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    const { carAdminLogoutAction } = await import('@/app/[slug]/admin/login/actions')
    await carAdminLogoutAction()
    toast.success('Você saiu do painel!')
    window.location.reload()
  }

  const items = navItems(slug)

  return (
    <>
      {/* 1. Top Bar Mobile (Sticky) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-1 text-white fixed top-0 left-0 right-0 z-40 border-b border-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-8 w-8 object-contain flex-shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">
              <Car className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-xs leading-tight truncate">{store.name}</p>
            <span className="text-[10px] text-muted-foreground font-medium">Painel Administrativo</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link href={`/${slug}`} target="_blank">
            <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-muted-foreground hover:text-white hover:bg-surface-2 gap-1 rounded-xl">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Vitrine</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="h-8 px-2 text-xs text-red-500 hover:text-red-400 hover:bg-red-950/40 rounded-xl"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 2. Bottom Nav Mobile (Fixed Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-1/95 backdrop-blur-md border-t border-surface py-2 px-4 z-40 flex justify-around items-center shadow-2xl">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all',
                isActive
                  ? 'text-white font-bold'
                  : 'text-muted-foreground hover:text-white font-medium'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-brand' : 'text-muted-foreground')} />
              <span className="text-[11px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* 3. Sidebar Desktop Clássica */}
      <aside className="hidden md:flex w-20 flex-shrink-0 bg-surface-1 border-r border-surface flex-col justify-between">
        <div>
          <div className="py-5 border-b border-surface flex justify-center" title={`${store.name} - Painel Administrativo`}>
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-10 w-10 object-contain flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs">
                <Car className="h-5 w-5" />
              </div>
            )}
          </div>

          <nav className="p-3 space-y-1.5 flex flex-col items-center">
            {items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    'flex items-center justify-center h-11 w-11 rounded-xl transition-all relative',
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-surface space-y-2 flex flex-col items-center">
          <Link href={`/${slug}`} target="_blank" title="Ver vitrine da loja" aria-label="Ver vitrine da loja">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-[10px] border-brand text-white hover:bg-brand/10 hover:text-white transition-colors">
              <ExternalLink className="h-4 w-4 text-brand" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-surface-2 rounded-[10px]"
            onClick={handleLogout}
            title="Sair do Painel"
            aria-label="Sair do Painel"
          >
            <LogOut className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </aside>
    </>
  )
}