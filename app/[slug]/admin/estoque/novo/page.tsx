import { createClient } from '@/lib/supabase/server'
import VehicleForm from '@/components/admin/VehicleForm'

export default async function NovoVeiculoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: store } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle()

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Novo Veículo</h1>
      <p className="text-zinc-500 mb-6">Adicione um veículo ao catálogo</p>
      <VehicleForm slug={slug} storeId={store?.id ?? ''} />
    </div>
  )
}