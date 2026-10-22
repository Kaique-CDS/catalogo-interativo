'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import type { Store } from '@/lib/supabase/types'
import { getTenantBrand } from '@/lib/tenants'
import { getStoreInstagram, getStoreWhatsApp } from '@/lib/store-contact'

interface FooterProps {
  store: Store
  variant?: 'full' | 'compact'
  className?: string
}

export default function Footer({ store, variant = 'full', className = '' }: FooterProps) {
  const brand = getTenantBrand(store.slug)
  const instagramInfo = getStoreInstagram(store)
  const whatsappInfo = getStoreWhatsApp(store)
  const currentYear = new Date().getFullYear()

  // Texto oficial da barra de copyright da marca
  const copyrightText = brand.copyright(currentYear)

  // Logo a ser exibida no footer (prioriza logo própria do footer da marca para manter contraste)
  const logoUrl = brand.logo.footer || store.logo_url || brand.logo.header

  return (
    <footer className={`border-t border-surface/20 store-footer mt-auto ${className}`}>
      {variant === 'full' && (
        <div className="container mx-auto px-4 max-w-7xl pt-12 pb-8 grid grid-cols-1 md:grid-cols-2 gap-10 justify-between">
          {/* Coluna 1 — Marca */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <div className="brand-logo-container flex items-center justify-center shrink-0">
                  <Image
                    src={logoUrl}
                    alt={store.name}
                    width={96}
                    height={48}
                    className="h-10 sm:h-12 w-auto max-w-[140px] object-contain flex-shrink-0"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 bg-brand rounded-[10px] flex items-center justify-center font-heading text-white text-2xl select-none">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-heading text-white text-xl uppercase tracking-wide">{store.name}</span>
            </div>
            {store.slogan && <p className="text-white/80 text-sm mb-4 max-w-md">{store.slogan}</p>}
            <div className="flex gap-3 mt-4">
              {instagramInfo.handle && (
                <a
                  href={instagramInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[44px] min-h-[44px] h-11 w-11 rounded-full bg-surface-2 flex items-center justify-center text-white/90 hover:text-white hover:bg-surface-3 transition-colors"
                  title={instagramInfo.handle}
                  aria-label={`Instagram ${instagramInfo.handle}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {whatsappInfo.display && (
                <a
                  href={`https://wa.me/${whatsappInfo.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[44px] min-h-[44px] h-11 w-11 rounded-full bg-surface-2 flex items-center justify-center text-white/90 hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                  title={`WhatsApp ${whatsappInfo.display}`}
                  aria-label={`WhatsApp ${whatsappInfo.display}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Coluna 2 — Institucional */}
          <div className="md:text-right">
            <h4 className="font-heading text-white text-lg uppercase tracking-wide mb-4">Institucional</h4>
            <ul className="space-y-1 text-sm text-white/90">
              <li><Link href={`/${store.slug}`} className="py-1.5 inline-block text-white/90 hover:text-white transition-colors">Nosso Estoque</Link></li>
              <li><Link href={`/${store.slug}/quem-somos`} className="py-1.5 inline-block text-white/90 hover:text-white transition-colors">Quem Somos</Link></li>
              <li><Link href={`/${store.slug}/termos`} className="py-1.5 inline-block text-white/90 hover:text-white transition-colors">Termos e Condições</Link></li>
              <li><Link href={`/${store.slug}/privacidade`} className="py-1.5 inline-block text-white/90 hover:text-white transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Barra Inferior OBRIGATÓRIA em todas as variantes e rotas ── */}
      <div className={`container mx-auto px-4 max-w-7xl ${variant === 'compact' ? 'py-6' : 'py-5 border-t border-white/10'} pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center flex flex-col sm:flex-row justify-between items-center gap-3.5`}>
        <p className="text-xs text-white/80 font-medium">
          {copyrightText}
        </p>
        <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
          Desenvolvido por{' '}
          <a
            href="https://vendazap.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-white/90 underline underline-offset-2 transition-colors"
          >
            VendaZap
          </a>
        </p>
      </div>
    </footer>
  )
}
