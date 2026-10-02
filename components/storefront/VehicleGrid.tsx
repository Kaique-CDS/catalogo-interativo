'use client'

import React, { useState, useEffect } from 'react'
import VehicleCard from './VehicleCard'
import SearchFilters from './SearchFilters'
import VehicleDetailModal from './VehicleDetailModal'
import { Car } from 'lucide-react'
import type { Vehicle, Store } from '@/lib/supabase/types'

interface Props {
  vehicles: Vehicle[]
  store: Store
  brands: string[]
  years: number[]
  searchParams: { q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string; v?: string; veiculo?: string }
}

export default function VehicleGrid({ vehicles, store, brands, years, searchParams }: Props) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [modalStep, setModalStep] = useState<'detail' | 'interest'>('detail')

  // Auto-open vehicle modal if ?v=ID or ?veiculo=ID is present in URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const targetId = params.get('v') || params.get('veiculo') || searchParams.v || searchParams.veiculo
    if (targetId) {
      const match = vehicles.find(v => v.id === targetId || (v.sku && v.sku.toLowerCase() === targetId.toLowerCase()))
      if (match) {
        setSelectedVehicle(match)
        setModalStep('detail')
      }
    }
  }, [vehicles, searchParams])

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setModalStep('detail')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('v', vehicle.id)
      window.history.replaceState(null, '', url.toString())
    }
  }

  const handleInterestVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setModalStep('interest')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('v', vehicle.id)
      window.history.replaceState(null, '', url.toString())
    }
  }

  const handleCloseVehicle = () => {
    setSelectedVehicle(null)
    setModalStep('detail')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('v')
      url.searchParams.delete('veiculo')
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''))
    }
  }

  return (
    <div>
      <SearchFilters brands={brands} years={years} searchParams={searchParams} />

      {vehicles.length === 0 ? (
        <div className="text-center py-20 bg-surface-1 rounded-2xl border border-surface p-8 max-w-md mx-auto">
          <Car className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-white text-xl uppercase tracking-wide mb-2">
            Nenhum Veículo Encontrado
          </h3>
          <p className="text-muted-foreground text-sm">
            Tente alterar os filtros ou limpar a pesquisa para ver mais opções.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-muted-foreground">
              <span className="text-brand font-bold">{vehicles.length}</span>{' '}
              veículo{vehicles.length !== 1 ? 's' : ''} disponíve{vehicles.length !== 1 ? 'is' : 'l'}
            </p>
            <span className="text-[11px] text-muted-foreground/60 hidden sm:inline">
              Clique no veículo para ver fotos e ficha técnica
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                store={store}
                onSelect={handleSelectVehicle}
                onInterest={handleInterestVehicle}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal de Detalhes do Veículo */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        store={store}
        initialStep={modalStep}
        onClose={handleCloseVehicle}
      />
    </div>
  )
}