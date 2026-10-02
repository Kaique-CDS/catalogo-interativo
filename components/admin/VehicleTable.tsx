'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, Eye, EyeOff, Car, LayoutList, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const supabase = createClient()

  useEffect(() => {
    setVehicles(initialVehicles)
  }, [initialVehicles])

  const toggleActive = async (vehicle: Vehicle) => {
    const nextState = !vehicle.is_active
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      const updated = { ...vehicle, is_active: nextState }
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? updated : v))
      import('@/lib/vehicles').then(({ saveVehicle }) => saveVehicle(updated))
      toast.success(nextState ? 'Veículo publicado!' : 'Veículo pausado!')
      return
    }
    const { error } = await supabase.from('vehicles').update({ is_active: nextState }).eq('id', vehicle.id)
    if (error) { toast.error('Erro ao atualizar o veículo'); return }
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, is_active: nextState } : v))
    toast.success(nextState ? 'Veículo publicado!' : 'Veículo pausado!')
  }

  const deleteVehicle = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      setVehicles(prev => prev.filter(v => v.id !== id))
      import('@/lib/vehicles').then(({ deleteVehicle: delVeh }) => delVeh(id))
      toast.success('Veículo excluído (Modo Local)')
      return
    }
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir o veículo'); return }
    setVehicles(prev => prev.filter(v => v.id !== id))
    toast.success('Veículo excluído com sucesso')
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 border border-surface rounded-2xl bg-surface-1 p-6">
        <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-bold text-white text-sm">Nenhum veículo cadastrado</h3>
        <p className="text-xs text-muted-foreground mt-1">Adicione seu primeiro veículo clicando no botão acima.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toggle view mode */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-1 bg-surface-1 border border-surface p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('completo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'completo'
                ? 'bg-surface-2 text-white shadow-xs'
                : 'text-muted-foreground hover:text-white hover:bg-surface-2/50'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Completo
          </button>
          <button
            onClick={() => setViewMode('simples')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'simples'
                ? 'bg-surface-2 text-white shadow-xs'
                : 'text-muted-foreground hover:text-white hover:bg-surface-2/50'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Simples
          </button>
        </div>
      </div>

      {/* SIMPLES mode: compact grid cards */}
      {viewMode === 'simples' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-surface-1 border border-surface hover:bg-surface-2 transition-colors rounded-2xl overflow-hidden shadow-2xs flex gap-3 p-2.5 items-center"
            >
              <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-surface-2 border border-surface flex-shrink-0">
                {v.images?.[0] ? (
                  <Image src={v.images[0]} alt={v.title} fill className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {v.sku && (
                  <span className="font-mono text-[9px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                    #{v.sku}
                  </span>
                )}
                <p className="font-bold text-white text-xs truncate mt-0.5">{v.brand} {v.model}</p>
                <p className="text-xs font-black text-white mt-0.5">{formatCurrency(v.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold border', v.is_active ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-surface-2 text-muted-foreground border-surface')}>
                  {v.is_active ? 'Publicado' : 'Oculto'}
                </span>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => toggleActive(v)}>
                    {v.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Link href={`/${slug}/admin/estoque/${v.id}`}>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-white">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMPLETO mode */}
      {viewMode === 'completo' && (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {vehicles.map((v) => (
              <div key={v.id} className="bg-surface-1 p-3.5 rounded-2xl border border-surface shadow-2xs flex gap-3 items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-14 w-16 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0 border border-surface">
                    {v.images?.[0] ? (
                      <Image src={v.images[0]} alt={v.title} fill className="object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {v.sku && (
                      <span className="font-mono text-[9px] font-bold text-brand">#{v.sku} • </span>
                    )}
                    <p className="font-bold text-white text-xs truncate">{v.title}</p>
                    <p className="text-[11px] text-muted-foreground">{v.brand} • {v.year}</p>
                    <p className="text-xs font-black text-white mt-0.5">{formatCurrency(v.price)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-semibold border', v.is_active ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-surface-2 text-muted-foreground border-surface')}>
                    {v.is_active ? 'Publicado' : 'Oculto'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-surface-2 hover:text-white" onClick={() => toggleActive(v)}>
                      {v.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Link href={`/${slug}/admin/estoque/${v.id}`}>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-surface-2 hover:text-white">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-950/30 hover:text-red-400" onClick={() => deleteVehicle(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
                {vehicles.map((vehicle) => (
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
                      <p className="font-bold text-white">{vehicle.title}</p>
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
                      <p className="font-medium text-white">{vehicle.year}</p>
                      <p className="text-[11px] opacity-80">{formatMileage(vehicle.mileage)}</p>
                    </TableCell>
                    <TableCell className="font-black text-white">{formatCurrency(vehicle.price)}</TableCell>
                    <TableCell>
                      <span className={cn('text-[10px] px-2 py-1 rounded-full font-semibold border inline-flex', vehicle.is_active ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-surface-2 text-muted-foreground border-surface')}>
                        {vehicle.is_active ? 'Publicado' : 'Oculto'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => toggleActive(vehicle)}>
                          {vehicle.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Link href={`/${slug}/admin/estoque/${vehicle.id}`}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-950/30 hover:text-red-400" onClick={() => deleteVehicle(vehicle.id)}>
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
    </div>
  )
}