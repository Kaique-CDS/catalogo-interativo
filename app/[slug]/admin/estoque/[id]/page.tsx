'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import VehicleForm from '@/components/admin/VehicleForm'
import type { Vehicle } from '@/lib/supabase/types'
import { getVehicles } from '@/lib/vehicles'

export default function EditarVeiculoPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [id, setId] = useState<string>('')
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(undefined)
  const [storeId, setStoreId] = useState('demo-store-id')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug)
      setId(p.id)
    })
  }, [params])

  useEffect(() => {
    async function loadVehicle() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
        try {
          const supabase = createClient()
          const { data: store } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle()
          if (store) {
            setStoreId(store.id)
            const { data: v } = await supabase.from('vehicles').select('*').eq('id', id).eq('store_id', store.id).single()
            if (v) setVehicle(v)
          }
        } catch (e) {
          console.error(e)
        }
      } else {
        const v = getVehicles().find(v => v.id === id)
        if (v) setVehicle(v)
      }
      setLoading(false)
    }

    if (slug && id) {
      loadVehicle()
    }
  }, [slug, id])

  if (!slug || !id || loading) return null

  if (!vehicle && !loading) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Editar Veículo</h1>
      <p className="text-zinc-500 mb-6 text-xs">Atualize os dados, fotos, especificações e status de publicação do veículo.</p>
      <VehicleForm slug={slug} storeId={storeId} vehicle={vehicle} />
    </div>
  )
}