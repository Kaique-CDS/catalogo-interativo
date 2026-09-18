'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Eye, EyeOff, Cake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
  getConfeitariaProducts,
  saveConfeitariaProduct,
  deleteConfeitariaProduct,
  ConfeitariaProduct,
  DEFAULT_CONFEITARIA_PRODUCTS
} from '@/lib/confeitaria'

export default function ProdutosPage() {
  const [products, setProducts] = useState<ConfeitariaProduct[]>(DEFAULT_CONFEITARIA_PRODUCTS)

  useEffect(() => {
    setProducts(getConfeitariaProducts())
  }, [])

  const toggleStatus = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.isActive
        const updated = { ...p, isActive: nextState }
        saveConfeitariaProduct(updated)
        toast.success(nextState ? 'Doce publicado no cardápio!' : 'Doce pausado da vitrine.')
        return updated
      }
      return p
    }))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente remover este doce do catálogo?')) return
    deleteConfeitariaProduct(id)
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('Item removido com sucesso.')
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-rose-950 tracking-tight">Cardápio do Ateliê 🍓</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Controle os doces e bolos visíveis para encomendas.</p>
        </div>
        <Link href="/confeitaria/admin/produtos/novo">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-1.5 shadow-xs font-semibold px-3 py-2 sm:px-4">
            <Plus className="h-4 w-4" /> Novo Doce
          </Button>
        </Link>
      </div>

      {/* 1. Visão Mobile: Lista de Cards de Produtos */}
      <div className="md:hidden space-y-3">
        {products.map((item) => (
          <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs flex gap-3 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-14 w-16 rounded-xl overflow-hidden bg-rose-50 flex-shrink-0 border border-rose-100">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-rose-950 text-xs truncate">{item.name}</p>
                <p className="text-[11px] text-zinc-400">{item.category} • {item.servings}</p>
                <p className="text-xs font-black text-rose-950 mt-0.5">{formatCurrency(item.price)}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <Badge
                variant={item.isActive ? 'default' : 'secondary'}
                className={item.isActive ? 'bg-emerald-600 hover:bg-emerald-600 text-[9px] px-1.5 py-0' : 'text-[9px] px-1.5 py-0'}
              >
                {item.isActive ? 'Visível' : 'Pausado'}
              </Badge>

              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleStatus(item.id)}
                  className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                  title={item.isActive ? "Pausar" : "Publicar"}
                >
                  {item.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Link href={`/confeitaria/admin/produtos/${item.id}`}>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                    title="Editar produto"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(item.id)}
                  className="h-7 w-7 text-zinc-400 hover:text-red-500"
                  title="Excluir produto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Visão Desktop: Tabela Tradicional */}
      <div className="hidden md:block bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs">
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
                <TableCell><span className="text-zinc-500">{item.category}</span></TableCell>
                <TableCell><span className="text-zinc-500">{item.servings}</span></TableCell>
                <TableCell><span className="font-bold text-rose-950">{formatCurrency(item.price)}</span></TableCell>
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
                      className="h-8 w-8 text-zinc-400 hover:text-rose-600"
                      title={item.isActive ? "Pausar" : "Publicar"}
                    >
                      {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Link href={`/confeitaria/admin/produtos/${item.id}`}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-zinc-400 hover:text-rose-600"
                        title="Editar produto"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-500"
                      title="Excluir produto"
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