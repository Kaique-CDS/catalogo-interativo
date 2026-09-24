'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, User, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { confeitariaLoginAction } from '../actions'

export default function ConfeitariaLoginPage() {
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
      const res = await confeitariaLoginAction(null, formData)
      if (res?.error) {
        setErrorMsg(res.error)
        toast.error(res.error)
        setPending(false)
      } else {
        document.cookie = 'confeitaria_admin_auth=true; path=/; samesite=lax'
        toast.success('Login autorizado!')
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
    <div className="min-h-screen bg-[#FFF9F6] dark:bg-zinc-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-rose-100 rounded-3xl shadow-xs w-full max-w-sm p-8 text-center">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl shadow-sm mb-4">
          🎂
        </div>

        <h2 className="text-2xl font-black text-rose-950 dark:text-rose-100">Acesso ao Ateliê</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-2">Gerenciador de Cardápio &amp; Confeitaria</p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[11px] text-zinc-400 font-medium">Área restrita. Apenas usuários autorizados.</span>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold text-left animate-in fade-in-0 duration-200">
            <span className="text-sm flex-shrink-0">❌</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <Label htmlFor="username" className="text-xs text-zinc-600 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" /> Usuário
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Digite seu usuário"
              className="rounded-xl border-rose-200 text-xs h-11"
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
              className="rounded-xl border-rose-200 text-xs h-11"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs py-3 shadow-xs transition-all cursor-pointer"
            disabled={pending}
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
              </span>
            ) : (
              'Entrar no Painel'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}