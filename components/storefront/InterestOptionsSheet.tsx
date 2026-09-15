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
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 space-y-5 pb-8 sm:pb-6">
        {/* Handle */}
        <div className="w-10 h-1.5 bg-zinc-200 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Como deseja prosseguir?</h3>
            <p className="text-sm text-zinc-500 mt-0.5">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={handleAVista}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100
                       hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
              <Banknote className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Compra à Vista</p>
              <p className="text-sm text-zinc-500">Falar com a equipe de Vendas</p>
            </div>
          </button>

          <button
            onClick={handleFinanciamento}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-zinc-100
                       hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <CreditCard className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Parcelamento / Financiamento</p>
              <p className="text-sm text-zinc-500">Simular com a equipe Financeira</p>
            </div>
          </button>
        </div>

        {/* Trade-in toggle */}
        <label className="flex items-center gap-3 cursor-pointer group select-none">
          <div
            onClick={() => setHasTradeIn(!hasTradeIn)}
            className={`relative h-11 w-full flex items-center gap-3 px-4 rounded-2xl border-2 transition-all ${
              hasTradeIn
                ? 'border-orange-400 bg-orange-50'
                : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
            }`}
          >
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              hasTradeIn ? 'bg-orange-500 border-orange-500' : 'border-zinc-300 bg-white'
            }`}>
              {hasTradeIn && <svg viewBox="0 0 10 8" className="h-3 w-3 fill-white"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <RefreshCw className={`h-4 w-4 flex-shrink-0 transition-colors ${hasTradeIn ? 'text-orange-600' : 'text-zinc-400'}`} />
            <span className={`text-sm font-medium transition-colors ${hasTradeIn ? 'text-orange-800' : 'text-zinc-600'}`}>
              Tenho um usado para dar na troca
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}