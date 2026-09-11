import { createClient } from '@/lib/supabase/server'
import StoreHeader from '@/components/storefront/StoreHeader'
import VehicleGrid from '@/components/storefront/VehicleGrid'
import type { Metadata } from 'next'
import type { Store, Vehicle } from '@/lib/supabase/types'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string }>
}

const DEMO_STORE: Store = {
  id: 'demo-store-id',
  slug: 'loja-exemplo',
  name: 'AutoCenter Premium',
  logo_url: null,
  address: 'Av. das Nações, 1500 - São Paulo, SP',
  whatsapp: '5511999999999',
  owner_id: 'demo-owner',
  created_at: new Date().toISOString(),
}

const DEMO_VEHICLES: Vehicle[] = [
  {
    id: '1',
    store_id: 'demo-store-id',
    title: 'Honda Civic Touring 1.5 Turbo',
    brand: 'Honda',
    model: 'Civic',
    year: 2022,
    mileage: 28000,
    price: 149900,
    description: 'Único dono, todas revisões na concessionária, teto solar, bancos em couro.',
    images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    store_id: 'demo-store-id',
    title: 'Toyota Corolla XEi 2.0 Flex',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2023,
    mileage: 18500,
    price: 138900,
    description: 'Impecável, garantia de fábrica ativa, IPVA 2024 pago.',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    store_id: 'demo-store-id',
    title: 'Jeep Compass Longitude T270 Turbo',
    brand: 'Jeep',
    model: 'Compass',
    year: 2021,
    mileage: 42000,
    price: 132000,
    description: 'Pacote premium de som Beats, faróis em LED, pneus novos.',
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    store_id: 'demo-store-id',
    title: 'Volkswagen T-Cross Highline 250 TSI',
    brand: 'Volkswagen',
    model: 'T-Cross',
    year: 2022,
    mileage: 31000,
    price: 119900,
    description: 'Painel digital active info display, chave presencial, piloto automático adaptativo.',
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
      .from('stores').select('name').eq('slug', slug).maybeSingle()
    if (store) {
      return {
        title: `${store.name} - Catálogo de Veículos`,
        description: `Confira o catálogo de veículos da ${store.name}`,
      }
    }
  } catch (e) {
    // Supabase fallback
  }

  return {
    title: `${DEMO_STORE.name} - Catálogo Demo`,
    description: `Confira o catálogo de veículos da ${DEMO_STORE.name}`,
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

      if (sParams.brand)    query = query.ilike('brand', `%${sParams.brand}%`)
      if (sParams.q)        query = query.or(`title.ilike.%${sParams.q}%,brand.ilike.%${sParams.q}%,model.ilike.%${sParams.q}%`)
      if (sParams.minPrice) query = query.gte('price', Number(sParams.minPrice))
      if (sParams.maxPrice) query = query.lte('price', Number(sParams.maxPrice))
      if (sParams.year)     query = query.eq('year', Number(sParams.year))

      const { data: vData } = await query
      vehicles = vData ?? []
    }
  } catch (err) {
    console.error('Supabase query error, fallback to demo:', err)
  }

  // Fallback demo caso não haja loja ou o Supabase ainda não esteja configurado
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

  return (
    <div className="min-h-screen bg-zinc-50">
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-xs font-medium py-2 px-4 text-center">
          ⚡ Modo Demonstração Ativo — Para conectar seu banco, insira as credenciais no arquivo <code>.env.local</code>.
        </div>
      )}
      <StoreHeader store={store} />
      <main className="container mx-auto px-4 py-8">
        <VehicleGrid
          vehicles={vehicles}
          store={store}
          brands={brands}
          years={years}
          searchParams={sParams}
        />
      </main>
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-zinc-400">
          {store.name} - Catálogo interativo por AutoCatálogo
        </div>
      </footer>
    </div>
  )
}