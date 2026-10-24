import { createClient } from '@/lib/supabase/server'
import StoreHeader from '@/components/storefront/StoreHeader'
import VehicleGrid from '@/components/storefront/VehicleGrid'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'
import ClosedScreen from '@/components/storefront/ClosedScreen'
import { isBusinessOpen, getNextOpenInfo, CONCESSIONARIA_HOURS } from '@/lib/businessHours'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Store, Vehicle } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string; v?: string; veiculo?: string }>
}

const DEMO_STORE: Store = {
  id: 'demo-store-id',
  slug: 'loja-exemplo',
  name: 'Milhaticar',
  logo_url: '/logo-milhaticar.png',
  banner_url: null,
  address: 'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
  whatsapp: '5511994942661',
  whatsapp_financeiro: '5511994942661',
  opening_hours: 'Seg a Sex: 09h às 18h | Sáb: 09h às 13h',
  primary_color: '#18181B',
  font_family: 'Inter',
  slogan: 'VEÍCULOS NOVOS E SEMINOVOS, NACIONAIS E IMPORTADOS!',
  owner_id: 'demo-owner',
  created_at: new Date().toISOString(),
}

const DEMO_VEHICLES: Vehicle[] = [
  {
    id: '1',
    store_id: 'demo-store-id',
    sku: 'CIV23',
    title: 'Honda Civic Touring 1.5 Turbo CVT',
    brand: 'Honda',
    model: 'Civic',
    year: 2023,
    mileage: 26000,
    price: 154900,
    fuel: 'Gasolina',
    transmission: 'Automático CVT',
    plate_end: '7',
    features: ['Teto Solar', 'Bancos em Couro', 'Painel Digital TFT', 'Faróis Full LED', 'Laudo Cautelar 100%'],
    description: 'Único dono, revisões rigorosamente em dia na autorizada, impecável sem nenhum retoque.',
    images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    store_id: 'demo-store-id',
    sku: 'COR23',
    title: 'Toyota Corolla XEi 2.0 Dynamic Force',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    mileage: 19800,
    price: 139900,
    fuel: 'Flex',
    transmission: 'Automático Direct Shift',
    plate_end: '3',
    features: ['Garantia de Fábrica', 'Central Multimídia', 'Controle de Estabilidade', 'Câmera de Ré'],
    description: 'Carro de não-fumante, IPVA 2024 quitado, estado de zero quilômetro.',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    store_id: 'demo-store-id',
    sku: 'JCP22',
    title: 'Jeep Compass Longitude T270 Turbo Flex',
    brand: 'Jeep',
    model: 'Compass',
    year: 2022,
    mileage: 38000,
    price: 136900,
    fuel: 'Flex',
    transmission: 'Automático 6 marchas',
    plate_end: '9',
    features: ['Som Premium Beats', 'Painel Full Digital', 'Ar Dual Zone', 'Sensor de Ponto Cego'],
    description: 'SUV em excepcional estado de conservação, laudo cautelar aprovado e pneus novos.',
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    store_id: 'demo-store-id',
    sku: 'TCR23',
    title: 'Volkswagen T-Cross Highline 250 TSI',
    brand: 'Volkswagen',
    model: 'T-Cross',
    year: 2023,
    mileage: 24000,
    price: 122900,
    fuel: 'Flex',
    transmission: 'Automático Tiptronic',
    plate_end: '4',
    features: ['Active Info Display', 'Partida Start/Stop', 'Chave Presencial', 'Piloto Automático Adaptativo'],
    description: 'Versão topo de linha com motor turbo de 150cv, economia e esportividade.',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  }
]

