'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
      try {
        const res = await fetch(`/api/vehicles?slug=${slug}`)
        if (res.ok) {
          const data = await res.json()
          const v = data.find((veh: Vehicle) => veh.id === id)
          if (v) {
            setVehicle(v)
            setLoading(false)
            return
          }
        }
      } catch (e) {
        console.error('Falha ao buscar veículo da API:', e)
      }
      
      // Fallback local
      const v = getVehicles().find(v => v.id === id)
      if (v) setVehicle(v)
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
    <div className="space-y-4">
      <div>
        <Link
          href={`/${slug}/admin/estoque`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-white mb-2 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-brand" /> Voltar para o Estoque
        </Link>
        <h1 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-wide">Editar Veículo</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Atualize os dados, fotos, especificações e status de publicação do veículo.</p>
      </div>
      <VehicleForm slug={slug} storeId={storeId} vehicle={vehicle} />
    </div>
  )
}