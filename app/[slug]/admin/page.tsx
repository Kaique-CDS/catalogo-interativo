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

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Dashboard</h1>
      <p className="text-zinc-500 mb-6">Visão geral do seu catálogo</p>
      <StatsCards totalVehicles={totalVehicles} activeVehicles={activeVehicles} slug={slug} />
    </div>
  )
}