'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Car, Settings, LogOut, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  store: { id: string; name: string; slug: string }
  slug: string
}

const navItems = (slug: string) => [
  { href: `/${slug}/admin`,              label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: `/${slug}/admin/estoque`,      label: 'Estoque',       icon: Car },
  { href: `/${slug}/admin/configuracoes`,label: 'Configuracoes', icon: Settings },
]

export default function AdminSidebar({ store, slug }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Ate logo!')
    router.push(`/${slug}/admin/login`)
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Car className="h-5 w-5" />AutoCatalogo
        </div>
        <p className="text-xs text-zinc-500 mt-1 truncate">{store.name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems(slug).map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link href={`/${slug}`} target="_blank">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" />Ver vitrine
          </Button>
        </Link>
        <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-zinc-500 hover:text-red-600" onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5" />Sair
        </Button>
      </div>
    </aside>
  )
}