'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Upload, AlertTriangle } from 'lucide-react'
import VehicleTable from '@/components/admin/VehicleTable'
import BulkUploadModal from '@/components/admin/BulkUploadModal'
import type { Vehicle } from '@/lib/supabase/types'
import { getVehicles } from '@/lib/vehicles'

export default function EstoquePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [dbError, setDbError] = useState<string | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [contractsEnabled, setContractsEnabled] = useState(false)
  const [linkedContracts, setLinkedContracts] = useState<Record<string, { id: string; number: number }>>({})

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await fetch(`/api/vehicles?slug=${slug}`)
        if (res.ok) {
          const data = await res.json()
          setVehicles(data || [])
          setDbError(null)
          return
        } else {
          const errData = await res.json().catch(() => ({}))
          console.error("API GET Error:", errData)
          const errMsg = errData.error || 'Erro ao consultar banco de dados'
          if (errMsg.includes('status') || errData.code === '42703') {
            setDbError('Banco desatualizado: falta aplicar a Migration 022 (colunas status e sold_at).')
          } else {
            setDbError(`Falha na consulta ao banco: ${errMsg}`)
          }
        }
      } catch (e: any) {
        console.error('Falha ao buscar veículos da API:', e)
        setDbError(`Erro de conexão com a API de veículos: ${e?.message || 'Falha de rede'}`)
      }
      
      // Fallback local só em caso de erro na rede ou API (Supabase não configurado)
      setVehicles(getVehicles())
    }
    
    if (slug) {
      loadVehicles()
    }
  }, [slug])

  useEffect(() => {
    async function checkContracts() {
      if (!slug) return
      try {
        const res = await fetch(`/api/contracts?slug=${slug}`)
        if (res.ok) {
          setContractsEnabled(true)
          const data = await res.json()
          const contracts = data.contracts || []
          const map: Record<string, { id: string; number: number }> = {}
          for (const c of contracts) {
            const vId = c.vehicle_id || c.vehicle_data?.id
            if (vId) {
              map[vId] = { id: c.id, number: c.number }
            }
          }
          setLinkedContracts(map)
        } else {
          setContractsEnabled(false)
        }
      } catch {
        setContractsEnabled(false)
      }
    }
    checkContracts()
  }, [slug])

  if (!slug) return null

  const isAtLimit = vehicles.length >= 50

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-heading text-heading tracking-wide uppercase leading-none">
              Estoque
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0 ${
                isAtLimit
                  ? 'bg-brand/10 text-brand border-brand/20'
                  : vehicles.length >= 40
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  : 'bg-surface-3 text-muted-foreground border-surface'
              }`}
            >
              {vehicles.length}/50 carros
            </span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
            Gerencie, edite e altere a publicação dos veículos do catálogo.
          </p>
        </div>

        <div className="relative group grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-center gap-2 border-surface bg-surface-1 hover:bg-surface-2 text-foreground rounded-xl text-xs font-bold shadow-xs h-11 px-3.5"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="h-4 w-4 shrink-0 text-brand" />
            <span className="truncate">Importar Planilha</span>
          </Button>

          {isAtLimit ? (
            <Button
              disabled
              className="w-full sm:w-auto justify-center gap-2 bg-surface-2 text-muted-foreground rounded-xl text-xs font-bold cursor-not-allowed h-11 px-3.5"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="truncate">Novo Veículo</span>
            </Button>
          ) : (
            <Link href={`/${slug}/admin/estoque/novo`} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto justify-center btn-brand gap-2 rounded-xl text-xs font-bold shadow-xs h-11 px-4">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">Novo Veículo</span>
              </Button>
            </Link>
          )}
          {isAtLimit && (
            <div className="col-span-2 sm:hidden text-[11px] text-brand font-medium">
              Limite de 50 veículos atingido. Exclua um para adicionar outro.
            </div>
          )}
          {isAtLimit && (
            <div className="absolute right-0 top-full mt-1.5 z-10 hidden sm:group-hover:block w-64 p-2.5 bg-surface-2 border border-surface text-foreground text-xs rounded-xl shadow-lg">
              Limite de 50 veículos atingido. Exclua um para adicionar outro.
            </div>
          )}
        </div>
      </div>

      {showBulkUpload && (
        <BulkUploadModal
          slug={slug}
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
          <span>{vehicles.length} de 50 veículos cadastrados</span>
          <span className={vehicles.length >= 50 ? 'text-brand font-bold' : 'text-muted-foreground'}>
            {vehicles.length >= 50 ? '⚠ Limite atingido' : `${50 - vehicles.length} vagas disponíveis`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              vehicles.length >= 50 ? 'bg-brand' : vehicles.length >= 40 ? 'bg-amber-500' : 'bg-brand/70'
            }`}
            style={{ width: `${Math.min((vehicles.length / 50) * 100, 100)}%` }}
          />
        </div>
      </div>

      {dbError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in-50">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-bold text-sm text-rose-700 dark:text-rose-300">
                Atenção: Banco de dados desatualizado ou erro na consulta
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{dbError}</p>
            </div>
          </div>
          <Link href={`/${slug}/admin/diagnostico`}>
            <Button size="sm" variant="outline" className="text-xs border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/15 h-8 rounded-xl shrink-0 font-bold">
              Ver Diagnóstico
            </Button>
          </Link>
        </div>
      )}

      <VehicleTable
        vehicles={vehicles}
        slug={slug}
        contractsEnabled={contractsEnabled}
        linkedContracts={linkedContracts}
      />
    </div>
  )
}