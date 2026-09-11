import Image from 'next/image'
import { MapPin } from 'lucide-react'
import type { Store } from '@/lib/supabase/types'

interface Props { store: Store }

export default function StoreHeader({ store }: Props) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        {store.logo_url ? (
          <Image
            src={store.logo_url}
            alt={store.name}
            width={56}
            height={56}
            className="rounded-xl object-contain border bg-zinc-50 p-1"
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {store.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-bold text-xl text-zinc-900">{store.name}</h1>
          {store.address && (
            <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {store.address}
            </p>
          )}
        </div>
      </div>
    </header>
  )
}