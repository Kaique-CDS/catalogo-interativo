'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import VehicleTable from '@/components/admin/VehicleTable'
import type { Vehicle } from '@/lib/supabase/types'
import { getVehicles } from '@/lib/vehicles'

export default function EstoquePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    async function loadVehicles() {
      let vData = getVehicles()
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        try {
          const supabase = createClient()
          const { data: store } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle()
          if (store) {
            const { data: remoteData } = await supabase
              .from('vehicles').select('*').eq('store_id', store.id).order('created_at', { ascending: false })
            if (remoteData && remoteData.length > 0) vData = remoteData
          }
        } catch (e) {
          console.error(e)
        }
      }
      setVehicles(vData)
    }
    
    if (slug) {
      loadVehicles()
    }
  }, [slug])

  if (!slug) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Estoque</h1>
          <p className="text-zinc-500 text-xs">Gerencie, edite e altere a publicação dos veículos do catálogo.</p>
        </div>
        <Link href={`/${slug}/admin/estoque/novo`}>
          <Button className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold">
            <Plus className="h-4 w-4" />Novo Veículo
          </Button>
        </Link>
      </div>
      <VehicleTable vehicles={vehicles} slug={slug} />
    </div>
  )
}