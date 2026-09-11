'use client'

import Image from 'next/image'
import { MessageCircle, Gauge, Calendar, Car } from 'lucide-react'
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
      address: store.address,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const imageUrl = vehicle.images?.[0]

  return (
    <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <div className="relative h-52 bg-zinc-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Car className="h-16 w-16 text-zinc-300" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-zinc-700 font-medium">
            {vehicle.brand}
          </Badge>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-zinc-900 text-base leading-snug mb-1">{vehicle.title}</h3>
        <p className="text-sm text-zinc-500 mb-3">{vehicle.model}</p>

        <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />{vehicle.year}
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />{formatMileage(vehicle.mileage)}
          </span>
        </div>

        <div className="mt-auto">
          <p className="text-2xl font-bold text-zinc-900 mb-3">{formatCurrency(vehicle.price)}</p>
          <Button
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
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