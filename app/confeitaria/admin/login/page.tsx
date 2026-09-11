'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfeitariaLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success('Bem-vindo(a) de volta ao Ateliê!')
      router.push('/confeitaria/admin')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-rose-100 rounded-3xl shadow-xs w-full max-w-sm p-8 text-center">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl shadow-sm mb-4">
          🎂
        </div>

        <h2 className="text-2xl font-black text-rose-950">Acesso ao Ateliê</h2>
        <p className="text-xs text-zinc-500 mt-1 mb-6">Gerenciador de Cardápio & Confeitaria</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs text-zinc-600">E-mail de acesso</Label>
            <Input
              id="email"
              type="email"
              placeholder="atelie@confeitaria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-rose-200 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs text-zinc-600">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border-rose-200 text-xs"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs py-2.5 shadow-xs"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Entrar no Painel'}
          </Button>
        </form>

        <p className="text-[11px] text-zinc-400 mt-6">
          Dúvidas? <Link href="/confeitaria" className="text-rose-600 hover:underline">Voltar para a vitrine</Link>
        </p>
      </div>
    </div>
  )
}