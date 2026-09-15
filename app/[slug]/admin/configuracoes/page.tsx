import { createClient } from '@/lib/supabase/server'
import StoreSettingsForm from '@/components/admin/StoreSettingsForm'
import type { Store } from '@/lib/supabase/types'

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let store: Store = {
    id: 'demo-store-id',
    slug,
    name: 'AutoCenter Motors Premium',
    logo_url: null,
    banner_url: null,
    address: 'Av. das Nações, 1500 - São Paulo, SP',
    whatsapp: '5511993270543',
    whatsapp_financeiro: null,
    opening_hours: 'Seg a Sex: 09h às 18h | Sáb: 09h às 13h',
    primary_color: '#18181B',
    font_family: 'Inter',
    slogan: 'Os melhores veículos seminovos com garantia e laudo aprovado.',
    owner_id: 'demo-owner',
    created_at: new Date().toISOString(),
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    try {
      const supabase = await createClient()
      const { data: dbStore } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
      if (dbStore) store = dbStore
    } catch (e) {}
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Configurações da Loja</h1>
      <p className="text-zinc-500 mb-6 text-xs">Personalize o tema visual, cores, fontes, WhatsApp e dados da concessionária.</p>
      <StoreSettingsForm store={store} slug={slug} />
    </div>
  )
}