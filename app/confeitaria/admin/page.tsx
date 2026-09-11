'use client'

import React from 'react'
import Link from 'next/link'
import { Cake, ShoppingBag, Eye, Heart, Plus, Sparkles, TrendingUp, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function ConfeitariaDashboardPage() {
  const stats = [
    { title: 'Itens no Cardápio', value: '18', desc: '4 categorias ativas', icon: Cake, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Cliques no WhatsApp', value: '142', desc: '+28% essa semana', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Visualizações do Catálogo', value: '1.890', desc: 'Últimos 30 dias', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]

  const topSellers = [
    { name: 'Bolo Red Velvet Supreme', category: 'Bolos Festivos', price: 'R$ 185,00', pedidos: 34, status: 'Mais Vendido' },
    { name: 'Bento Cake Personalizado Divertido', category: 'Bento Cakes', price: 'R$ 55,00', pedidos: 52, status: 'Sucesso' },
    { name: 'Caixa Degustação de Brigadeiros (12 un)', category: 'Doces Finos', price: 'R$ 48,00', pedidos: 29, status: 'Pronta Entrega' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-rose-950 tracking-tight">Visão Geral do Ateliê 🍓</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Acompanhe a performance do seu cardápio e leads recebidos.</p>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((item, idx) => (
          <Card key={idx} className="border-rose-100/70 shadow-xs bg-white rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-500">{item.title}</p>
                <p className="text-3xl font-black text-rose-950 mt-1">{item.value}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> {item.desc}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Card de Ação Rápida */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-md shadow-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
            Dica de Conversão
          </span>
          <h3 className="text-lg font-bold mt-2">Adicione os sabores da temporada de Páscoa ou Natal!</h3>
          <p className="text-xs text-rose-100 mt-1 max-w-xl">
            Bolos temáticos aumentam em até 4x os pedidos no WhatsApp durante semanas comemorativas.
          </p>
        </div>
        <Link href="/confeitaria/admin/produtos/novo">
          <Button className="bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl shadow-xs whitespace-nowrap">
            + Criar Item Temático
          </Button>
        </Link>
      </div>

      {/* Tabela de Destaques */}
      <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-rose-950 text-base">Doces Mais Clicados no WhatsApp</h2>
          <Link href="/confeitaria/admin/produtos" className="text-xs text-rose-600 font-semibold hover:underline">
            Ver cardápio completo →
          </Link>
        </div>

        <div className="divide-y divide-rose-50 text-xs">
          {topSellers.map((prod, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-rose-900/40 text-sm">#{i + 1}</span>
                <div>
                  <p className="font-bold text-rose-950">{prod.name}</p>
                  <span className="text-[11px] text-zinc-400">{prod.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-semibold text-rose-950">{prod.price}</span>
                <span className="bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                  {prod.pedidos} leads
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}