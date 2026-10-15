'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getVehicles } from '@/lib/vehicles'
import type { Vehicle } from '@/lib/supabase/types'
import { 
  Car, CheckCircle2, EyeOff, Plus, AlertTriangle, ImageOff, FileText, 
  Clock, Database, ArrowRight, Camera, MousePointerClick, TrendingUp, 
  Users, Share2, MessageCircle, BarChart3, Smartphone, Globe, Copy, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [copiedSource, setCopiedSource] = useState<string | null>(null)
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
      fetch(`/api/vehicles?slug=${slug}`)
        .then(async res => {
          if (res.ok) {
            const data = await res.json()
            setVehicles(data || [])
          }
        })
        .catch(console.error)
        
      // Fetch analytics
      const fetchAnalytics = async () => {
        try {
          const res = await fetch(`/api/analytics?slug=${slug}`, { cache: 'no-store' }) 
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
    { label: 'Acessos na Vitrine', value: analytics.totalViews.toLocaleString('pt-BR'), icon: Users, color: 'text-brand', bg: 'bg-brand/10', trend: 'Visualizações totais' },
    { label: 'Cliques no WhatsApp', value: analytics.whatsappClicks.toLocaleString('pt-BR'), icon: MessageCircle, color: 'text-brand', bg: 'bg-brand/10', trend: 'Leads gerados' },
    { label: 'Taxa de Conversão', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/10', trend: 'Cliques por acesso' },
    { label: 'Compartilhamentos', value: analytics.shares.toString(), icon: Share2, color: 'text-brand', bg: 'bg-brand/10', trend: 'Links enviados' },
  ]

  const totalSources = Object.values(analytics.sources).reduce((a, b) => a + b, 0)
  const getSourcePercent = (key: string) => totalSources > 0 ? Math.round(((analytics.sources[key] || 0) / totalSources) * 100) : 0
  const getSourceCount = (key: string) => analytics.sources[key] || 0

  const trafficSources = [
    { key: 'instagram', name: 'Instagram (Bio/Stories)', count: getSourceCount('instagram'), value: getSourcePercent('instagram'), color: 'bg-[var(--chart-1,var(--brand-red))]' },
    { key: 'google', name: 'Google Busca', count: getSourceCount('google'), value: getSourcePercent('google'), color: 'bg-[var(--chart-2,#34d399)]' },
    { key: 'direct', name: 'Acesso Direto (Link)', count: getSourceCount('direct'), value: getSourcePercent('direct'), color: 'bg-[var(--chart-4,#a1a1aa)]' },
    { key: 'facebook', name: 'Facebook', count: getSourceCount('facebook'), value: getSourcePercent('facebook'), color: 'bg-[var(--chart-3,#3b82f6)]' },
  ]

  const leadingSource = [...trafficSources].sort((a, b) => b.count - a.count)[0]

  const copyTrackingLink = (refKey: string, label: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${origin}/${slug}?ref=${refKey}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedSource(refKey)
      toast.success(`Link de ${label} copiado!`, { description: link })
      setTimeout(() => setCopiedSource(null), 2000)
    }).catch(() => {
      toast.error('Não foi possível copiar o link.')
    })
  }

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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading text-heading tracking-wide uppercase leading-none">
            Painel de Inteligência
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            Métricas de tráfego e comportamento dos clientes nos últimos 30 dias.
          </p>
        </div>
        <Link href={`/${slug}/admin/estoque/novo`} className="w-full sm:w-auto">
          <Button size="sm" className="w-full sm:w-auto justify-center btn-brand text-xs font-bold rounded-xl gap-1.5 h-11 px-4">
            <Plus className="h-4 w-4" /> Adicionar Carro
          </Button>
        </Link>
      </div>

      {/* Métricas de Marketing (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {marketingCards.map((kpi, i) => (
          <div key={i} className="bg-surface-1 border border-surface rounded-xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden">
            {loadingAnalytics && <div className="absolute inset-0 bg-surface-1/50 backdrop-blur-sm z-10 flex items-center justify-center"><div className="h-4 w-4 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>}
            <div className={`h-8 w-8 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center mb-2.5`}>
              <kpi.icon className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-4xl text-heading tracking-wide leading-none">{kpi.value}</p>
            <p className="text-xs font-semibold text-foreground mt-1.5 leading-snug">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Origem de Tráfego */}
        <div className="bg-surface-1 border border-surface rounded-xl p-4 sm:p-5 shadow-xs lg:col-span-1 relative overflow-hidden">
          {loadingAnalytics && <div className="absolute inset-0 bg-surface-1/50 backdrop-blur-sm z-10 flex items-center justify-center"><div className="h-5 w-5 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>}
          <h2 className="text-xs sm:text-sm font-bold text-heading flex items-center gap-2 mb-4 uppercase tracking-wider">
            <Globe className="h-4 w-4 text-brand shrink-0" /> De onde vêm os clientes?
          </h2>
          <div className="space-y-4">
            {trafficSources.map((source) => (
              <div key={source.key}>
                <div className="flex justify-between items-baseline text-xs mb-1.5">
                  <span className="font-medium text-muted-foreground">{source.name}</span>
                  <span className="font-heading text-sm text-heading tracking-wider">
                    <span className="text-[11px] font-sans font-normal text-muted-foreground mr-1.5">({source.count})</span>
                    {source.value}%
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${source.color} transition-all duration-1000`}
                    style={{ width: `${source.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Links rápidos de rastreamento para Bio/Campanhas */}
          <div className="mt-4 pt-3.5 border-t border-surface">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Links para Bio &amp; Campanhas (1 toque para copiar)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'instagram', label: 'Instagram' },
                { key: 'facebook', label: 'Facebook' },
                { key: 'google', label: 'Google' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => copyTrackingLink(item.key, item.label)}
                  className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-surface text-[11px] font-semibold text-foreground active:scale-95 transition-all"
                >
                  {copiedSource === item.key ? (
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 text-brand shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3.5 leading-relaxed bg-surface-2 p-3 rounded-xl border border-surface">
            {totalSources > 0 && leadingSource ? (
              <>
                A maior parte do seu público chega por <strong className="text-foreground">{leadingSource.name}</strong> ({leadingSource.value}%). Continue divulgando o link nos Stories e na Bio!
              </>
            ) : (
              <>
                O sistema detecta automaticamente acessos vindos do <strong className="text-foreground">Instagram, Google e Facebook</strong> (inclusive pelos navegadores internos do iOS e Android).
              </>
            )}
          </p>
        </div>

        {/* Veículos Mais Populares */}
        <div className="bg-surface-1 border border-surface rounded-xl p-4 sm:p-5 shadow-xs lg:col-span-2 relative overflow-hidden">
          {loadingAnalytics && <div className="absolute inset-0 bg-surface-1/50 backdrop-blur-sm z-10 flex items-center justify-center"><div className="h-5 w-5 rounded-full border-2 border-brand border-t-transparent animate-spin" /></div>}
          <h2 className="text-xs sm:text-sm font-bold text-heading flex items-center gap-2 mb-4 uppercase tracking-wider">
            <BarChart3 className="h-4 w-4 text-brand shrink-0" /> Veículos Mais Desejados (Top 3)
          </h2>
          {topVehicles.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {loadingAnalytics ? 'Carregando dados...' : 'Ainda não há dados suficientes de acesso para gerar este ranking.'}
            </div>
          ) : (
            <div className="space-y-3">
              {topVehicles.map((v, i) => (
                <Link key={v.id} href={`/${slug}/admin/estoque/${v.id}`} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-surface hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-16 rounded-lg bg-surface-2 flex-shrink-0 relative overflow-hidden border border-surface">
                      {v.images?.[0] ? <img src={v.images[0]} className="w-full h-full object-cover" alt="Car" /> : <Car className="h-4 w-4 absolute top-4 left-6 text-muted-foreground" />}
                      <div className="absolute top-0 left-0 bg-brand text-white text-[9px] font-black px-1.5 py-0.5 rounded-br-lg">{i + 1}º</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide line-clamp-1">{v.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                        {v.brand} • <span className="text-price font-bold">{v.price && v.price > 0 ? `R$ ${v.price.toLocaleString('pt-BR')}` : 'Sob consulta'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface text-right">
                    <div className="flex sm:block items-center gap-1.5">
                      <p className="font-heading text-base sm:text-xl text-heading tracking-wide leading-none">{v.views}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider sm:mt-0.5">Acessos</p>
                    </div>
                    <div className="flex sm:block items-center gap-1.5">
                      <p className="font-heading text-base sm:text-xl text-brand tracking-wide leading-none">{v.clicks}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider sm:mt-0.5">WhatsApp</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operacional & Estoque Geral */}
      <h2 className="text-xs sm:text-sm font-bold text-heading pt-2 border-t border-surface uppercase tracking-wider">
        Visão Geral do Estoque &amp; Alertas
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-surface-3 text-brand flex items-center justify-center mb-2"><Car className="h-4 w-4" /></div>
          <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide">{totalVehicles}/50</p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Carros Cadastrados</p>
        </div>
        <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
          <div className="h-8 w-8 rounded-lg bg-surface-3 text-brand flex items-center justify-center mb-2"><CheckCircle2 className="h-4 w-4" /></div>
          <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide">{activeVehicles}</p>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Publicados na Vitrine</p>
        </div>
        <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs col-span-2 flex flex-col justify-center">
          {noPhotos.length === 0 && noDescription.length === 0 ? (
            <div className="flex items-center gap-2 text-foreground text-sm font-semibold bg-surface-2 border border-surface/50 p-3 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-brand shrink-0" /> Vitrine 100% Otimizada!
            </div>
          ) : (
            <div className="space-y-2">
              {noPhotos.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                  <ImageOff className="h-4 w-4 shrink-0" /> {noPhotos.length} veículo(s) sem foto
                </div>
              )}
              {noDescription.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 font-medium bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                  <FileText className="h-4 w-4 shrink-0" /> {noDescription.length} veículo(s) sem descrição
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}