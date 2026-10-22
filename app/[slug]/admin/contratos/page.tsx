import { getStoreContractSettings } from '@/lib/contracts/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLocalContracts } from '@/lib/contracts/cache'
import ContractsDashboard from '@/components/contracts/ContractsDashboard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ContratosDashboardPage({ params }: Props) {
  const { slug } = await params
  const { store } = await getStoreContractSettings(slug)

  let contracts: any[] = []
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('store_id', store.id)
      .is('deleted_at', null)
      .order('number', { ascending: false })

    if (!error && data) {
      contracts = data
    }
  } catch (err) {
    console.warn('Erro ao carregar contratos iniciais:', err)
  }

  // Mescla com contratos locais em desenvolvimento
  const localList = getLocalContracts(store.id)
  const map = new Map<string, any>()
  for (const c of contracts) map.set(c.id, c)
  for (const c of localList) {
    if (!map.has(c.id)) map.set(c.id, c)
  }
  const merged = Array.from(map.values()).sort((a, b) => (b.number || 0) - (a.number || 0))

  return <ContractsDashboard store={store} slug={slug} initialContracts={merged} />
}
