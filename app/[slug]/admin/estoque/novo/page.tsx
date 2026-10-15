import { createClient } from '@/lib/supabase/server'
import VehicleForm from '@/components/admin/VehicleForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NovoVeiculoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: store } = await supabase.from('stores').select('id').eq('slug', slug).maybeSingle()

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/${slug}/admin/estoque`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-brand" /> Voltar para o Estoque
        </Link>
        <h1 className="text-2xl sm:text-3xl font-heading text-heading uppercase tracking-wide">Novo Veículo</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Adicione um veículo ao catálogo</p>
      </div>
      <VehicleForm slug={slug} storeId={store?.id ?? ''} />
    </div>
  )
}