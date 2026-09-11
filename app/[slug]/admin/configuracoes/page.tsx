import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StoreSettingsForm from '@/components/admin/StoreSettingsForm'

export default async function ConfiguracoesPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: store } = await supabase.from('stores').select('*').eq('slug', params.slug).single()
  if (!store) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Configuracoes</h1>
      <p className="text-zinc-500 mb-6">Personalize sua loja e dados de contato</p>
      <StoreSettingsForm store={store} slug={params.slug} />
    </div>
  )
}