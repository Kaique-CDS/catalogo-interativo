'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, Eye, EyeOff, Car, LayoutList, LayoutGrid, Search, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatMileage, cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

interface Props { vehicles: Vehicle[]; slug: string }

type ViewMode = 'completo' | 'simples'

export default function VehicleTable({ vehicles: initialVehicles, slug }: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [viewMode, setViewMode] = useState<ViewMode>('completo')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(9)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

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

  const displayedVehicles = filteredVehicles.slice(0, visibleCount)

  const toggleActive = async (vehicle: Vehicle) => {
    const nextState = !vehicle.is_active
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextState })
      })
      if (!res.ok) throw new Error()
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, is_active: nextState } : v))
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
      {/* Search by SKU, model, brand */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por SKU, modelo ou marca..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setVisibleCount(9)
          }}
          className="pl-10 h-12 bg-surface-1 border-surface text-foreground placeholder:text-muted-foreground/60 rounded-xl text-base sm:text-sm"
        />
      </div>

      {/* Toggle view mode */}
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
          {displayedVehicles.map((v) => (
            <div
              key={v.id}
              className="bg-surface-1 border border-surface hover:bg-surface-2 transition-colors rounded-2xl overflow-hidden shadow-2xs flex gap-3 p-3 items-center"
            >
              <div className="relative h-16 w-20 rounded-xl overflow-hidden bg-surface-2 border border-surface flex-shrink-0">
                {v.images?.[0] ? (
                  <Image src={v.images[0]} alt={v.title} fill className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {v.sku && (
                    <span className="font-mono text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                      #{v.sku}
                    </span>
                  )}
                  <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold border', v.is_active ? 'badge-status-published' : 'badge-status-hidden')}>
                    {v.is_active ? 'Publicado' : 'Oculto'}
                  </span>
                </div>
                <p className="font-bold text-heading text-xs truncate mt-1">{v.title}</p>
                <p className="text-xs font-black text-price mt-0.5">{renderPrice(v.price)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-3" onClick={() => toggleActive(v)}>
                  {v.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Link href={`/${slug}/admin/estoque/${v.id}`}>
                  <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-3">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLETO mode */}
      {viewMode === 'completo' && (
        <>
          {/* Mobile cards — Mobile-First ergonomic layout for iOS & Android */}
          <div className="md:hidden space-y-3">
            {displayedVehicles.map((v) => (
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
                  </div>
                </div>

                {/* Touch-friendly action bar (40px height per button) */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-surface">
                  <button
                    type="button"
                    onClick={() => toggleActive(v)}
                    className="h-10 rounded-xl bg-surface-2 hover:bg-surface-3 active:scale-[0.98] text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-all"
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

                  <Link
                    href={`/${slug}/admin/estoque/${v.id}`}
                    className="h-10 rounded-xl bg-surface-2 hover:bg-surface-3 active:scale-[0.98] text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setVehicleToDelete(v)}
                    className="h-10 rounded-xl bg-red-950/25 hover:bg-red-950/40 active:scale-[0.98] border border-red-900/30 text-xs font-semibold text-red-400 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-surface text-xs">
                {displayedVehicles.map((vehicle) => (
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
                    <TableCell>
                      <span className={cn('text-[10px] px-2 py-1 rounded-full font-semibold border inline-flex', vehicle.is_active ? 'badge-status-published' : 'badge-status-hidden')}>
                        {vehicle.is_active ? 'Publicado' : 'Oculto'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => toggleActive(vehicle)}>
                          {vehicle.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Link href={`/${slug}/admin/estoque/${vehicle.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-950/30 hover:text-red-400" onClick={() => setVehicleToDelete(vehicle)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Modal de Confirmação de Exclusão Irreversível */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={!deleting ? () => setVehicleToDelete(null) : undefined}
          />
          <div className="relative w-full max-w-md bg-surface-1 border border-surface rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                className="rounded-xl border-surface bg-surface-2 hover:bg-surface-3 text-foreground text-xs font-semibold h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteVehicle}
                className="rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold h-10 px-4 gap-2 transition-all shadow-md shadow-red-900/30"
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
    </div>
  )
}