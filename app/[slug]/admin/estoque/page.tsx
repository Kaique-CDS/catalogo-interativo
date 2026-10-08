'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import VehicleTable from '@/components/admin/VehicleTable'
import BulkUploadModal from '@/components/admin/BulkUploadModal'
import type { Vehicle } from '@/lib/supabase/types'
import { getVehicles } from '@/lib/vehicles'

export default function EstoquePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    async function loadVehicles() {
      // Usar a rota da API com o identificador 'demo-store-id' (simulando a loja atual)
      // Em produção, isso viria dinamicamente de uma query de 'store' real
      try {
        const res = await fetch(`/api/vehicles?store_id=demo-store-id`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.length > 0) {
            setVehicles(data)
            return
          }
        }
      } catch (e) {
        console.error('Falha ao buscar veículos da API:', e)
      }
      
      // Fallback local se a API não retornar nada
      setVehicles(getVehicles())
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
          <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide uppercase">Estoque</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            isAtLimit
              ? 'bg-brand/10 text-brand border-brand/20'
              : vehicles.length >= 32
              ? 'bg-amber-900/30 text-amber-400 border-amber-800'
              : 'bg-surface-2 text-muted-foreground border-surface'
          }`}>
            {vehicles.length}/40 carros
          </span>
        </div>
        <div className="relative group flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 border-surface bg-surface-1 rounded-[10px] text-xs font-bold shadow-xs h-10 px-4"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="h-4 w-4" /> Importar Planilha
          </Button>
          
          {isAtLimit ? (
            <Button
              disabled
              className="gap-2 bg-surface-2 text-muted-foreground rounded-[10px] text-xs font-bold cursor-not-allowed h-10 px-4"
            >
              <Plus className="h-4 w-4" />Novo Veículo
            </Button>
          ) : (
            <Link href={`/${slug}/admin/estoque/novo`}>
              <Button className="btn-brand gap-2 rounded-[10px] text-xs font-bold shadow-xs h-10 px-4">
                <Plus className="h-4 w-4" />Novo Veículo
              </Button>
            </Link>
          )}
          {isAtLimit && (
            <div className="absolute right-0 top-full mt-1.5 z-10 hidden group-hover:block w-64 p-2.5 bg-surface-2 border border-surface text-white text-xs rounded-xl shadow-lg">
              Limite de 40 veículos atingido. Exclua um para adicionar outro.
            </div>
          )}
        </div>
      </div>
      <p className="text-muted-foreground text-sm mb-4">Gerencie, edite e altere a publicação dos veículos do catálogo.</p>

      {showBulkUpload && (
        <BulkUploadModal
          storeId="demo-store-id"
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => {
            setShowBulkUpload(false)
            window.location.reload()
          }}
        />
      )}

      {/* Progress bar */}
      <div className="mt-2 mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5 font-medium">
          <span>{vehicles.length} de 40 veículos cadastrados</span>
          <span className={vehicles.length >= 40 ? 'text-brand font-bold' : 'text-muted-foreground'}>
            {vehicles.length >= 40 ? '⚠ Limite atingido' : `${40 - vehicles.length} vagas disponíveis`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              vehicles.length >= 40 ? 'bg-brand' : vehicles.length >= 32 ? 'bg-amber-500' : 'bg-brand/70'
            }`}
            style={{ width: `${Math.min((vehicles.length / 40) * 100, 100)}%` }}
          />
        </div>
      </div>

      <VehicleTable vehicles={vehicles} slug={slug} />
    </div>
  )
}