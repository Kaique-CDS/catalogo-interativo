'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
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

  const [q,        setQ]        = useState(searchParams.q ?? '')
  const [brand,    setBrand]    = useState(searchParams.brand ?? 'all')
  const [year,     setYear]     = useState(searchParams.year ?? 'all')
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice ?? '')

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams()
    if (q)                        params.set('q', q)
    if (brand && brand !== 'all') params.set('brand', brand)
    if (year  && year  !== 'all') params.set('year', year)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    router.push(`${pathname}?${params.toString()}`)
  }, [q, brand, year, minPrice, maxPrice, router, pathname])

  const clearFilters = () => {
    setQ(''); setBrand('all'); setYear('all'); setMinPrice(''); setMaxPrice('')
    router.push(pathname)
  }

  const hasFilters = q || (brand && brand !== 'all') || (year && year !== 'all') || minPrice || maxPrice

  return (
    <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar marca, modelo..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Ano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input placeholder="Preco min." type="number" className="w-[120px]" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <Input placeholder="Preco max." type="number" className="w-[120px]" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />

        <Button onClick={applyFilters} className="gap-2">
          <Search className="h-4 w-4" />Filtrar
        </Button>

        {hasFilters && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />Limpar
          </Button>
        )}
      </div>
    </div>
  )
}