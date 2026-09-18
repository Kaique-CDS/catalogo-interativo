'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, Loader2, Cake, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
  CATEGORIES_CONFEITARIA,
  getConfeitariaProducts,
  saveConfeitariaProduct,
  ConfeitariaProduct
} from '@/lib/confeitaria'

export default function EditarDocePage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params?.id || '')

  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ConfeitariaProduct | null>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES_CONFEITARIA[0])
  const [price, setPrice] = useState('')
  const [servings, setServings] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const list = getConfeitariaProducts()
    const found = list.find(p => p.id === id)
    if (found) {
      setProduct(found)
      setName(found.name)
      setCategory(found.category)
      setPrice(String(found.price))
      setServings(found.servings || '')
      setPrepTime(found.prepTime || '')
      setDescription(found.description || '')
      setImage(found.image)
      setIsActive(found.isActive)
    }
  }, [id])

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

    const updatedProduct: ConfeitariaProduct = {
      id,
      name: name.trim(),
      category,
      badge: '',
      price: numPrice,
      servings: servings.trim(),
      prepTime: prepTime.trim(),
      description: description.trim(),
      dietary: [],
      image: image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
      isActive
    }

    saveConfeitariaProduct(updatedProduct)

    setTimeout(() => {
      setLoading(false)
      toast.success('Doce/Bolo atualizado com sucesso!')
      router.push('/confeitaria/admin/produtos')
    }, 400)
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <Cake className="h-12 w-12 text-rose-300 mx-auto mb-3 animate-pulse" />
        <p className="text-sm font-semibold text-zinc-600">Carregando produto para edição...</p>
      </div>
    )
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
          <h1 className="text-xl font-black text-rose-950">Editar Doce ou Bolo 🍰</h1>
          <p className="text-xs text-zinc-500">Atualize fotos, valores, porções e informações do cardápio.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Foto do Produto */}
        <Card className="rounded-2xl border-rose-100 bg-white shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-3">
            <Label className="text-xs font-bold text-rose-950 block">Foto do Produto</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-24 rounded-2xl overflow-hidden bg-rose-50 border border-rose-200 flex-shrink-0">
                {image ? (
                  <Image src={image} alt={name} fill className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-rose-300">
                    <Cake className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="image" className="text-[11px] font-medium text-zinc-500">URL da Imagem</Label>
                <Input
                  id="image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="rounded-xl border-rose-200 text-xs"
                />
              </div>
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
                placeholder="Ex: Bolo Red Velvet Supreme"
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
                  placeholder="Ex: 15 a 20 fatias"
                  className="rounded-xl border-rose-200 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prepTime" className="text-xs font-semibold text-zinc-700">Prazo de Encomenda</Label>
                <Input
                  id="prepTime"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="Ex: 24h antecedência"
                  className="rounded-xl border-rose-200 text-sm"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1 pt-2">
              <Label htmlFor="description" className="text-xs font-semibold text-zinc-700">Descrição (Massa, Recheios e Coberturas)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Massa aveludada com toque de cacau..."
                rows={3}
                className="rounded-xl border-rose-200 text-sm"
              />
            </div>

            {/* Status do Produto */}
            <div className="pt-3 border-t border-rose-100 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-rose-950 block">Disponibilidade no Cardápio</Label>
                <p className="text-[11px] text-zinc-400">Quando pausado, o doce não aparece para pedidos dos clientes.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsActive(!isActive)}
                className={`text-xs font-bold rounded-xl gap-1.5 ${
                  isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                }`}
              >
                {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {isActive ? 'Publicado (Visível)' : 'Pausado'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm py-3 shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Salvar Alterações'}
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
