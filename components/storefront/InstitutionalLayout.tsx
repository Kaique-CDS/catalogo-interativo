import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'

interface Props {
  slug: string
  title: string
  children: React.ReactNode
}

/** Estrutura compartilhada pelas páginas institucionais (Quem Somos, Termos, Privacidade). */
export default function InstitutionalLayout({ slug, title, children }: Props) {
  return (
    <div
      className="min-h-screen bg-surface-0 text-foreground"
      style={{ fontFamily: 'var(--font-body, Montserrat, sans-serif)' }}
    >
      <header className="bg-surface-0/95 backdrop-blur-sm border-b border-surface sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-4xl flex items-center justify-between gap-3">
          <Link href={`/${slug}`} className="flex items-center gap-2 sm:gap-3 min-w-0 group">
            <Image
              src="/logo-milhaticar.png"
              alt="Milhaticar"
              width={40}
              height={40}
              className="h-10 w-10 object-contain flex-shrink-0"
            />
            <span className="font-heading text-white text-base sm:text-lg uppercase tracking-wide truncate">Milhaticar</span>
          </Link>
          <Link
            href={`/${slug}`}
            className="flex items-center justify-center gap-1.5 h-10 px-3 sm:px-4 rounded-[10px] border border-surface text-xs sm:text-sm font-semibold text-white hover:border-brand hover:text-brand transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao estoque</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-10 max-w-4xl">
        <h1 className="font-heading text-white text-3xl sm:text-4xl uppercase tracking-wide mb-8">{title}</h1>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground [&_h2]:font-heading [&_h2]:text-white [&_h2]:text-xl [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:mt-8 [&_h2]:mb-2 [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
          {children}
        </div>
      </main>

      <footer className="border-t border-surface py-6 text-center text-xs text-muted-foreground/60">
        © DESDE 2019 - {new Date().getFullYear()} MILHATICAR. Todos os direitos reservados.
      </footer>

      <FloatingWhatsApp
        storeName="Milhaticar"
        whatsapp="5511994942661"
        customMessage="Olá! Estou no catálogo *Milhaticar* e gostaria de informações."
      />
    </div>
  )
}
