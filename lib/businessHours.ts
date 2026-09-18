export interface DayHours {
  open: number
  close: number
}

export type WeeklyHours = Record<number, DayHours | null>

const DAY_NAMES = ['Domingo', 'Segunda', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado']

// Concessionaria: Seg-Sex 09-18 | Sab 09-13 | Dom fechado
export const CONCESSIONARIA_HOURS: WeeklyHours = {
  0: null,
  1: { open: 9, close: 18 },
  2: { open: 9, close: 18 },
  3: { open: 9, close: 18 },
  4: { open: 9, close: 18 },
  5: { open: 9, close: 18 },
  6: { open: 9, close: 13 },
}

// Confeitaria: Ter-Sab 09-19 | Dom 09-14 | Seg fechado
export const CONFEITARIA_HOURS: WeeklyHours = {
  0: { open: 9, close: 14 },
  1: null,
  2: { open: 9, close: 19 },
  3: { open: 9, close: 19 },
  4: { open: 9, close: 19 },
  5: { open: 9, close: 19 },
  6: { open: 9, close: 19 },
}

export function isBusinessOpen(hours: WeeklyHours, now?: Date): boolean {
  const date = now ?? new Date()
  const day = date.getDay()
  const minutes = date.getHours() * 60 + date.getMinutes()
  const todayHours = hours[day]
  if (!todayHours) return false
  return minutes >= todayHours.open * 60 && minutes < todayHours.close * 60
}

export function getNextOpenInfo(hours: WeeklyHours, now?: Date): string {
  const date = now ?? new Date()
  const currentDay = date.getDay()
  const currentMinutes = date.getHours() * 60 + date.getMinutes()
  for (let i = 0; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7
    const dayHours = hours[checkDay]
    if (!dayHours) continue
    const openMinutes = dayHours.open * 60
    if (i === 0 && currentMinutes >= openMinutes) continue
    const label = i === 0 ? 'Hoje' : i === 1 ? 'Amanha' : DAY_NAMES[checkDay]
    return `${label} as ${String(dayHours.open).padStart(2, '0')}h`
  }
  return 'Em breve'
}