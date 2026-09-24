'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Car, CheckCircle, Archive, Plus, Users, MessageCircle, Clock, Smartphone, TrendingUp, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  totalVehicles: number
  activeVehicles: number
  slug: string
}

export default function StatsCards({ totalVehicles, activeVehicles, slug }: Props) {
  const inactiveVehicles = totalVehicles - activeVehicles

  const metrics = [
    {
      title: 'Cliques no WhatsApp',
      value: '184',
      change: '+32% esta semana',
      icon: MessageCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      desc: 'Clientes que abriram conversa'
    },
    {
      title: 'Acessos Totais',
      value: '2.490',
      change: '88% via Smartphone',
      icon: Smartphone,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      desc: 'Tráfego Instagram / Google'
    },
    {
      title: 'Tempo Médio na Vitrine',
      value: '3m 42s',
      change: 'Alta retenção',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      desc: 'Média de navegação no estoque'
    },
    {
      title: 'Taxa de Conversão',
      value: '7.4%',
      change: 'Meta do mercado: 3.5%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      desc: 'Visitantes que viram lead'
    }
  ]

  const topInterestVehicles = [
    { title: 'Honda Civic Touring 1.5 Turbo', year: 2023, price: 'R$ 154.900', views: 840, leads: 54, conversion: '6.4%' },
    { title: 'Toyota Corolla XEi 2.0 Dynamic', year: 2023, price: 'R$ 139.900', views: 620, leads: 48, conversion: '7.7%' },
    { title: 'Jeep Compass Longitude T270', year: 2022, price: 'R$ 136.900', views: 510, leads: 42, conversion: '8.2%' },
    { title: 'Volkswagen T-Cross Highline 250', year: 2023, price: 'R$ 122.900', views: 430, leads: 31, conversion: '7.2%' },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Métricas de Alto Impacto Comercial (Analytics de Conversão) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m, idx) => (
          <Card key={idx} className="border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-2xs bg-white dark:bg-zinc-950">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-500 truncate">{m.title}</span>
                <div className={`h-8 w-8 rounded-xl ${m.bg} ${m.color} flex items-center justify-center flex-shrink-0`}>
                  <m.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">{m.value}</p>
              <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" /> {m.change}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">{m.desc}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Status Rápido do Estoque */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <CardContent className="p-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Veículos no Estoque</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 mt-0.5">{totalVehicles}</p>
            </div>
            <div className="hidden sm:flex h-9 w-9 rounded-xl bg-zinc-100 items-center justify-center text-zinc-600 dark:text-zinc-400">
              <Car className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <CardContent className="p-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Anúncios Publicados</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{activeVehicles}</p>
            </div>
            <div className="hidden sm:flex h-9 w-9 rounded-xl bg-emerald-50 items-center justify-center text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
          <CardContent className="p-4 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-zinc-500 font-medium">Pausados / Reservados</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-400 mt-0.5">{inactiveVehicles}</p>
            </div>
            <div className="hidden sm:flex h-9 w-9 rounded-xl bg-zinc-100 items-center justify-center text-zinc-400">
              <Archive className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Destaque Comercial: Inteligência de Vendas (Carros Mais Buscados) */}
      <div className="bg-white rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-zinc-900 text-sm sm:text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Ranking de Interesse do Cliente (O que mais vende)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Dados baseados em visualizações e taxa de cliques no botão Tenho Interesse.</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
            Últimos 30 dias
          </span>
        </div>

        <div className="divide-y divide-zinc-100 text-xs">
          {topInterestVehicles.map((v, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-black text-zinc-300 text-sm w-4">#{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 truncate">{v.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{v.year} • {v.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 text-right">
                <div className="hidden sm:block">
                  <p className="font-bold text-zinc-900 dark:text-zinc-50">{v.views}</p>
                  <p className="text-[10px] text-zinc-400">visualizações</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl text-center">
                  <p className="font-black text-xs">{v.leads} leads</p>
                  <p className="text-[9px] font-medium text-emerald-600">{v.conversion} conv.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Insights de Horários de Pico dos Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Comportamento do Cliente</span>
          <h4 className="font-bold text-base mt-1 mb-2">🔥 Horário de Maior Fechamento</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Seus clientes entram em contato com mais intensidade entre <strong>12h às 14h</strong> e <strong>18h30 às 21h</strong>. Mantenha sua equipe rápida no WhatsApp nesses horários para não perder vendas!
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">Origem dos Compradores</span>
          <h4 className="font-bold text-base text-indigo-950 mt-1 mb-2">📱 Canais que mais geram vendas</h4>
          <ul className="text-xs text-indigo-900/80 space-y-1.5 font-medium">
            <li className="flex justify-between"><span>1. Link da Bio do Instagram</span><strong className="text-indigo-950">58% dos leads</strong></li>
            <li className="flex justify-between"><span>2. Anúncios Meta Ads (Facebook/Insta)</span><strong className="text-indigo-950">27% dos leads</strong></li>
            <li className="flex justify-between"><span>3. Indicação direta & Google Busca</span><strong className="text-indigo-950">15% dos leads</strong></li>
          </ul>
        </div>
      </div>
    </div>
  )
}