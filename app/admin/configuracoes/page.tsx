'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  Bell,
  Database,
  CreditCard,
  Save,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ConfiguracoesAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [nomePlataforma, setNomePlataforma] = useState('VendaZap')
  const [emailSuporte, setEmailSuporte] = useState('kaiquecorrea86@gmail.com')
  const [whatsappSuporte, setWhatsappSuporte] = useState('5511993270543')
  const [diasTrial, setDiasTrial] = useState('7')
  const [limiteStarter, setLimiteStarter] = useState('20')
  const [limitePremium, setLimitePremium] = useState('40')
  const [limiteEnterprise, setLimiteEnterprise] = useState('100')
  const [emailsCobrancaAtivo, setEmailsCobrancaAtivo] = useState(true)

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/configuracoes', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar configurações')
      const { config } = await res.json()
      if (config) {
        setNomePlataforma(config.nome_plataforma || 'VendaZap')
        setEmailSuporte(config.email_suporte || 'kaiquecorrea86@gmail.com')
        setWhatsappSuporte(config.whatsapp_suporte || '5511993270543')
        setDiasTrial(String(config.dias_trial ?? 7))
        setLimiteStarter(String(config.limite_carros_starter ?? 20))
        setLimitePremium(String(config.limite_carros_premium ?? 40))
        setLimiteEnterprise(String(config.limite_carros_enterprise ?? 100))
        setEmailsCobrancaAtivo(Boolean(config.emails_cobranca_ativo))
      }
    } catch {
      toast.error('Erro ao carregar configurações da plataforma.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_plataforma: nomePlataforma.trim() || 'VendaZap',
          email_suporte: emailSuporte.trim() || null,
          whatsapp_suporte: whatsappSuporte.trim() || '5511993270543',
          dias_trial: Number(diasTrial || 7),
          limite_carros_starter: Number(limiteStarter || 20),
          limite_carros_premium: Number(limitePremium || 40),
          limite_carros_enterprise: Number(limiteEnterprise || 100),
          emails_cobranca_ativo: emailsCobrancaAtivo,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar configurações')
      toast.success('Configurações da plataforma salvas no Supabase (id=1)!')
    } catch {
      toast.error('Falha ao salvar configurações no banco.')
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} className="shrink-0">
      {value ? (
        <ToggleRight className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
      ) : (
        <ToggleLeft className="h-7 w-7 text-zinc-400" />
      )}
    </button>
  )

  const Section = ({
    icon: Icon,
    title,
    children,
  }: {
    icon: React.ElementType
    title: string
    children: React.ReactNode
  }) => (
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
            Configurações da Plataforma
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Ajustes globais salvos diretamente na tabela configuracoes (id=1).
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadConfig}
          disabled={loading}
          className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
          title="Recarregar configurações"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Section icon={Globe} title="Informações da Plataforma">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome da Plataforma</Label>
          <Input
            value={nomePlataforma}
            onChange={(e) => setNomePlataforma(e.target.value)}
            className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> E-mail de Suporte
            </Label>
            <Input
              value={emailSuporte}
              onChange={(e) => setEmailSuporte(e.target.value)}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> WhatsApp de Suporte
            </Label>
            <Input
              value={whatsappSuporte}
              onChange={(e) => setWhatsappSuporte(e.target.value)}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>
        </div>
      </Section>

      <Section icon={CreditCard} title="Configurações de Planos">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Dias de Trial (novos clientes)
          </Label>
          <Input
            type="number"
            value={diasTrial}
            onChange={(e) => setDiasTrial(e.target.value)}
            className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white w-32"
            min="1"
            max="60"
          />
          <p className="text-[11px] text-zinc-400">
            Quantos dias o novo cliente terá acesso gratuito antes de precisar assinar.
          </p>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Limite de Carros por Plano
          </Label>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-24 shrink-0">Starter</span>
            <Input
              type="number"
              min="1"
              value={limiteStarter}
              onChange={(e) => setLimiteStarter(e.target.value)}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white w-28"
            />
            <span className="text-xs text-zinc-400">carros</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-24 shrink-0">Premium</span>
            <Input
              type="number"
              min="1"
              value={limitePremium}
              onChange={(e) => setLimitePremium(e.target.value)}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white w-28"
            />
            <span className="text-xs text-zinc-400">carros</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-24 shrink-0">Enterprise</span>
            <Input
              type="number"
              min="1"
              value={limiteEnterprise}
              onChange={(e) => setLimiteEnterprise(e.target.value)}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white w-28"
            />
            <span className="text-xs text-zinc-400">carros</span>
          </div>
        </div>
      </Section>

      <Section icon={Bell} title="Notificações Automáticas (Resend)">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">E-mails de Cobrança</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Quando ativo, verifica automaticamente faturas vencendo em até 3 dias e dispara e-mail de aviso via Resend.
            </p>
          </div>
          <Toggle value={emailsCobrancaAtivo} onToggle={() => setEmailsCobrancaAtivo((v) => !v)} />
        </div>
      </Section>

      <Section icon={Database} title="Banco de Dados Supabase">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">Registro Persistente</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">configuracoes (id = 1)</span>
            </div>
          </div>
        </div>
      </Section>

      <Button
        onClick={handleSave}
        disabled={saving || loading}
        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 px-6 gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Salvando no Supabase...' : 'Salvar Configurações'}
      </Button>
    </div>
  )
}
