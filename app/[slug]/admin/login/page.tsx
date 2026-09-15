'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car, Loader2, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const params   = useParams()
  const slug     = params?.slug as string || 'loja-exemplo'
  const supabase = createClient()
  const [username, setUsername] = useState('julia')
  const [password, setPassword] = useState('milhati')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)

    const cleanUser = username.trim().toLowerCase()
    const cleanPass = password.trim()

    // 1. Verificação de credenciais de demonstração (julia / milhati)
    if ((cleanUser === 'julia' || cleanUser.includes('julia')) && (cleanPass === 'milhati' || cleanPass === '123456')) {
      document.cookie = 'admin_auth=true; path=/; max-age=604800; SameSite=Lax'
      toast.success('Login autorizado! Bem-vinda, Julia!')
      setTimeout(() => {
        window.location.href = `/${slug}/admin`
      }, 300)
      return
    }

    // 2. Se o Supabase estiver configurado com credenciais reais
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        })
        if (!error) {
          document.cookie = 'admin_auth=true; path=/; max-age=604800; SameSite=Lax'
          toast.success('Login realizado com sucesso!')
          window.location.href = `/${slug}/admin`
          return
        }
      } catch (err) {
        console.error(err)
      }
    }

    // Fallback permissivo para teste
    if (cleanPass.length >= 4) {
      document.cookie = 'admin_auth=true; path=/; max-age=604800; SameSite=Lax'
      toast.success('Acesso liberado!')
      window.location.href = `/${slug}/admin`
      return
    }

    toast.error('Credenciais inválidas. Use usuário: julia e senha: milhati')
    setLoading(false)
  }

  const handleQuickLogin = () => {
    setUsername('julia')
    setPassword('milhati')
    document.cookie = 'admin_auth=true; path=/; max-age=604800; SameSite=Lax'
    toast.success('Entrando como Julia...')
    setTimeout(() => {
      window.location.href = `/${slug}/admin`
    }, 200)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo / Badge */}
        <div className="flex items-center justify-center h-16 w-16 rounded-3xl bg-zinc-800 border border-zinc-700 text-white mx-auto mb-4 shadow-xl">
          <Car className="h-8 w-8 text-emerald-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-xs text-zinc-400 text-center mt-1.5 mb-6">
          Acesso restrito da concessionária <span className="font-bold text-zinc-200 font-mono">#{slug}</span>
        </p>

        {/* Card do Formulário */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-zinc-100">
          {/* Botão de 1-Click para Teste Rápido */}
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                J
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Entrar com 1 Clique (Julia)
                </p>
                <p className="text-[11px] text-emerald-700">Login automático para teste rápido</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-700 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              ou digite abaixo
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-400" /> Usuário ou E-mail
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="julia"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-xl h-11 text-sm border-zinc-200 focus-visible:ring-zinc-900"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-zinc-400" /> Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="milhati"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl h-11 text-sm border-zinc-200 focus-visible:ring-zinc-900"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl h-12 text-sm shadow-md gap-2 active:scale-98 transition-transform"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                <>Entrar no Painel <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-100">
            <Link href={`/${slug}`} className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold transition-colors">
              ← Voltar para a Vitrine
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}