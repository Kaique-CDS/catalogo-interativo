'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Car,
  LayoutList,
  LayoutGrid,
  Search,
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatMileage, cn } from '@/lib/utils'
import { getTempoEmEstoque, formatDateBR } from '@/lib/date-utils'
import MarkAsSoldModal from './MarkAsSoldModal'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

interface Props {
  vehicles: Vehicle[]
  slug: string
}

type ViewMode = 'completo' | 'simples'
type SortOrder = 'recent' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc'

export default function VehicleTable({ vehicles: initialVehicles, slug }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles)
  const [viewMode, setViewMode] = useState<ViewMode>('completo')
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(9)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [vehicleForSaleModal, setVehicleForSaleModal] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setVehicles(initialVehicles)
  }, [initialVehicles])

  const filteredVehicles = vehicles.filter(v => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase().trim()
    return (
      v.title.toLowerCase().includes(term) ||
      v.brand.toLowerCase().includes(term) ||
      v.model.toLowerCase().includes(term) ||
      (v.sku && v.sku.toLowerCase().includes(term))
    )
  })

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    if (sortOrder === 'recent') {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
      return timeB - timeA
    }
    if (sortOrder === 'oldest') {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
      return timeA - timeB
    }
    if (sortOrder === 'price_asc') {
      return (a.price || 0) - (b.price || 0)
    }
    if (sortOrder === 'price_desc') {
      return (b.price || 0) - (a.price || 0)
    }
    if (sortOrder === 'name_asc') {
      return a.title.localeCompare(b.title)
    }
    return 0
  })

  const displayedVehicles = sortedVehicles.slice(0, visibleCount)

  const toggleActive = async (vehicle: Vehicle) => {
    const nextState = !vehicle.is_active
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextState }),
      })
      if (!res.ok) throw new Error()
      setVehicles(prev => prev.map(v => (v.id === vehicle.id ? { ...v, is_active: nextState } : v)))
      toast.success(nextState ? 'Veículo publicado!' : 'Veículo pausado!')
    } catch {
      toast.error('Erro ao atualizar o veículo')
    }
  }

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/vehicles/${vehicleToDelete.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao excluir veículo')
      }
      setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id))
      toast.success('Veículo e fotos excluídos com sucesso!')
      setVehicleToDelete(null)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao excluir o veículo')
    } finally {
      setDeleting(false)
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 border border-surface rounded-2xl bg-surface-1 p-6">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-foreground text-sm">Nenhum veículo cadastrado</h3>
        <p className="text-xs text-muted-foreground mt-1">Adicione seu primeiro veículo clicando no botão acima.</p>
      </div>
    )
  }

  const renderPrice = (price?: number | null) => {
    if (!price || price <= 0) return 'Sob consulta'
    return formatCurrency(price)
  }

  return (
    <div className="space-y-4">
      {/* Search by SKU, model, brand & Ordenação */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por SKU, modelo ou marca..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setVisibleCount(9)
            }}
            className="pl-10 h-11 bg-surface-1 border-surface text-foreground placeholder:text-muted-foreground/60 rounded-xl text-base sm:text-sm"
          />
        </div>

        {/* Dropdown de Ordenação (Prompt 4) */}
        <div className="w-full sm:w-56 shrink-0">
          <Select value={sortOrder} onValueChange={(val: SortOrder) => setSortOrder(val)}>
            <SelectTrigger className="h-11 rounded-xl bg-surface-1 border-surface text-foreground text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Ordenar por" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-surface-1 border-surface text-foreground rounded-xl text-xs">
              <SelectItem value="recent">Mais recentes (cadastro)</SelectItem>
              <SelectItem value="oldest">Mais antigos (em estoque)</SelectItem>
              <SelectItem value="price_desc">Maior preço</SelectItem>
              <SelectItem value="price_asc">Menor preço</SelectItem>
              <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggle view mode & contadores */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Exibindo <strong className="text-foreground">{Math.min(visibleCount, filteredVehicles.length)}</strong> de{' '}
          <strong className="text-foreground">{filteredVehicles.length}</strong> veículo{filteredVehicles.length !== 1 ? 's' : ''}
          {searchTerm && <span className="text-brand font-medium ml-1">(filtrado)</span>}
        </p>
        <div className="flex items-center gap-1 bg-surface-1 border border-surface p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('completo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'completo'
                ? 'bg-surface-3 text-brand shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2/50'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Completo
          </button>
          <button
            type="button"
            onClick={() => setViewMode('simples')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'simples'
                ? 'bg-surface-3 text-brand shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-2/50'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Simples
          </button>
        </div>
      </div>

      {/* SIMPLES mode: compact grid cards */}
      {viewMode === 'simples' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {displayedVehicles.map((v) => {
            const tempo = getTempoEmEstoque(v.created_at)
            const isSold = v.status === 'vendido'
            return (
              <div
                key={v.id}
                className="bg-surface-1 border border-surface hover:bg-surface-2 transition-colors rounded-2xl overflow-hidden shadow-2xs flex gap-3 p-3 items-center"
              >
                <div className="relative h-16 w-20 rounded-xl overflow-hidden bg-surface-2 border border-surface flex-shrink-0">
                  {v.images?.[0] ? (
                    <Image src={v.images[0]} alt={v.title} fill className="object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {v.sku && (
                      <span className="font-mono text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                        #{v.sku}
                      </span>
                    )}
                    {isSold ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Vendido
                      </span>
                    ) : (
                      <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold border', v.is_active ? 'badge-status-published' : 'badge-status-hidden')}>
                        {v.is_active ? 'Publicado' : 'Oculto'}
                      </span>
                    )}
                    {/* Chip de tempo em estoque (Prompt 4) */}
                    <span className="text-[9px] font-medium text-muted-foreground bg-surface-2 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      {tempo.compact}
                    </span>
                  </div>
                  <p className="font-bold text-heading text-xs truncate mt-1">{v.title}</p>
                  <p className="text-xs font-black text-price mt-0.5">{renderPrice(v.price)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Botão Marcar como Vendido (Prompt 5) */}
                  <Button
                    size="icon"
                    variant="ghost"
                    title={isSold ? 'Editar venda' : 'Marcar como vendido'}
                    className={cn(
                      'h-10 w-10 rounded-xl',
                      isSold ? 'text-emerald-400 hover:bg-emerald-950/30' : 'text-muted-foreground hover:text-emerald-400 hover:bg-surface-3'
                    )}
                    onClick={() => setVehicleForSaleModal(v)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-3"
                    onClick={() => toggleActive(v)}
                  >
                    {v.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Link href={`/${slug}/admin/estoque/${v.id}`}>
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-3">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* COMPLETO mode */}
      {viewMode === 'completo' && (
        <>
          {/* Mobile cards — Mobile-First ergonomic layout for iOS & Android */}
          <div className="md:hidden space-y-3">
            {displayedVehicles.map((v) => {
              const tempo = getTempoEmEstoque(v.created_at)
              const isSold = v.status === 'vendido'
              return (
                <div
                  key={v.id}
                  className="bg-surface-1 p-3.5 rounded-2xl border border-surface shadow-2xs space-y-3"
                >
                  <div className="flex gap-3 items-start">
                    <div className="relative h-20 w-24 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0 border border-surface">
                      {v.images?.[0] ? (
                        <Image src={v.images[0]} alt={v.title} fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <Car className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {v.sku ? (
                          <span className="font-mono text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">
                            #{v.sku}
                          </span>
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-1.5">
                          {isSold && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Vendido
                            </span>
                          )}
                          <span
                            className={cn(
                              'text-[10px] px-2.5 py-0.5 rounded-full font-semibold border shrink-0',
                              v.is_active
                                ? 'badge-status-published'
                                : 'badge-status-hidden'
                            )}
                          >
                            {v.is_active ? 'Publicado' : 'Oculto'}
                          </span>
                        </div>
                      </div>

                      <p className="font-bold text-heading text-sm leading-snug line-clamp-2">
                        {v.title}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <p className="text-[11px] text-muted-foreground truncate">
                          {v.brand} • {v.year} • {formatMileage(v.mileage)}
                        </p>
                        <p className="text-xs font-black text-price shrink-0">
                          {renderPrice(v.price)}
                        </p>
                      </div>

                      {/* Data de cadastro e tempo em estoque (Prompt 4) */}
                      <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-surface/50 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-brand" />
                          {tempo.dateBr}
                        </span>
                        <span>•</span>
                        <span className="text-foreground font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {tempo.relative}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Touch-friendly action bar (44px height per button) */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2.5 border-t border-surface">
                    <button
                      type="button"
                      onClick={() => toggleActive(v)}
                      className="h-11 rounded-xl bg-surface-2 hover:bg-surface-3 active:scale-[0.98] text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-all"
                    >
                      {v.is_active ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Publicar</span>
                        </>
                      )}
                    </button>

                    {/* Botão Vender / Vendido (Prompt 5) */}
                    <button
                      type="button"
                      onClick={() => setVehicleForSaleModal(v)}
                      className={cn(
                        'h-11 rounded-xl active:scale-[0.98] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all',
                        isSold
                          ? 'bg-emerald-950/30 border border-emerald-900/40 text-emerald-400'
                          : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-emerald-400'
                      )}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{isSold ? 'Vendido' : 'Vender'}</span>
                    </button>

                    <Link
                      href={`/${slug}/admin/estoque/${v.id}`}
                      className="h-11 rounded-xl bg-surface-2 hover:bg-surface-3 active:scale-[0.98] text-[11px] font-semibold text-foreground flex items-center justify-center gap-1 transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setVehicleToDelete(v)}
                      className="h-11 rounded-xl bg-red-950/25 hover:bg-red-950/40 active:scale-[0.98] border border-red-900/30 text-[11px] font-semibold text-red-400 flex items-center justify-center gap-1 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-surface-1 border border-surface rounded-2xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-surface-2">
                <TableRow className="text-xs border-surface">
                  <TableHead className="w-16">Foto</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Ano/Km</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-surface text-xs">
                {displayedVehicles.map((vehicle) => {
                  const tempo = getTempoEmEstoque(vehicle.created_at)
                  const isSold = vehicle.status === 'vendido'
                  return (
                    <TableRow key={vehicle.id} className="hover:bg-surface-2 border-surface transition-colors">
                      <TableCell>
                        <div className="relative h-12 w-16 rounded-lg bg-surface-2 overflow-hidden border border-surface">
                          {vehicle.images?.[0] ? (
                            <Image src={vehicle.images[0]} alt={vehicle.title} fill className="object-cover" />
                          ) : (
                            <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-muted-foreground" /></div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-heading">{vehicle.title}</p>
                        <p className="text-[11px] text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                      </TableCell>
                      <TableCell>
                        {vehicle.sku ? (
                          <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                            #{vehicle.sku}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <p className="font-medium text-heading">{vehicle.year}</p>
                        <p className="text-[11px] opacity-80">{formatMileage(vehicle.mileage)}</p>
                      </TableCell>
                      <TableCell className="font-black text-price">{renderPrice(vehicle.price)}</TableCell>

                      {/* Coluna Cadastrado em (Prompt 4) */}
                      <TableCell>
                        <p className="font-medium text-heading text-[11px] flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {tempo.dateBr}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {tempo.relative}
                        </p>
                      </TableCell>

                      {/* Coluna Status (com vendido e publicado) */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {isSold ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Vendido
                            </span>
                          ) : (
                            <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold border inline-flex', vehicle.is_active ? 'badge-status-published' : 'badge-status-hidden')}>
                              {vehicle.is_active ? 'Publicado' : 'Oculto'}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Botão Marcar como Vendido (Prompt 5) */}
                          <Button
                            size="icon"
                            variant="ghost"
                            title={isSold ? 'Editar data da venda' : 'Marcar como vendido'}
                            className={cn(
                              'h-8 w-8',
                              isSold ? 'text-emerald-400 hover:bg-emerald-950/30' : 'text-muted-foreground hover:text-emerald-400 hover:bg-surface-3'
                            )}
                            onClick={() => setVehicleForSaleModal(vehicle)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleActive(vehicle)}
                          >
                            {vehicle.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>

                          <Link href={`/${slug}/admin/estoque/${vehicle.id}`}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:bg-red-950/30 hover:text-red-400"
                            onClick={() => setVehicleToDelete(vehicle)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {filteredVehicles.length > visibleCount && (
        <div className="pt-3 pb-2 text-center">
          <Button
            onClick={() => setVisibleCount((c) => c + 9)}
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 rounded-xl border-surface bg-surface-1 hover:bg-surface-2 text-foreground font-bold gap-2 text-xs sm:text-sm shadow-xs transition-all hover:border-brand"
          >
            <span>Ver mais veículos</span>
            <ChevronDown className="h-4 w-4 text-brand" />
            <span className="text-muted-foreground font-normal">
              ({filteredVehicles.length - visibleCount} restantes)
            </span>
          </Button>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão Irreversível (Bottom sheet no mobile) */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={!deleting ? () => setVehicleToDelete(null) : undefined}
          />
          <div className="relative w-full max-w-md bg-surface-1 border border-surface rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="h-11 w-11 rounded-xl bg-red-950/40 border border-red-900/40 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-heading leading-tight">
                  Excluir Veículo
                </h3>
                <p className="text-xs text-red-400 font-medium mt-0.5">
                  Ação irreversível
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Tem certeza? Isso vai remover o veículo{' '}
              <strong className="text-foreground font-bold">{vehicleToDelete.title}</strong>{' '}
              e todas as suas fotos permanentemente.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => setVehicleToDelete(null)}
                className="rounded-xl border-surface bg-surface-2 hover:bg-surface-3 text-foreground text-xs font-semibold h-11 px-5"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteVehicle}
                className="rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold h-11 px-5 gap-2 transition-all shadow-md shadow-red-900/30"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Excluindo fotos...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Marcar como Vendido (Prompt 5) - Renderizado uma única vez aqui no final */}
      {vehicleForSaleModal && (
        <MarkAsSoldModal
          vehicle={vehicleForSaleModal}
          onClose={() => setVehicleForSaleModal(null)}
          onSuccess={(updated) => {
            setVehicles(prev => prev.map(v => (v.id === updated.id ? updated : v)))
          }}
        />
      )}
    </div>
  )
}
