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

  const isAtLimit = vehicles.length >= 40

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Estoque</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
            isAtLimit
              ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
              : vehicles.length >= 32
              ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
          }`}>
            {vehicles.length}/40 carros
          </span>
        </div>
        <div className="relative group">
          {isAtLimit ? (
            <Button
              disabled
              className="gap-2 bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-xl text-xs font-bold cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />Novo Veículo
            </Button>
          ) : (
            <Link href={`/${slug}/admin/estoque/novo`}>
              <Button className="gap-2 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-xs font-bold shadow-xs">
                <Plus className="h-4 w-4" />Novo Veículo
              </Button>
            </Link>
          )}
          {isAtLimit && (
            <div className="absolute right-0 top-full mt-1.5 z-10 hidden group-hover:block w-64 p-2.5 bg-zinc-900 text-white text-xs rounded-xl shadow-lg">
              Limite de 40 veículos atingido. Exclua um para adicionar outro.
            </div>
          )}
        </div>
      </div>
      <p className="text-zinc-500 text-xs mb-2">Gerencie, edite e altere a publicação dos veículos do catálogo.</p>

      {/* Progress bar */}
      <div className="mt-2 mb-6">
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          <span>{vehicles.length} de 40 veículos cadastrados</span>
          <span className={vehicles.length >= 40 ? 'text-rose-500 font-bold' : 'text-zinc-400'}>
            {vehicles.length >= 40 ? '⚠ Limite atingido' : `${40 - vehicles.length} vagas disponíveis`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              vehicles.length >= 40 ? 'bg-rose-500' : vehicles.length >= 32 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min((vehicles.length / 40) * 100, 100)}%` }}
          />
        </div>
      </div>

      <VehicleTable vehicles={vehicles} slug={slug} />
    </div>
  )
}