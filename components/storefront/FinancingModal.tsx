'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, SendHorizonal, Loader2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildFinancingWhatsAppUrl } from '@/lib/whatsapp'
import type { Vehicle } from '@/lib/supabase/types'

const BANKS = [
  'Banco do Brasil', 'Bradesco', 'Caixa Econômica Federal', 'Itaú', 'Santander',
  'Nubank', 'Sicoob', 'Sicredi', 'BTG Pactual', 'Outro',
]

const schema = z.object({
  nome:            z.string().min(3, 'Informe seu nome completo'),
  cpf:             z.string().min(11, 'CPF inválido').max(14),
  cnh:             z.string().optional(),
  dataNascimento:  z.string().optional(),
  rendaMensal:     z.string().optional(),
  valorEntrada:    z.string().optional(),
  banco:           z.string().optional(),
  email:           z.string().email('E-mail inválido').optional().or(z.literal('')),
  contato:         z.string().min(10, 'Informe um telefone válido com DDD'),
})

type FormData = z.infer<typeof schema>

interface Props {
  vehicle: Vehicle
  store: {
    name: string
    whatsapp: string
    whatsapp_financeiro?: string | null
  }
  hasTradeIn: boolean
  onClose: () => void
  onBack: () => void
}

export default function FinancingModal({ vehicle, store, hasTradeIn, onClose, onBack }: Props) {
  const [sending, setSending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    setSending(true)
    const url = buildFinancingWhatsAppUrl({
      whatsappFinanceiro: store.whatsapp_financeiro,
      whatsapp: store.whatsapp,
      storeName: store.name,
      sku: vehicle.sku ?? 'N/A',
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      hasTradeIn,
      ...data,
    })
    window.open(url, '_blank')
    setSending(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh]">
        {/* Handle (mobile) */}
        <div className="w-10 h-1.5 bg-zinc-200 rounded-full mx-auto mt-3 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-500" />
          </button>
          <div className="flex-1">
            <h3 className="font-bold text-zinc-900">Simulação de Financiamento</h3>
            <p className="text-xs text-zinc-500">
              {vehicle.brand} {vehicle.model} {vehicle.year}
              {vehicle.sku && (
                <span className="ml-1.5 font-mono font-semibold text-blue-600">
                  #{vehicle.sku}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto flex-1 px-5 py-4 space-y-4"
        >
          {/* SKU (read-only) */}
          <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-3">
            <div className="text-xs text-blue-600 font-medium">Veículo de interesse</div>
            <div className="ml-auto font-mono text-sm font-bold text-blue-700">
              SKU: #{vehicle.sku ?? 'N/A'}
            </div>
          </div>

          {/* Required fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" placeholder="João da Silva" {...register('nome')} />
              {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF *</Label>
              <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
              {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contato">Telefone (WhatsApp) *</Label>
              <Input id="contato" placeholder="(11) 99999-0000" {...register('contato')} />
              {errors.contato && <p className="text-xs text-red-500">{errors.contato.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cnh">Número da CNH</Label>
              <Input id="cnh" placeholder="00000000000" {...register('cnh')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input id="dataNascimento" type="date" {...register('dataNascimento')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rendaMensal">Renda Mensal (R$)</Label>
              <Input id="rendaMensal" placeholder="3.500,00" {...register('rendaMensal')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valorEntrada">Valor de Entrada (R$)</Label>
              <Input id="valorEntrada" placeholder="5.000,00" {...register('valorEntrada')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="banco">Banco de conta corrente</Label>
              <select
                id="banco"
                {...register('banco')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione...</option>
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="joao@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          {/* Trade-in notice */}
          {hasTradeIn && (
            <div className="p-3 bg-orange-50 rounded-xl text-sm text-orange-700 font-medium flex items-center gap-2">
              🔄 Incluindo veículo usado na troca
            </div>
          )}

          {/* LGPD notice */}
          <p className="text-xs text-zinc-400 leading-relaxed">
            Ao enviar, você concorda que seus dados serão compartilhados com a loja via WhatsApp,
            conforme a LGPD. Seus dados não serão usados para outros fins.
          </p>

          <div className="pb-2">
            <Button type="submit" disabled={sending} className="w-full h-12 text-base gap-2 rounded-xl">
              {sending ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Abrindo WhatsApp...</>
              ) : (
                <><SendHorizonal className="h-5 w-5" />Enviar Simulação pelo WhatsApp</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}