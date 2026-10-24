/**
 * Utilitários de Data e Tempo em Estoque (Catálogo Interativo)
 * Fuso horário oficial: America/Sao_Paulo
 */

export interface TempoEmEstoque {
  dateBr: string       // Ex: "23/10/2026"
  relative: string     // Ex: "hoje", "há 1 dia", "há 12 dias", "há 2 meses", "há 1 ano"
  compact: string      // Ex: "Hoje", "1 dia", "12 dias", "2 meses", "1 ano"
  days: number         // Quantidade de dias corridos no estoque
}

const SAO_PAULO_TZ = 'America/Sao_Paulo'

/**
 * Calcula o tempo decorrido no estoque a partir da data de criação do veículo
 * respeitando estritamente o fuso horário brasileiro (America/Sao_Paulo).
 */
export function getTempoEmEstoque(dateInput?: string | Date | null): TempoEmEstoque {
  const fallbackDate = new Date()
  let targetDate: Date

  if (!dateInput) {
    targetDate = fallbackDate
  } else if (typeof dateInput === 'string') {
    targetDate = new Date(dateInput)
    if (isNaN(targetDate.getTime())) {
      targetDate = fallbackDate
    }
  } else {
    targetDate = dateInput
  }

  // Formatador brasileiro DD/MM/AAAA no fuso de SP
  const brFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Formatador YYYY-MM-DD para contagem exata de dias de calendário
  const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dateBr = brFormatter.format(targetDate)

  try {
    const todayYmd = ymdFormatter.format(new Date())
    const targetYmd = ymdFormatter.format(targetDate)

    const [todayY, todayM, todayD] = todayYmd.split('-').map(Number)
    const [targetY, targetM, targetD] = targetYmd.split('-').map(Number)

    const todayUtc = Date.UTC(todayY, todayM - 1, todayD)
    const targetUtc = Date.UTC(targetY, targetM - 1, targetD)

    const diffMs = todayUtc - targetUtc
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

    let relative: string
    let compact: string

    if (days === 0) {
      relative = 'hoje'
      compact = 'Hoje'
    } else if (days === 1) {
      relative = 'há 1 dia'
      compact = '1 dia'
    } else if (days < 30) {
      relative = `há ${days} dias`
      compact = `${days} dias`
    } else if (days < 60) {
      relative = 'há 1 mês'
      compact = '1 mês'
    } else if (days < 365) {
      const months = Math.floor(days / 30)
      relative = `há ${months} meses`
      compact = `${months} meses`
    } else if (days < 730) {
      relative = 'há 1 ano'
      compact = '1 ano'
    } else {
      const years = Math.floor(days / 365)
      relative = `há ${years} anos`
      compact = `${years} anos`
    }

    return { dateBr, relative, compact, days }
  } catch {
    return { dateBr, relative: 'hoje', compact: 'Hoje', days: 0 }
  }
}

/**
 * Formata qualquer data para DD/MM/AAAA no fuso de São Paulo.
 */
export function formatDateBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '—'
  const targetDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(targetDate.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SAO_PAULO_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(targetDate)
}

/**
 * Calcula a diferença em dias inteiros entre cadastro e venda no fuso de São Paulo.
 */
export function getDaysToSell(createdAt?: string | Date | null, soldAt?: string | Date | null): number {
  if (!createdAt || !soldAt) return 0
  const cDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const sDate = typeof soldAt === 'string' ? new Date(soldAt) : soldAt
  if (isNaN(cDate.getTime()) || isNaN(sDate.getTime())) return 0

  const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  try {
    const cYmd = ymdFormatter.format(cDate)
    const sYmd = ymdFormatter.format(sDate)

    const [cY, cM, cD] = cYmd.split('-').map(Number)
    const [sY, sM, sD] = sYmd.split('-').map(Number)

    const cUtc = Date.UTC(cY, cM - 1, cD)
    const sUtc = Date.UTC(sY, sM - 1, sD)

    const diffMs = sUtc - cUtc
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  } catch {
    return 0
  }
}

export interface SoldVehicleItem {
  id: string
  title: string
  brand: string
  model: string
  price?: number | null
  created_at?: string
  sold_at?: string
  createdDateBr: string
  soldDateBr: string
  daysToSell: number
  hasSoldDate: boolean
}

export interface MonthlySalesPoint {
  monthKey: string  // "2024-10"
  label: string     // "Out/24"
  avgDays: number   // Média de dias
  totalSales: number // Quantidade de vendas
}

