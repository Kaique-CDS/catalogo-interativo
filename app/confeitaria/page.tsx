'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle, Heart, Search, Sparkles, MapPin, Clock, Settings, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  category: string
  price: number
  description: string
  servings?: string
  prepTime?: string
  badge?: string
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
    description: 'Massa aveludada com toque suave de cacau, recheio generoso de cream cheese frosting original e frutas frescas selecionadas.',
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
    description: 'Camadas de massa úmida de cacau black 70%, recheio duplo de ganache trufada meio amarga e brigadeiro cremoso de Leite Ninho.',
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
    description: 'Mini bolo na caixinha de lancheira térmica com velinha mágica e frase/desenho personalizado à sua escolha!',
    images: ['https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80'],
  },
  {
    id: '4',
    name: 'Torta Cheesecake New York com Calda de Maracujá',
    category: 'Sobremesas na Taça',
    price: 140.00,
    servings: '10 fatias (1.5kg)',
    prepTime: 'Pronta entrega sob consulta',
    description: 'Base crocante de biscoito amanteigado, creme assado super denso e cremoso, finalizado com calda artesanal de maracujá silvestre.',
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
    description: 'Sabores: Pistache com toque de flor de sal, Ninho com Nutella, Meio Amargo com crispearls Callebaut e Churros.',
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
    description: 'A clássica receita fofinha da vovó coberta com uma avalanche de brigadeiro belga morno ao leite.',
    images: ['https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=800&q=80'],
  },
]

export default function ConfeitariaPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [search, setSearch] = useState('')

  const filteredProducts = PRODUCTS.filter((item) => {
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sendOrderWhatsApp = (product: Product) => {
    const lines = [
      `Olá, *${STORE.name}*! 🍰✨`,
      `Estava navegando pelo catálogo e gostaria de encomendar / saber mais sobre:`,
      '',
      `🧁 *${product.name}*`,
      `💰 *Valor:* ${formatCurrency(product.price)}`,
      product.servings ? `🍴 *Rendimento:* ${product.servings}` : '',
      product.prepTime ? `⏰ *Prazo:* ${product.prepTime}` : '',
      '',
      `Vocês têm disponibilidade para a data de hoje/próximos dias?`,
    ].filter(Boolean)

    const message = lines.join('\n')
    const url = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-[#FFF9F6] text-zinc-800 font-sans">
      <div className="bg-rose-500 text-white text-xs font-medium py-2 px-4 text-center tracking-wide flex items-center justify-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> Encomendas especiais para aniversários e eventos com entrega rápida via WhatsApp!
      </div>

      <header className="bg-white/90 backdrop-blur-md border-b border-rose-100 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <span className="text-2xl">🎂</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-rose-950 flex items-center gap-1.5">
                {STORE.name}
                <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 bg-rose-50 font-normal">
                  Artesanal
                </Badge>
              </h1>
              <p className="text-xs text-rose-800/70 flex items-center gap-1 mt-0.5 justify-center sm:justify-start">
                <MapPin className="h-3 w-3" /> {STORE.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/confeitaria/admin">
              <Button variant="outline" size="sm" className="rounded-full border-rose-200 text-rose-900 hover:bg-rose-50 text-xs gap-1.5 font-semibold">
                <LayoutDashboard className="h-3.5 w-3.5 text-rose-600" />
                Painel Admin
              </Button>
            </Link>
            <a
              href={`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de falar com o atendimento da confeitaria.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 text-center max-w-2xl">
        <span className="text-xs font-semibold tracking-wider text-rose-600 uppercase bg-rose-100/70 px-3 py-1 rounded-full">
          Cardápio Oficial & Encomendas
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-rose-950 mt-3 mb-2 tracking-tight">
          Feito à mão, com ingredientes nobres e muito afeto.
        </h2>
        <p className="text-sm text-zinc-600">
          Escolha seu doce favorito abaixo e clique em <strong className="text-emerald-700">"Pedir no WhatsApp"</strong> para verificar pronta entrega ou agendar sua data!
        </p>

        <div className="relative mt-6 max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
          <Input
            placeholder="Buscar por bolo, sabor, fatia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-full border-rose-200 bg-white focus-visible:ring-rose-400 text-sm shadow-xs"
          />
        </div>
      </section>

      <section className="container mx-auto px-4 mb-8">
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-300'
                  : 'bg-white text-zinc-600 border border-rose-100 hover:bg-rose-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <main className="container mx-auto px-4 pb-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-rose-100 max-w-md mx-auto">
            <span className="text-4xl block mb-2">🧁</span>
            <h3 className="font-bold text-rose-950">Nenhum docinho encontrado</h3>
            <p className="text-xs text-zinc-500 mt-1">Tente pesquisar por outro termo ou mude de categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-60 w-full overflow-hidden bg-rose-50">
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
                    <span className="bg-rose-950/70 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-bold text-rose-950 text-lg leading-snug group-hover:text-rose-700 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-rose-50 flex flex-col gap-1 text-[11px] text-zinc-500">
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

                  <div className="mt-5 pt-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">A partir de</span>
                      <span className="text-2xl font-extrabold text-rose-950">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <Button
                      onClick={() => sendOrderWhatsApp(product)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Pedir no WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-rose-100 bg-white py-8 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-semibold text-rose-950">{STORE.name}</p>
        <p>{STORE.address} • {STORE.openingHours}</p>
        <p className="text-[11px] text-zinc-400">Cardápio Interativo SaaS com Checkout direto no WhatsApp</p>
      </footer>
    </div>
  )
}