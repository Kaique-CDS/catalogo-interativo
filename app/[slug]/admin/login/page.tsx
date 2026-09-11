'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router   = useRouter()
  const params   = useParams()
  const slug     = params?.slug as string || 'loja-exemplo'
  const supabase = createClient()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Se estiver em modo demo
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      toast.success('Entrando em modo demonstração!')
      setTimeout(() => {
        router.push(`/${slug}/admin`)
      }, 800)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
      setLoading(false)
      return
    }
    router.push(`/${slug}/admin`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="bg-white border rounded-2xl shadow-sm w-full max-w-sm p-8">
        <div className="flex items-center gap-2 font-bold text-xl mb-8">
          <Car className="h-6 w-6" />AutoCatálogo
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-1">Entrar na loja</h2>
        <p className="text-sm text-zinc-500 mb-6">Painel admin - <span className="font-medium">{slug}</span></p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</> : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}