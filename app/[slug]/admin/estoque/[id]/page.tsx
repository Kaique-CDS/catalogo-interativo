import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import VehicleForm from '@/components/admin/VehicleForm'

export default async function EditarVeiculoPage({ params }: { params: { slug: string; id: string } }) {
  const supabase = await createClient()
  const { data: store }   = await supabase.from('stores').select('id').eq('slug', params.slug).single()
  const { data: vehicle } = await supabase
    .from('vehicles').select('*').eq('id', params.id).eq('store_id', store?.id ?? '').single()

  if (!vehicle) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Editar Veiculo</h1>
      <p className="text-zinc-500 mb-6">{vehicle.brand} {vehicle.model} {vehicle.year}</p>
      <VehicleForm slug={params.slug} storeId={store?.id ?? ''} vehicle={vehicle} />
    </div>
  )
}