import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Car, CheckCircle, Archive, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props { totalVehicles: number; activeVehicles: number; slug: string }

export default function StatsCards({ totalVehicles, activeVehicles, slug }: Props) {
  const inactiveVehicles = totalVehicles - activeVehicles
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-zinc-500">Total no estoque</p><p className="text-3xl font-bold text-zinc-900 mt-1">{totalVehicles}</p></div>
              <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center"><Car className="h-5 w-5 text-zinc-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-zinc-500">Publicados</p><p className="text-3xl font-bold text-green-600 mt-1">{activeVehicles}</p></div>
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div><p className="text-sm text-zinc-500">Pausados</p><p className="text-3xl font-bold text-zinc-400 mt-1">{inactiveVehicles}</p></div>
              <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center"><Archive className="h-5 w-5 text-zinc-400" /></div>
            </div>
          </CardContent>
        </Card>
      </div>
      {totalVehicles === 0 && (
        <div className="text-center py-16 border rounded-xl bg-white">
          <Car className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
          <h3 className="font-semibold text-zinc-700 mb-1">Nenhum veiculo cadastrado ainda</h3>
          <p className="text-sm text-zinc-400 mb-6">Adicione seu primeiro veiculo ao catalogo</p>
          <Link href={`/${slug}/admin/estoque/novo`}><Button className="gap-2"><Plus className="h-4 w-4" />Adicionar veiculo</Button></Link>
        </div>
      )}
    </div>
  )
}