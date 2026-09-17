'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
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

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-xs">
      {/* Busca Rápida + Botão Filtros Mobile */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar modelo, versão..."
            className="pl-9 pr-3 rounded-xl border-zinc-200 text-sm h-10 w-full"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`h-10 px-3 rounded-xl gap-1.5 text-xs font-semibold sm:hidden ${showAdvanced || hasFilters ? 'border-zinc-900 bg-zinc-900 text-white' : ''}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
        </Button>

        <Button onClick={applyFilters} className="h-10 px-4 rounded-xl gap-1.5 text-xs font-semibold bg-zinc-900 text-white hidden sm:flex">
          <Search className="h-3.5 w-3.5" />
          Buscar
        </Button>
      </div>

      {/* Opções de Filtros (Sempre visível no Desktop, colapsável no mobile) */}
      <div className={`${showAdvanced ? 'grid' : 'hidden'} sm:grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 items-end pt-3 mt-2 border-t border-zinc-100`}>
        {/* Marca */}
        <div className="w-full sm:w-[150px]">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Marca</label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="w-full h-9 rounded-xl text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Ano */}
        <div className="w-full sm:w-[120px]">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Ano</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full h-9 rounded-xl text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>


        <div className="col-span-2 sm:col-span-1 flex gap-2 w-full sm:w-auto">
          <Button onClick={applyFilters} className="h-9 px-4 rounded-xl text-xs font-semibold bg-zinc-900 text-white flex-1 sm:hidden">
            Aplicar Filtros
          </Button>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 rounded-xl text-xs text-zinc-500 hover:text-zinc-900 gap-1">
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}