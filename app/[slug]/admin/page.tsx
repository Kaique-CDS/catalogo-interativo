'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getVehicles } from '@/lib/vehicles'
import type { Vehicle } from '@/lib/supabase/types'
import { 
  Car, CheckCircle2, EyeOff, Plus, AlertTriangle, ImageOff, FileText, 
  Clock, Database, ArrowRight, Camera, MousePointerClick, TrendingUp, 
  Users, Share2, MessageCircle, BarChart3, Smartphone, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => { params.then(p => setSlug(p.slug)) }, [params])
  useEffect(() => {
    if (slug) setVehicles(getVehicles())
  }, [slug])

  if (!slug) return null

  const totalVehicles = vehicles.length
  const activeVehicles = vehicles.filter(v => v.is_active).length
  const inactiveVehicles = totalVehicles - activeVehicles
  
  // Storage estimation
  const totalImages = vehicles.reduce((acc, v) => acc + (v.images?.length || 0), 0)
  
  // Alertas reais
  const noPhotos = vehicles.filter(v => !v.images || v.images.length === 0)
  const noDescription = vehicles.filter(v => !v.description || v.description.trim().length < 10)
  
  // Atividade
  const recentlyAdded = [...vehicles].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 4)

  // ==========================================
  // MÉTRICAS SIMULADAS DE MARKETING/VENDAS
  // ==========================================
  const totalViews = 12450
  const whatsappClicks = 312
  const conversionRate = ((whatsappClicks / totalViews) * 100).toFixed(1)

  const marketingCards = [
    { label: 'Acessos na Vitrine', value: '12.450', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', trend: '+12% este mês' },
    { label: 'Cliques no WhatsApp', value: '312', icon: MessageCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', trend: '+5% este mês' },
    { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', trend: 'Cliques por acesso' },
    { label: 'Compartilhamentos', value: '84', icon: Share2, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', trend: 'Links enviados' },
  ]

  const trafficSources = [
    { name: 'Instagram (Bio/Stories)', value: 65, color: 'bg-pink-500' },
    { name: 'Google Busca', value: 20, color: 'bg-blue-500' },
    { name: 'Acesso Direto (Link)', value: 10, color: 'bg-zinc-500' },
    { name: 'Facebook', value: 5, color: 'bg-indigo-500' },
  ]

  const topVehicles = vehicles.filter(v => v.is_active).slice(0, 3).map((v, i) => ({
    ...v,
    views: 1540 - (i * 380),
    clicks: 45 - (i * 12)
  }))

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Painel de Inteligência</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Métricas de tráfego e comportamento dos clientes nos últimos 30 dias.</p>
        </div>
        <Link href={`/${slug}/admin/estoque/novo`}>
          <Button size="sm" className="bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white text-xs font-bold rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar Carro
          </Button>
        </Link>
      </div>

      {/* Métricas de Marketing (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {marketingCards.map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <div className={`h-8 w-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.value}</p>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{kpi.label}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{kpi.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Origem de Tráfego */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs lg:col-span-1">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-blue-500" /> De onde vêm os clientes?
          </h2>
          <div className="space-y-4">
            {trafficSources.map((source, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{source.name}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{source.value}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${source.color}`} style={{ width: `${source.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-5 leading-relaxed">
            A maior parte do seu público chega pelo <strong>Instagram</strong>. Recomendamos continuar postando o link da sua vitrine nos Stories.
          </p>
        </div>

        {/* Veículos Mais Populares */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs lg:col-span-2">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-emerald-500" /> Veículos Mais Desejados (Top 3)
          </h2>
          {topVehicles.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400">Nenhum veículo ativo no estoque para gerar métricas.</div>
          ) : (
            <div className="space-y-3">
              {topVehicles.map((v, i) => (
                <Link key={v.id} href={`/${slug}/admin/estoque/${v.id}`} className="flex items-center gap-4 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="h-10 w-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 relative overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {v.images?.[0] ? <img src={v.images[0]} className="w-full h-full object-cover" alt="Car" /> : <Car className="h-4 w-4 absolute top-3 left-5 text-zinc-400" />}
                    <div className="absolute top-0 left-0 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg">{i + 1}º</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{v.title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{v.brand} • R$ {v.price.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-4 shrink-0 text-right">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{v.views}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Visualizações</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{v.clicks}</p>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Cliques no Zap</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operacional & Estoque Geral */}
      <h2 className="text-sm font-bold text-zinc-900 dark:text-white pt-2 border-t border-zinc-200 dark:border-zinc-800">
        Visão Geral do Estoque & Alertas
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2"><Car className="h-4 w-4" /></div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">{totalVehicles}/40</p>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Carros Cadastrados</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2"><CheckCircle2 className="h-4 w-4" /></div>
          <p className="text-xl font-black text-zinc-900 dark:text-white">{activeVehicles}</p>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Publicados na Vitrine</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs col-span-2 flex flex-col justify-center">
          {noPhotos.length === 0 && noDescription.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5" /> Vitrine 100% Otimizada!
            </div>
          ) : (
            <div className="space-y-2">
              {noPhotos.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <ImageOff className="h-3.5 w-3.5" /> {noPhotos.length} veículo(s) sem foto
                </div>
              )}
              {noDescription.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <FileText className="h-3.5 w-3.5" /> {noDescription.length} veículo(s) sem descrição
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}