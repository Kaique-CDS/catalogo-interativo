import { getStoreWithContacts } from '@/lib/store-service'
import StoreSettingsForm from '@/components/admin/StoreSettingsForm'
import type { Store } from '@/lib/supabase/types'

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const store = await getStoreWithContacts(slug)

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-heading text-heading mb-2 uppercase tracking-wide">Configurações da Loja</h1>
      <p className="text-muted-foreground mb-8 text-sm">Personalize o tema visual, cores, fontes, WhatsApp e dados da concessionária.</p>
      <StoreSettingsForm store={store} slug={slug} />
    </div>
  )
}