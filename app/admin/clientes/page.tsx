'use client'

import React, { useState } from 'react'
import { HardDrive, CheckCircle2, AlertCircle, Database, Search, Filter, MoreVertical, Edit, Ban, Send, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const CLIENTS = [
  { id: 1, name: 'Concessionária NAPISTA', plan: 'Premium', dueDate: '2026-10-15', status: 'Ativo', dbUsage: '2.4 GB', limit: '10 GB' },
  { id: 2, name: 'Doce Encanto Ateliê', plan: 'Médio', dueDate: '2026-09-30', status: 'Pendente', dbUsage: '840 MB', limit: '5 GB' },
  { id: 3, name: 'Boutique da Moda', plan: 'Básico', dueDate: '2026-11-05', status: 'Ativo', dbUsage: '1.2 GB', limit: '5 GB' },
  { id: 4, name: 'Tech Store Brasil', plan: 'Básico', dueDate: '2026-08-15', status: 'Inativo', dbUsage: '4.5 GB', limit: '5 GB' },
  { id: 5, name: 'Artesanato Silva', plan: 'Médio', dueDate: '2026-10-01', status: 'Ativo', dbUsage: '120 MB', limit: '2 GB' },
  { id: 6, name: 'Venda de Garagem', plan: 'Trial', dueDate: '2026-09-28', status: 'Ativo', dbUsage: '50 MB', limit: '1 GB' },
]

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Clientes & Lojas</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerencie todos os assinantes da sua plataforma.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs">
          + Adicionar Cliente Manual
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por nome da loja, email ou CNPJ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 gap-2">
          <Filter className="h-4 w-4" />
          Filtros Avançados
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome da Loja</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Vencimento</th>
                <th className="px-6 py-4">Uso de Banco (BD)</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {CLIENTS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((client) => (
                <tr key={client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-zinc-900 dark:text-white">{client.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">ID: {client.id.toString().padStart(4, '0')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {client.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {client.status === 'Ativo' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Ativo</span>}
                    {client.status === 'Pendente' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><AlertCircle className="h-3.5 w-3.5" /> Pendente</span>}
                    {client.status === 'Inativo' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><AlertCircle className="h-3.5 w-3.5" /> Inativo</span>}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">
                    {new Date(client.dueDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{client.dbUsage}</span>
                      <span className="text-zinc-400">{client.limit}</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          (parseFloat(client.dbUsage) / parseFloat(client.limit)) > 0.8 ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min((parseFloat(client.dbUsage) / parseFloat(client.limit)) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-indigo-600" title="Acessar como cliente">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-amber-600" title="Cobrar no WhatsApp">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-600" title="Suspender">
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Fake */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Mostrando {CLIENTS.length} de {CLIENTS.length} clientes</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 text-xs rounded-lg">Anterior</Button>
            <Button variant="outline" size="sm" disabled className="h-8 text-xs rounded-lg">Próxima</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
