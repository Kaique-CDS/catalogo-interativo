import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'
import LocationSection from '@/components/storefront/LocationSection'
import Footer from '@/components/storefront/Footer'
import { getTenantBrand } from '@/lib/tenants'
import { getStoreWithContacts } from '@/lib/store-service'
import type { Store } from '@/lib/supabase/types'

interface Props {
  slug: string
  title: string
  children: React.ReactNode
  showLocation?: boolean
  store?: Store
}

/** Estrutura compartilhada pelas páginas institucionais (Quem Somos, Termos, Privacidade). */
export default async function InstitutionalLayout({
  slug,
  title,
  children,
  showLocation = false,
  store: initialStore,
}: Props) {
  const brand = getTenantBrand(slug)
  const store = initialStore || (await getStoreWithContacts(slug))
  const logoUrl = store.logo_url || brand.logo.header

  return (
    <div
      className="min-h-screen flex flex-col bg-surface-0 text-foreground"
      style={{ fontFamily: 'var(--font-body, Montserrat, sans-serif)' }}
    >
      <header className="bg-surface-0/95 backdrop-blur-sm border-b border-surface sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-4xl flex items-center justify-between gap-3">
          <Link href={`/${slug}`} className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            {logoUrl ? (
              <div className="brand-logo-container flex items-center justify-center shrink-0">
                <Image
                  src={logoUrl}
                  alt={store.name}
                  width={80}
                  height={40}
                  className="h-8 sm:h-10 w-auto max-w-[120px] sm:max-w-[140px] object-contain flex-shrink-0"
                />
              </div>
            ) : null}
            <span className="font-heading text-heading text-base sm:text-lg uppercase tracking-wide truncate">
              {store.name}
            </span>
          </Link>
          <Link
            href={`/${slug}`}
            className="flex items-center justify-center gap-1.5 min-h-[44px] h-11 px-3 sm:px-4 rounded-[10px] border border-surface text-xs sm:text-sm font-semibold text-foreground hover:border-brand hover:text-brand transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao estoque</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-10 max-w-4xl flex-1">
        <h1 className="font-heading text-heading text-3xl sm:text-4xl uppercase tracking-wide mb-8">{title}</h1>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground [&_h2]:font-heading [&_h2]:text-heading [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-2 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
          {children}
        </div>
      </main>

      {/* Bloco de Localização e Mapa quando habilitado (ex: Quem Somos) */}
      {showLocation && (
        <section className="container mx-auto px-4 max-w-4xl pb-12">
          <LocationSection store={store} title="Onde estamos" />
        </section>
      )}

      {/* Rodapé institucional com barra inferior obrigatória */}
      <Footer store={store} variant="compact" />

      <FloatingWhatsApp
        storeId={store.id}
        slug={slug}
        storeName={store.name}
        whatsapp={store.whatsapp}
        customMessage={`Olá! Estou na página *${title}* do catálogo *${store.name}* e gostaria de informações.`}
      />
    </div>
  )
}
