'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car, Loader2, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router   = useRouter()
  const params   = useParams()
  const slug     = params?.slug as string || 'loja-exemplo'
  const supabase = createClient()
  const [username, setUsername] = useState('julia')
  const [password, setPassword] = useState('milhati')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const cleanUser = username.trim().toLowerCase()
    const cleanPass = password.trim()

    // 1. Verificação de credenciais de demonstração (julia / milhati)
    if (cleanUser === 'julia' && cleanPass === 'milhati') {
      document.cookie = 'admin_auth=true; path=/; max-age=604800; SameSite=Lax'
      toast.success('Login autorizado! Bem-vinda, Julia!')
      setTimeout(() => {
        router.push(`/${slug}/admin`)
        router.refresh()
      }, 500)
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
          router.push(`/${slug}/admin`)
          router.refresh()
          return
        }
      } catch (err) {
        console.error(err)
      }
    }

    // Se estiver em modo demo e digitou outra coisa
    if (cleanPass === 'milhati' || cleanUser === 'julia') {
      document.cookie = 'admin_auth=true; path=/; max-age=604800; SameSite=Lax'
      toast.success('Acesso liberado!')
      router.push(`/${slug}/admin`)
      router.refresh()
      return
    }

    toast.error('Usuário ou senha incorretos. Use usuário: julia e senha: milhati')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 sm:p-8 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-zinc-900 text-white mx-auto mb-4 shadow-md">
          <Car className="h-7 w-7" />
        </div>

        <h2 className="text-2xl font-black text-zinc-900 text-center tracking-tight">Painel Admin</h2>
        <p className="text-xs text-zinc-500 text-center mt-1 mb-6">
          Acesso administrativo da loja <span className="font-bold text-zinc-800 uppercase font-mono">#{slug}</span>
        </p>

        {/* Card informativo de credenciais para facilitar o teste */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-6 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 leading-relaxed">
            <span className="font-bold block">Acesso de Demonstração:</span>
            <span className="text-emerald-700">Usuário: <strong>julia</strong> • Senha: <strong>milhati</strong></span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" /> Usuário / E-mail
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="julia"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl text-sm"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-400" /> Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl text-sm"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl h-11 text-sm shadow-md gap-2 mt-2"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Entrando no Painel...</>
            ) : (
              <>Entrar no Painel <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-zinc-100">
          <Link href={`/${slug}`} className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors">
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  )
}