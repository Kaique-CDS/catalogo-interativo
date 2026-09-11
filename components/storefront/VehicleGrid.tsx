import VehicleCard from './VehicleCard'
import SearchFilters from './SearchFilters'
import { Car } from 'lucide-react'
import type { Vehicle, Store } from '@/lib/supabase/types'

interface Props {
  vehicles: Vehicle[]
  store: Store
  brands: string[]
  years: number[]
  searchParams: { q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string }
}

export default function VehicleGrid({ vehicles, store, brands, years, searchParams }: Props) {
  return (
    <div>
      <SearchFilters brands={brands} years={years} searchParams={searchParams} />

      {vehicles.length === 0 ? (
        <div className="text-center py-24">
          <Car className="h-16 w-16 text-zinc-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-700 mb-1">Nenhum veiculo encontrado</h3>
          <p className="text-zinc-400 text-sm">Tente ajustar os filtros ou volte em breve.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-4">
            {vehicles.length} veiculo{vehicles.length !== 1 ? 's' : ''} encontrado{vehicles.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} store={store} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}