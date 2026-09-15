'use client'

import { MessageCircle } from 'lucide-react'

interface Props {
  storeName: string
  whatsapp: string
}

export default function FloatingWhatsApp({ storeName, whatsapp }: Props) {
  const cleanPhone = whatsapp.replace(/\D/g, '')
  const message = `Olá, *${storeName}*! 👋\nGostaria de tirar algumas dúvidas sobre os veículos disponíveis no catálogo.`
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  return (
    <aside aria-label="Atendimento via WhatsApp" className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-40">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white
                   p-3 sm:px-4 sm:py-3 rounded-full shadow-lg hover:shadow-emerald-600/30
                   transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
        title="Tirar dúvidas no WhatsApp"
      >
        {/* Pulsing notification dot */}
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
        </span>

        <MessageCircle className="h-5 w-5 fill-white text-emerald-600 sm:text-white sm:fill-none" />

        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">Dúvidas?</span>
          <span className="text-xs font-bold text-white">Fale no WhatsApp</span>
        </div>
      </a>
    </aside>
  )
}