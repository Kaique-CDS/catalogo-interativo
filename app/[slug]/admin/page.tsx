import { createClient } from '@/lib/supabase/server'
import StatsCards from '@/components/admin/StatsCards'

export default async function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let totalVehicles = 4
  let activeVehicles = 4

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    try {
      const supabase = await createClient()
      const { data: store } = await supabase
        .from('stores').select('id, name').eq('slug', slug).single()

      if (store) {
        const { count: total } = await supabase
          .from('vehicles').select('id', { count: 'exact', head: true }).eq('store_id', store.id)
        const { count: active } = await supabase
          .from('vehicles').select('id', { count: 'exact', head: true })
          .eq('store_id', store.id).eq('is_active', true)
        totalVehicles  = total  ?? 0
        activeVehicles = active ?? 0
      }
    } catch(e) {}
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Dashboard</h1>
      <p className="text-zinc-500 mb-6">Visão geral do seu catálogo</p>
      <StatsCards totalVehicles={totalVehicles} activeVehicles={activeVehicles} slug={slug} />
    </div>
  )
}