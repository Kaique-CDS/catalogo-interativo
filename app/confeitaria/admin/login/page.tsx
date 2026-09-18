'use client'

import React, { useState, useActionState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, User, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { confeitariaLoginAction } from '../actions'

export default function ConfeitariaLoginPage() {
  const [pending, setPending] = useState(false)
  const [state, formAction] = useActionState(confeitariaLoginAction, null)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
      setPending(false)
    }
  }, [state])

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-rose-100 rounded-3xl shadow-xs w-full max-w-sm p-8 text-center">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl shadow-sm mb-4">
          🎂
        </div>

        <h2 className="text-2xl font-black text-rose-950">Acesso ao Atelie</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-2">Gerenciador de Cardapio &amp; Confeitaria</p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[11px] text-zinc-400 font-medium">Area restrita. Apenas usuarios autorizados.</span>
        </div>

        <form
          action={(formData) => {
            setPending(true)
            formAction(formData)
          }}
          className="space-y-4 text-left"
        >
          <div className="space-y-1">
            <Label htmlFor="username" className="text-xs text-zinc-600 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" /> Usuario
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Digite seu usuario"
              className="rounded-xl border-rose-200 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs text-zinc-600 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-400" /> Senha
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Digite sua senha"
              className="rounded-xl border-rose-200 text-xs"
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
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs py-2.5 shadow-xs"
            disabled={pending}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Entrar no Painel'}
          </Button>
        </form>
      </div>
    </div>
  )
}