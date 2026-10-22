'use client'

import React from 'react'
import { MapPin, Phone, MessageCircle, Mail, Clock, ExternalLink, Navigation } from 'lucide-react'
import type { Store } from '@/lib/supabase/types'
import { getStorePhone, getStoreInstagram, getStoreWhatsApp, getStoreAddress, getStoreOpeningHours } from '@/lib/store-contact'

interface Props {
  store: Store
  className?: string
  title?: string
}

/**
 * Extrai e valida a URL segura de incorporação do Google Maps a partir de um iframe ou link.
 * Aceita apenas origens oficiais do Google Maps no formato embed.
 */
export function extractMapsEmbedSrc(raw?: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const match = trimmed.match(/src=["'](https:\/\/[^"']+)["']/i)
  const candidate = match ? match[1] : trimmed

  try {
    const parsed = new URL(candidate)
    const isGoogle =
      parsed.hostname === 'www.google.com' ||
      parsed.hostname === 'maps.google.com' ||
      parsed.hostname === 'google.com'

    if (parsed.protocol === 'https:' && isGoogle) {
      if (parsed.pathname.startsWith('/maps/embed') || parsed.searchParams.get('output') === 'embed') {
        return candidate
      }
    }
  } catch {
    return null
  }
  return null
}

export default function LocationSection({ store, className = '', title }: Props) {
  const address = getStoreAddress(store) || null
  const phoneInfo = getStorePhone(store)
  const instagramInfo = getStoreInstagram(store)
  const whatsappInfo = getStoreWhatsApp(store)

  // Extrai embed customizado ou gera o padrão a partir do endereço
  const customEmbed = extractMapsEmbedSrc(store.maps_embed_url)
  const defaultEmbed = address
    ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&hl=pt-BR&output=embed`
    : null
  const embedUrl = customEmbed || defaultEmbed

  // Se a loja não tiver endereço, não renderiza o mapa
  const hasMap = Boolean(address && embedUrl)

  const encodedAddress = address ? encodeURIComponent(address) : ''
  const directionsUrl = address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
    : null
  const searchMapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    : null

  // Quebra horários de funcionamento por "|" ou "\n"
  const openingHours = getStoreOpeningHours(store)
  const hoursList = openingHours
    ? openingHours.split(/[|\n]/).map((h) => h.trim()).filter(Boolean)
    : []

  return (
    <section aria-label="Localização e Contato" className={`w-full ${className}`}>
      <div className="bg-surface-1 border border-surface rounded-2xl shadow-xs overflow-hidden">
        {hasMap ? (
          /* Desktop (≥1024px): 2 colunas (~58% mapa, ~42% contato). Mobile: Coluna única (mapa primeiro) */
          <div className="flex flex-col lg:flex-row items-stretch">
            {/* Mapa à esquerda (~58% no desktop, altura mín. 380px no desktop e 280px no mobile) */}
            <div className="w-full lg:w-[58%] min-h-[280px] sm:min-h-[320px] lg:min-h-[420px] relative bg-surface-2 border-b lg:border-b-0 lg:border-r border-surface">
              <iframe
                src={embedUrl!}
                title={`Localização de ${store.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full min-h-[280px] sm:min-h-[320px] lg:min-h-[420px] border-0 block"
                allowFullScreen={false}
              />
            </div>

            {/* Informações à direita (~42% no desktop) */}
            <div className="w-full lg:w-[42%] p-5 sm:p-7 md:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] font-bold text-brand uppercase tracking-wider block mb-1">
                    {title || 'Venha nos visitar'}
                  </span>
                  <h3 className="font-heading text-xl sm:text-2xl text-heading uppercase tracking-wide leading-tight">
                    {store.name}
                  </h3>
                </div>

                <ul className="space-y-3.5 text-sm">
                  {/* Endereço */}
                  {address && (
                    <li className="flex items-start gap-3 text-foreground">
                      <MapPin className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                      <a
                        href={searchMapsUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-brand transition-colors font-medium leading-relaxed break-words"
                        title="Ver no Google Maps"
                      >
                        {address}
                      </a>
                    </li>
                  )}

                  {/* Telefone Fixo / Televendas */}
                  {phoneInfo.display && (
                    <li className="flex items-center gap-3 text-foreground">
                      <Phone className="h-4 w-4 text-brand shrink-0" />
                      <a
                        href={`tel:${phoneInfo.tel}`}
                        className="text-foreground hover:text-brand transition-colors font-medium"
                      >
                        {phoneInfo.label}: {phoneInfo.display}
                      </a>
                    </li>
                  )}

                  {/* WhatsApp */}
                  {whatsappInfo.display && (
                    <li className="flex items-center gap-3 text-foreground">
                      <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                      <a
                        href={`https://wa.me/${whatsappInfo.number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-[#25D366] transition-colors font-medium"
                      >
                        WhatsApp: {whatsappInfo.display}
                      </a>
                    </li>
                  )}

                  {/* E-mail da loja */}
                  {store.email && (
                    <li className="flex items-center gap-3 text-foreground min-w-0">
                      <Mail className="h-4 w-4 text-brand shrink-0" />
                      <a
                        href={`mailto:${store.email}`}
                        className="text-foreground hover:text-brand transition-colors font-medium truncate break-all"
                      >
                        {store.email}
                      </a>
                    </li>
                  )}

                  {/* Horário de Funcionamento quebrado em linhas */}
                  {hoursList.length > 0 && (
                    <li className="flex items-start gap-3 text-foreground">
                      <Clock className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                      <div className="space-y-0.5 text-foreground/90">
                        {hoursList.map((hour, idx) => (
                          <p key={idx} className="font-medium text-xs sm:text-sm">
                            {hour}
                          </p>
                        ))}
                      </div>
                    </li>
                  )}

                  {/* Instagram */}
                  {instagramInfo.handle && (
                    <li className="flex items-center gap-3 text-foreground">
                      <svg className="h-4 w-4 text-brand shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                      <a
                        href={instagramInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-brand transition-colors font-medium"
                      >
                        {instagramInfo.handle}
                      </a>
                    </li>
                  )}
                </ul>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-surface flex flex-col sm:flex-row flex-wrap gap-2.5">
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto sm:flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-opacity"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Como chegar</span>
                  </a>
                )}
                {searchMapsUrl && (
                  <a
                    href={searchMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface bg-surface-2 hover:bg-surface-3 text-foreground text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <span>Abrir no Maps</span>
                  </a>
                )}
                <a
                  href={`https://wa.me/${whatsappInfo.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Tenant sem endereço: renderiza apenas o bloco de contato sem mapa */
          <div className="p-6 sm:p-8 max-w-2xl mx-auto space-y-5">
            <div>
              <span className="text-[11px] font-bold text-brand uppercase tracking-wider block mb-1">
                {title || 'Atendimento e Contato'}
              </span>
              <h3 className="font-heading text-xl sm:text-2xl text-heading uppercase tracking-wide leading-tight">
                {store.name}
              </h3>
            </div>

            <ul className="space-y-3 text-sm">
              {phoneInfo.display && (
                <li className="flex items-center gap-3 text-foreground">
                  <Phone className="h-4 w-4 text-brand shrink-0" />
                  <a href={`tel:${phoneInfo.tel}`} className="text-foreground hover:text-brand font-medium">
                    {phoneInfo.label}: {phoneInfo.display}
                  </a>
                </li>
              )}
              {whatsappInfo.display && (
                <li className="flex items-center gap-3 text-foreground">
                  <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                  <a href={`https://wa.me/${whatsappInfo.number}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-[#25D366] font-medium">
                    WhatsApp: {whatsappInfo.display}
                  </a>
                </li>
              )}
              {store.email && (
                <li className="flex items-center gap-3 text-foreground">
                  <Mail className="h-4 w-4 text-brand shrink-0" />
                  <a href={`mailto:${store.email}`} className="text-foreground hover:text-brand font-medium">
                    {store.email}
                  </a>
                </li>
              )}
              {hoursList.length > 0 && (
                <li className="flex items-start gap-3 text-foreground">
                  <Clock className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    {hoursList.map((hour, idx) => (
                      <p key={idx} className="font-medium text-xs sm:text-sm">{hour}</p>
                    ))}
                  </div>
                </li>
              )}
            </ul>

            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappInfo.number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-bold shadow-xs hover:opacity-95 transition-opacity"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
