'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import StoreHeader from '@/components/storefront/StoreHeader'
import VehicleGrid from '@/components/storefront/VehicleGrid'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'
import ClosedScreen from '@/components/storefront/ClosedScreen'
import CookieBanner from '@/components/storefront/CookieBanner'
import { isBusinessOpen, getNextOpenInfo, CONCESSIONARIA_HOURS } from '@/lib/businessHours'
import { getVehicles } from '@/lib/vehicles'
import type { Store, Vehicle } from '@/lib/supabase/types'

interface StorefrontClientProps {
  slug: string
  searchParams: { q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string; v?: string; veiculo?: string }
  initialStore: Store | null
  initialVehicles: Vehicle[] | null
  DEMO_STORE: Store
}

export default function StorefrontClient({ slug, searchParams, initialStore, initialVehicles, DEMO_STORE }: StorefrontClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [store, setStore] = useState<Store>(initialStore || { ...DEMO_STORE, slug })
  const [isDemoMode, setIsDemoMode] = useState(!initialStore)
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    // Check business hours on client side
    const saoPauloNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    setIsOpen(isBusinessOpen(CONCESSIONARIA_HOURS, saoPauloNow))
  }, [])

  useEffect(() => {
    let currentVehicles = initialVehicles || []
    
    // Fallback to local storage if no server data was found (demo mode)
    if (!initialVehicles || initialVehicles.length === 0) {
      setIsDemoMode(true)
      currentVehicles = getVehicles().filter(v => v.is_active)
    }

    // Apply client side filters
    if (searchParams.brand && searchParams.brand !== 'all') {
      currentVehicles = currentVehicles.filter(v => v.brand.toLowerCase() === searchParams.brand?.toLowerCase())
    }
    if (searchParams.q) {
      const q = searchParams.q.toLowerCase()
      currentVehicles = currentVehicles.filter(v => v.title.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q))
    }
    if (searchParams.minPrice) {
      currentVehicles = currentVehicles.filter(v => v.price >= Number(searchParams.minPrice))
    }
    if (searchParams.maxPrice) {
      currentVehicles = currentVehicles.filter(v => v.price <= Number(searchParams.maxPrice))
    }
    if (searchParams.year && searchParams.year !== 'all') {
      currentVehicles = currentVehicles.filter(v => v.year === Number(searchParams.year))
    }

    setVehicles(currentVehicles)
  }, [initialVehicles, searchParams])

  const brands = [...new Set(vehicles.map((v) => v.brand))].sort()
  const years  = [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a)

  const fontFamily = store.font_family || 'Inter'
  const fontGoogleUrl = fontFamily !== 'Inter'
    ? `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`
    : null

  if (isOpen === false) {
    const saoPauloNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    return (
      <ClosedScreen
        storeName={store.name}
        nextOpen={getNextOpenInfo(CONCESSIONARIA_HOURS, saoPauloNow)}
        theme="zinc"
        whatsapp={store.whatsapp}
      />
    )
  }

  return (
    <div
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 pb-12"
      style={{ fontFamily: `'${fontFamily}', sans-serif` }}
    >
      {fontGoogleUrl && (
        <link rel="stylesheet" href={fontGoogleUrl} />
      )}

      {isDemoMode && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center">
          ⚡ Modo Local Ativo — Alterações são salvas apenas neste navegador.
        </div>
      )}

      <StoreHeader store={store} />

      {/* Hero Banner (se configurado) */}
      {store.banner_url && (
        <div className="container mx-auto px-3 sm:px-4 pt-4 max-w-7xl">
          <div className="relative aspect-[21/9] sm:aspect-[24/5] w-full rounded-2xl overflow-hidden shadow-xs border border-zinc-200 dark:border-zinc-800">
            <Image src={store.banner_url} alt={store.name} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <h2 className="text-xl sm:text-3xl font-black">{store.name}</h2>
              {store.slogan && <p className="text-xs sm:text-sm text-zinc-200 mt-1">{store.slogan}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Por que comprar com a gente (Napista / Genérico) */}
      <section className="container mx-auto px-3 sm:px-4 mt-8 max-w-7xl">
        <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">Por que comprar com a {store.name}?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { title: 'Laudo Cautelar 100% Aprovado', desc: 'Procedência garantida em todos os nossos carros.' },
            { title: 'Garantia de 1 Ano', desc: 'Compre tranquilo com motor e câmbio assegurados.' },
            { title: 'Taxas Imbatíveis', desc: 'Financiamento facilitado com as melhores taxas do mercado.' },
            { title: 'Avaliação Justa', desc: 'Pagamos o melhor preço no seu usado na troca.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
              <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">{item.title}</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <VehicleGrid
          vehicles={vehicles}
          store={store}
          brands={brands}
          years={years}
          searchParams={searchParams}
        />
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-12 py-8 text-center text-xs text-zinc-500">
        <p className="font-semibold text-zinc-900">{store.name}</p>
        {store.address && <p className="mt-0.5">{store.address}</p>}
        {store.opening_hours && (
          <p className="mt-1 text-zinc-600 font-medium">🕒 {store.opening_hours}</p>
        )}
        <p className="text-[11px] text-zinc-400 mt-3">Catálogo Interativo Mobile First com Checkout Direto via WhatsApp</p>
      </footer>

      <FloatingWhatsApp storeName={store.name} whatsapp={store.whatsapp} customMessage={`Olá! Estou no catálogo *${store.name}* e gostaria de informações.`} />
      <CookieBanner />
    </div>
  )
}
