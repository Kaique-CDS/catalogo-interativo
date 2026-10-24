'use client'

import React, { useState } from 'react'
import { CheckCircle2, Calendar, Loader2, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Vehicle } from '@/lib/supabase/types'

interface MarkAsSoldModalProps {
  vehicle: Vehicle
  onClose: () => void
  onSuccess: (updatedVehicle: Vehicle) => void
}

export default function MarkAsSoldModal({
  vehicle,
  onClose,
  onSuccess,
}: MarkAsSoldModalProps) {
  const isAlreadySold = vehicle.status === 'vendido'

  // Padrão: data da venda existente ou data de hoje (YYYY-MM-DD no fuso local)
  const [saleDate, setSaleDate] = useState<string>(() => {
    if (vehicle.sold_at) {
      try {
        return new Date(vehicle.sold_at).toISOString().split('T')[0]
      } catch {
        // fallback
      }
    }
    return new Date().toISOString().split('T')[0]
  })

  const [saving, setSaving] = useState(false)

  const handleConfirmSold = async () => {
    if (!saleDate) {
      toast.error('Informe a data da venda.')
      return
    }

    setSaving(true)
    try {
      const soldIso = new Date(`${saleDate}T12:00:00-03:00`).toISOString()
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'vendido',
          sold_at: soldIso,
          is_active: false,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao registrar venda.')
      }

      toast.success('Veículo registrado como vendido!')
      onSuccess({
        ...vehicle,
        status: 'vendido',
        sold_at: soldIso,
        is_active: false,
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao marcar como vendido.')
    } finally {
      setSaving(false)
    }
  }

  const handleRevertToAvailable = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'disponivel',
          sold_at: null,
          is_active: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao reverter veículo.')
      }

      toast.success('Veículo retornado para o estoque disponível!')
      onSuccess({
        ...vehicle,
        status: 'disponivel',
        sold_at: null,
        is_active: true,
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao reverter veículo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={!saving ? onClose : undefined} />
      <div className="relative w-full max-w-md bg-surface-1 border border-surface rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAlreadySold ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading leading-tight">
                {isAlreadySold ? 'Editar Venda do Veículo' : 'Confirmar Venda do Veículo'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">
                {vehicle.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 my-5">
          <div className="space-y-1.5">
            <Label htmlFor="saleDate" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              Data Real da Venda
            </Label>
            <Input
              id="saleDate"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="rounded-xl h-11 text-sm bg-surface-2 border-surface text-foreground"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Esta data é usada no Dashboard para calcular com precisão o tempo que o carro levou para ser vendido.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-2/60 border border-surface text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">O que acontece agora:</p>
            <p>• O status do veículo passará para <strong className="text-emerald-500">Vendido</strong>.</p>
            <p>• Ele é pausado na vitrine pública para não receber novas propostas.</p>
            <p>• As métricas de giro e tempo até a venda no Dashboard serão atualizadas automaticamente.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-surface">
          {isAlreadySold ? (
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleRevertToAvailable}
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground border-surface h-11 px-4 gap-1.5 rounded-xl"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reverter para Disponível
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground h-11 px-4 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={handleConfirmSold}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-5 rounded-xl shadow-md gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isAlreadySold ? 'Atualizar Data' : 'Confirmar Venda'}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
