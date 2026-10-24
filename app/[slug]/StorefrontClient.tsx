'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import StoreHeader from '@/components/storefront/StoreHeader'
import VehicleGrid from '@/components/storefront/VehicleGrid'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'
import FloatingWelcomeVideo from '@/components/storefront/FloatingWelcomeVideo'
import ClosedScreen from '@/components/storefront/ClosedScreen'
import CookieBanner from '@/components/storefront/CookieBanner'
import { isBusinessOpen, getNextOpenInfo, CONCESSIONARIA_HOURS } from '@/lib/businessHours'
import { getVehicles } from '@/lib/vehicles'
import type { Store, Vehicle } from '@/lib/supabase/types'
import { ShieldCheck, BadgeCheck, BadgePercent, Car, Clock, Phone as PhoneIcon, MessageCircle, MapPin } from 'lucide-react'
import BrandBanner from '@/components/storefront/BrandBanner'
import LocationSection from '@/components/storefront/LocationSection'
import CustomerPhotosSection from '@/components/storefront/CustomerPhotosSection'
import Footer from '@/components/storefront/Footer'
import { getClientTrafficInfo } from '@/lib/analytics-source'
import { getTenantBrand } from '@/lib/tenants'
import { getStorePhone, getStoreInstagram, getStoreWhatsApp } from '@/lib/store-contact'

interface StorefrontClientProps {
  slug: string
  searchParams: { q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string; v?: string; veiculo?: string }
  initialStore: Store | null
  initialVehicles: Vehicle[] | null
  initialBanners?: any[] | null
  initialCustomerPhotos?: any[] | null
  initialDbError?: string | null
  DEMO_STORE: Store
}

export default function StorefrontClient({ slug, searchParams, initialStore, initialVehicles, initialBanners, initialCustomerPhotos, initialDbError, DEMO_STORE }: StorefrontClientProps) {
  const brand = getTenantBrand(slug)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [store, setStore] = useState<Store>(initialStore || { ...DEMO_STORE, slug })
  const [isDemoMode, setIsDemoMode] = useState(!initialStore)
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  const phoneInfo = getStorePhone(store)
  const instagramInfo = getStoreInstagram(store)
  const whatsappInfo = getStoreWhatsApp(store)

  useEffect(() => {
    // Check business hours on client side
    const saoPauloNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    setIsOpen(isBusinessOpen(CONCESSIONARIA_HOURS, saoPauloNow))

    // Track page view with accurate source detection (URL params, In-App Browser UA, Referrer, sessionStorage)
    const trafficInfo = getClientTrafficInfo()

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: store.id,
        slug,
        event_type: 'page_view',
        source: trafficInfo.source,
        session_id: trafficInfo.sessionId,
        source_detail: trafficInfo.sourceDetail,
        referrer_host: trafficInfo.referrerHost,
        utm_source: trafficInfo.utmSource,
        utm_medium: trafficInfo.utmMedium,
        utm_campaign: trafficInfo.utmCampaign,
      }),
    }).catch(console.error)
  }, [slug, store.id])

  useEffect(() => {
    let currentVehicles = (initialVehicles || []).filter(v => v.status !== 'vendido')
    
    // Fallback to local storage only for tenants configured with demo vehicles (milhaticar)
    if (initialVehicles === null) {
      setIsDemoMode(true)
      currentVehicles = brand.allowLocalDemoVehicles
        ? getVehicles().filter(v => v.is_active && v.status !== 'vendido')
        : []
    }

    // Apply client side filters
    if (searchParams.brand && searchParams.brand !== 'all') {
      currentVehicles = currentVehicles.filter(v => v.brand.toLowerCase() === searchParams.brand?.toLowerCase())
    }
    if (searchParams.q) {
      const q = searchParams.q.toLowerCase()
      currentVehicles = currentVehicles.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.model.toLowerCase().includes(q) || 
        v.brand.toLowerCase().includes(q) ||
        (v.sku && v.sku.toLowerCase().includes(q))
      )
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
        whatsapp={whatsappInfo.number}
      />
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-surface-0 text-foreground transition-colors duration-300"
      style={{ fontFamily: 'var(--font-body, Montserrat, sans-serif)' }}
    >
      {fontGoogleUrl && (
        <link rel="stylesheet" href={fontGoogleUrl} />
      )}

      <StoreHeader store={store} />

      {/* ── Brand Banner (Carrossel Imagens / Vídeos) ── */}
      {(initialBanners?.length || store.banner_url || store.banner_mobile_url || brand.banners.desktop || brand.banners.mobile) && (
        <section className="container mx-auto px-3 sm:px-4 mt-4 sm:mt-6 max-w-7xl">
          <BrandBanner
            altText={`Bem-vindo à ${store.name}`}
            banners={initialBanners || undefined}
            desktopBanner={store.banner_url || brand.banners.desktop || null}
            mobileBanner={store.banner_mobile_url || brand.banners.mobile || null}
          />
        </section>
      )}

      {/* ── Grid Principal ── */}
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl flex-1 pb-16 sm:pb-8">
        <VehicleGrid
          vehicles={vehicles}
          store={store}
          brands={brands}
          years={years}
          searchParams={searchParams}
          hasDbError={Boolean(initialDbError)}
        />
      </main>

      {/* ── Clientes que levaram o carro pra casa (Prompt 3: entre listagem de carros e mapa/contato) ── */}
      <CustomerPhotosSection
        photos={initialCustomerPhotos}
        store={store}
        slug={slug}
      />

      {/* ── Localização e Bloco de Contato ── */}
      <div className="container mx-auto px-3 sm:px-4 pb-12 max-w-7xl">
        <LocationSection store={store} />
      </div>

      {/* ── Footer Unificado ── */}
      <Footer store={store} variant="full" />

      <FloatingWhatsApp
        storeId={store.id}
        slug={slug}
        storeName={store.name}
        whatsapp={whatsappInfo.number}
        customMessage={`Olá! Estou no catálogo *${store.name}* e gostaria de informações.`}
      />

      {/* ── Vídeo Institucional Flutuante (Prompt 2) ── */}
      <FloatingWelcomeVideo
        slug={slug}
        storeName={store.name}
        videoUrl={store.welcome_video_url}
        posterUrl={store.welcome_video_poster_url}
        enabled={store.welcome_video_enabled}
      />

      <CookieBanner />
    </div>
  )
}
