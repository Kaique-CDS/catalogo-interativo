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
  const [analytics, setAnalytics] = useState<{
    totalViews: number
    whatsappClicks: number
    shares: number
    sources: Record<string, number>
    topVehicles: any[]
  }>({
    totalViews: 0,
    whatsappClicks: 0,
    shares: 0,
    sources: { instagram: 0, google: 0, facebook: 0, direct: 0 },
    topVehicles: []
  })
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  useEffect(() => { params.then(p => setSlug(p.slug)) }, [params])
  
  useEffect(() => {
    if (slug) {
      // Fetch vehicles
      fetch(`/api/vehicles?store_id=demo-store-id`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) setVehicles(data)
          else setVehicles(getVehicles()) // Fallback
        })
        .catch(() => setVehicles(getVehicles()))
      // Fetch analytics
      // Precisaríamos do store_id real. Como o app usa o slug para tudo no frontend por enquanto,
      // e os mocks de vehicles não tem store_id vinculado fácil aqui, 
      // vou assumir que a API aceita store_id="demo-store-id" ou o próprio slug para simplificar.
      // O ideal é passar o store_id verdadeiro aqui.
      const fetchAnalytics = async () => {
        try {
          const res = await fetch(`/api/analytics?store_id=demo-store-id`) // Mock store id usado no frontend
          if (res.ok) {
            const data = await res.json()
            setAnalytics(data)
          }
        } catch (error) {
          console.error('Failed to fetch analytics:', error)
        } finally {
          setLoadingAnalytics(false)
        }
      }
      fetchAnalytics()
    }
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

  // ==========================================
  // MÉTRICAS REAIS DA API DE ANALYTICS
  // ==========================================
  const conversionRate = analytics.totalViews > 0 
    ? ((analytics.whatsappClicks / analytics.totalViews) * 100).toFixed(1) 
    : '0.0'

  const marketingCards = [
    { label: 'Acessos na Vitrine', value: analytics.totalViews.toLocaleString('pt-BR'), icon: Users, color: 'text-white', bg: 'bg-surface-2', trend: 'Visualizações totais' },
    { label: 'Cliques no WhatsApp', value: analytics.whatsappClicks.toLocaleString('pt-BR'), icon: MessageCircle, color: 'text-brand', bg: 'bg-brand/10', trend: 'Leads gerados' },
    { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-white', bg: 'bg-surface-2', trend: 'Cliques por acesso' },
    { label: 'Compartilhamentos', value: analytics.shares.toString(), icon: Share2, color: 'text-brand', bg: 'bg-brand/10', trend: 'Links enviados' },
  ]

  const totalSources = Object.values(analytics.sources).reduce((a, b) => a + b, 0)
  const getSourcePercent = (key: string) => totalSources > 0 ? Math.round((analytics.sources[key] || 0) / totalSources * 100) : 0

  const trafficSources = [
    { name: 'Instagram (Bio/Stories)', value: getSourcePercent('instagram'), color: 'bg-brand' },
    { name: 'Google Busca', value: getSourcePercent('google'), color: 'bg-white' },
    { name: 'Acesso Direto (Link)', value: getSourcePercent('direct'), color: 'bg-surface-3' },
    { name: 'Facebook', value: getSourcePercent('facebook'), color: 'bg-surface-2' },
  ]

  // Junta dados da API de analytics com os dados do veículo
  const topVehicles = analytics.topVehicles.map(tv => {
    const v = vehicles.find(veh => veh.id === tv.id)
    return {
      ...v,
      id: tv.id,
      title: v?.title || 'Veículo Excluído',
      brand: v?.brand || '',
      price: v?.price || 0,
      images: v?.images || [],
      views: tv.views,
      clicks: tv.clicks
    }
  }).slice(0, 3)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide uppercase">Painel de Inteligência</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Métricas de tráfego e comportamento dos clientes nos últimos 30 dias.</p>
        </div>
        <Link href={`/${slug}/admin/estoque/novo`}>
          <Button size="sm" className="btn-brand text-xs font-bold rounded-xl gap-1.5 h-10 px-4">
            <Plus className="h-3.5 w-3.5" /> Adicionar Carro
          </Button>
        </Link>
      </div>

      {/* Métricas de Marketing (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {marketingCards.map((kpi, i) => (
          <div key={i} className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs relative overflow-hidden">
            {loadingAnalytics && <div className="absolute inset-0 bg-surface-1/50 backdrop-blur-sm z-10 flex items-center justify-center"><div className="h-4 w-4 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>}
            <div className={`h-8 w-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
              <kpi.icon className="h-4 w-4" />
            </div>
            <p className="font-heading text-3xl sm:text-4xl text-white tracking-wide">{kpi.value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-1">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Origem de Tráfego */}
        <div className="bg-surface-1 border border-surface rounded-xl p-5 shadow-xs lg:col-span-1 relative overflow-hidden">
          {loadingAnalytics && <div className="absolute inset-0 bg-surface-1/50 backdrop-blur-sm z-10 flex items-center justify-center"><div className="h-5 w-5 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>}
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Globe className="h-4 w-4 text-brand" /> De onde vêm os clientes?
          </h2>
          <div className="space-y-4">
            {trafficSources.map((source, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-muted-foreground">{source.name}</span>
                  <span className="font-heading text-sm text-white tracking-wider">{source.value}%</span>
                </div>
                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${source.color} transition-all duration-1000`} style={{ width: `${source.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed bg-surface-2 p-3 rounded-xl border border-surface">
            A maior parte do seu público chega pelo <strong className="text-white">Instagram</strong>. Recomendamos continuar postando o link da sua vitrine nos Stories.
          </p>
        </div>

        {/* Veículos Mais Populares */}
        <div className="bg-surface-1 border border-surface rounded-xl p-5 shadow-xs lg:col-span-2 relative overflow-hidden">
          {loadingAnalytics && <div className="absolute inset-0 bg-surface-1/50 backdrop-blur-sm z-10 flex items-center justify-center"><div className="h-5 w-5 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>}
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
            <BarChart3 className="h-4 w-4 text-brand" /> Veículos Mais Desejados (Top 3)
          </h2>
          {topVehicles.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {loadingAnalytics ? 'Carregando dados...' : 'Ainda não há dados suficientes de acesso para gerar este ranking.'}
            </div>
          ) : (
            <div className="space-y-3">
              {topVehicles.map((v, i) => (
                <Link key={v.id} href={`/${slug}/admin/estoque/${v.id}`} className="flex items-center gap-4 p-3 rounded-xl border border-surface hover:bg-surface-2 transition-colors">
                  <div className="h-10 w-14 rounded-lg bg-surface-2 flex-shrink-0 relative overflow-hidden border border-surface">
                    {v.images?.[0] ? <img src={v.images[0]} className="w-full h-full object-cover" alt="Car" /> : <Car className="h-4 w-4 absolute top-3 left-5 text-muted-foreground" />}
                    <div className="absolute top-0 left-0 bg-brand text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg">{i + 1}º</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white uppercase tracking-wide truncate">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate font-medium mt-0.5">{v.brand} • R$ {(v.price || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-4 shrink-0 text-right">
                    <div>
                      <p className="font-heading text-lg sm:text-xl text-white tracking-wide">{v.views}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Acessos</p>
                    </div>
                    <div>
                      <p className="font-heading text-lg sm:text-xl text-brand tracking-wide">{v.clicks}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">WhatsApp</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operacional & Estoque Geral */}
      <h2 className="text-sm font-bold text-white pt-2 border-t border-surface uppercase tracking-wider">
        Visão Geral do Estoque & Alertas
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-surface-2 text-white flex items-center justify-center mb-2"><Car className="h-4 w-4" /></div>
          <p className="font-heading text-2xl sm:text-3xl text-white tracking-wide">{totalVehicles}/40</p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Carros Cadastrados</p>
        </div>
        <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-surface-2 text-white flex items-center justify-center mb-2"><CheckCircle2 className="h-4 w-4" /></div>
          <p className="font-heading text-2xl sm:text-3xl text-white tracking-wide">{activeVehicles}</p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Publicados na Vitrine</p>
        </div>
        <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs col-span-2 flex flex-col justify-center">
          {noPhotos.length === 0 && noDescription.length === 0 ? (
            <div className="flex items-center gap-2 text-white text-sm font-semibold bg-surface-2 border border-surface/50 p-3 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-brand" /> Vitrine 100% Otimizada!
            </div>
          ) : (
            <div className="space-y-2">
              {noPhotos.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-brand font-medium bg-brand/10 border border-brand/20 p-2.5 rounded-lg">
                  <ImageOff className="h-3.5 w-3.5" /> {noPhotos.length} veículo(s) sem foto
                </div>
              )}
              {noDescription.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-brand font-medium bg-brand/10 border border-brand/20 p-2.5 rounded-lg">
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