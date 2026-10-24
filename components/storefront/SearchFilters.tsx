'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, X, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sincroniza estado local se searchParams mudar externamente
  useEffect(() => {
    setQ(searchParams.q ?? '')
    setBrand(searchParams.brand ?? 'all')
    setYear(searchParams.year ?? 'all')
  }, [searchParams.q, searchParams.brand, searchParams.year])

  // Limpa o timer de debounce ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    }
  }, [])

  const scrollBrands = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const applyWithValues = useCallback(
    (newQ: string, newBrand: string, newYear: string) => {
      const params = new URLSearchParams()
      const trimmed = newQ.trim()
      if (trimmed) params.set('q', trimmed)
      if (newBrand && newBrand !== 'all') params.set('brand', newBrand)
      if (newYear && newYear !== 'all') params.set('year', newYear)
      const queryStr = params.toString()
      router.push(queryStr ? `${pathname}?${queryStr}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  const applyFilters = useCallback(() => {
    applyWithValues(q, brand, year)
  }, [applyWithValues, q, brand, year])

  // Atualização com debounce (~250ms) ao digitar
  const handleQueryChange = (val: string) => {
    setQ(val)
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    debounceTimeoutRef.current = setTimeout(() => {
      applyWithValues(val, brand, year)
    }, 250)
  }

  // Limpa a busca textual imediatamente
  const handleClearQuery = () => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    setQ('')
    applyWithValues('', brand, year)
  }

  // Limpa todos os filtros
  const clearFilters = () => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
    setQ('')
    setBrand('all')
    setYear('all')
    setShowAdvanced(false)
    router.push(pathname, { scroll: false })
  }

  const handleBrandClick = (b: string) => {
    const next = brand === b ? 'all' : b
    setBrand(next)
    applyWithValues(q, next, year)
  }

  // Total de filtros ativos para exibir no badge
  const activeFilterCount =
    (q.trim() ? 1 : 0) +
    (brand && brand !== 'all' ? 1 : 0) +
    (year && year !== 'all' ? 1 : 0)

  const getBrandLogo = (b: string) => {
    const l = b.toLowerCase().trim()
    let slug = l
    if (l === 'mercedes' || l === 'mercedes benz') slug = 'mercedes-benz'
    if (l === 'vw' || l === 'volks') slug = 'volkswagen'
    if (l === 'land rover') slug = 'land-rover'
    if (l === 'aston martin') slug = 'aston-martin'
    if (l === 'alfa romeo') slug = 'alfa-romeo'
    return `https://www.carlogos.org/car-logos/${slug}-logo.png`
  }

  return (
    <div className="mb-5 sm:mb-6 space-y-4">
      {/* ── 1. Filtro Rápido por Marca (Carrossel) ── */}
      {brands.length > 0 && (
        <div className="relative group/brands">
          <button
            type="button"
            onClick={() => scrollBrands('left')}
            aria-label="Rolar marcas para a esquerda"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white border border-surface shadow-md -ml-3 opacity-0 group-hover/brands:opacity-100 transition-opacity hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide snap-x relative"
          >
            {brands.map((b) => {
              const logo = getBrandLogo(b)
              const isActive = brand === b
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleBrandClick(b)}
                  className={`snap-center shrink-0 min-h-[44px] h-12 w-16 sm:h-14 sm:w-20 rounded-xl flex items-center justify-center border p-2 transition-all duration-150 ${
                    isActive
                      ? 'bg-brand border-brand shadow-[0_0_0_2px_var(--color-primary,#6366f1)]'
                      : 'bg-surface-1 border-surface text-muted-foreground hover:border-brand/40 hover:bg-surface-2'
                  }`}
                  title={b}
                >
                  {logo ? (
                    <div className="w-full h-full relative flex items-center justify-center group-icon">
                      <img
                        src={logo}
                        alt={b}
                        className={`w-full h-full object-contain transition-all ${
                          isActive
                            ? 'opacity-100 scale-110'
                            : 'opacity-80 hover:opacity-100 hover:scale-105'
                        }`}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.nextElementSibling) {
                            ;(e.currentTarget.nextElementSibling as HTMLElement).style.display =
                              'block'
                          }
                        }}
                      />
                      <span
                        className={`hidden font-bold text-[10px] sm:text-xs truncate w-full text-center ${
                          isActive ? 'text-white' : ''
                        }`}
                      >
                        {b}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`font-bold text-[10px] sm:text-xs truncate w-full text-center ${
                        isActive ? 'text-white' : ''
                      }`}
                    >
                      {b}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollBrands('right')}
            aria-label="Rolar marcas para a direita"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white border border-surface shadow-md -mr-3 opacity-0 group-hover/brands:opacity-100 transition-opacity hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── 2. Barra Única de Busca e Filtros (Clean, sem caixa/fundo externo) ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 w-full">
        {/* Campo de Busca Único */}
        <div className="relative flex-1">
          <label htmlFor="storefront-search" className="sr-only">
            Buscar carro ou marca
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="storefront-search"
            type="text"
            placeholder="Buscar carro ou marca"
            value={q}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
                applyFilters()
              }
            }}
            className="w-full h-12 pl-11 pr-10 text-xs sm:text-sm bg-surface-1 border border-surface rounded-2xl text-foreground placeholder:text-muted-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all"
          />
          {q && (
            <button
              type="button"
              onClick={handleClearQuery}
              aria-label="Limpar campo de busca"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Botão "Filtros" Integrado com Badge */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="Abrir filtros avançados"
          aria-expanded={showAdvanced}
          className={`h-12 px-3.5 sm:px-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand ${
            showAdvanced || activeFilterCount > 0
              ? 'border-brand text-brand bg-brand/10'
              : 'border-surface bg-surface-1 text-muted-foreground hover:text-foreground hover:bg-surface-2'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 3. Painel Expansível de Filtros Avançados (Dropdown Clean) ── */}
      {showAdvanced && (
        <div className="bg-surface-1 border border-surface rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-surface">
            <h4 className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-brand" /> Filtros Avançados
            </h4>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-brand font-medium flex items-center gap-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Marca
              </label>
              <Select
                value={brand}
                onValueChange={(v) => {
                  setBrand(v)
                  applyWithValues(q, v, year)
                }}
              >
                <SelectTrigger className="h-11 text-xs rounded-xl bg-surface-2 border-surface text-foreground focus:ring-brand">
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-surface text-foreground">
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Ano
              </label>
              <Select
                value={year}
                onValueChange={(v) => {
                  setYear(v)
                  applyWithValues(q, brand, v)
                }}
              >
                <SelectTrigger className="h-11 text-xs rounded-xl bg-surface-2 border-surface text-foreground focus:ring-brand">
                  <SelectValue placeholder="Qualquer ano" />
                </SelectTrigger>
                <SelectContent className="bg-surface-1 border-surface text-foreground">
                  <SelectItem value="all">Qualquer ano</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="btn-brand w-full h-11 text-xs font-bold rounded-xl"
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
