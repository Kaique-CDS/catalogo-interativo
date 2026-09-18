'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car, Loader2, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { carAdminLoginAction } from './actions'

export default function LoginPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'loja-exemplo'
  const [pending, setPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const user = ((formData.get('username') as string) || '').trim()
    const pass = ((formData.get('password') as string) || '').trim()

    if (!user || !pass) {
      setErrorMsg('Preencha o usuário e a senha.')
      toast.error('Preencha o usuário e a senha.')
      setPending(false)
      return
    }

    try {
      const res = await carAdminLoginAction(null, formData)
      if (res?.error) {
        setErrorMsg(res.error)
        toast.error(res.error)
        setPending(false)
      } else {
        document.cookie = 'admin_auth=true; path=/; samesite=lax'
        toast.success('Login realizado com sucesso!')
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Erro de conexão ao verificar credenciais. Tente novamente.')
      toast.error('Erro ao verificar credenciais.')
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center h-16 w-16 rounded-3xl bg-zinc-800 border border-zinc-700 text-white mx-auto mb-4 shadow-xl">
          <Car className="h-8 w-8 text-emerald-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-xs text-zinc-400 text-center mt-1.5 mb-6">
          Acesso restrito da concessionária{' '}
          <span className="font-bold text-zinc-200 font-mono">#{slug}</span>
        </p>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-zinc-100">
          <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
            <ShieldCheck className="h-5 w-5 text-zinc-500 flex-shrink-0" />
            <p className="text-xs text-zinc-600 font-medium">
              Área restrita. Apenas usuários autorizados.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold animate-in fade-in-0 duration-200">
              <span className="text-base flex-shrink-0">❌</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-400" /> Usuário
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Digite seu usuário"
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
                name="password"
                type="password"
                placeholder="Digite sua senha"
                className="rounded-xl h-11 text-sm border-zinc-200 focus-visible:ring-zinc-900"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl h-12 text-sm shadow-md gap-2 active:scale-98 transition-transform cursor-pointer"
              disabled={pending}
            >
              {pending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
              ) : (
                <>Entrar no Painel <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-100">
            <Link href={`/${slug}`} className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold transition-colors">
              &larr; Voltar para a Vitrine
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}