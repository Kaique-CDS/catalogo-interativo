'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCards from '@/components/admin/StatsCards'
import { getVehicles } from '@/lib/vehicles'

export default function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [totalVehicles, setTotalVehicles] = useState(0)
  const [activeVehicles, setActiveVehicles] = useState(0)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    async function loadStats() {
      let tVehicles = 0
      let aVehicles = 0

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        try {
          const supabase = createClient()
          const { data: store } = await supabase
            .from('stores').select('id, name').eq('slug', slug).single()

          if (store) {
            const { count: total } = await supabase
              .from('vehicles').select('id', { count: 'exact', head: true }).eq('store_id', store.id)
            const { count: active } = await supabase
              .from('vehicles').select('id', { count: 'exact', head: true })
              .eq('store_id', store.id).eq('is_active', true)
            tVehicles = total ?? 0
            aVehicles = active ?? 0
          }
        } catch(e) {}
      } else {
        const localVehicles = getVehicles()
        tVehicles = localVehicles.length
        aVehicles = localVehicles.filter(v => v.is_active).length
      }

      setTotalVehicles(tVehicles)
      setActiveVehicles(aVehicles)
    }

    if (slug) {
      loadStats()
    }
  }, [slug])

  if (!slug) return null

  // Dados simulados de limite de armazenamento para o lojista
  const dbUsage = 2.4 * 1024 * 1024 * 1024 // 2.4 GB
  const dbLimit = 10 * 1024 * 1024 * 1024 // 10 GB
  const usagePercentage = (dbUsage / dbLimit) * 100

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals))} ${sizes[i]}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Dashboard</h1>
        <p className="text-zinc-500">Visão geral do seu catálogo</p>
      </div>
      
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
            Espaço de Armazenamento (Imagens e Dados)
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Plano Atual: <span className="font-bold text-indigo-600">Premium</span></p>
        </div>
        
        <div className="flex-1 w-full max-w-sm">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-zinc-700">{formatBytes(dbUsage)} utilizados</span>
            <span className="text-zinc-400">Total: {formatBytes(dbLimit)}</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${usagePercentage > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1.5 text-right">
            Você ainda tem {formatBytes(dbLimit - dbUsage)} disponíveis
          </p>
        </div>

        <button className="shrink-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-colors">
          Fazer Upgrade
        </button>
      </div>

      <StatsCards totalVehicles={totalVehicles} activeVehicles={activeVehicles} slug={slug} />
    </div>
  )
}