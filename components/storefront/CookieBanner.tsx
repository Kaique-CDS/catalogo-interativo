'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'

interface Props {
  storageKey?: string
}

export default function CookieBanner({ storageKey = 'catalogo_lgpd_accepted' }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(storageKey)
      if (!accepted) setVisible(true)
    } catch {
      // localStorage unavailable (SSR/private mode)
    }
  }, [storageKey])

  const accept = () => {
    try {
      localStorage.setItem(storageKey, '1')
    } catch { /* empty */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <div
        className="pointer-events-auto mx-auto max-w-2xl bg-zinc-900 text-white rounded-2xl shadow-2xl
                   flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5
                   border border-zinc-700"
      >
        <Cookie className="h-6 w-6 flex-shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-zinc-200">
            Este site utiliza cookies para melhorar sua experiência de navegação.
            Ao continuar, você concorda com nossa{' '}
            <a
              href="#"
              className="underline underline-offset-2 text-amber-400 hover:text-amber-300"
              onClick={(e) => e.preventDefault()}
            >
              Política de Privacidade
            </a>{' '}
            (LGPD).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={accept}
            className="flex-1 sm:flex-none bg-amber-400 hover:bg-amber-300 text-zinc-900 font-semibold rounded-xl"
          >
            Aceitar
          </Button>
          <button
            onClick={accept}
            className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}