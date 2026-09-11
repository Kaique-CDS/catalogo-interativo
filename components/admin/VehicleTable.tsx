'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Trash2, Eye, EyeOff, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

interface Props { vehicles: Vehicle[]; slug: string }

export default function VehicleTable({ vehicles: initialVehicles, slug }: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const supabase = createClient()

  const toggleActive = async (vehicle: Vehicle) => {
    const { error } = await supabase.from('vehicles').update({ is_active: !vehicle.is_active }).eq('id', vehicle.id)
    if (error) { toast.error('Erro ao atualizar o veiculo'); return }
    setVehicles((prev) => prev.map((v) => v.id === vehicle.id ? { ...v, is_active: !v.is_active } : v))
    toast.success(vehicle.is_active ? 'Veiculo pausado' : 'Veiculo publicado')
  }

  const deleteVehicle = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veiculo?')) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir o veiculo'); return }
    setVehicles((prev) => prev.filter((v) => v.id !== id))
    toast.success('Veiculo excluido com sucesso')
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-16 border rounded-xl bg-white">
        <Car className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
        <h3 className="font-semibold text-zinc-700 mb-1">Estoque vazio</h3>
        <p className="text-sm text-zinc-400">Adicione veiculos clicando em "Novo Veiculo"</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Foto</TableHead>
            <TableHead>Veiculo</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Preco</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div className="h-12 w-16 rounded-md bg-zinc-100 overflow-hidden">
                  {vehicle.images?.[0] ? (
                    <Image src={vehicle.images[0]} alt={vehicle.title} width={64} height={48} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center"><Car className="h-5 w-5 text-zinc-300" /></div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-zinc-900 text-sm">{vehicle.title}</p>
                <p className="text-xs text-zinc-500">{vehicle.brand} {vehicle.model}</p>
              </TableCell>
              <TableCell className="text-sm">{vehicle.year}</TableCell>
              <TableCell className="text-sm font-medium">{formatCurrency(vehicle.price)}</TableCell>
              <TableCell>
                <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                  {vehicle.is_active ? 'Publicado' : 'Pausado'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" title={vehicle.is_active ? 'Pausar' : 'Publicar'} onClick={() => toggleActive(vehicle)}>
                    {vehicle.is_active ? <EyeOff className="h-4 w-4 text-zinc-500" /> : <Eye className="h-4 w-4 text-zinc-500" />}
                  </Button>
                  <Link href={`/${slug}/admin/estoque/${vehicle.id}`}>
                    <Button size="icon" variant="ghost"><Pencil className="h-4 w-4 text-zinc-500" /></Button>
                  </Link>
                  <Button size="icon" variant="ghost" onClick={() => deleteVehicle(vehicle.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}