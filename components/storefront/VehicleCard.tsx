'use client'

import Image from 'next/image'
import { Gauge, Calendar, Car, Fuel, Cog, Eye, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMileage } from '@/lib/utils'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { Vehicle, Store } from '@/lib/supabase/types'

interface Props {
  vehicle: Vehicle
  store: Store
  onSelect?: (vehicle: Vehicle) => void
}

export default function VehicleCard({ vehicle, store, onSelect }: Props) {
  const imageUrl = vehicle.images?.[0]

  const handleDirectInterest = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = buildWhatsAppUrl({
      whatsapp: store.whatsapp,
      whatsappFinanceiro: store.whatsapp_financeiro,
      storeName: store.name,
      sku: vehicle.sku ?? 'N/A',
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      sector: 'vendas',
    })
    window.open(url, '_blank')
  }

  return (
    <div
      onClick={() => onSelect?.(vehicle)}
      className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
    >
      {/* Foto com Badges */}
      <div className="relative aspect-[16/10] sm:h-52 bg-zinc-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Car className="h-16 w-16 text-zinc-300" />
          </div>
        )}

        {/* Marca Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-start">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-xs text-zinc-800 font-bold text-[11px] shadow-xs">
            {vehicle.brand}
          </Badge>
        </div>

        {/* Hover / Dica de Toque para Expandir */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Ver detalhes
          </span>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-zinc-900 text-base sm:text-lg leading-snug group-hover:text-zinc-700 transition-colors">
            {vehicle.title}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 mb-3 font-medium">
            {vehicle.model}
          </p>

          {/* Grid de Especificações */}
          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl mb-3">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              {vehicle.year}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Gauge className="h-3.5 w-3.5 text-zinc-400" />
              {formatMileage(vehicle.mileage)}
            </span>
            {vehicle.transmission && (
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
                <Cog className="h-3.5 w-3.5 text-zinc-400" />
                {vehicle.transmission}
              </span>
            )}
            {vehicle.fuel && (
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
                <Fuel className="h-3.5 w-3.5 text-zinc-400" />
                {vehicle.fuel}
              </span>
            )}
            {vehicle.plate_end && (
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 col-span-2">
                <span className="font-mono font-bold text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.2 rounded">
                  Placa final {vehicle.plate_end}
                </span>
              </span>
            )}
          </div>

          {/* Opcionais Destaques */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {vehicle.features.slice(0, 3).map((f) => (
                <span key={f} className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                  {f}
                </span>
              ))}
              {vehicle.features.length > 3 && (
                <span className="text-[10px] text-zinc-400 py-0.5">
                  +{vehicle.features.length - 3} mais
                </span>
              )}
            </div>
          )}
        </div>

        {/* Preço e Botão Tenho Interesse */}
        <div className="pt-2.5 border-t border-zinc-100 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Condição comercial</span>
              <span className="text-sm font-extrabold text-emerald-700 tracking-tight">
                Consulte no WhatsApp
              </span>
            </div>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              Sob Consulta
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(vehicle)
              }}
              className="w-full text-xs font-bold rounded-xl py-2.5 text-zinc-700 hover:bg-zinc-100"
            >
              Ver Detalhes
            </Button>
            <Button
              className="w-full gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl py-2.5 font-bold text-xs shadow-xs active:scale-98 transition-transform"
              onClick={handleDirectInterest}
            >
              <svg className="w-3.5 h-3.5 fill-white shrink-0" viewBox="0 0 448 512" aria-hidden="true">
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              Tenho Interesse
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}