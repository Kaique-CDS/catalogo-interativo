import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import VehicleTable from '@/components/admin/VehicleTable'
import type { Vehicle } from '@/lib/supabase/types'

const DEMO_VEHICLES: Vehicle[] = [
  {
    id: '1',
    store_id: 'demo-store-id',
    title: 'Honda Civic Touring 1.5 Turbo',
    brand: 'Honda',
    model: 'Civic',
    year: 2022,
    mileage: 28000,
    price: 149900,
    description: 'Único dono, todas revisões na concessionária.',
    images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    store_id: 'demo-store-id',
    title: 'Toyota Corolla XEi 2.0 Flex',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    mileage: 18500,
    price: 138900,
    description: 'Impecável, garantia de fábrica ativa.',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  }
]

export default async function EstoquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let vehicles: Vehicle[] = DEMO_VEHICLES

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    try {
      const supabase = await createClient()
      const { data: store } = await supabase.from('stores').select('id').eq('slug', slug).single()
      const { data: vData } = await supabase
        .from('vehicles').select('*').eq('store_id', store?.id ?? '').order('created_at', { ascending: false })
      if (vData) vehicles = vData
    } catch (e) {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Estoque</h1>
          <p className="text-zinc-500">Gerencie os veículos do catálogo</p>
        </div>
        <Link href={`/${slug}/admin/estoque/novo`}>
          <Button className="gap-2"><Plus className="h-4 w-4" />Novo Veículo</Button>
        </Link>
      </div>
      <VehicleTable vehicles={vehicles} slug={slug} />
    </div>
  )
}