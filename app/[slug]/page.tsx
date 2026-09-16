import { createClient } from '@/lib/supabase/server'
import StoreHeader from '@/components/storefront/StoreHeader'
import VehicleGrid from '@/components/storefront/VehicleGrid'
import FloatingWhatsApp from '@/components/storefront/FloatingWhatsApp'
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
  let vehicles: Vehicle[] = []
  let isDemoMode = false

  try {
    const supabase = await createClient()
    const { data: storeData } = await supabase
      .from('stores').select('*').eq('slug', slug).maybeSingle()

    store = storeData

    if (store) {
      let query = supabase
        .from('vehicles').select('*')
        .eq('store_id', store.id).eq('is_active', true)
        .order('created_at', { ascending: false })

      if (sParams.brand && sParams.brand !== 'all') {
        query = query.ilike('brand', `%${sParams.brand}%`)
      }
      if (sParams.q) {
        query = query.or(`title.ilike.%${sParams.q}%,brand.ilike.%${sParams.q}%,model.ilike.%${sParams.q}%`)
      }
      if (sParams.minPrice) query = query.gte('price', Number(sParams.minPrice))
      if (sParams.maxPrice) query = query.lte('price', Number(sParams.maxPrice))
      if (sParams.year && sParams.year !== 'all') query = query.eq('year', Number(sParams.year))

      const { data: vData } = await query
      vehicles = vData ?? []
    }
  } catch (err) {
    console.error('Supabase query fallback:', err)
  }

  if (!store) {
    isDemoMode = true
    store = { ...DEMO_STORE, slug }
    vehicles = DEMO_VEHICLES

    if (sParams.brand && sParams.brand !== 'all') {
      vehicles = vehicles.filter(v => v.brand.toLowerCase() === sParams.brand?.toLowerCase())
    }
    if (sParams.q) {
      const q = sParams.q.toLowerCase()
      vehicles = vehicles.filter(v => v.title.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q))
    }
    if (sParams.minPrice) {
      vehicles = vehicles.filter(v => v.price >= Number(sParams.minPrice))
    }
    if (sParams.maxPrice) {
      vehicles = vehicles.filter(v => v.price <= Number(sParams.maxPrice))
    }
    if (sParams.year && sParams.year !== 'all') {
      vehicles = vehicles.filter(v => v.year === Number(sParams.year))
    }
  }

  const brands = [...new Set(vehicles.map((v) => v.brand))].sort()
  const years  = [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a)

  const fontFamily = store.font_family || 'Inter'
  const fontGoogleUrl = fontFamily !== 'Inter'
    ? `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`
    : null

  return (
    <div
      className="min-h-screen bg-zinc-50 pb-12"
      style={{ fontFamily: `'${fontFamily}', sans-serif` }}
    >
      {fontGoogleUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontGoogleUrl} />
      )}

      {isDemoMode && (
        <div className="bg-amber-500 text-white text-xs font-semibold py-2 px-4 text-center">
          ⚡ Modo Demonstração Ativo — Conecte seu Supabase em <code>.env.local</code> para gerenciar dados reais.
        </div>
      )}

      <StoreHeader store={store} />

      {/* Hero Banner (se configurado) */}
      {store.banner_url && (
        <div className="container mx-auto px-3 sm:px-4 pt-4 max-w-7xl">
          <div className="relative aspect-[21/9] sm:aspect-[24/5] w-full rounded-2xl overflow-hidden shadow-xs border border-zinc-200">
            <Image src={store.banner_url} alt={store.name} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <h2 className="text-xl sm:text-3xl font-black">{store.name}</h2>
              {store.slogan && <p className="text-xs sm:text-sm text-zinc-200 mt-1">{store.slogan}</p>}
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <VehicleGrid
          vehicles={vehicles}
          store={store}
          brands={brands}
          years={years}
          searchParams={sParams}
        />
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-12 py-8 text-center text-xs text-zinc-500">
        <p className="font-semibold text-zinc-900">{store.name}</p>
        {store.address && <p className="mt-0.5">{store.address}</p>}
        {store.opening_hours && (
          <p className="mt-1 text-zinc-600 font-medium">🕐 {store.opening_hours}</p>
        )}
        <p className="text-[11px] text-zinc-400 mt-3">Catálogo Interativo Mobile First com Checkout Direto via WhatsApp</p>
      </footer>

      <FloatingWhatsApp storeName={store.name} whatsapp={store.whatsapp} />
    </div>
  )
}