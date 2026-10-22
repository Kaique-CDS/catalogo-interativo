import { getStoreContractSettings } from '@/lib/contracts/module-guard'
import { createClient } from '@/lib/supabase/server'
import { DEMO_VEHICLES } from '@/lib/vehicles'
import PowerOfAttorneyWizard from '@/components/contracts/PowerOfAttorneyWizard'
import type { Vehicle } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function NovaProcuracaoPage({ params }: Props) {
  const { slug } = await params
  const { store } = await getStoreContractSettings(slug)

  let vehicles: Vehicle[] = []

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient()
      const { data: dbVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (dbVehicles && dbVehicles.length > 0) {
        vehicles = dbVehicles
      }
    } catch {
      // Ignora erro e usa fallback
    }
  }

  if (vehicles.length === 0) {
    vehicles = DEMO_VEHICLES
  }

  return <PowerOfAttorneyWizard store={store} slug={slug} vehicles={vehicles} />
}
