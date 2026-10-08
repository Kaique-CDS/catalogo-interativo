'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Banknote, CreditCard, RefreshCw } from 'lucide-react'
import type { Vehicle } from '@/lib/supabase/types'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

interface Props {
  vehicle: Vehicle
  store: {
    name: string
    whatsapp: string
    whatsapp_financeiro?: string | null
  }
  onClose: () => void
  onOpenFinancing: (hasTradeIn: boolean) => void
}

export default function InterestOptionsSheet({ vehicle, store, onClose, onOpenFinancing }: Props) {
  const [hasTradeIn, setHasTradeIn] = useState(false)

  const handleAVista = () => {
    // Track WhatsApp click
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: vehicle.store_id || 'demo-store-id',
        vehicle_id: vehicle.id,
        event_type: 'whatsapp_click',
        source: 'direct'
      })
    }).catch(console.error)

    const url = buildWhatsAppUrl({
      whatsapp: store.whatsapp,
      whatsappFinanceiro: store.whatsapp_financeiro,
      storeName: store.name,
      sku: vehicle.sku ?? 'N/A',
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      sector: 'vendas',
      hasTradeIn,
    })
    window.open(url, '_blank')
    onClose()
  }

  const handleFinanciamento = () => {
    // Note: The actual redirect to whatsapp happens inside FinancingModal, 
    // but it's a click expressing intent. We can track it there or here. 
    // Let's track it in FinancingModal as well, but for now we'll do it where the final button is clicked.
    onOpenFinancing(hasTradeIn)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-5 pb-8 sm:pb-6">
        {/* Handle */}
        <div className="w-10 h-1.5 bg-zinc-200 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Como deseja prosseguir?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={handleAVista}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800/60
                       hover:border-blue-200 dark:hover:border-emerald-500/50 hover:bg-blue-50 dark:hover:bg-emerald-950/20 transition-all group text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <Banknote className="h-6 w-6 text-green-700 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Consultar Valor & Condições</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Negociação direta com a equipe de Vendas</p>
            </div>
          </button>

          <button
            onClick={handleFinanciamento}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800/60
                       hover:border-blue-200 dark:hover:border-indigo-500/50 hover:bg-blue-50 dark:hover:bg-indigo-950/20 transition-all group text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-indigo-900/50 transition-colors">
              <CreditCard className="h-6 w-6 text-blue-700 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">Parcelamento / Financiamento</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Simular com a equipe Financeira</p>
            </div>
          </button>
        </div>

        {/* Trade-in toggle */}
        <label className="flex items-center gap-3 cursor-pointer group select-none">
          <div
            onClick={() => setHasTradeIn(!hasTradeIn)}
            className={`relative h-11 w-full flex items-center gap-3 px-4 rounded-2xl border-2 transition-all ${
              hasTradeIn
                ? 'border-orange-400 dark:border-orange-500/50 bg-orange-50 dark:bg-orange-950/30'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              hasTradeIn ? 'bg-orange-500 border-orange-500' : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
            }`}>
              {hasTradeIn && <svg viewBox="0 0 10 8" className="h-3 w-3 fill-white"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <RefreshCw className={`h-4 w-4 flex-shrink-0 transition-colors ${hasTradeIn ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <span className={`text-sm font-medium transition-colors ${hasTradeIn ? 'text-orange-800 dark:text-orange-300' : 'text-zinc-600 dark:text-zinc-400'}`}>
              Tenho um usado para dar na troca
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}