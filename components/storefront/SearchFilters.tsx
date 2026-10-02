'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCallback, useState } from 'react'

interface Props {
  brands: string[]
  years: number[]
  searchParams: { q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string }
}

export default function SearchFilters({ brands, years, searchParams }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const [q,    setQ]    = useState(searchParams.q    ?? '')
  const [brand, setBrand] = useState(searchParams.brand ?? 'all')
  const [year,  setYear]  = useState(searchParams.year  ?? 'all')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (q)                    params.set('q',     q)
    if (brand && brand !== 'all') params.set('brand', brand)
    if (year  && year  !== 'all') params.set('year',  year)
    router.push(`${pathname}?${params.toString()}`)
  }, [q, brand, year, router, pathname])

  const clearFilters = () => {
    setQ(''); setBrand('all'); setYear('all')
    router.push(pathname)
  }

  const hasFilters = q || (brand && brand !== 'all') || (year && year !== 'all')

  const handleBrandClick = (b: string) => {
    const next = brand === b ? 'all' : b
    setBrand(next)
    const params = new URLSearchParams()
    if (q)           params.set('q',     q)
    if (next !== 'all') params.set('brand', next)
    if (year !== 'all') params.set('year',  year)
    router.push(`${pathname}?${params.toString()}`)
  }

  const getBrandLogo = (b: string) => {
    const l = b.toLowerCase()
    if (l.includes('audi'))       return 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg'
    if (l.includes('bmw'))        return 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg'
    if (l.includes('toyota'))     return 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg'
    if (l.includes('honda'))      return 'https://upload.wikimedia.org/wikipedia/commons/3/38/Honda.svg'
    if (l.includes('volkswagen') || l.includes('vw')) return 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg'
    if (l.includes('fiat'))       return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Fiat_Logo_2020.svg'
    if (l.includes('ford'))       return 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg'
    if (l.includes('chevrolet'))  return 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png'
    if (l.includes('jeep'))       return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-weight="900" font-size="48" fill="%23888">Jeep</text></svg>`
    return null
  }

  return (
    <div className="mb-4 sm:mb-6 space-y-3">

      {/* ── Filtro rápido por marca ── */}
      {brands.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x">
          {brands.map(b => {
            const logo     = getBrandLogo(b)
            const isActive = brand === b
            return (
              <button
                key={b}
                onClick={() => handleBrandClick(b)}
                className={`snap-center shrink-0 h-12 w-16 sm:h-14 sm:w-20 rounded-xl flex items-center justify-center border p-2 transition-all duration-150
                  ${isActive
                    ? 'chip-active shadow-[0_0_0_2px_var(--brand-red)]'
                    : 'bg-surface-2 border-surface text-muted-foreground hover:border-white/20'
                  }`}
                title={b}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={b}
                    className={`w-full h-full object-contain transition-all ${isActive ? 'brightness-0 invert' : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}
                  />
                ) : (
                  <span className={`font-bold text-[10px] sm:text-xs truncate w-full text-center ${isActive ? 'text-white' : ''}`}>
                    {b}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Barra de busca ── */}
      <div className="bg-surface-2 border border-surface rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Buscar modelo, versão, ano..."
              className="input-brand w-full pl-10 pr-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 border border-surface"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              style={{ borderRadius: '10px', backgroundColor: 'var(--brand-surface-2)', color: '#fff' }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`h-11 px-3 rounded-[10px] border font-semibold text-sm flex items-center gap-1.5 flex-shrink-0 transition-colors
              ${showAdvanced || hasFilters
                ? 'border-brand text-brand bg-brand/10'
                : 'border-surface text-muted-foreground hover:border-white/20 hover:text-white'
              }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasFilters && <span className="h-2 w-2 rounded-full bg-brand" />}
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 px-3 rounded-[10px] border border-surface text-muted-foreground hover:text-brand hover:border-brand transition-colors flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Limpar</span>
            </button>
          )}
        </div>

        {/* ── Filtros avançados ── */}
        {showAdvanced && (
          <div className="pt-3 border-t border-surface grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-wider">Marca</label>
              <Select value={brand} onValueChange={(v) => { setBrand(v); applyFilters() }}>
                <SelectTrigger className="h-9 text-xs rounded-[10px] bg-surface-3 border-surface text-white focus:ring-brand focus:border-brand">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border-surface text-white">
                  <SelectItem value="all">Todas as Marcas</SelectItem>
                  {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block tracking-wider">Ano</label>
              <Select value={year} onValueChange={(v) => { setYear(v); applyFilters() }}>
                <SelectTrigger className="h-9 text-xs rounded-[10px] bg-surface-3 border-surface text-white focus:ring-brand focus:border-brand">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-surface-2 border-surface text-white">
                  <SelectItem value="all">Qualquer ano</SelectItem>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex items-end">
              <button
                onClick={applyFilters}
                className="btn-brand w-full h-9 text-xs"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}