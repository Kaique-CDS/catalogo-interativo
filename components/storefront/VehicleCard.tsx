'use client'

import Image from 'next/image'
import { MessageCircle, Gauge, Calendar, Car, Sparkles, Fuel, Cog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import type { Vehicle, Store } from '@/lib/supabase/types'

interface Props { vehicle: Vehicle; store: Store }

export default function VehicleCard({ vehicle, store }: Props) {
  const handleWhatsApp = () => {
    const url = buildWhatsAppUrl({
      whatsapp: store.whatsapp,
      storeName: store.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      transmission: vehicle.transmission,
      fuel: vehicle.fuel,
      address: store.address,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const imageUrl = vehicle.images?.[0]

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group">
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
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-xs text-zinc-800 font-bold text-[11px] shadow-xs">
            {vehicle.brand}
          </Badge>
          {vehicle.badge && (
            <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wide">
              {vehicle.badge}
            </span>
          )}
        </div>

        {vehicle.plate_end && (
          <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Placa final {vehicle.plate_end}
          </div>
        )}
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
        <div className="pt-2 border-t border-zinc-100 mt-2">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[11px] text-zinc-400 font-medium">Valor à vista</span>
            <span className="text-2xl font-black text-zinc-900 tracking-tight">
              {formatCurrency(vehicle.price)}
            </span>
          </div>

          <Button
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-sm shadow-sm active:scale-[0.98] transition-all"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            Tenho Interesse
          </Button>
        </div>
      </div>
    </div>
  )
}