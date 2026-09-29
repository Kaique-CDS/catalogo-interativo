'use client'

import { useState } from 'react'
import { Settings, Globe, Bell, Shield, Database, CreditCard, Save, ChevronRight, ToggleLeft, ToggleRight, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ConfiguracoesAdminPage() {
  const [saving, setSaving] = useState(false)
  const [emailNotif, setEmailNotif] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [trialDays, setTrialDays] = useState('7')
  const [supportEmail, setSupportEmail] = useState('suporte@vendazap.com')
  const [supportPhone, setSupportPhone] = useState('5511993270543')
  const [platformName, setPlatformName] = useState('VendaZap')
  const [maxCarsPerPlan, setMaxCarsPerPlan] = useState({ Starter: '20', Premium: '40', Enterprise: '100' })

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      toast.success('Configurações da plataforma salvas!')
      setSaving(false)
    }, 800)
  }

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="shrink-0">
      {value
        ? <ToggleRight className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
        : <ToggleLeft className="h-7 w-7 text-zinc-400" />}
    </button>
  )

  const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
          <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  )

  return (
    <div className="space-y-6 pb-12 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">Configurações da Plataforma</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Ajustes globais que afetam todos os clientes e o comportamento do sistema.</p>
      </div>

      <Section icon={Globe} title="Informações da Plataforma">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome da Plataforma</Label>
          <Input value={platformName} onChange={e=>setPlatformName(e.target.value)} className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> E-mail de Suporte</Label>
            <Input value={supportEmail} onChange={e=>setSupportEmail(e.target.value)} className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp de Suporte</Label>
            <Input value={supportPhone} onChange={e=>setSupportPhone(e.target.value)} className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
        </div>
      </Section>

      <Section icon={CreditCard} title="Configurações de Planos">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Dias de Trial (novos clientes)</Label>
          <Input type="number" value={trialDays} onChange={e=>setTrialDays(e.target.value)} className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 w-32" min="1" max="30" />
          <p className="text-[11px] text-zinc-400">Quantos dias o novo cliente terá acesso gratuito antes de precisar assinar.</p>
        </div>
        <div className="space-y-3">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Limite de Carros por Plano</Label>
          {(['Starter','Premium','Enterprise'] as const).map(plan => (
            <div key={plan} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-24 shrink-0">{plan}</span>
              <Input
                type="number" min="1"
                value={maxCarsPerPlan[plan]}
                onChange={e => setMaxCarsPerPlan(p => ({...p, [plan]: e.target.value}))}
                className="rounded-xl dark:bg-zinc-800 dark:border-zinc-700 w-28"
              />
              <span className="text-xs text-zinc-400">carros</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Bell} title="Notificações">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">E-mails de Cobrança</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Notificar clientes sobre faturas e vencimentos.</p>
          </div>
          <Toggle value={emailNotif} onToggle={() => setEmailNotif(v => !v)} />
        </div>
      </Section>

      <Section icon={Shield} title="Segurança e Manutenção">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Modo de Manutenção</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Desativa o acesso pública a todos os catálogos temporariamente.</p>
          </div>
          <Toggle value={maintenanceMode} onToggle={() => setMaintenanceMode(v => !v)} />
        </div>
        {maintenanceMode && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400 font-semibold">
            ⚠️ Modo de manutenção ATIVO — todos os catálogos públicos estão indisponíveis.
          </div>
        )}
      </Section>

      <Section icon={Database} title="Banco de Dados">
        <div className="space-y-3">
          {[
            { label: 'Armazenamento Total Utilizado', value: '12.4 GB de 500 GB', pct: 2.5 },
            { label: 'Total de Registros no Banco', value: '8.241 linhas', pct: null },
          ].map((row, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{row.label}</span>
                <span className="font-bold text-zinc-900 dark:text-white">{row.value}</span>
              </div>
              {row.pct !== null && (
                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <div className="h-full bg-indigo-500 rounded-full" style={{width:`${row.pct}%`}} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white font-bold rounded-xl h-11 gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </Button>
    </div>
  )
}
