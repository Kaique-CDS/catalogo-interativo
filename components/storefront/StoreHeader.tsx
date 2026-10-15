import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import type { Store } from '@/lib/supabase/types'
import { getTenantBrand } from '@/lib/tenants'
import { getStorePhone, getStoreInstagram } from '@/lib/store-contact'

interface Props { store: Store }

export default function StoreHeader({ store }: Props) {
  const brand = getTenantBrand(store.slug)
  const phoneInfo = getStorePhone(store)
  const instagramInfo = getStoreInstagram(store)
  const logoUrl = store.logo_url || brand.logo.header

  return (
    <header className="bg-surface-0/95 border-b border-surface sticky top-0 z-40 backdrop-blur-md">
      <div className="container mx-auto px-2.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 max-w-7xl">

        {/* Logo + Nome */}
        <Link
          href={`/${store.slug}`}
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial group"
          aria-label={`Voltar para ${store.name}`}
        >
          {logoUrl ? (
            <div className="brand-logo-container flex items-center justify-center shrink-0">
              <Image
                src={logoUrl}
                alt={store.name}
                width={80}
                height={44}
                priority
                className="h-8 sm:h-11 w-auto max-w-[120px] sm:max-w-[140px] object-contain flex-shrink-0"
              />
            </div>
          ) : (
            /* Fallback: inicial da loja */
            <div className="h-8 w-8 sm:h-11 sm:w-11 bg-brand rounded-[10px] flex items-center justify-center font-heading text-white text-lg sm:text-2xl flex-shrink-0 select-none">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-heading text-sm sm:text-base md:text-xl uppercase tracking-wide leading-tight truncate">
              {store.name}
            </h1>
            {store.slogan && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate font-medium">
                {store.slogan}
              </p>
            )}
            {!store.slogan && store.address && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 text-brand" />
                <span className="truncate">{store.address}</span>
              </p>
            )}
          </div>
        </Link>

        {/* Ações direita — 100% Mobile First */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          {/* Instagram — visível em todos */}
          <a
            href={instagramInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[10px] border border-surface text-muted-foreground hover:text-brand hover:border-brand transition-colors shrink-0"
            title={`Instagram ${instagramInfo.handle}`}
            aria-label={`Instagram ${instagramInfo.handle}`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
          </a>

          {/* Telefone — Visível em Celular e Desktop (100% Mobile First) */}
          <a
            href={`tel:${phoneInfo.tel}`}
            className="flex items-center gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-[10px] border border-surface bg-surface-1/40 hover:bg-surface-2 text-xs sm:text-sm font-semibold text-foreground hover:text-brand hover:border-brand/40 transition-colors shrink-0 group"
            title={`Ligar para ${phoneInfo.display}`}
            aria-label={`Ligar para ${phoneInfo.display}`}
          >
            <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-brand shrink-0" />
            <span className="text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap tracking-tight group-hover:text-brand">
              {phoneInfo.display}
            </span>
          </a>
        </div>
      </div>
    </header>
  )
}