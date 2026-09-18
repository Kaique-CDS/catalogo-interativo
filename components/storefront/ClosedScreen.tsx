'use client'

import React from 'react'
import { Clock, Moon, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ClosedScreenProps {
  storeName: string
  nextOpen: string
  theme: 'rose' | 'zinc'
  whatsapp?: string
  contactUrl?: string
  onContact?: () => void
}

export default function ClosedScreen({
  storeName,
  nextOpen,
  theme,
  whatsapp,
  contactUrl,
  onContact,
}: ClosedScreenProps) {
  const isRose = theme === 'rose'
  const emoji = isRose ? '🎂' : '🚗'

  const cleanPhone = whatsapp ? whatsapp.replace(/\D/g, '') : ''
  const defaultWhatsAppUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        isRose
          ? `Olá! Gostaria de tirar uma dúvida sobre os doces e bolos da ${storeName}.`
          : `Olá! Gostaria de informações sobre os veículos da ${storeName}.`
      )}`
    : undefined

  const resolvedContactUrl = contactUrl || defaultWhatsAppUrl

  return (
    <main
      className={cn(
        'min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none transition-colors duration-300',
        isRose ? 'bg-[#FFF9F6] text-rose-950' : 'bg-zinc-950 text-zinc-100'
      )}
    >
      {/* Ambient background decoration */}
      {isRose ? (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-200/40 via-rose-100/20 to-transparent pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/25 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-zinc-800/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-zinc-900/60 blur-3xl pointer-events-none" />
        </>
      )}

      {/* Main card */}
      <div
        className={cn(
          'relative z-10 max-w-md w-full rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl transition-all duration-300 backdrop-blur-md',
          isRose
            ? 'bg-white/90 border border-rose-100/90 shadow-rose-200/40'
            : 'bg-zinc-900/90 border border-zinc-800/80 shadow-black/60'
        )}
      >
        {/* Large emoji icon at top */}
        <div
          className={cn(
            'w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-3 shadow-inner transition-transform duration-300 hover:scale-105',
            isRose
              ? 'bg-rose-50 border border-rose-100/80 text-rose-500'
              : 'bg-zinc-800/70 border border-zinc-700/60 text-zinc-100'
          )}
          aria-hidden="true"
        >
          {emoji}
        </div>

        {/* Badge / Pill: Fechado agora */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4 transition-colors',
            isRose
              ? 'bg-rose-100/80 text-rose-700 border border-rose-200/60'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          )}
        >
          <Clock className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
          <span>Fechado agora</span>
        </div>

        {/* Title */}
        <h1
          className={cn(
            'text-3xl sm:text-4xl font-extrabold tracking-tight',
            isRose ? 'text-rose-950' : 'text-white'
          )}
        >
          Estamos Fechados
        </h1>

        {/* Subtitle */}
        <p
          className={cn(
            'mt-2 text-base font-medium',
            isRose ? 'text-rose-600/90' : 'text-zinc-400'
          )}
        >
          {storeName}
        </p>

        {/* Section: Reabrimos {nextOpen} */}
        <div
          className={cn(
            'w-full rounded-2xl p-4 mt-6 flex items-center justify-center gap-3 border transition-colors',
            isRose
              ? 'bg-rose-50/70 border-rose-100 text-rose-900'
              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-100'
          )}
        >
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
              isRose ? 'bg-rose-100 text-rose-600' : 'bg-zinc-700/70 text-zinc-300'
            )}
          >
            <Moon className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-wider',
                isRose ? 'text-rose-400' : 'text-zinc-400'
              )}
            >
              Horário de Atendimento
            </p>
            <p className="text-sm sm:text-base font-bold">
              Reabrimos {nextOpen}
            </p>
          </div>
        </div>

        {/* Tasteful note */}
        <p
          className={cn(
            'mt-5 text-xs sm:text-sm leading-relaxed max-w-xs',
            isRose ? 'text-rose-800/75' : 'text-zinc-400'
          )}
        >
          {isRose
            ? 'Enquanto isso, você pode nos enviar uma mensagem. Responderemos com carinho assim que reabrirmos!'
            : 'Enquanto isso, entre em contato para deixar sua mensagem ou proposta. Retornaremos assim que abrirmos!'}
        </p>

        {/* Contact Button */}
        <div className="w-full mt-6">
          {resolvedContactUrl ? (
            <Button
              asChild
              className={cn(
                'w-full font-semibold rounded-xl h-11 text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer',
                isRose
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-white hover:bg-zinc-200 text-zinc-950'
              )}
            >
              <a
                href={resolvedContactUrl}
                target={resolvedContactUrl.startsWith('http') ? '_blank' : undefined}
                rel={resolvedContactUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <MessageCircle className="w-4 h-4" />
                Entre em Contato
              </a>
            </Button>
          ) : (
            <Button
              onClick={onContact}
              className={cn(
                'w-full font-semibold rounded-xl h-11 text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2',
                isRose
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-white hover:bg-zinc-200 text-zinc-950'
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Entre em Contato
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}
