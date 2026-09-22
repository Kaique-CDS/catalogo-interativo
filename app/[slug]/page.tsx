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
  name: 'AutoCenter Motors Premium',
  logo_url: null,
  banner_url: null,
  address: 'Av. das Nações, 1500 - São Paulo, SP',
  whatsapp: '5511993270543',
  whatsapp_financeiro: '5511993270543',
  opening_hours: 'Seg a Sex: 09h às 18h | Sáb: 09h às 13h',
  primary_color: '#18181B',
  font_family: 'Inter',
  slogan: 'Os melhores veículos seminovos com laudo 100% aprovado e procedência garantida.',
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const supabase = await createClient()
    const { data: store } = await supabase
      .from('stores').select('name, slogan').eq('slug', slug).maybeSingle()
    if (store) {
      return {
        title: `${store.name} - Catálogo de Veículos`,
        description: store.slogan || `Confira os veículos disponíveis na ${store.name}`,
      }
    }
  } catch (e) {}

  return {
    title: `${DEMO_STORE.name} - Catálogo de Veículos`,
    description: DEMO_STORE.slogan || `Confira o catálogo de seminovos da ${DEMO_STORE.name}`,
  }
}

export default async function StorefrontPage({ params, searchParams }: Props) {
  const { slug } = await params
  const sParams = await searchParams

  let store: Store | null = null
  let vehicles: Vehicle[] | null = null

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      const supabase = await createClient()
      const { data: storeData } = await supabase
        .from('stores').select('*').eq('slug', slug).maybeSingle()

      if (storeData) {
        store = storeData
        const { data: vData } = await supabase
          .from('vehicles').select('*')
          .eq('store_id', storeData.id).eq('is_active', true)
          .order('created_at', { ascending: false })
        
        vehicles = vData || []
      }
    }
  } catch (err) {
    console.error('Supabase query fallback:', err)
  }

  // Import dynamically or normally (since it's a server component importing a client component)
  const StorefrontClient = (await import('./StorefrontClient')).default

  return (
    <StorefrontClient 
      slug={slug} 
      searchParams={sParams} 
      initialStore={store} 
      initialVehicles={vehicles} 
      DEMO_STORE={DEMO_STORE} 
    />
  )
}