import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Sparkles } from 'lucide-react'
import type { Store } from '@/lib/supabase/types'

interface Props { store: Store }

export default function StoreHeader({ store }: Props) {
  return (
    <header className="bg-surface-0 border-b border-surface sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3 max-w-7xl">

        {/* Logo + Nome */}
        <Link
          href={`/${store.slug}`}
          className="flex items-center gap-3 min-w-0 group"
          aria-label={`Voltar para ${store.name}`}
        >
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={store.name}
              width={48}
              height={48}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
            />
          ) : (
            /* Fallback: inicial da loja com identidade vermelha */
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-brand rounded-[10px] flex items-center justify-center font-heading text-white text-2xl flex-shrink-0 select-none">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-white text-base sm:text-xl uppercase tracking-wide leading-none truncate">
              {store.name}
            </h1>
            {store.slogan && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate font-medium">
                {store.slogan}
              </p>
            )}
            {!store.slogan && store.address && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0 text-brand" />
                <span className="truncate">{store.address}</span>
              </p>
            )}
          </div>
        </Link>

        {/* Ações direita */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Instagram — visível em todos */}
          <a
            href="https://instagram.com/milhaticarsp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-surface text-muted-foreground hover:text-brand hover:border-brand transition-colors"
            title="Instagram @milhaticarsp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
          </a>

          {/* Telefone — apenas desktop */}
          {store.whatsapp && (
            <a
              href={`tel:+551147294937`}
              className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-[10px] border border-surface text-sm font-semibold text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
              title="Televendas"
            >
              <Phone className="h-3.5 w-3.5 text-brand" />
              (11) 4729-4937
            </a>
          )}
        </div>
      </div>
    </header>
  )
}