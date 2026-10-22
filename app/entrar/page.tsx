'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  Building2,
  ShieldAlert,
  MessageCircle,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ThemeProvider } from '@/components/ThemeProvider'

interface StoreOption {
  tenant_id: string
  name: string
  logo_url?: string | null
}

export default function CentralLoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Múltiplas lojas
  const [storeChoices, setStoreChoices] = useState<StoreOption[] | null>(null)
  const [selectingTenant, setSelectingTenant] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanId = identifier.trim()
    const cleanPass = password.trim()

    if (!cleanId || !cleanPass) {
      setErrorMsg('Preencha seu usuário ou e-mail e sua senha.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login-central', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Usuário ou senha incorretos.')
      }

      // Se requer escolha entre múltiplas lojas
      if (data.requiresChoice && Array.isArray(data.stores) && data.stores.length > 1) {
        setStoreChoices(data.stores)
        toast.info('Selecione qual loja você deseja gerenciar.')
        return
      }

      // Redirecionamento direto para a loja única
      if (data.redirectTo) {
        toast.success(`Bem-vindo(a) ao painel da ${data.store?.name || 'sua loja'}!`)
        router.push(data.redirectTo)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectStore = async (tenant_id: string) => {
    setSelectingTenant(tenant_id)
    try {
      const res = await fetch('/api/auth/login-central', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao conectar à loja.')
      }

      router.push(data.redirectTo)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao acessar loja selecionada.')
      setSelectingTenant(null)
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col justify-between font-sans relative">
        {/* Topo / Barra de Navegação */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2.5 font-black text-xl tracking-tight">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>
              Venda<span className="text-indigo-600 dark:text-indigo-400">Zap</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-600 dark:text-zinc-400 rounded-xl">
                Voltar à Home
              </Button>
            </Link>
          </div>
        </header>

        {/* Conteúdo Central */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-6">
            {!storeChoices ? (
              /* FORMULÁRIO DE LOGIN */
              <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-xl dark:bg-zinc-900/90 backdrop-blur-md overflow-hidden">
                <CardHeader className="text-center pt-8 pb-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-3 shadow-xs">
                    <Lock className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-2xl font-black text-zinc-900 dark:text-white">
                    Entrar no Painel
                  </CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Digite seu usuário ou e-mail cadastrado. O sistema identificará seu painel automaticamente.
                  </p>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{errorMsg}</p>
                        {errorMsg.includes('suporte') && (
                          <a
                            href="https://wa.me/5511993270543?text=Olá! Preciso de ajuda para acessar o painel do lojista no VendaZap."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold underline mt-1 text-emerald-600 dark:text-emerald-400"
                          >
                            <MessageCircle className="h-3 w-3" /> Falar com o suporte no WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        E-mail ou Usuário
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Ex: admin ou seu@email.com"
                          autoCapitalize="none"
                          autoCorrect="off"
                          disabled={loading}
                          className="pl-10 h-11 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Senha
                        </label>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Sua senha de acesso"
                          disabled={loading}
                          className="pl-10 pr-10 h-11 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm gap-2 shadow-md shadow-indigo-600/20 mt-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Identificando sua loja...
                        </>
                      ) : (
                        <>
                          Entrar no Painel <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              /* SELEÇÃO ENTRE MÚLTIPLAS LOJAS */
              <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-xl dark:bg-zinc-900/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
                <CardHeader className="text-center pt-8 pb-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl font-black text-zinc-900 dark:text-white">
                    Qual loja deseja gerenciar?
                  </CardTitle>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Seu usuário tem permissão para gerenciar mais de uma loja na plataforma.
                  </p>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-0 space-y-3">
                  <div className="space-y-2.5">
                    {storeChoices.map((st) => (
                      <button
                        key={st.tenant_id}
                        type="button"
                        disabled={!!selectingTenant}
                        onClick={() => handleSelectStore(st.tenant_id)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          {st.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={st.logo_url}
                              alt={st.name}
                              className="h-10 w-10 object-contain rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-700"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 font-bold">
                              {st.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {st.name}
                            </p>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              /{st.tenant_id}
                            </p>
                          </div>
                        </div>

                        <div>
                          {selectingTenant === st.tenant_id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setStoreChoices(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                    >
                      Trocar de conta / Voltar
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rodapé Informativo */}
            <div className="text-center space-y-2">
              <p className="text-xs text-zinc-400">
                Ainda não tem seu catálogo ativo?{' '}
                <a
                  href="https://wa.me/5511993270543?text=Olá! Gostaria de criar um catálogo digital para minha loja."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Fale com a gente
                </a>
              </p>
            </div>
          </div>
        </main>

        <footer className="p-4 text-center text-[11px] text-zinc-400">
          © {new Date().getFullYear()} VendaZap. Todos os direitos reservados.
        </footer>
      </div>
    </ThemeProvider>
  )
}
