import type { Vehicle } from './supabase/types'

export const DEMO_VEHICLES: Vehicle[] = [
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
    color: 'Branco Pérola',
    plate_end: '7',
    badge: null,
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
    color: 'Prata Metálico',
    plate_end: '3',
    badge: null,
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
    color: 'Preto Carbon',
    plate_end: '9',
    badge: null,
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
    color: 'Cinza Platinum',
    plate_end: '4',
    badge: null,
    features: ['Active Info Display', 'Partida Start/Stop', 'Chave Presencial', 'Piloto Automático Adaptativo'],
    description: 'Versão topo de linha com motor turbo de 150cv, economia e esportividade.',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    is_active: true,
    created_at: new Date().toISOString(),
  }
]

const STORAGE_KEY = 'concessionaria_custom_vehicles'

export function getVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return DEMO_VEHICLES
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEMO_VEHICLES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEMO_VEHICLES
  } catch {
    return DEMO_VEHICLES
  }
}

export function saveVehicle(vehicle: Vehicle): void {
  if (typeof window === 'undefined') return
  try {
    const list = getVehicles()
    const index = list.findIndex(p => p.id === vehicle.id)
    if (index >= 0) {
      list[index] = vehicle
    } else {
      list.unshift(vehicle)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Erro ao salvar veículo:', e)
  }
}

export function deleteVehicle(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const list = getVehicles().filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Erro ao excluir veículo:', e)
  }
}
