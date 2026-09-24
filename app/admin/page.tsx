import React from 'react'
import { HardDrive, CheckCircle2, AlertCircle, Database } from 'lucide-react'

// Dados simulados de clientes SaaS
const CLIENTS = [
  { id: 1, name: 'Concessionária NAPISTA', dueDate: '2026-10-15', status: 'Ativo', dbUsage: '2.4 GB', limit: '10 GB' },
  { id: 2, name: 'Doce Encanto Ateliê', dueDate: '2026-09-30', status: 'Pendente', dbUsage: '840 MB', limit: '5 GB' },
  { id: 3, name: 'Boutique da Moda', dueDate: '2026-11-05', status: 'Ativo', dbUsage: '1.2 GB', limit: '5 GB' },
  { id: 4, name: 'Tech Store Brasil', dueDate: '2026-08-15', status: 'Inativo', dbUsage: '4.5 GB', limit: '5 GB' },
  { id: 5, name: 'Artesanato Silva', dueDate: '2026-10-01', status: 'Ativo', dbUsage: '120 MB', limit: '2 GB' },
]

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Master (SaaS)</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerenciamento central de clientes e assinaturas.</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
              {CLIENTS.filter(c => c.status === 'Ativo').length} Ativos
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nome do Cliente</th>
                  <th className="px-6 py-4">Data de Vencimento</th>
                  <th className="px-6 py-4">Status do Contrato</th>
                  <th className="px-6 py-4">Consumo de BD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {CLIENTS.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {new Date(client.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      {client.status === 'Ativo' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> Ativo</span>}
                      {client.status === 'Pendente' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><AlertCircle className="h-3.5 w-3.5" /> Pendente</span>}
                      {client.status === 'Inativo' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800"><AlertCircle className="h-3.5 w-3.5" /> Inativo</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-zinc-400" />
                        <span className="font-mono text-zinc-600 dark:text-zinc-300">{client.dbUsage}</span>
                        <span className="text-zinc-400 text-xs">/ {client.limit}</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${(parseFloat(client.dbUsage) / parseFloat(client.limit)) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
