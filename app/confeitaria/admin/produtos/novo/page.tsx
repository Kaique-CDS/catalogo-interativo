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

export default function NovoDocePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('Bolos Festivos')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success('Bolo cadastrado com sucesso no catálogo!')
      router.push('/confeitaria/admin/produtos')
    }, 600)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/confeitaria/admin/produtos">
          <Button size="icon" variant="ghost" className="h-9 w-9 text-zinc-500 hover:text-rose-600 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-black text-rose-950">Cadastrar Novo Doce ou Bolo</h1>
          <p className="text-xs text-zinc-500">Adicione os detalhes que o cliente verá na vitrine e receberá no WhatsApp.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Fotos com dica R2/Cloudflare */}
        <Card className="rounded-3xl border-rose-100 bg-white">
          <CardContent className="p-6">
            <Label className="text-xs font-bold text-rose-950 block mb-2">Fotos do Produto</Label>
            <div className="border-2 border-dashed border-rose-200 rounded-2xl p-6 text-center hover:border-rose-400 transition-colors bg-rose-50/20 cursor-pointer">
              <Upload className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-rose-950">Clique para selecionar fotos ou arraste aqui</p>
              <p className="text-[11px] text-zinc-400 mt-1">Formatos suportados: PNG, JPG ou WebP até 5MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card className="rounded-3xl border-rose-100 bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs text-zinc-600">Nome do Bolo / Sobremesa *</Label>
              <Input id="name" placeholder="Ex: Bolo Brigadeiro Vulcão Belga" className="rounded-xl border-rose-200 text-xs" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-600">Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl border-rose-200 text-xs">
                    <SelectValue placeholder="Selecione a categoria" />
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
                <Label htmlFor="price" className="text-xs text-zinc-600">Preço (R$) *</Label>
                <Input id="price" type="number" step="0.01" placeholder="Ex: 145.00" className="rounded-xl border-rose-200 text-xs" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="servings" className="text-xs text-zinc-600">Rendimento / Porções</Label>
                <Input id="servings" placeholder="Ex: 15 a 20 fatias (2kg)" className="rounded-xl border-rose-200 text-xs" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prepTime" className="text-xs text-zinc-600">Prazo de Encomenda</Label>
                <Input id="prepTime" placeholder="Ex: Encomenda: 24h antecedência" className="rounded-xl border-rose-200 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs text-zinc-600">Descrição dos Ingredientes & Recheios</Label>
              <Textarea
                id="description"
                placeholder="Descreva a massa, os recheios, tipo de cobertura e outros detalhes irresistíveis..."
                rows={3}
                className="rounded-xl border-rose-200 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs py-3 shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Publicar no Cardápio'}
          </Button>
          <Link href="/confeitaria/admin/produtos">
            <Button variant="outline" type="button" className="rounded-xl border-rose-200 text-xs text-zinc-600">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}