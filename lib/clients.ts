'use client'

export interface SaaSClient {
  id: string
  name: string
  email: string
  phone: string
  plan: 'Trial' | 'Básico' | 'Médio' | 'Premium'
  status: 'Ativo' | 'Pendente' | 'Inativo'
  dueDate: string
  dbUsageBytes: number
  limitBytes: number
  createdAt: string
  blocked: boolean
}

const STORAGE_KEY = '@vendazap_saas_clients'

// Gerador de dados iniciais bonitos para demonstração
const getInitialClients = (): SaaSClient[] => [
  {
    id: 'cli-001', name: 'Concessionária NAPISTA', email: 'contato@napista.com.br', phone: '11999999999',
    plan: 'Premium', status: 'Ativo', dueDate: '2026-10-15', dbUsageBytes: 2.4 * 1024 * 1024 * 1024, limitBytes: 10 * 1024 * 1024 * 1024,
    createdAt: '2025-10-15', blocked: false
  },
  {
    id: 'cli-002', name: 'Doce Encanto Ateliê', email: 'doce@encanto.com', phone: '11988888888',
    plan: 'Médio', status: 'Pendente', dueDate: '2026-09-30', dbUsageBytes: 840 * 1024 * 1024, limitBytes: 5 * 1024 * 1024 * 1024,
    createdAt: '2026-02-10', blocked: false
  },
  {
    id: 'cli-003', name: 'Boutique da Moda', email: 'moda@boutique.com', phone: '21977777777',
    plan: 'Básico', status: 'Ativo', dueDate: '2026-11-05', dbUsageBytes: 1.2 * 1024 * 1024 * 1024, limitBytes: 5 * 1024 * 1024 * 1024,
    createdAt: '2026-05-20', blocked: false
  },
  {
    id: 'cli-004', name: 'Tech Store Brasil', email: 'admin@techstore.com.br', phone: '31966666666',
    plan: 'Básico', status: 'Inativo', dueDate: '2026-08-15', dbUsageBytes: 4.5 * 1024 * 1024 * 1024, limitBytes: 5 * 1024 * 1024 * 1024,
    createdAt: '2026-01-15', blocked: true
  },
  {
    id: 'cli-005', name: 'Venda de Garagem', email: 'garagem@venda.com', phone: '41955555555',
    plan: 'Trial', status: 'Ativo', dueDate: '2026-09-28', dbUsageBytes: 50 * 1024 * 1024, limitBytes: 1 * 1024 * 1024 * 1024,
    createdAt: '2026-09-21', blocked: false
  }
]

export function getClients(): SaaSClient[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse clients', e)
    }
  }
  const initial = getInitialClients()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return initial
}

export function saveClient(client: SaaSClient): SaaSClient[] {
  const clients = getClients()
  const index = clients.findIndex(c => c.id === client.id)
  let newClients = [...clients]
  if (index >= 0) {
    newClients[index] = client
  } else {
    newClients.unshift(client)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newClients))
  return newClients
}

export function updateClientStatus(id: string, status: SaaSClient['status'], blocked?: boolean): SaaSClient[] {
  const clients = getClients()
  const index = clients.findIndex(c => c.id === id)
  if (index >= 0) {
    clients[index].status = status
    if (blocked !== undefined) clients[index].blocked = blocked
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
  }
  return clients
}

export function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