export interface SalesMetricsResult {
  totalSold: number
  soldWithDatesCount: number
  salesWithoutDateCount: number
  avgDays: number
  fastest: SoldVehicleItem | null
  slowest: SoldVehicleItem | null
  chartData: MonthlySalesPoint[]
  soldList: SoldVehicleItem[]
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

/**
 * Calcula todas as métricas de tempo até a venda no estoque.
 */
export function calculateSalesMetrics(
  vehicles: Array<any>,
  period: '30d' | '90d' | '12m' | 'all' = 'all',
  brandFilter: string = 'all',
  vehicleIdFilter: string = 'all'
): SalesMetricsResult {
  const now = new Date()
  const nowUtc = now.getTime()

  // 1. Filtrar vendidos
  let soldVehicles = (vehicles || []).filter(v => v.status === 'vendido')

  // 2. Filtro por veículo específico (se selecionado)
  if (vehicleIdFilter && vehicleIdFilter !== 'all') {
    soldVehicles = soldVehicles.filter(v => String(v.id) === String(vehicleIdFilter))
  }

  // 3. Filtro de marca
  if (brandFilter && brandFilter !== 'all') {
    soldVehicles = soldVehicles.filter(v => 
      (v.brand || '').toLowerCase() === brandFilter.toLowerCase()
    )
  }

  // 4. Filtro por período (baseado na data da venda sold_at ou fallback now())
  if (period !== 'all') {
    const periodDays = period === '30d' ? 30 : period === '90d' ? 90 : 365
    const cutoffTime = nowUtc - periodDays * 86400000
    soldVehicles = soldVehicles.filter(v => {
      if (!v.sold_at) return true // Preserva vendas antigas no histórico
      const soldTime = new Date(v.sold_at).getTime()
      return soldTime >= cutoffTime
    })
  }

  const soldList: SoldVehicleItem[] = []
  let totalDaysSum = 0
  let soldWithDatesCount = 0
  let salesWithoutDateCount = 0

  let fastest: SoldVehicleItem | null = null
  let slowest: SoldVehicleItem | null = null

  const monthlyMap: Record<string, { totalDays: number; count: number; monthKey: string }> = {}

  for (const v of soldVehicles) {
    const hasSoldDate = Boolean(v.sold_at)
    const daysToSell = hasSoldDate ? getDaysToSell(v.created_at, v.sold_at) : 0

    const item: SoldVehicleItem = {
      id: v.id,
      title: v.title,
      brand: v.brand,
      model: v.model,
      price: v.price,
      created_at: v.created_at,
      sold_at: v.sold_at,
      createdDateBr: formatDateBR(v.created_at),
      soldDateBr: formatDateBR(v.sold_at),
      daysToSell,
      hasSoldDate,
    }

    soldList.push(item)

    if (hasSoldDate) {
      soldWithDatesCount++
      totalDaysSum += daysToSell

      if (!fastest || daysToSell < fastest.daysToSell) {
        fastest = item
      }
      if (!slowest || daysToSell > slowest.daysToSell) {
        slowest = item
      }

      // Agrupamento mensal para o gráfico
      const sDate = new Date(v.sold_at)
      const year = sDate.getFullYear()
      const month = String(sDate.getMonth() + 1).padStart(2, '0')
      const monthKey = `${year}-${month}`

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { totalDays: 0, count: 0, monthKey }
      }
      monthlyMap[monthKey].totalDays += daysToSell
      monthlyMap[monthKey].count += 1
    } else {
      salesWithoutDateCount++
    }
  }

  // Ordena a lista de vendidos pela data de venda mais recente
  soldList.sort((a, b) => {
    const timeA = a.sold_at ? new Date(a.sold_at).getTime() : 0
    const timeB = b.sold_at ? new Date(b.sold_at).getTime() : 0
    return timeB - timeA
  })

  const avgDays = soldWithDatesCount > 0 ? Math.round(totalDaysSum / soldWithDatesCount) : 0

  // Formata pontos do gráfico
  const sortedMonthKeys = Object.keys(monthlyMap).sort()
  const chartData: MonthlySalesPoint[] = sortedMonthKeys.map(k => {
    const item = monthlyMap[k]
    const [y, m] = k.split('-')
    const shortYear = y.slice(2)
    const monthName = MONTH_LABELS[m] || m
    return {
      monthKey: k,
      label: `${monthName}/${shortYear}`,
      avgDays: Math.round(item.totalDays / item.count),
      totalSales: item.count,
    }
  })

  return {
    totalSold: soldVehicles.length,
    soldWithDatesCount,
    salesWithoutDateCount,
    avgDays,
    fastest,
    slowest,
    chartData,
    soldList,
  }
}

