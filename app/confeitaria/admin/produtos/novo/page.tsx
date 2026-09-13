'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, Loader2, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'

const DIETARY_OPTIONS = [
  'Sem Glúten (Gluten-Free)',
  'Sem Lactose',
  'Vegano (Zero Origem Animal)',
  'Sem Açúcar / Low Carb',
  'Contém Nozes / Castanhas',
  'Artesanal & Sem Conservantes'
]

const POPULAR_BADGES = [
  'Nenhum',
  'Mais Pedido 🍓',
  'Destaque ✨',
  'Presente Perfeito 🎁',
  'Edição Limitada ⏳',
  'Artesanal 🍫',
  'Sucesso das Tardes ☕'
]

export default function NovoDocePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('Bolos Festivos')
  const [badge, setBadge] = useState('Mais Pedido 🍓')
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['Artesanal & Sem Conservantes'])

  const toggleDietary = (item: string) => {
    setSelectedDietary(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success('Bolo/Doce publicado no catálogo com sucesso!')
      router.push('/confeitaria/admin/produtos')
    }, 600)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link href="/confeitaria/admin/produtos">
          <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-500 hover:text-rose-600 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-black text-rose-950">Cadastrar Novo Doce ou Bolo 🧁</h1>
          <p className="text-xs text-zinc-500">Detalhes essenciais para o cliente decidir rápido e pedir no WhatsApp.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Fotos */}
        <Card className="rounded-2xl border-rose-100 bg-white shadow-xs">
          <CardContent className="p-5 sm:p-6">
            <Label className="text-xs font-bold text-rose-950 block mb-2">Fotos do Produto</Label>
            <div className="border-2 border-dashed border-rose-200 rounded-2xl p-6 text-center hover:border-rose-400 transition-colors bg-rose-50/20 cursor-pointer">
              <Upload className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-rose-950">Clique para selecionar ou arraste as fotos</p>
              <p className="text-[11px] text-zinc-400 mt-1">Imagens de dar água na boca convertem até 3x mais!</p>
            </div>
          </CardContent>
        </Card>

        {/* Informações Comerciais */}
        <Card className="rounded-2xl border-rose-100 bg-white shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold text-zinc-700">Nome do Doce / Bolo *</Label>
              <Input id="name" placeholder="Ex: Bolo Red Velvet Supreme com Frutas Vermelhas" className="rounded-xl border-rose-200 text-sm" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl border-rose-200 text-sm">
                    <SelectValue placeholder="Selecione categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bolos Festivos">Bolos Festivos</SelectItem>
                    <SelectItem value="Bento Cakes">Bento Cakes</SelectItem>
                    <SelectItem value="Doces Finos">Doces Finos</SelectItem>
                    <SelectItem value="Fatias & Pedaços">Fatias & Pedaços</SelectItem>
                    <SelectItem value="Sobremesas na Taça">Sobremesas na Taça</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Selo Promocional</Label>
                <Select value={badge} onValueChange={setBadge}>
                  <SelectTrigger className="rounded-xl border-rose-200 text-sm">
                    <SelectValue placeholder="Selecione selo" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BADGES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price" className="text-xs font-semibold text-zinc-700">Preço (R$) *</Label>
                <Input id="price" type="number" step="0.01" placeholder="Ex: 185.00" className="rounded-xl border-rose-200 text-sm font-bold text-rose-950" required />
              </div>

              <div className="space-y-1">
                <Label htmlFor="servings" className="text-xs font-semibold text-zinc-700">Rendimento / Porções</Label>
                <Input id="servings" placeholder="Ex: 15 a 20 fatias (2.2kg)" className="rounded-xl border-rose-200 text-sm" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prepTime" className="text-xs font-semibold text-zinc-700">Prazo de Encomenda</Label>
                <Input id="prepTime" placeholder="Ex: 24h antecedência ou Pronta Entrega" className="rounded-xl border-rose-200 text-sm" />
              </div>
            </div>

            {/* Selos / Informações Nutricionais e Dietéticas */}
            <div className="pt-2">
              <Label className="text-xs font-bold text-zinc-800 block mb-2">Características & Restrições Alimentares</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map((item) => {
                  const isChecked = selectedDietary.includes(item)
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleDietary(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isChecked
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50/70 text-rose-900 hover:bg-rose-100 border border-rose-100'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3" />}
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">Descrição Irresistível (Massa, Recheios e Coberturas)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Massa aveludada com toque de cacau 100%, recheio duplo de cream cheese artesanal e brigadeiro de Ninho, coberto com morangos frescos e mirtilos..."
                rows={3}
                className="rounded-xl border-rose-200 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm py-3 shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Publicar Doce no Cardápio'}
          </Button>
          <Link href="/confeitaria/admin/produtos">
            <Button variant="outline" type="button" className="rounded-xl border-rose-200 text-sm text-zinc-600">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}