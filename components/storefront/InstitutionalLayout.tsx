import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'
import { getTenantBrand } from '@/lib/tenants'

interface Props {
  slug: string
  title: string
  children: React.ReactNode
}

/** Estrutura compartilhada pelas páginas institucionais (Quem Somos, Termos, Privacidade). */
export default function InstitutionalLayout({ slug, title, children }: Props) {
  const brand = getTenantBrand(slug)

  return (
    <div
      className="min-h-screen bg-surface-0 text-foreground"
      style={{ fontFamily: 'var(--font-body, Montserrat, sans-serif)' }}
    >
      <header className="bg-surface-0/95 backdrop-blur-sm border-b border-surface sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-4xl flex items-center justify-between gap-3">
          <Link href={`/${slug}`} className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <div className="brand-logo-container flex items-center justify-center shrink-0">
              <Image
                src={brand.logo.header}
                alt={brand.name}
                width={40}
                height={40}
                className="h-10 w-10 object-contain flex-shrink-0"
              />
            </div>
            <span className="font-heading text-heading text-base sm:text-lg uppercase tracking-wide truncate">{brand.name}</span>
          </Link>
          <Link
            href={`/${slug}`}
            className="flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 rounded-[10px] border border-surface text-xs sm:text-sm font-semibold text-foreground hover:border-brand hover:text-brand transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao estoque</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-10 max-w-4xl">
        <h1 className="font-heading text-heading text-3xl sm:text-4xl uppercase tracking-wide mb-8">{title}</h1>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground [&_h2]:font-heading [&_h2]:text-heading [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-2 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
          {children}
        </div>
      </main>

      <footer className="border-t border-surface store-footer py-6 text-center text-xs text-muted-foreground/60">
        {brand.copyright(new Date().getFullYear())}
      </footer>

      <FloatingWhatsApp
        storeName={brand.name}
        whatsapp={brand.whatsapp.number}
        customMessage={`Olá! Estou no catálogo *${brand.name}* e gostaria de informações.`}
      />
    </div>
  )
}
