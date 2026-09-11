'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, MapPin, Globe, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfeitariaConfiguracoesPage() {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('Doce Encanto Ateliê de Bolos')
  const [whatsapp, setWhatsapp] = useState('5511999999999')
  const [address, setAddress] = useState('Rua das Flores, 280 - Vila Madalena, São Paulo - SP')
  const [hours, setHours] = useState('Terça a Sábado: 09h às 19h | Domingo: 09h às 14h')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success('Configurações do ateliê salvas!')
      setLoading(false)
    }, 600)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-rose-950 tracking-tight">Configurações do Ateliê 🌸</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Defina o número do WhatsApp que recebe os pedidos e os dados da sua confeitaria.</p>
      </div>

      {/* Link da Vitrine */}
      <Card className="rounded-3xl border-rose-200/80 bg-gradient-to-r from-rose-50 to-pink-50 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Link Público do seu Cardápio</span>
            <p className="text-xs font-mono text-rose-950 mt-0.5 font-bold">http://localhost:3000/confeitaria</p>
          </div>
          <a href="/confeitaria" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="text-xs border-rose-300 text-rose-800 bg-white rounded-xl">
              Abrir Vitrine
            </Button>
          </a>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="rounded-3xl border-rose-100 bg-white shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs text-zinc-600">Nome da Confeitaria / Ateliê</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-rose-200 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="whatsapp" className="text-xs text-zinc-600 flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp Oficial de Pedidos (com DDD) *
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="rounded-xl border-rose-200 text-xs"
                required
              />
              <p className="text-[11px] text-zinc-400">É para este número que os clientes serão encaminhados com a mensagem pronta.</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs text-zinc-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                Endereço Físico ou Ponto de Retirada
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border-rose-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="hours" className="text-xs text-zinc-600">Horários de Atendimento & Retirada</Label>
              <Input
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="rounded-xl border-rose-200 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs py-3 shadow-xs flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar Configurações</>}
        </Button>
      </form>
    </div>
  )
}