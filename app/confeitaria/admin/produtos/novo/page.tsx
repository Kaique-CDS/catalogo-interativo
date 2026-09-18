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
import { ArrowLeft, Upload, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  CATEGORIES_CONFEITARIA,
  saveConfeitariaProduct
} from '@/lib/confeitaria'
import { generateWithGemini, buildCakeDescriptionPrompt, getGeminiApiKey } from '@/lib/gemini'

export default function NovoDocePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES_CONFEITARIA[0])
  const [price, setPrice] = useState('')
  const [servings, setServings] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const handleGenerateDescription = async () => {
    const missing: string[] = []
    if (!name.trim()) missing.push('Nome do Doce / Bolo')
    if (!category?.trim()) missing.push('Categoria')
    const numPrice = parseFloat(price.replace(',', '.'))
    if (isNaN(numPrice) || numPrice <= 0) missing.push('Preço (R$)')
    if (!servings.trim()) missing.push('Rendimento / Porções')
    if (!prepTime.trim()) missing.push('Prazo de Encomenda')

    if (missing.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios antes de gerar a legenda com IA: ${missing.join(', ')}.`, {
        duration: 6000,
      })
      return
    }

    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      toast.error('Chave do Gemini não configurada.')
      return
    }

    setAiLoading(true)
    try {
      const prompt = buildCakeDescriptionPrompt({
        name: name.trim(),
        category,
        price: numPrice,
        servings: servings.trim(),
        prepTime: prepTime.trim(),
      })
      const result = await generateWithGemini(prompt)
      setDescription(result)
      toast.success('Legenda gerada com sucesso pela IA!')
    } catch (err) {
      toast.error('Erro ao gerar descrição com IA. Verifique sua chave do Gemini.')
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Informe o nome do doce/bolo.')
      return
    }
    const numPrice = parseFloat(price.replace(',', '.'))
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Informe um preço válido.')
      return
    }

    setLoading(true)

    saveConfeitariaProduct({
      id: Date.now().toString(),
      name: name.trim(),
      category,
      badge: '',
      price: numPrice,
      servings: servings.trim(),
      prepTime: prepTime.trim(),
      description: description.trim(),
      dietary: [],
      image: image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      isActive: true
    })

    setTimeout(() => {
      toast.success('Bolo/Doce publicado no catálogo com sucesso!')
      router.push('/confeitaria/admin/produtos')
    }, 400)
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
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bolo Red Velvet Supreme com Frutas Vermelhas"
                className="rounded-xl border-rose-200 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl border-rose-200 text-sm">
                  <SelectValue placeholder="Selecione categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES_CONFEITARIA.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="price" className="text-xs font-semibold text-zinc-700">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 185.00"
                  className="rounded-xl border-rose-200 text-sm font-bold text-rose-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="servings" className="text-xs font-semibold text-zinc-700">Rendimento / Porções</Label>
                <Input
                  id="servings"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="Ex: 15 a 20 fatias (2.2kg)"
                  className="rounded-xl border-rose-200 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prepTime" className="text-xs font-semibold text-zinc-700">Prazo de Encomenda</Label>
                <Input
                  id="prepTime"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="Ex: 24h antecedência ou Pronta Entrega"
                  className="rounded-xl border-rose-200 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">Descrição Irresistível (Massa, Recheios e Coberturas)</Label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {aiLoading ? 'Gerando com IA...' : '✨ Gerar com IA'}
                </button>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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