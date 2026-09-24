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
import { ArrowLeft, Upload, Loader2, Sparkles, Lock, Edit3 } from 'lucide-react'
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
  const [descMode, setDescMode] = useState<'manual' | 'ai'>('manual')

  const numPrice = parseFloat(price.replace(',', '.'))
  const missingFields: string[] = []
  if (!name.trim()) missingFields.push('Nome do Doce/Bolo')
  if (!category?.trim()) missingFields.push('Categoria')
  if (isNaN(numPrice) || numPrice <= 0) missingFields.push('Preço')
  if (!servings.trim()) missingFields.push('Rendimento')
  if (!prepTime.trim()) missingFields.push('Prazo')

  const isFormComplete = missingFields.length === 0

  const handleGenerateDescription = async () => {
    if (!isFormComplete) {
      toast.error(`Preencha todos os campos obrigatórios antes de gerar a legenda com IA: ${missingFields.join(', ')}.`, {
        duration: 5000,
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
          <h1 className="text-xl font-black text-rose-950 dark:text-rose-100">Cadastrar Novo Doce ou Bolo 🧁</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Detalhes essenciais para o cliente decidir rápido e pedir no WhatsApp.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Fotos */}
        <Card className="rounded-2xl border-rose-100 bg-white shadow-xs">
          <CardContent className="p-5 sm:p-6">
            <Label className="text-xs font-bold text-rose-950 block mb-2">Fotos do Produto</Label>
            <div className="border-2 border-dashed border-rose-200 rounded-2xl p-6 text-center hover:border-rose-400 transition-colors bg-rose-50 dark:bg-rose-950/30/20 cursor-pointer">
              <Upload className="h-8 w-8 text-rose-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-rose-950 dark:text-rose-100">Clique para selecionar ou arraste as fotos</p>
              <p className="text-[11px] text-zinc-400 mt-1">Imagens de dar água na boca convertem até 3x mais!</p>
            </div>
          </CardContent>
        </Card>

        {/* Informações Comerciais */}
        <Card className="rounded-2xl border-rose-100 bg-white shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nome do Doce / Bolo *</Label>
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
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Categoria *</Label>
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
                <Label htmlFor="price" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 185.00"
                  className="rounded-xl border-rose-200 text-sm font-bold text-rose-950 dark:text-rose-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="servings" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Rendimento / Porções</Label>
                <Input
                  id="servings"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="Ex: 15 a 20 fatias (2.2kg)"
                  className="rounded-xl border-rose-200 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="prepTime" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Prazo de Encomenda</Label>
                <Input
                  id="prepTime"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="Ex: 24h antecedência ou Pronta Entrega"
                  className="rounded-xl border-rose-200 text-sm"
                />
              </div>
            </div>

            {/* Balão Moderno de Descrição com Abas (Manual vs I.A) */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800/90 bg-gradient-to-b from-rose-50/50 to-white p-4 sm:p-5 shadow-xs space-y-3">
              {/* Cabeçalho do Balão com Seletor de Modo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-rose-100 dark:border-rose-900/50">
                <div>
                  <Label htmlFor="description" className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                    <span>Descrição do Doce ou Bolo</span>
                    <span className="text-rose-500">*</span>
                  </Label>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Escolha como deseja montar o texto irresistível para o cardápio:
                  </p>
                </div>

                {/* Segmented Switcher (2 opções: Manual ou I.A) */}
                <div className="inline-flex p-1 bg-rose-100 dark:bg-rose-900/40/70 rounded-xl gap-1 self-start sm:self-auto border border-rose-200 dark:border-rose-800/60">
                  <button
                    type="button"
                    onClick={() => setDescMode('manual')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      descMode === 'manual'
                        ? 'bg-white text-rose-950 shadow-xs'
                        : 'text-zinc-600 hover:text-rose-950 dark:text-rose-100'
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5 text-rose-500" />
                    Fazer Manualmente
                  </button>

                  <button
                    type="button"
                    onClick={() => setDescMode('ai')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      descMode === 'ai'
                        ? isFormComplete
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs'
                          : 'bg-zinc-800 text-zinc-100 shadow-xs'
                        : isFormComplete
                          ? 'text-rose-700 hover:text-rose-900 dark:text-rose-200'
                          : 'text-zinc-600 hover:text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    {isFormComplete ? (
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-zinc-400" />
                    )}
                    <span>Gerar com I.A</span>
                    {!isFormComplete && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-700 text-zinc-200 rounded font-medium ml-0.5">
                        Bloqueado
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Conteúdo Interno do Balão */}
              <div className="pt-2 space-y-3">
                {descMode === 'manual' ? (
                  /* MODO MANUAL */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5 text-zinc-600 font-medium">
                        <Edit3 className="h-3.5 w-3.5 text-rose-400" /> Escreva os detalhes de massa, recheio e textura:
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {description.length}/500 carac.
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Massa aveludada com toque de cacau 100%, recheio duplo de brigadeiro belga e Ninho artesanal, coberto com morangos frescos e raspas de chocolate nobre..."
                      rows={4}
                      maxLength={500}
                      className="text-sm rounded-xl bg-white border-rose-200 focus:border-rose-500 transition-colors"
                    />
                  </div>
                ) : (
                  /* MODO I.A */
                  <div className="space-y-3">
                    {!isFormComplete ? (
                      /* ESTADO BLOQUEADO */
                      <div className="rounded-xl border border-dashed border-amber-300/80 bg-gradient-to-r from-amber-50/80 via-rose-50/40 to-amber-50/60 p-3.5 text-zinc-800 dark:text-zinc-200">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/15 border border-amber-300/60 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                                Gerador com I.A Bloqueado
                              </span>
                              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                                Economia de Tokens
                              </span>
                            </div>
                            <p className="text-xs text-amber-900/80 leading-relaxed">
                              Para economizar tokens e criar uma legenda irresistível para este produto, preencha os dados obrigatórios primeiro:
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {missingFields.map((f) => (
                                <span
                                  key={f}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200/70 border border-amber-300/80 text-[11px] font-semibold text-amber-900"
                                >
                                  ⚠️ {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Botão de IA Bloqueado dentro do balão */}
                        <div className="mt-3 pt-3 border-t border-amber-200/60">
                          <button
                            type="button"
                            disabled
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-200/80 text-zinc-400 font-semibold text-xs border border-zinc-300/70 cursor-not-allowed shadow-inner"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Preencha os dados acima para desbloquear a geração com I.A
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ESTADO DESBLOQUEADO / PRONTO */
                      <div className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50/90 via-pink-50/60 to-rose-50/40 p-3.5 text-zinc-900 dark:text-zinc-50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-950 uppercase tracking-wide">
                                <Sparkles className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> I.A Pronta para Gerar
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                                ✓ Dados Completos
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                              A I.A filtrará apenas os dados preenchidos deste doce para gastar o mínimo de tokens:
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-rose-200 text-rose-900 font-medium">
                                🎂 {name.trim()}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-rose-200 text-rose-900 font-medium">
                                🏷️ {category}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-rose-200 text-rose-900 font-medium">
                                💰 R$ {numPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-rose-200 text-rose-900 font-medium">
                                🍰 {servings.trim()}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950/90 border border-rose-200 text-rose-900 font-medium">
                                ⏰ {prepTime.trim()}
                              </span>
                            </div>
                          </div>

                          {/* Botão de Gerar com IA DENTRO do balão */}
                          <div className="shrink-0 self-stretch sm:self-center">
                            <button
                              type="button"
                              onClick={handleGenerateDescription}
                              disabled={aiLoading}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
                            >
                              {aiLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 text-amber-200" />
                              )}
                              {aiLoading ? 'Criando descrição...' : '✨ Gerar Legenda com I.A'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Campo de Texto onde a IA insere a descrição */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="text-[11px] text-zinc-500 font-medium">
                          Texto da Descrição (gerado pela IA ou ajustado por você):
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {description.length}/500 carac.
                        </span>
                      </div>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                          isFormComplete
                            ? "Clique no botão '✨ Gerar Legenda com I.A' acima para criar a descrição irresistível..."
                            : "Preencha os dados obrigatórios para liberar o botão de geração com I.A..."
                        }
                        rows={4}
                        maxLength={500}
                        className="text-sm rounded-xl bg-white border-rose-200 focus:border-rose-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Dica de rodapé */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-zinc-400">
                    Mínimo 10 caracteres. Máximo 500 caracteres para cardápios otimizados.
                  </p>
                </div>
              </div>
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
            <Button variant="outline" type="button" className="rounded-xl border-rose-200 text-sm text-zinc-600 dark:text-zinc-400">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}