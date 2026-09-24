import React from 'react'
import { Users, CreditCard, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Master</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Visão geral do crescimento e faturamento da plataforma.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white dark:bg-zinc-900 rounded-xl">Baixar Relatório</Button>
          <Link href="/admin/clientes">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Gerenciar Clientes</Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: 'Receita Recorrente (MRR)', value: 'R$ 48.590', trend: '+12.5%', trendUp: true, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { title: 'Lojas Ativas', value: '412', trend: '+5', trendUp: true, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
          { title: 'Faturas Vencidas', value: '14', trend: '-2', trendUp: true, icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
          { title: 'Taxa de Churn', value: '1.2%', trend: '-0.3%', trendUp: true, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                kpi.trendUp ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20'
              }`}>
                {kpi.trend} {kpi.trendUp && <ArrowUpRight className="h-3 w-3" />}
              </span>
            </div>
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-1">{kpi.title}</h3>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Simulado */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <h3 className="text-lg font-bold mb-6">Crescimento de Assinaturas (Últimos 6 Meses)</h3>
          <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 pt-4 border-b border-zinc-100 dark:border-zinc-800 pb-2 relative">
            {/* Linhas de grade de fundo simuladas */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
              {[0,1,2,3].map(l => <div key={l} className="w-full border-t border-dashed border-zinc-100 dark:border-zinc-800/50"></div>)}
            </div>
            
            {[
              { month: 'Abr', val: 40 }, { month: 'Mai', val: 55 }, { month: 'Jun', val: 75 }, 
              { month: 'Jul', val: 65 }, { month: 'Ago', val: 90 }, { month: 'Set', val: 100 }
            ].map((col, i) => (
              <div key={i} className="flex flex-col items-center flex-1 z-10 group">
                <div className="w-full max-w-[40px] bg-indigo-100 dark:bg-indigo-900/30 rounded-t-md relative group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40 transition-colors" style={{ height: `${col.val}%` }}>
                  <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md" style={{ height: `${col.val * 0.7}%` }}></div>
                </div>
                <span className="text-xs text-zinc-500 mt-3 font-semibold">{col.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Assinantes Pagos</div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"><div className="w-3 h-3 bg-indigo-200 dark:bg-indigo-800 rounded-sm"></div> Trials Ativos</div>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col">
          <h3 className="text-lg font-bold mb-6">Atividade Recente</h3>
          <div className="flex-1 space-y-6">
            {[
              { title: 'Novo Assinante Premium', desc: 'Boutique da Moda aderiu ao plano anual.', time: '2h atrás', color: 'bg-emerald-500' },
              { title: 'Pagamento Recusado', desc: 'Tech Store Brasil falhou na renovação.', time: '5h atrás', color: 'bg-rose-50 dark:bg-rose-950/300' },
              { title: 'Upgrade de Plano', desc: 'Doce Encanto mudou para o Plano Médio.', time: 'Ontem', color: 'bg-indigo-500' },
              { title: 'Novo Trial Iniciado', desc: 'Sapataria XYZ começou os 7 dias.', time: 'Ontem', color: 'bg-amber-500' },
            ].map((act, i) => (
              <div key={i} className="flex gap-4 relative">
                {i !== 3 && <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-zinc-100 dark:bg-zinc-800 -ml-[1px]"></div>}
                <div className={`w-4 h-4 rounded-full border-[3px] border-white dark:border-zinc-900 shrink-0 ${act.color} relative z-10 mt-1`}></div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{act.title}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{act.desc}</p>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase block mt-1">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6 rounded-xl text-xs font-bold">Ver Todo Histórico</Button>
        </div>
      </div>
    </div>
  )
}
