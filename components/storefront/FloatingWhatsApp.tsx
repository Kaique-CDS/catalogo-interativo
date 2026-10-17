'use client'

import { useEffect, useState } from 'react'
import { getTrafficSource } from '@/lib/analytics-source'

interface Props {
  storeId?: string
  slug?: string
  storeName: string
  whatsapp: string
  customMessage?: string
}

export default function FloatingWhatsApp({ storeId, slug, storeName, whatsapp, customMessage }: Props) {
  const [bottomOffset, setBottomOffset] = useState<number>(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const cleanPhone = whatsapp.replace(/\D/g, '')
  const message = customMessage || `Olá, *${storeName}*! 👋\nGostaria de tirar algumas dúvidas sobre os veículos disponíveis no catálogo.`
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  // 1. Acoplamento dinâmico via IntersectionObserver + Scroll:
  // Quando o footer entra na viewport, calcula o overlap e ancora o botão
  // exatamente 16px acima do topo do rodapé, nunca cobrindo créditos nem copyright.
  useEffect(() => {
    const findFooter = () =>
      document.querySelector('footer.store-footer') ||
      document.querySelector('footer')

    const updatePosition = () => {
      const footer = findFooter()
      if (!footer) {
        setBottomOffset(0)
        return
      }

      const rect = footer.getBoundingClientRect()
      const windowHeight = window.innerHeight
      // Distância da base da viewport até o topo do footer
      const overlap = windowHeight - rect.top

      if (overlap > 0) {
        // Ancora 16px acima do topo do footer
        setBottomOffset(Math.round(overlap + 16))
      } else {
        setBottomOffset(0)
      }
    }

    // Atualização inicial
    updatePosition()

    const footer = findFooter()
    let observer: IntersectionObserver | null = null

    if (footer && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        () => {
          updatePosition()
        },
        {
          root: null,
          threshold: [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        }
      )
      observer.observe(footer)
    }

    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    return () => {
      if (observer) observer.disconnect()
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [])

  // 2. Ocultar o botão automaticamente quando houver modal, drawer ou lightbox aberto
  // (evita cobrir CTAs como 'Tenho Interesse' e opções de financiamento)
  useEffect(() => {
    const checkModal = () => {
      if (typeof document === 'undefined') return
      const hasDialog = !!document.querySelector(
        '[role="dialog"], [aria-modal="true"], .fixed.inset-0.z-50, [data-state="open"]'
      )
      const isBodyLocked =
        document.body.style.overflow === 'hidden' ||
        document.body.style.position === 'fixed'

      setIsModalOpen(hasDialog || isBodyLocked)
    }

    checkModal()

    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-state'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <aside
      aria-label="Atendimento via WhatsApp"
      style={{
        bottom:
          bottomOffset > 0
            ? `${bottomOffset}px`
            : 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        right: 'max(1.25rem, env(safe-area-inset-right, 1.25rem))',
      }}
      className={`fixed z-30 transition-all duration-200 ease-out ${
        isModalOpen
          ? 'opacity-0 pointer-events-none scale-75'
          : 'opacity-100 pointer-events-auto scale-100'
      }`}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        title="Falar no WhatsApp"
        onClick={() => {
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              store_id: storeId,
              slug,
              event_type: 'whatsapp_click',
              source: getTrafficSource(),
            }),
          }).catch(console.error)
        }}
        className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full
                   bg-[#25D366] hover:bg-[#20bd5a] text-white
                   shadow-[0_4px_20px_rgba(37,211,102,0.5)] hover:shadow-[0_6px_28px_rgba(37,211,102,0.7)]
                   transition-all duration-200 transform hover:scale-105 active:scale-95 group
                   focus:outline-hidden focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Símbolo Oficial do WhatsApp (FontAwesome / Brand Asset) */}
        <svg
          className="w-8 h-8 sm:w-9 sm:h-9 fill-white group-hover:scale-110 transition-transform duration-200"
          viewBox="0 0 448 512"
          aria-hidden="true"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>
    </aside>
  )
}