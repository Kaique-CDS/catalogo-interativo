'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Cake, Settings, LogOut, ExternalLink, Sparkles, Plus, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ConfeitariaAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/confeitaria/admin', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
    { href: '/confeitaria/admin/produtos', label: 'Cardápio', icon: Cake },
    { href: '/confeitaria/admin/configuracoes', label: 'Configurações', icon: Settings },
  ]

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#FFF9F6] text-zinc-800 overflow-hidden font-sans">
      {/* Header Mobile da Confeitaria */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-rose-100 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm shadow-xs">
            🎂
          </div>
          <span className="font-bold text-sm text-rose-950">Doce Encanto Admin</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Link href="/confeitaria" target="_blank">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-rose-700 gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              Cardápio
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-950"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5 text-rose-950" />}
          </Button>
        </div>
      </div>

      {/* Menu Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs pt-14" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white p-4 space-y-2 border-b border-rose-100 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider px-3 mb-1">Menu do Ateliê</p>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-zinc-600 hover:bg-rose-50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <div className="pt-2 border-t border-rose-50">
              <Link href="/confeitaria/admin/produtos/novo" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs mb-2">
                  <Plus className="h-4 w-4" /> Novo Bolo ou Doce
                </Button>
              </Link>
              <Link href="/confeitaria/admin/login">
                <Button variant="ghost" size="sm" className="w-full text-xs text-zinc-400 hover:text-rose-600">
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Sair
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Mobile Confeitaria */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-rose-100 py-1.5 px-6 z-40 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-3 rounded-lg transition-all ${
                isActive ? 'text-rose-600 font-bold' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-rose-600' : 'text-zinc-400'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Sidebar Desktop Confeitaria */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-rose-100 flex-col justify-between">
        <div>
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

        <div className="p-4 border-t border-rose-100 space-y-2">
          <Link href="/confeitaria" target="_blank">
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-rose-200 text-rose-900 hover:bg-rose-50 rounded-xl">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver Cardápio
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

      {/* Conteúdo com Padding Adaptativo */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <header className="hidden md:flex bg-white/70 backdrop-blur-xs border-b border-rose-100 px-8 py-3.5 items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-rose-500" />
            <span>Gestão do Catálogo de Encomendas & Vitrine Pronta Entrega</span>
          </div>
          <Link href="/confeitaria/admin/produtos/novo">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5 shadow-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> Cadastrar Novo Doce
            </Button>
          </Link>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}