import { getTenantBrand, getTenantDemoStore } from '@/lib/tenants'
import { getStoreWithContacts } from '@/lib/store-service'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = getTenantBrand(slug)
  try {
    const supabase = await createClient()
    const { data: store } = await supabase
      .from('stores').select('name, slogan, logo_url').eq('slug', slug).maybeSingle()
    if (store) {
      const iconUrl = store.logo_url || brand.logo.favicon
      return {
        title: `${store.name} - Catálogo de Veículos`,
        description: store.slogan || `Confira os veículos disponíveis na ${store.name}`,
        icons: {
          icon: iconUrl,
          apple: iconUrl,
        },
      }
    }
  } catch (e) {}

  const demoStore = getTenantDemoStore(slug)
  return {
    title: `${demoStore.name} - Catálogo de Veículos`,
    description: demoStore.slogan || `Confira o catálogo de seminovos da ${demoStore.name}`,
    icons: {
      icon: brand.logo.favicon,
      apple: brand.logo.appleIcon,
    },
  }
}

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sParams = await searchParams
  const demoStore = getTenantDemoStore(slug)

  let store: Store | null = null
  let vehicles: Vehicle[] | null = null
  let banners: any[] | null = null
  let customerPhotos: any[] | null = null
  let dbError: string | null = null

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      const supabase = await createClient()
      const { data: storeData, error: storeError } = await supabase
        .from('stores').select('id').eq('slug', slug).maybeSingle()

      if (storeError) {
        console.error('[Vitrine] Erro ao buscar loja por slug:', storeError.message)
        dbError = storeError.message
      }

      if (storeData) {
        store = await getStoreWithContacts(slug)

        // 1. Consulta de veículos com retry defensivo se a migration 022 (status) faltar
        const vRes = await supabase
          .from('vehicles').select('*')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .neq('status', 'vendido')
          .order('created_at', { ascending: false })

        if (vRes.error) {
          console.error('[Vitrine] Erro na consulta de veículos com filtro de status:', vRes.error.message)
          // Se a coluna status não existir (migration 022 pendente), refaz imediatamente sem o filtro
          if (
            vRes.error.code === '42703' ||
            vRes.error.message?.includes('status') ||
            vRes.error.code === 'PGRST204'
          ) {
            console.warn('[Vitrine] Coluna status inexistente no banco. Refazendo consulta sem filtro de status.')
            const retryRes = await supabase
              .from('vehicles').select('*')
              .eq('store_id', storeData.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })

            if (retryRes.error) {
              console.error('[Vitrine] Erro no retry de veículos:', retryRes.error.message)
              dbError = retryRes.error.message
              vehicles = null
            } else {
              vehicles = retryRes.data || []
            }
          } else {
            dbError = vRes.error.message
            vehicles = null
          }
        } else {
          vehicles = vRes.data || []
        }

        // 2. Consulta de banners com fallback para colunas legadas da tabela stores
        const bRes = await supabase
          .from('tenant_banners').select('*')
          .eq('tenant_id', storeData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })

        let bannersList: any[] = []
        if (bRes.error) {
          console.warn('[Vitrine] Aviso ao consultar tenant_banners (Migration 023 pendente):', bRes.error.message)
        } else {
          bannersList = bRes.data || []
        }

        // Retrocompatibilidade: se não há banners em tenant_banners, recupera das colunas antigas de stores
        if (bannersList.length === 0 && store) {
          if (store.banner_url) {
            bannersList.push({
              id: 'legacy-desktop',
              tenant_id: store.id,
              device: 'desktop',
              media_type: 'image',
              url: store.banner_url,
              sort_order: 0,
              is_active: true,
              created_at: new Date().toISOString(),
            })
          }
          if (store.banner_mobile_url) {
            bannersList.push({
              id: 'legacy-mobile',
              tenant_id: store.id,
              device: 'mobile',
              media_type: 'image',
              url: store.banner_mobile_url,
              sort_order: 0,
              is_active: true,
              created_at: new Date().toISOString(),
            })
          }
        }
        banners = bannersList

        // 3. Consulta de fotos de clientes
        const cRes = await supabase
          .from('tenant_customer_photos').select('*')
          .eq('tenant_id', storeData.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })

        if (cRes.error) {
          console.warn('[Vitrine] Aviso ao consultar tenant_customer_photos (Migration 025 pendente):', cRes.error.message)
          customerPhotos = []
        } else {
          customerPhotos = cRes.data || []
        }
      }
    }
  } catch (err: any) {
    console.error('[Vitrine] Falha inesperada ao consultar Supabase:', err?.message || err)
    dbError = err?.message || 'Erro inesperado de banco de dados'
  }

  // Import dynamically or normally (since it's a server component importing a client component)
  const StorefrontClient = (await import('./StorefrontClient')).default

  return (
    <StorefrontClient 
      slug={slug} 
      searchParams={sParams} 
      initialStore={store} 
      initialVehicles={vehicles} 
      initialBanners={banners}
      initialCustomerPhotos={customerPhotos}
      initialDbError={dbError}
      DEMO_STORE={demoStore} 
    />
  )
}