'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Heart, Search, Sparkles, MapPin, Clock, Settings, LayoutDashboard, X, Share2, Check, ShieldCheck, Eye, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { getConfeitariaProducts } from '@/lib/confeitaria'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'

interface Product {
  id: string
  name: string
  category: string
  price: number
  description: string
  servings?: string
  prepTime?: string
  badge?: string
  dietary?: string[]
  images: string[]
}

const STORE = {
  name: 'Doce Encanto Ateliê de Bolos',
  whatsapp: '5511999999999',
  address: 'Rua das Flores, 280 - Vila Madalena, São Paulo - SP',
  instagram: '@doceencanto.atelie',
  openingHours: 'Terça a Sábado: 09h às 19h | Domingo: 09h às 14h',
}

const CATEGORIES = ['Todos', 'Bolos Festivos', 'Bento Cakes', 'Doces Finos', 'Fatias & Pedaços', 'Sobremesas na Taça']

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Bolo Red Velvet Supreme com Frutas Vermelhas',
    category: 'Bolos Festivos',
    price: 185.00,
    servings: '15 a 20 fatias (2.2kg)',
    prepTime: 'Encomenda: 24h antecedência',
    badge: 'Mais Pedido 🍓',
    dietary: ['Artesanal & Sem Conservantes', 'Contém Lactose', 'Cacau Puro 100%'],
    description: 'Massa aveludada clássica americana com toque suave de cacau especial, recheio generoso e equilibrado de cream cheese frosting importado. Finalizado com mirtilos, amoras e morangos frescos selecionados à mão.',
    images: ['https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: '2',
    name: 'Bolo Trufado Chocomenta & Ninho',
    category: 'Bolos Festivos',
    price: 165.00,
    servings: '12 a 15 fatias (1.8kg)',
    prepTime: 'Encomenda: 24h antecedência',
    badge: 'Destaque ✨',
    dietary: ['Chocolate Belga Callebaut', 'Sem Conservantes'],
    description: 'Camadas de massa úmida de cacau black 70%, recheio duplo de ganache trufada meio amarga aromatizada com menta e brigadeiro cremoso de Leite Ninho. Cobertura com raspas rústicas de chocolate nobre.',
    images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: '3',
    name: 'Bento Cake Personalizado Divertido',
    category: 'Bento Cakes',
    price: 55.00,
    servings: '1 a 2 pessoas (400g)',
    prepTime: 'Pronta entrega ou encomenda',
    badge: 'Presente Perfeito 🎁',
    dietary: ['Personalizável', 'Acompanha Vela Mágica'],
    description: 'Mini bolo artesanal na caixinha de lancheira térmica ecológica com velinha mágica e frase/desenho com meme à sua escolha! Massa de baunilha com recheio de brigadeiro gourmet.',
    images: ['https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: '4',
    name: 'Torta Cheesecake New York com Calda de Maracujá',
    category: 'Sobremesas na Taça',
    price: 140.00,
    servings: '10 fatias (1.5kg)',
    prepTime: 'Pronta entrega sob consulta',
    dietary: ['Queijo Philadelphia Original', 'Calda 100% Natural'],
    description: 'Base crocante de biscoito amanteigado artesanal, creme assado lentamente em banho-maria super denso e aveludado, finalizado com redução artesanal de maracujá silvestre com sementes.',
    images: ['https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: '5',
    name: 'Caixa Degustação de Brigadeiros Gourmet (12 un)',
    category: 'Doces Finos',
    price: 48.00,
    servings: '12 unidades selecionadas',
    prepTime: 'Pronta entrega diária',
    badge: 'Artesanal 🍫',
    dietary: ['Pistache Italiano', 'Crispearls Callebaut'],
    description: 'Sabores finos: Pistache com flor de sal de Guérande, Ninho com Nutella pura, Meio Amargo 70% com crispearls crocantes e Churros com doce de leite caseiro.',
    images: ['https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: '6',
    name: 'Fatia Supreme de Cenoura com Vulcão de Brigadeiro',
    category: 'Fatias & Pedaços',
    price: 24.00,
    servings: 'Fatia Individual Generosa (300g)',
    prepTime: 'Disponível na vitrine',
    badge: 'Sucesso das Tardes ☕',
    dietary: ['Receita de Família', 'Brigadeiro Quentinho'],
    description: 'A clássica receita fofinha e dourada da vovó, acompanhada de um potinho com avalanche de brigadeiro belga morno ao leite para você despejar por cima na hora de saborear.',
    images: ['https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=800&q=80'],
  },
]

const PERSONALIZATION_TAGS = [
  '🎂 Velinha de Aniversário',
  '🎈 Topo de Bolo Personalizado',
  '✍️ Nome / Frase no Bolo',
  '🎁 Embalagem para Presente',
  '🚫 Sem Nozes / Castanhas',
  '🥛 Sem Lactose / Troca de Recheio',
  '🍓 Frutas Extras',
]

export default function ConfeitariaPage() {
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [search, setSearch] = useState('')
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null)

  const [selectedPersonalizations, setSelectedPersonalizations] = useState<string[]>([])
  const [personalizationText, setPersonalizationText] = useState('')

  // Carrega produtos cadastrados/editados no admin via localStorage
  useEffect(() => {
    const custom = getConfeitariaProducts()
    if (custom && custom.length > 0) {
      setProductsList(custom.filter(p => p.isActive !== false).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        servings: p.servings,
        prepTime: p.prepTime,
        badge: p.badge,
        dietary: p.dietary,
        description: p.description || '',
        images: [p.image]
      })))
    }
  }, [])

  // Reseta campos de personalização ao trocar de produto
  useEffect(() => {
    setSelectedPersonalizations([])
    setPersonalizationText('')
  }, [activeModalProduct?.id])

  // Travar scroll quando modal aberto
  useEffect(() => {
    if (activeModalProduct) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [activeModalProduct])

  const filteredProducts = productsList.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sendOrderWhatsApp = (product: Product) => {
    const lines = [
      `Olá, *${STORE.name}*! 🍰✨`,
      `Estava no cardápio e gostaria de encomendar:`,
      '',
      `🧁 *${product.name}*`,
      `💰 *Valor base:* ${formatCurrency(product.price)}`,
      product.servings ? `🍴 *Rendimento:* ${product.servings}` : '',
      product.prepTime ? `⏰ *Prazo estimado:* ${product.prepTime}` : '',
    ]

    const hasPersonalization = selectedPersonalizations.length > 0 || personalizationText.trim()

    if (hasPersonalization) {
      lines.push(
        '',
        '🎈 *PERSONALIZAÇÃO & REQUISITOS DO PEDIDO:*'
      )
      if (selectedPersonalizations.length > 0) {
        lines.push(`• *Itens / Serviços:* ${selectedPersonalizations.join(', ')}`)
      }
      if (personalizationText.trim()) {
        lines.push(`• *Observações:* "${personalizationText.trim()}"`)
      }
      lines.push('*(Gostaria de combinar os detalhes e valor final com você aqui no chat)*')
    }

    lines.push(
      '',
      `Vocês têm disponibilidade para essa data/pedido? Como podemos fechar?`
    )

    const message = lines.filter(line => line !== undefined).join('\n')
    const url = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareProduct = (product: Product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Olha que delícia: ${product.name} no ateliê ${STORE.name}!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link do doce copiado!')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-zinc-800 font-sans pb-12">
      {/* Banner de Aviso Superior */}
      <div className="bg-rose-500 text-white text-xs font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> Encomendas especiais para aniversários e eventos com entrega rápida via WhatsApp!
      </div>

      {/* Header Confeitaria */}
      <header className="bg-white/90 backdrop-blur-md border-b border-rose-100 sticky top-0 z-20 shadow-2xs">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3 max-w-7xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-200 flex-shrink-0 text-xl">
              🎂
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-xl text-rose-950 flex items-center gap-1.5 truncate">
                <span className="truncate">{STORE.name}</span>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-rose-600 border-rose-200 bg-rose-50 font-normal flex-shrink-0">
                  Artesanal
                </Badge>
              </h1>
              <p className="text-[11px] sm:text-xs text-rose-800/70 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0 text-rose-400" />
                <span className="truncate">{STORE.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/confeitaria/admin">
              <Button variant="outline" size="sm" className="rounded-xl border-rose-200 text-rose-900 hover:bg-rose-50 text-xs gap-1.5 font-semibold h-9">
                <LayoutDashboard className="h-3.5 w-3.5 text-rose-600" />
                <span className="hidden sm:inline">Painel</span> Admin
              </Button>
            </Link>
            <a
              href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de falar com o atendimento da confeitaria.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-6 sm:py-10 text-center max-w-2xl">
        <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase bg-rose-100/70 px-3 py-1 rounded-full">
          Cardápio Oficial & Encomendas
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-rose-950 mt-3 mb-2 tracking-tight">
          Feito à mão, com ingredientes nobres e muito afeto.
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600">
          Toque em qualquer doce para ver os detalhes, fotos e pedir direto no WhatsApp!
        </p>

        {/* Busca */}
        <div className="relative mt-5 max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
          <Input
            placeholder="Buscar sabor, recheio, bolo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl border-rose-200 bg-white focus-visible:ring-rose-400 text-sm shadow-xs h-10"
          />
        </div>
      </section>

      {/* Categorias Tabs */}
      <section className="container mx-auto px-4 mb-6 max-w-7xl">
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                  : 'bg-white text-zinc-600 border border-rose-100 hover:bg-rose-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grade de Produtos */}
      <main className="container mx-auto px-3 sm:px-4 max-w-7xl">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 max-w-md mx-auto p-6">
            <span className="text-4xl block mb-2">🧁</span>
            <h3 className="font-bold text-rose-950 text-base">Nenhum docinho encontrado</h3>
            <p className="text-xs text-zinc-500 mt-1">Tente pesquisar por outro termo ou selecione outra categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setActiveModalProduct(product)}
                className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Imagem do Produto */}
                <div className="relative aspect-[16/11] sm:h-60 w-full overflow-hidden bg-rose-50">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {product.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 backdrop-blur-xs text-rose-900 text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                        {product.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="bg-rose-950/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>

                  {/* Dica de Toque */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/95 text-rose-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Ver Detalhes
                    </span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-rose-950 text-base sm:text-lg leading-snug group-hover:text-rose-700 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>

                    {/* Detalhes extras */}
                    <div className="mt-3 pt-2.5 border-t border-rose-50 flex flex-col gap-1 text-[11px] text-zinc-500">
                      {product.servings && (
                        <span className="flex items-center gap-1.5 font-medium text-rose-900/80">
                          🍽️ {product.servings}
                        </span>
                      )}
                      {product.prepTime && (
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="h-3 w-3" /> {product.prepTime}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Preço e Botão */}
                  <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">A partir de</span>
                      <span className="text-xl sm:text-2xl font-black text-rose-950">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveModalProduct(product)
                        }}
                        className="rounded-xl border-rose-200 text-rose-900 text-xs font-semibold h-9 px-3"
                      >
                        Detalhes
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          sendOrderWhatsApp(product)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 sm:px-4 h-9 text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Pedir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Expansão do Doce */}
      {activeModalProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in-0 duration-200"
          onClick={() => setActiveModalProduct(null)}
        >
          <div
            className="bg-white w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Foto Grande do Doce */}
            <div className="relative aspect-[16/10] sm:aspect-video w-full bg-rose-100 flex-shrink-0">
              <Image
                src={activeModalProduct.images[0]}
                alt={activeModalProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 576px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

              <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                <button
                  onClick={() => handleShareProduct(activeModalProduct)}
                  className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveModalProduct(null)}
                  className="h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                {activeModalProduct.badge ? (
                  <span className="bg-white/95 text-rose-900 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                    {activeModalProduct.badge}
                  </span>
                ) : <div />}
                <span className="bg-rose-950/70 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                  {activeModalProduct.category}
                </span>
              </div>
            </div>

            {/* Informações Ricas */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-zinc-800">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-rose-950 leading-snug">
                  {activeModalProduct.name}
                </h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-rose-950">
                    {formatCurrency(activeModalProduct.price)}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">por unidade / encomenda</span>
                </div>
              </div>

              {/* Informações Técnicas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block flex items-center gap-1">
                    <Utensils className="h-3 w-3 text-rose-400" /> Rendimento
                  </span>
                  <span className="text-xs font-bold text-rose-950 mt-0.5 block">
                    {activeModalProduct.servings || 'Consultar porções'}
                  </span>
                </div>
                <div className="bg-rose-50/60 border border-rose-100 p-3 rounded-2xl">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block flex items-center gap-1">
                    <Clock className="h-3 w-3 text-rose-400" /> Prazo
                  </span>
                  <span className="text-xs font-bold text-rose-950 mt-0.5 block">
                    {activeModalProduct.prepTime || 'Pronta Entrega'}
                  </span>
                </div>
              </div>

              {/* Ingredientes e Restrições */}
              {activeModalProduct.dietary && activeModalProduct.dietary.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-rose-500" />
                    Características & Ingredientes
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeModalProduct.dietary.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-rose-900 border border-rose-100 px-2.5 py-1 rounded-full font-medium">
                        <Check className="h-3 w-3 text-rose-500" /> {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrição Longa */}
              <div>
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1">
                  Sobre esta Criação
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                  {activeModalProduct.description}
                </p>
              </div>

              {/* Personalização do Pedido (Aniversário, Ingredientes, etc.) */}
              <div className="bg-rose-50/60 border border-rose-200/80 p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl leading-none">🎈</span>
                  <div>
                    <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                      Deseja Personalizar? (Aniversário ou Ingredientes)
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Selecione itens especiais ou escreva alterações para combinar direto no WhatsApp com a confeiteira.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PERSONALIZATION_TAGS.map((tag) => {
                    const isSelected = selectedPersonalizations.includes(tag)
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          setSelectedPersonalizations(prev =>
                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                          )
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold border transition-all ${
                          isSelected
                            ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                            : 'bg-white border-rose-200 text-rose-950 hover:bg-rose-100/60'
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-1 pt-1">
                  <label htmlFor="custom-notes" className="text-[11px] font-bold text-zinc-700 block">
                    Observações de aniversário ou alterações de ingredientes:
                  </label>
                  <textarea
                    id="custom-notes"
                    rows={2}
                    value={personalizationText}
                    onChange={(e) => setPersonalizationText(e.target.value)}
                    placeholder="Ex: Nome da aniversariante (Sofia, 15 anos), velinha dourada, trocar recheio por Ninho puro, retirar castanhas..."
                    className="w-full text-xs rounded-xl border border-rose-200 p-2.5 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="text-xs text-zinc-500 flex items-center gap-2 pt-2 border-t border-rose-50">
                <MapPin className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />
                <span>Retirada ou Envio express em: <strong>{STORE.address}</strong></span>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-rose-50/40 border-t border-rose-100 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="hidden sm:block">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Encomendar Agora</span>
                <span className="text-xs text-zinc-600 font-medium">Atendimento direto com a confeiteira</span>
              </div>

              <Button
                onClick={() => sendOrderWhatsApp(activeModalProduct)}
                className="w-full sm:w-auto flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md gap-2 active:scale-98 transition-transform"
              >
                <MessageCircle className="h-5 w-5" />
                Pedir no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé Confeitaria */}
      <footer className="border-t border-rose-100 bg-white mt-12 py-8 text-center text-xs text-zinc-500 space-y-1.5">
        <p className="font-semibold text-rose-950">{STORE.name}</p>
        <p>{STORE.address} • {STORE.openingHours}</p>
        <p className="text-[11px] text-zinc-400">Cardápio Interativo SaaS com Checkout direto no WhatsApp</p>
      </footer>

      <FloatingWhatsApp
        storeName={STORE.name}
        whatsapp={STORE.whatsapp}
        customMessage={`Olá, *${STORE.name}*! 🍰👋\nGostaria de tirar algumas dúvidas sobre os doces, bolos e encomendas do cardápio.`}
      />
    </div>
  )
}