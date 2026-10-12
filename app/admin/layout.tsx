'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Bell, Search, Sparkles, Menu, X, Activity, Lightbulb } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      toast.success('Sessão encerrada com sucesso.')
      router.push('/admin/login')
      router.refresh()
    } catch {
      router.push('/admin/login')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!globalSearch.trim()) return
    router.push(`/admin/clientes?q=${encodeURIComponent(globalSearch.trim())}`)
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/clientes', label: 'Lojas / Clientes', icon: Users },
    { href: '/admin/financeiro', label: 'Financeiro', icon: CreditCard },
    { href: '/admin/auditoria', label: 'Auditoria de Logs', icon: Activity },
    { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
    { href: '/admin/melhorias', label: 'Melhorias', icon: Lightbulb },
  ]

  if (pathname === '/admin/login') {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        {children}
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row text-zinc-900 dark:text-zinc-50 font-sans overflow-hidden transition-colors duration-200">
        
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-10 shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-zinc-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Venda<span className="text-indigo-600 dark:text-indigo-400">Zap</span>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-bold ml-1">ADMIN</span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 mt-4">Menu Principal</p>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive 
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                  }`}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                S
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate text-zinc-900 dark:text-white">Super Admin</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">gabriel@vendazap.com</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 mt-2 gap-2"
            >
              <LogOut className="h-4 w-4" /> {loggingOut ? 'Saindo...' : 'Sair do Painel'}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
          {/* Header Mobile & Topbar Desktop */}
          <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="md:hidden text-zinc-700 dark:text-zinc-300" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search Topbar */}
              <form onSubmit={handleGlobalSearch} className="hidden sm:flex relative w-64 md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input 
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Buscar clientes, faturas ou configurações..." 
                  className="pl-9 h-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl w-full"
                />
              </form>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/admin/auditoria">
                <Button variant="ghost" size="icon" className="relative rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-zinc-950"></span>
                </Button>
              </Link>
            </div>
          </header>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              <aside className="relative w-72 bg-white dark:bg-zinc-950 flex flex-col shadow-2xl h-full animate-in slide-in-from-left-full duration-200">
                <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2 font-black text-xl text-zinc-900 dark:text-white">
                    <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Venda<span className="text-indigo-600 dark:text-indigo-400">Zap</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                  {navItems.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                        <span className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                          isActive 
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}>
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSidebarOpen(false)
                      handleLogout()
                    }}
                    disabled={loggingOut}
                    className="w-full justify-start text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-2"
                  >
                    <LogOut className="h-4 w-4" /> {loggingOut ? 'Saindo...' : 'Sair do Painel'}
                  </Button>
                </div>
              </aside>
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950/60 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
