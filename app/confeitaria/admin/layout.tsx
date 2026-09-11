'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Cake, Settings, LogOut, ExternalLink, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConfeitariaAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/confeitaria/admin', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
    { href: '/confeitaria/admin/produtos', label: 'Cardápio & Bolos', icon: Cake },
    { href: '/confeitaria/admin/configuracoes', label: 'Ateliê & WhatsApp', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-[#FFF9F6] text-zinc-800 overflow-hidden font-sans">
      {/* Sidebar Confeitaria */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-rose-100 flex flex-col justify-between">
        <div>
          {/* Logo / Nome */}
          <div className="p-6 border-b border-rose-100">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-lg shadow-sm">
                🎂
              </div>
              <div>
                <h2 className="font-bold text-sm text-rose-950 leading-tight">Doce Encanto</h2>
                <span className="text-[11px] text-rose-600 font-medium">Painel Confeitaria</span>
              </div>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                      : 'text-zinc-600 hover:bg-rose-50 hover:text-rose-950'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-rose-100 space-y-2">
          <Link href="/confeitaria" target="_blank">
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-rose-200 text-rose-900 hover:bg-rose-50">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver Cardápio Público
            </Button>
          </Link>
          <Link href="/confeitaria/admin/login">
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-zinc-400 hover:text-rose-600">
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </Button>
          </Link>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/70 backdrop-blur-xs border-b border-rose-100 px-8 py-3.5 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-rose-500" />
            <span>Gestão do Catálogo de Encomendas & Vitrine Pronta Entrega</span>
          </div>
          <Link href="/confeitaria/admin/produtos/novo">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs gap-1.5 shadow-xs">
              <Plus className="h-3.5 w-3.5" /> Cadastrar Novo Doce
            </Button>
          </Link>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}