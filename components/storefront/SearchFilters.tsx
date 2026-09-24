'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useCallback, useState } from 'react'
import Image from 'next/image'

interface Props {
  brands: string[]
  years: number[]
  searchParams: { q?: string; brand?: string; minPrice?: string; maxPrice?: string; year?: string }
}

export default function SearchFilters({ brands, years, searchParams }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [q, setQ] = useState(searchParams.q ?? '')
  const [brand, setBrand] = useState(searchParams.brand ?? 'all')
  const [year, setYear] = useState(searchParams.year ?? 'all')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (brand && brand !== 'all') params.set('brand', brand)
    if (year && year !== 'all') params.set('year', year)
    router.push(`${pathname}?${params.toString()}`)
  }, [q, brand, year, router, pathname])

  const clearFilters = () => {
    setQ(''); setBrand('all'); setYear('all')
    router.push(pathname)
  }

  const hasFilters = q || (brand && brand !== 'all') || (year && year !== 'all')

  const getBrandLogo = (b: string) => {
    const l = b.toLowerCase()
    if (l.includes('audi')) return 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg'
    if (l.includes('bmw')) return 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg'
    if (l.includes('porsche')) return 'https://upload.wikimedia.org/wikipedia/en/2/23/Porsche_crest.svg'
    if (l.includes('toyota')) return 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg'
    if (l.includes('honda')) return 'https://upload.wikimedia.org/wikipedia/commons/3/38/Honda.svg'
    if (l.includes('jeep')) return 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Jeep_logo.svg'
    if (l.includes('volkswagen') || l.includes('vw')) return 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg'
    if (l.includes('fiat')) return 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Fiat_Logo_2020.svg'
    if (l.includes('ford')) return 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg'
    if (l.includes('chevrolet')) return 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png'
    return null
  }

  const handleBrandClick = (b: string) => {
    const newBrand = brand === b ? 'all' : b
    setBrand(newBrand)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (newBrand !== 'all') params.set('brand', newBrand)
    if (year && year !== 'all') params.set('year', year)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="mb-4 sm:mb-6">
      {brands.length > 0 && (
        <div className="flex overflow-x-auto gap-2.5 pb-2 mb-2 scrollbar-hide snap-x">
          {brands.map(b => {
            const logo = getBrandLogo(b)
            const isActive = brand === b
            return (
              <button
                key={b}
                onClick={() => handleBrandClick(b)}
                className={`snap-center shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl flex items-center justify-center border transition-all p-2 sm:p-2.5 ${
                  isActive 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500 shadow-sm scale-105' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
                title={b}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={b} className="w-full h-full object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all" />
                ) : (
                  <span className="font-bold text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate w-full px-1">{b}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-xs">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar modelo, versão..."
              className="pl-9 pr-3 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm h-10 w-full text-zinc-900 dark:text-zinc-50"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`h-10 px-3 rounded-xl gap-2 font-medium shrink-0 dark:border-zinc-800 ${showAdvanced || hasFilters ? 'border-indigo-600 text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasFilters && <span className="flex h-2 w-2 rounded-full bg-indigo-600 ml-1"></span>}
          </Button>

          {(q || hasFilters) && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              className="h-10 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Marca</label>
              <Select value={brand} onValueChange={(v) => { setBrand(v); applyFilters(); }}>
                <SelectTrigger className="h-9 text-xs rounded-lg dark:bg-zinc-900 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Marcas</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Ano</label>
              <Select value={year} onValueChange={(v) => { setYear(v); applyFilters(); }}>
                <SelectTrigger className="h-9 text-xs rounded-lg dark:bg-zinc-900 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer ano</SelectItem>
                  {years.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 sm:col-span-2 flex items-end">
              <Button onClick={applyFilters} className="w-full h-9 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold shadow-xs">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}