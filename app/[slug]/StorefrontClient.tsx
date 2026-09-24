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

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-12 pt-12 pb-8">
        <div className="container mx-auto px-4 max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4">{store.name}</h3>
            {store.slogan && <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 max-w-sm">{store.slogan}</p>}
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              <li className="flex items-center gap-2">📞 {store.whatsapp}</li>
              {store.address && <li className="flex items-start gap-2">📍 {store.address}</li>}
              {store.opening_hours && <li className="flex items-start gap-2">🕒 {store.opening_hours}</li>}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">Nosso Estoque</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">Quem Somos</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">Termos e Condições</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400">Política de Privacidade</a></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 max-w-7xl mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">© {new Date().getFullYear()} {store.name}. Todos os direitos reservados.</p>
          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Desenvolvido por <a href="/" className="text-indigo-500">VendaZap Catálogos</a>
          </p>
        </div>
      </footer>

      <FloatingWhatsApp storeName={store.name} whatsapp={store.whatsapp} customMessage={`Olá! Estou no catálogo *${store.name}* e gostaria de informações.`} />
      <CookieBanner />
    </div>
  )
}
