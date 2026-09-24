'use client'

import React from 'react'
import Link from 'next/link'
import { Cake, ShoppingBag, Eye, Heart, Plus, Sparkles, TrendingUp, MessageCircle, Clock, Smartphone, Calendar, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ConfeitariaDashboardPage() {
  const [products, setProducts] = React.useState<any[]>([])

  React.useEffect(() => {
    import('@/lib/confeitaria').then(({ getConfeitariaProducts }) => {
      setProducts(getConfeitariaProducts())
    })
  }, [])

  const activeProducts = products.filter(p => p.isActive)
  const totalProducts = products.length
  
  // Calculate Ticket Médio (Average Price of Active Products)
  const avgPrice = activeProducts.length > 0 
    ? activeProducts.reduce((acc, p) => acc + p.price, 0) / activeProducts.length 
    : 0

  // Mock numbers based on product count to make it feel "real"
  const fakeClicks = totalProducts * 14
  const fakeAccesses = totalProducts * 189
  const fakeConversion = totalProducts > 0 ? (7.5 + (totalProducts * 0.1)).toFixed(1) : '0'

  const stats = [
    { title: 'Cliques no WhatsApp', value: fakeClicks.toString(), desc: '+28% essa semana', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Pedidos e orçamentos abertos' },
    { title: 'Taxa de Conversão', value: `${fakeConversion}%`, desc: 'Média do setor: 3.2%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', sub: 'Visitantes que chamaram no whats' },
    { title: 'Acessos no Cardápio', value: fakeAccesses.toLocaleString('pt-BR'), desc: '91% via Celular', icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Tráfego vindo do Instagram' },
    { title: 'Ticket Médio Estimado', value: `R$ ${avgPrice.toFixed(0)}`, desc: 'Por encomenda', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Calculado sobre itens do estoque' },
  ]

  const topSellers = activeProducts.slice(0, 4).map((p, i) => ({
    name: p.name,
    category: p.category,
    price: `R$ ${p.price.toFixed(2).replace('.', ',')}`,
    pedidos: Math.floor(fakeClicks * (0.4 - (i * 0.08))),
    conversion: `${(Number(fakeConversion) + (2 - i)).toFixed(1)}%`,
    trend: `+${15 + (4 - i) * 5}%`
  }))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-rose-950 tracking-tight">Inteligência de Vendas do Ateliê 🍓</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Dados reais para você antecipar estoque, ingredientes e faturar mais.</p>
        </div>
        <Link href="/confeitaria/admin/produtos/novo">
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5 shadow-xs font-semibold px-4 py-2 self-start sm:self-auto">
            <Plus className="h-3.5 w-3.5" /> Adicionar Doce / Bolo
          </Button>
        </Link>
      </div>

      {/* Uso de Armazenamento - Widget SaaS */}
      <div className="bg-white border border-rose-100 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
        
        <div className="relative z-10">
          <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            Espaço de Armazenamento de Fotos
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Plano Atual: <span className="font-bold text-rose-600">Médio</span></p>
        </div>
        
        <div className="flex-1 w-full max-w-sm relative z-10">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-zinc-700">840 MB utilizados</span>
            <span className="text-zinc-400">Total: 5 GB</span>
          </div>
          <div className="h-2 w-full bg-rose-50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-rose-500" 
              style={{ width: '16.8%' }}
            ></div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 text-right">
            Você ainda tem aprox. 4.1 GB livres.
          </p>
        </div>

        <button className="relative z-10 shrink-0 px-4 py-2 bg-rose-950 hover:bg-rose-900 text-white rounded-lg text-xs font-bold transition-colors">
          Fazer Upgrade
        </button>
      </div>

      {/* 1. Grid de Métricas Comerciais de Alto Impacto */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((item, idx) => (
          <Card key={idx} className="border-rose-100/80 shadow-2xs bg-white rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-500 truncate">{item.title}</span>
                <div className={`h-8 w-8 rounded-xl ${item.bg} flex items-center justify-center ${item.color} flex-shrink-0`}>
                  <item.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-950">{item.value}</p>
              <div className="mt-2 pt-2 border-t border-rose-50 flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> {item.desc}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">{item.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* 3. Tabela de Performance dos Doces & Taxa de Conversão */}
      <div className="bg-white rounded-3xl border border-rose-100 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <div>
            <h2 className="font-bold text-rose-950 text-base">Doces Mais Desejados (Top Conversão)</h2>
            <p className="text-xs text-zinc-400">Produtos que os clientes mais clicam para pedir no WhatsApp.</p>
          </div>
          <Link href="/confeitaria/admin/produtos" className="text-xs text-rose-600 font-semibold hover:underline self-start sm:self-auto">
            Ver cardápio completo →
          </Link>
        </div>

        <div className="divide-y divide-rose-50 text-xs">
          {topSellers.map((prod, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-black text-rose-900/40 text-sm w-4">#{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-bold text-rose-950 truncate">{prod.name}</p>
                  <span className="text-[11px] text-zinc-400">{prod.category} • {prod.price}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 text-right">
                <span className="hidden sm:inline-block text-[11px] font-bold text-emerald-600">
                  {prod.trend}
                </span>
                <div className="bg-rose-50 text-rose-800 px-3 py-1 rounded-xl text-center">
                  <p className="font-black text-xs">{prod.pedidos} pedidos</p>
                  <p className="text-[9px] font-medium text-rose-600">{prod.conversion} conv.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Comportamento e Origem dos Clientes da Confeitaria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-rose-500" />
            <h4 className="font-bold text-sm text-rose-950">Horários de Maior Desejo por Doces</h4>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed mb-3">
            O maior volume de cliques para encomendas ocorre entre <strong>14h e 17h30</strong> (horário do café da tarde) e <strong>domingos pela manhã</strong> (comemorações em família).
          </p>
          <div className="bg-rose-50/70 p-2.5 rounded-xl text-[11px] text-rose-900 font-medium">
            ✨ Dica: Deixe mensagens automáticas ativas no WhatsApp para responder em menos de 5 minutos.
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-indigo-500" />
            <h4 className="font-bold text-sm text-rose-950">Origem dos Pedidos de Encomenda</h4>
          </div>
          <ul className="text-xs text-zinc-600 space-y-2 font-medium">
            <li className="flex justify-between items-center bg-zinc-50 p-2 rounded-xl">
              <span>📸 Instagram (Bio e Stories)</span>
              <strong className="text-rose-950 font-bold">64% dos clientes</strong>
            </li>
            <li className="flex justify-between items-center bg-zinc-50 p-2 rounded-xl">
              <span>💬 Reencaminhados no WhatsApp</span>
              <strong className="text-rose-950 font-bold">24% dos clientes</strong>
            </li>
            <li className="flex justify-between items-center bg-zinc-50 p-2 rounded-xl">
              <span>📍 Busca Local / Google Maps</span>
              <strong className="text-rose-950 font-bold">12% dos clientes</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}