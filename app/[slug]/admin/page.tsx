'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getVehicles } from '@/lib/vehicles'
import type { Vehicle } from '@/lib/supabase/types'
import { 
  Car, CheckCircle2, EyeOff, Plus, AlertTriangle, ImageOff, FileText, 
  Clock, Database, ArrowRight, Camera, MousePointerClick, TrendingUp, 
  Users, Share2, MessageCircle, BarChart3, Smartphone, Globe, Copy, Check,
  Zap, Calendar, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { calculateSalesMetrics, formatDateBR } from '@/lib/date-utils'
import { toast } from 'sonner'

function formatFriendlyChannel(raw: string): string {
  const s = String(raw || '').trim().toLowerCase()
  if (s === 'direct' || s === 'direto' || s === 'direto / não identificado') return 'Acesso Direto'
  if (s === 'google' || s === 'google (orgânico)') return 'Google Busca'
  if (s === 'google ads' || s === 'gads') return 'Google Ads'
  if (s === 'instagram' || s === 'ig') return 'Instagram'
  if (s === 'instagram (app)') return 'Instagram (app)'
  if (s === 'instagram ads') return 'Instagram Ads'
  if (s === 'facebook' || s === 'fb') return 'Facebook'
  if (s === 'facebook (app)') return 'Facebook (app)'
  if (s === 'facebook ads') return 'Facebook Ads'
  if (s === 'meta (facebook/instagram)') return 'Meta (Face/Insta)'
  if (s === 'whatsapp' || s === 'wa') return 'WhatsApp'
  if (s === 'olx') return 'OLX'
  if (s === 'webmotors') return 'Webmotors'
  if (s === 'icarros') return 'iCarros'
  if (s === 'linktree') return 'Linktree'
  if (s === 'tiktok') return 'TikTok'
  if (s === 'tiktok ads') return 'TikTok Ads'
  if (s === 'bing') return 'Bing'
  if (s === 'bing ads') return 'Bing Ads'
  if (s === 'outros sites' || s === 'outros canais') return 'Outros sites'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export default function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [copiedSource, setCopiedSource] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [salesPeriod, setSalesPeriod] = useState<'30d' | '90d' | '12m' | 'all'>('all')
  const [salesBrand, setSalesBrand] = useState<string>('all')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all')

  const [analytics, setAnalytics] = useState<{
    totalViews: number
    whatsappClicks: number
    shares: number
    sources: Record<string, number>
    trafficSourcesList?: Array<{
      key: string
      name: string
      count: number
      value: number
      color: string
    }>
    topVehicles: any[]
  }>({
    totalViews: 0,
    whatsappClicks: 0,
    shares: 0,
    sources: {},
    trafficSourcesList: [],
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
  const totalPhotos = vehicles.reduce((sum, v) => sum + (v.images?.length || 0), 0)
  
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
  
  const trafficSources = (analytics.trafficSourcesList && analytics.trafficSourcesList.length > 0
    ? analytics.trafficSourcesList
    : []).map((item) => ({
      ...item,
      name: formatFriendlyChannel(item.name),
    }))

  const leadingSource = trafficSources.length > 0 ? trafficSources[0] : null

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

  // ==========================================
  // MÉTRICAS DE TEMPO ATÉ A VENDA (PROMPT 5)
  // ==========================================
  const salesMetrics = calculateSalesMetrics(vehicles, salesPeriod, salesBrand, selectedVehicleId)
  const availableBrands = Array.from(new Set(vehicles.map(v => v.brand).filter(Boolean))).sort()
  const soldVehiclesList = vehicles.filter(v => v.status === 'vendido')

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading text-heading tracking-wide uppercase leading-none">
            Painel de Inteligência
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            Métricas de tráfego, vendas e comportamento dos clientes.
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
          {trafficSources.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground bg-surface-2/40 rounded-xl border border-surface p-4">
              Nenhum acesso registrado no período.
            </div>
          ) : (
            <div className="space-y-4">
              {trafficSources.map((source) => (
                <div key={source.key} title={`${source.name}: ${source.count} acesso(s) (${source.value}%)`}>
                  <div className="flex justify-between items-baseline text-xs mb-1.5">
                    <span className="font-medium text-muted-foreground truncate max-w-[190px]">{source.name}</span>
                    <span className="font-heading text-sm text-heading tracking-wider shrink-0">
                      <span className="text-[11px] font-sans font-normal text-muted-foreground mr-1.5" title={`${source.count} visitas`}>
                        ({source.count})
                      </span>
                      {source.value}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${source.color} transition-all duration-1000`}
                      style={{ width: `${Math.max(source.value, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  className="min-h-[44px] flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-surface text-[11px] font-semibold text-foreground active:scale-95 transition-all"
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
                O sistema classifica automaticamente todos os acessos vindos do <strong className="text-foreground">Instagram, Google, Facebook, WhatsApp, OLX, Webmotors</strong> e campanhas com UTMs.
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

      {/* ======================================================== */}
      {/* SEÇÃO TEMPO ATÉ A VENDA NO ESTOQUE (PROMPT 5)            */}
      {/* ======================================================== */}
      <div className="pt-4 border-t border-surface space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-heading flex items-center gap-2 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-brand shrink-0" />
              Tempo até a Venda &amp; Giro de Estoque
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Velocidade de saída dos veículos desde a data de entrada até a data da venda.
            </p>
          </div>

          {/* Filtros de Período e Marca */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-1 border border-surface p-1 rounded-xl">
              {[
                { key: '30d', label: '30 dias' },
                { key: '90d', label: '90 dias' },
                { key: '12m', label: '12 meses' },
                { key: 'all', label: 'Histórico' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSalesPeriod(p.key as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    salesPeriod === p.key
                      ? 'bg-surface-3 text-brand shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Filtro por Marca */}
            {availableBrands.length > 0 && (
              <div className="w-32 sm:w-36">
                <Select value={salesBrand} onValueChange={(val) => {
                  setSalesBrand(val)
                  setSelectedVehicleId('all')
                }}>
                  <SelectTrigger className="h-9 rounded-xl bg-surface-1 border-surface text-foreground text-xs">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-1 border-surface text-foreground rounded-xl text-xs">
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {availableBrands.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtro por Veículo Específico */}
            {soldVehiclesList.length > 0 && (
              <div className="w-48 sm:w-56">
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger className="h-9 rounded-xl bg-surface-1 border-surface text-foreground text-xs">
                    <SelectValue placeholder="Carro específico" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-1 border-surface text-foreground rounded-xl text-xs max-h-60">
                    <SelectItem value="all">Todos os carros ({soldVehiclesList.length})</SelectItem>
                    {soldVehiclesList.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de foco em veículo específico */}
        {selectedVehicleId !== 'all' && (
          <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 rounded-xl bg-brand/10 border border-brand/20 text-xs text-foreground animate-in fade-in">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-brand shrink-0" />
              <span>
                Visualizando tempo até a venda de: <strong className="text-brand font-bold">{vehicles.find(v => v.id === selectedVehicleId)?.title || selectedVehicleId}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedVehicleId('all')}
              className="text-[11px] font-bold text-brand hover:underline px-2 py-0.5 rounded-lg bg-surface-1 border border-surface shrink-0"
            >
              Ver todos os carros
            </button>
          </div>
        )}

        {/* Banner discreto para vendas antigas sem data registrada */}
        {salesMetrics.salesWithoutDateCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>{salesMetrics.salesWithoutDateCount} venda(s)</strong> registrada(s) sem data da venda informada. Elas constam no histórico da loja, mas não alteram o cálculo da média de dias.
            </span>
          </div>
        )}

        {/* Cards de Métricas de Venda */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card Principal: Tempo Médio */}
          <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-brand flex items-center justify-center mb-2">
              <Clock className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide">
              {salesMetrics.soldWithDatesCount > 0 ? `${salesMetrics.avgDays} dias` : '—'}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
              Tempo Médio até Vender
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {salesMetrics.soldWithDatesCount > 0
                ? `${salesMetrics.soldWithDatesCount} venda(s) computada(s)`
                : 'Sem vendas com data'}
            </p>
          </div>

          {/* Card: Total de Vendas */}
          <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide">
              {salesMetrics.totalSold}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
              Carros Vendidos
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              No período selecionado
            </p>
          </div>

          {/* Card: Venda Mais Rápida */}
          <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-amber-400 flex items-center justify-center mb-2">
              <Zap className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide">
              {salesMetrics.fastest ? `${salesMetrics.fastest.daysToSell} dias` : '—'}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
              Venda Mais Rápida
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={salesMetrics.fastest?.title}>
              {salesMetrics.fastest?.title || 'Nenhum registro'}
            </p>
          </div>

          {/* Card: Venda Mais Lenta */}
          <div className="bg-surface-1 border border-surface rounded-xl p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-muted-foreground flex items-center justify-center mb-2">
              <Calendar className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide">
              {salesMetrics.slowest ? `${salesMetrics.slowest.daysToSell} dias` : '—'}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">
              Maior Tempo no Pátio
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={salesMetrics.slowest?.title}>
              {salesMetrics.slowest?.title || 'Nenhum registro'}
            </p>
          </div>
        </div>

        {/* Gráfico de Evolução e Tabela Detalhada */}
        {salesMetrics.totalSold === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-surface bg-surface-1">
            <Car className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="font-bold text-sm text-heading">Nenhuma venda registrada no período</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Quando você marcar veículos como vendidos na página de Estoque informando a data da venda, o tempo médio e o gráfico de giro aparecerão aqui automaticamente.
            </p>
            <div className="mt-4">
              <Link href={`/${slug}/admin/estoque`}>
                <Button size="sm" variant="outline" className="text-xs rounded-xl border-surface">
                  Ir para Estoque <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gráfico Mensal */}
            {salesMetrics.chartData.length > 0 && (
              <div className="bg-surface-1 border border-surface rounded-xl p-4 sm:p-5 shadow-xs">
                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-bold text-heading uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-brand shrink-0" /> Evolução Mensal do Tempo até Vender (Média em dias)
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Média de dias decorridos entre a entrada no estoque e a saída do veículo por mês.
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesMetrics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.15)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} unit="d" />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          name === 'avgDays' ? `${value} dias` : value,
                          name === 'avgDays' ? 'Média de Dias' : 'Vendas Realizadas'
                        ]}
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fafafa',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="avgDays" name="avgDays" fill="var(--color-primary, #6366f1)" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tabela Detalhada de Veículos Vendidos */}
            <div className="bg-surface-1 border border-surface rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-surface flex items-center justify-between">
                <h3 className="text-xs font-bold text-heading uppercase tracking-wider">
                  Histórico Detalhado de Vendas ({salesMetrics.soldList.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-2 text-muted-foreground font-semibold border-b border-surface">
                    <tr>
                      <th className="px-4 py-2.5">Veículo</th>
                      <th className="px-4 py-2.5">Entrada no Estoque</th>
                      <th className="px-4 py-2.5">Data da Venda</th>
                      <th className="px-4 py-2.5">Tempo até Vender</th>
                      <th className="px-4 py-2.5 text-right">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface">
                    {salesMetrics.soldList.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-2 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-heading">
                          <button
                            type="button"
                            onClick={() => setSelectedVehicleId(item.id)}
                            className="text-left hover:text-brand transition-colors block font-bold"
                            title="Clique para filtrar apenas este veículo"
                          >
                            {item.title}
                          </button>
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            {item.brand} {item.model}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {item.createdDateBr}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {item.hasSoldDate ? item.soldDateBr : <span className="text-amber-500 italic">Não informada</span>}
                        </td>
                        <td className="px-4 py-2.5 font-bold">
                          {item.hasSoldDate ? (
                            <span className="text-emerald-400 font-bold">
                              {item.daysToSell} {item.daysToSell === 1 ? 'dia' : 'dias'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-black text-price">
                          {item.price ? `R$ ${item.price.toLocaleString('pt-BR')}` : 'Sob consulta'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Operacional & Estoque Geral */}
      <div className="space-y-3 pt-2 border-t border-surface">
        <h2 className="text-xs sm:text-sm font-bold text-heading uppercase tracking-wider">
          Visão Geral do Estoque
        </h2>

        {/* 4 Cards de Estoque Perfeitamente Alinhados (2 cols mobile, 4 cols desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-surface-1 border border-surface rounded-xl p-3.5 sm:p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-brand flex items-center justify-center mb-2.5">
              <Car className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide leading-none">
              {totalVehicles}<span className="text-sm font-sans font-normal text-muted-foreground">/50</span>
            </p>
            <p className="text-xs font-semibold text-foreground mt-1.5 leading-snug">Carros Cadastrados</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{Math.max(50 - totalVehicles, 0)} vagas disponíveis</p>
          </div>

          <div className="bg-surface-1 border border-surface rounded-xl p-3.5 sm:p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-emerald-500 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide leading-none">{activeVehicles}</p>
            <p className="text-xs font-semibold text-foreground mt-1.5 leading-snug">Publicados na Vitrine</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Visíveis para compradores</p>
          </div>

          <div className="bg-surface-1 border border-surface rounded-xl p-3.5 sm:p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-zinc-400 flex items-center justify-center mb-2.5">
              <EyeOff className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide leading-none">{inactiveVehicles}</p>
            <p className="text-xs font-semibold text-foreground mt-1.5 leading-snug">Ocultos / Pausados</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fora da vitrine pública</p>
          </div>

          <div className="bg-surface-1 border border-surface rounded-xl p-3.5 sm:p-4 shadow-xs">
            <div className="h-8 w-8 rounded-lg bg-surface-3 text-brand flex items-center justify-center mb-2.5">
              <Camera className="h-4 w-4" />
            </div>
            <p className="font-heading text-2xl sm:text-3xl text-heading tracking-wide leading-none">{totalPhotos}</p>
            <p className="text-xs font-semibold text-foreground mt-1.5 leading-snug">Fotos Cadastradas</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Média: {totalVehicles > 0 ? (totalPhotos / totalVehicles).toFixed(1) : 0} por carro
            </p>
          </div>
        </div>

        {/* Alertas Reais de Pendências - Renderiza SOMENTE se houver pendências (sem mensagem de otimizada) */}
        {(noPhotos.length > 0 || noDescription.length > 0) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 sm:p-4 space-y-2.5 mt-3">
            <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Pendências no Estoque
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {noPhotos.length > 0 && (
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 bg-surface-1/80 border border-amber-500/20 p-2.5 rounded-lg">
                  <ImageOff className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{noPhotos.length} veículo(s) sem foto cadastrada</span>
                </div>
              )}
              {noDescription.length > 0 && (
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 bg-surface-1/80 border border-amber-500/20 p-2.5 rounded-lg">
                  <FileText className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>{noDescription.length} veículo(s) sem descrição</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
