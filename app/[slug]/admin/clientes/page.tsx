import Link from 'next/link'
import { getStoreWithContacts } from '@/lib/store-service'
import CustomerPhotosSection from '@/components/admin/CustomerPhotosSection'
import { ArrowLeft, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ClientesAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getStoreWithContacts(slug)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/${slug}/admin`}>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 -ml-2 text-muted-foreground hover:text-heading">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Painel
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading text-heading uppercase tracking-wide flex items-center gap-2.5">
            <Users className="h-6 w-6 text-primary" /> Galeria de Clientes
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Gerencie as fotos dos clientes que levaram o carro pra casa exibidas na vitrine da loja.
          </p>
        </div>
      </div>

      <CustomerPhotosSection slug={slug} storeId={store?.id} />
    </div>
  )
}
