'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getVehicles } from '@/lib/vehicles'
import type { Vehicle } from '@/lib/supabase/types'
import { Car, CheckCircle2, EyeOff, Plus, AlertTriangle, ImageOff, FileText, Clock, TrendingUp, Database, ArrowRight, Camera } from 'lucide-react'
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
  
  // Real alerts
  const noPhotos = vehicles.filter(v => !v.images || v.images.length === 0)
  const noDescription = vehicles.filter(v => !v.description || v.description.trim().length < 10)
  const recentlyAdded = [...vehicles].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5)
  
  // Storage estimation (avg 1.2MB per image)
  const totalImages = vehicles.reduce((acc, v) => acc + (v.images?.length || 0), 0)
  const estimatedStorageMB = totalImages * 1.2
  const storageLimitMB = 5 * 1024 // 5GB in MB
  const storagePercent = Math.min((estimatedStorageMB / storageLimitMB) * 100, 100)

  const formatBytes = (mb: number) => mb > 1024 ? `${(mb/1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`

  const statCards = [
    { label: 'Total no Estoque', value: totalVehicles, max: 40, icon: Car, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', subtext: `${40 - totalVehicles} vagas disponíveis` },
    { label: 'Publicados na Vitrine', value: activeVehicles, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', subtext: 'Visíveis para compradores' },
    { label: 'Ocultos / Pausados', value: inactiveVehicles, icon: EyeOff, color: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800', subtext: 'Fora da vitrine pública' },
    { label: 'Total de Fotos', value: totalImages, icon: Camera, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30', subtext: `Média: ${totalVehicles > 0 ? (totalImages/totalVehicles).toFixed(1) : 0} por carro` },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Painel do Lojista</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Controle em tempo real do seu catálogo.</p>
        </div>
        <Link href={`/${slug}/admin/estoque/novo`}>
          <Button size="sm" className="bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white text-xs font-bold rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Adicionar Carro
          </Button>
        </Link>
      </div>

      {/* Storage Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
          <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-zinc-700 dark:text-zinc-300">Armazenamento: <span className="font-bold">{formatBytes(estimatedStorageMB)}</span> usados</span>
            <span className="text-zinc-400">Plano: 5 GB</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storagePercent > 85 ? 'bg-rose-500' : storagePercent > 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
              style={{ width: `${storagePercent}%` }} />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">{totalImages} fotos cadastradas · estimativa baseada em 1.2 MB/foto</p>
        </div>
        <Link href={`/${slug}/admin/estoque`} className="shrink-0">
          <Button size="sm" variant="outline" className="text-xs rounded-xl dark:border-zinc-700 dark:text-zinc-300 w-full sm:w-auto">Ver Estoque <ArrowRight className="h-3 w-3 ml-1" /></Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
            <div className={`h-8 w-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{s.value}{s.max ? <span className="text-sm font-normal text-zinc-400">/{s.max}</span> : ''}</p>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{s.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Alertas do Catálogo
          </h2>
          {noPhotos.length === 0 && noDescription.length === 0 ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Nenhum alerta! Catálogo completo. 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {noPhotos.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-400">{noPhotos.length} carro(s) sem foto</span>
                  </div>
                  {noPhotos.slice(0, 3).map(v => (
                    <Link key={v.id} href={`/${slug}/admin/estoque/${v.id}`}>
                      <p className="text-xs text-amber-700 dark:text-amber-400/80 hover:underline truncate">• {v.title}</p>
                    </Link>
                  ))}
                </div>
              )}
              {noDescription.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-sm font-bold text-rose-800 dark:text-rose-400">{noDescription.length} carro(s) sem descrição</span>
                  </div>
                  {noDescription.slice(0, 3).map(v => (
                    <Link key={v.id} href={`/${slug}/admin/estoque/${v.id}`}>
                      <p className="text-xs text-rose-700 dark:text-rose-400/80 hover:underline truncate">• {v.title}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Atividade Recente */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" /> Adicionados Recentemente
          </h2>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {recentlyAdded.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">Nenhum veículo cadastrado ainda.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentlyAdded.map(v => (
                  <Link key={v.id} href={`/${slug}/admin/estoque/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${v.is_active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{v.title}</p>
                      <p className="text-[10px] text-zinc-400">{v.brand} · {v.year} · {v.images?.length || 0} fotos</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${v.is_active ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                      {v.is_active ? 'Ativo' : 'Oculto'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}