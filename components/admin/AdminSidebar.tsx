'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Car, Settings, LogOut, ExternalLink, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { getTenantBrand } from '@/lib/tenants'

interface Props {
  store: { id: string; name: string; slug: string; logo_url?: string | null }
  slug: string
}

const navItems = (slug: string) => [
  { href: `/${slug}/admin`,               label: 'Início',        icon: LayoutDashboard, exact: true },
  { href: `/${slug}/admin/estoque`,       label: 'Estoque',       icon: Car },
  { href: `/${slug}/admin/configuracoes`, label: 'Configurações', icon: Settings },
  { href: `/${slug}/admin/melhorias`,     label: 'Melhorias',     icon: Lightbulb },
]

export default function AdminSidebar({ store, slug }: Props) {
  const pathname = usePathname()
  const brand = getTenantBrand(slug || store?.slug)
  const storeName = store?.name || brand.name
  const storeLogo = store?.logo_url || brand.logo.header

  const handleLogout = async () => {
    document.cookie = `admin_auth_${slug}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    const { carAdminLogoutAction } = await import('@/app/[slug]/admin/login/actions')
    await carAdminLogoutAction(slug)
    toast.success('Você saiu do painel!')
    window.location.reload()
  }

  const items = navItems(slug)

  return (
    <>
      {/* 1. Top Bar Mobile (Sticky) */}
      <header className="md:hidden flex items-center justify-between px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] bg-surface-1/95 backdrop-blur-md text-foreground fixed top-0 left-0 right-0 z-40 border-b border-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          {storeLogo ? (
            <div className="brand-logo-container h-8 w-auto min-w-[32px] max-w-[90px] flex items-center justify-center flex-shrink-0">
              <img
                src={storeLogo}
                alt={storeName}
                className="h-full w-auto object-contain"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-brand flex items-center justify-center text-white font-bold flex-shrink-0">
              <Car className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-xs leading-tight truncate text-foreground">{storeName}</p>
            <span className="text-[10px] text-muted-foreground font-medium block truncate">Painel da Loja</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link href={`/${slug}`} target="_blank">
            <Button size="sm" variant="ghost" className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground bg-surface-2/60 hover:bg-surface-2 gap-1.5 rounded-xl border border-surface">
              <ExternalLink className="h-3.5 w-3.5 text-brand" />
              <span className="text-[11px] font-semibold text-foreground">Vitrine</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="h-9 w-9 p-0 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 2. Bottom Nav Mobile (Fixed Bottom — iOS & Android Native Tab Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-1/95 backdrop-blur-md border-t border-surface pt-1.5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-4 gap-1 shadow-2xl">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all active:scale-95',
                isActive
                  ? 'bg-brand/15 text-brand font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-2 font-medium'
              )}
            >
              <item.icon className="h-5 w-5 mb-0.5 text-brand" />
              <span className="text-[10px] leading-tight truncate max-w-full">
                {item.label === 'Configurações' ? 'Ajustes' : item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* 3. Sidebar Desktop com Logo + Nome da Loja */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-surface-1 border-r border-surface flex-col justify-between">
        <div>
          <div className="px-5 py-5 border-b border-surface flex items-center gap-3" title={`${storeName} - Painel Administrativo`}>
            {storeLogo ? (
              <div className="brand-logo-container h-10 w-auto min-w-[40px] max-w-[120px] flex items-center justify-center flex-shrink-0">
                <img
                  src={storeLogo}
                  alt={storeName}
                  className="h-full w-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs shrink-0">
                <Car className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-foreground truncate leading-tight">{storeName}</p>
              <span className="text-[11px] text-muted-foreground font-medium block truncate">Painel da Loja</span>
            </div>
          </div>

          <nav className="p-3 space-y-1.5 flex flex-col">
            {items.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-brand text-white shadow-xs active-nav-item'
                      : 'text-muted-foreground hover:bg-surface-3 hover:text-brand'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-brand')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-surface space-y-2 flex flex-col">
          <Link href={`/${slug}`} target="_blank" title="Ver vitrine da loja" aria-label="Ver vitrine da loja">
            <Button variant="outline" className="w-full justify-start gap-2.5 h-10 rounded-xl border-brand/40 bg-brand/5 text-brand hover:bg-brand/15 hover:text-brand-dark transition-colors text-xs font-semibold">
              <ExternalLink className="h-4 w-4 text-brand shrink-0" />
              <span className="truncate">Ver Vitrine</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-10 text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-xl text-xs font-semibold"
            onClick={handleLogout}
            title="Sair do Painel"
            aria-label="Sair do Painel"
          >
            <LogOut className="h-4 w-4 text-red-500 shrink-0" />
            <span>Sair do Painel</span>
          </Button>
        </div>
      </aside>
    </>
  )
}