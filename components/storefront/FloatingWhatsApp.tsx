'use client'

interface Props {
  storeName: string
  whatsapp: string
}

export default function FloatingWhatsApp({ storeName, whatsapp }: Props) {
  const cleanPhone = whatsapp.replace(/\D/g, '')
  const message = `Olá, *${storeName}*! 👋\nGostaria de tirar algumas dúvidas sobre os veículos disponíveis no catálogo.`
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

  return (
    <aside aria-label="Atendimento via WhatsApp" className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        title="Falar no WhatsApp"
        className="flex items-center justify-center h-13 w-13 sm:h-14 sm:w-14 rounded-full
                   bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl hover:shadow-emerald-600/40
                   transition-all duration-300 transform hover:scale-105 active:scale-95 group"
      >
        {/* WhatsApp Icon */}
        <svg
          className="h-7 w-7 sm:h-8 sm:w-8 fill-white group-hover:scale-110 transition-transform duration-300"
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.17.581 4.204 1.597 5.968l-1.605 5.864 6.046-1.587c1.704.931 3.659 1.467 5.74 1.467 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
        </svg>
      </a>
    </aside>
  )
}