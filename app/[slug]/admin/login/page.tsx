'use client'

import React, { useState, useActionState, useEffect } from 'react'
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

  const [state, formAction] = useActionState(carAdminLoginAction, null)

  useEffect(() => {
    if (state && !state.error) {
      // Sucesso - redirect
      toast.success('Login realizado com sucesso!')
      window.location.href = `/${slug}/admin`
    } else if (state?.error) {
      toast.error(state.error)
      setPending(false)
    }
  }, [state, slug])

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
          Acesso restrito da concessionaria{' '}
          <span className="font-bold text-zinc-200 font-mono">#{slug}</span>
        </p>

        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 border border-zinc-100">
          <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
            <ShieldCheck className="h-5 w-5 text-zinc-500 flex-shrink-0" />
            <p className="text-xs text-zinc-600 font-medium">
              Area restrita. Apenas usuarios autorizados.
            </p>
          </div>

          <form
            action={(formData) => {
              setPending(true)
              formAction(formData)
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-400" /> Usuario
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Digite seu usuario"
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

            {state?.error && (
              <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {state.error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl h-12 text-sm shadow-md gap-2 active:scale-98 transition-transform"
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