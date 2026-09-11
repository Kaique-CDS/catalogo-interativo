'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Eye, EyeOff, Cake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: 'Bolo Red Velvet Supreme com Frutas Vermelhas',
    category: 'Bolos Festivos',
    price: 185.00,
    servings: '15 a 20 fatias',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    name: 'Bolo Trufado Chocomenta & Ninho',
    category: 'Bolos Festivos',
    price: 165.00,
    servings: '12 a 15 fatias',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    name: 'Bento Cake Personalizado Divertido',
    category: 'Bento Cakes',
    price: 55.00,
    servings: '1 a 2 pessoas',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    name: 'Torta Cheesecake New York com Calda de Maracujá',
    category: 'Sobremesas na Taça',
    price: 140.00,
    servings: '10 fatias',
    isActive: true,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '5',
    name: 'Caixa Degustação de Brigadeiros Gourmet (12 un)',
    category: 'Doces Finos',
    price: 48.00,
    servings: '12 unidades',
    isActive: false,
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
  }
]

export default function ProdutosPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS)

  const toggleStatus = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.isActive
        toast.success(nextState ? 'Doce publicado no cardápio!' : 'Doce pausado da vitrine.')
        return { ...p, isActive: nextState }
      }
      return p
    }))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente remover este doce do catálogo?')) return
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Item removido com sucesso.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-rose-950 tracking-tight">Cardápio & Itens de Confeitaria</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Gerencie os bolos, doces finos e sobremesas exibidos aos clientes.</p>
        </div>
        <Link href="/confeitaria/admin/produtos/novo">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5 shadow-xs font-semibold">
            <Plus className="h-4 w-4" /> Novo Bolo / Doce
          </Button>
        </Link>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-rose-50/50">
            <TableRow className="border-rose-100 text-xs">
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Doce / Bolo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Rendimento</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-rose-50 text-xs">
            {products.map((item) => (
              <TableRow key={item.id} className="border-rose-50 hover:bg-rose-50/30">
                <TableCell>
                  <div className="relative h-12 w-14 rounded-xl overflow-hidden bg-rose-100 border border-rose-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-bold text-rose-950 text-xs">{item.name}</p>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-500">{item.category}</span>
                </TableCell>
                <TableCell>
                  <span className="text-zinc-500">{item.servings}</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-rose-950">{formatCurrency(item.price)}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.isActive ? 'default' : 'secondary'}
                    className={item.isActive ? 'bg-emerald-600 hover:bg-emerald-600 text-[10px]' : 'text-[10px]'}
                  >
                    {item.isActive ? 'Visível' : 'Pausado'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleStatus(item.id)}
                      title={item.isActive ? 'Pausar' : 'Publicar'}
                      className="h-8 w-8 text-zinc-400 hover:text-rose-600"
                    >
                      {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-500"
                    >
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