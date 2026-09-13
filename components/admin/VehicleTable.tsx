'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, Eye, EyeOff, Car, Calendar, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatMileage } from '@/lib/utils'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

interface Props { vehicles: Vehicle[]; slug: string }

export default function VehicleTable({ vehicles: initialVehicles, slug }: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const supabase = createClient()

  const toggleActive = async (vehicle: Vehicle) => {
    const nextState = !vehicle.is_active
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, is_active: nextState } : v))
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
      toast.success('Veículo excluído (Modo Demo)')
      return
    }
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir o veículo'); return }
    setVehicles(prev => prev.filter(v => v.id !== id))
    toast.success('Veículo excluído com sucesso')
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 border border-zinc-200 rounded-2xl bg-white p-6">
        <Car className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
        <h3 className="font-bold text-zinc-800 text-sm">Nenhum veículo cadastrado</h3>
        <p className="text-xs text-zinc-500 mt-1">Adicione seu primeiro veículo clicando no botão acima.</p>
      </div>
    )
  }

  return (
    <div>
      {/* 1. Visão Mobile: Cards Compactos de Gestão */}
      <div className="md:hidden space-y-3">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs flex gap-3 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-14 w-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-100">
                {v.images?.[0] ? (
                  <Image src={v.images[0]} alt={v.title} fill className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-zinc-300" /></div>
                )}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-zinc-900 text-xs truncate">{v.title}</p>
                <p className="text-[11px] text-zinc-500">{v.brand} • {v.year}</p>
                <p className="text-xs font-black text-zinc-900 mt-0.5">{formatCurrency(v.price)}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <Badge variant={v.is_active ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                {v.is_active ? 'Ativo' : 'Pausado'}
              </Badge>

              <div className="flex items-center gap-0.5">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-500" onClick={() => toggleActive(v)}>
                  {v.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Link href={`/${slug}/admin/estoque/${v.id}`}>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-500">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => deleteVehicle(v.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Visão Desktop: Tabela Tradicional */}
      <div className="hidden md:block bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="text-xs">
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Ano/Km</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100 text-xs">
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id} className="hover:bg-zinc-50/40">
                <TableCell>
                  <div className="relative h-12 w-16 rounded-lg bg-zinc-100 overflow-hidden border border-zinc-100">
                    {vehicle.images?.[0] ? (
                      <Image src={vehicle.images[0]} alt={vehicle.title} fill className="object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-zinc-300" /></div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-zinc-900">{vehicle.title}</p>
                  <p className="text-[11px] text-zinc-500">{vehicle.brand} {vehicle.model}</p>
                </TableCell>
                <TableCell className="text-zinc-600">
                  <p className="font-medium">{vehicle.year}</p>
                  <p className="text-[11px] text-zinc-400">{formatMileage(vehicle.mileage)}</p>
                </TableCell>
                <TableCell className="font-black text-zinc-900">{formatCurrency(vehicle.price)}</TableCell>
                <TableCell>
                  <Badge variant={vehicle.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {vehicle.is_active ? 'Publicado' : 'Pausado'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-zinc-900" onClick={() => toggleActive(vehicle)}>
                      {vehicle.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Link href={`/${slug}/admin/estoque/${vehicle.id}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-zinc-900">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteVehicle(vehicle.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}