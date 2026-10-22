'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { validateDate, maskDateBr, onlyDigits } from '@/lib/validations'
import { Button } from '@/components/ui/button'

export interface DatePickerProps {
  value?: string | null
  onChange: (isoDate: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  isBirthDate?: boolean
  minYear?: number
  maxYear?: number
  error?: string
  className?: string
  required?: boolean
  id?: string
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function ModernDatePicker({
  value,
  onChange,
  label,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  isBirthDate = false,
  minYear = 1920,
  maxYear = new Date().getFullYear() + 10,
  error: customError,
  className = '',
  required = false,
  id,
}: DatePickerProps) {
  // Converte valor inicial (ISO YYYY-MM-DD ou DD/MM/AAAA) para texto exibido
  const initialText = React.useMemo(() => {
    if (!value) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-')
      return `${d}/${m}/${y}`
    }
    return value
  }, [value])

  const [inputValue, setInputValue] = useState(initialText)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-')
      return new Date(Number(y), Number(m) - 1, 1)
    }
    return isBirthDate ? new Date(2000, 0, 1) : new Date()
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Sincroniza se o valor externo mudar
  useEffect(() => {
    setInputValue(initialText)
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-')
      setCurrentMonth(new Date(Number(y), Number(m) - 1, 1))
      setInternalError(null)
    } else if (!value) {
      setInternalError(null)
    }
  }, [initialText, value])

  // Fecha dropdown ao clicar fora (no Desktop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Manipulação da digitação manual com máscara
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const masked = maskDateBr(raw)
    setInputValue(masked)

    const digits = onlyDigits(masked)
    if (digits.length === 0) {
      setInternalError(null)
      onChange('')
      return
    }

    if (digits.length === 8) {
      const validation = validateDate(masked, { isBirthDate, minYear })
      if (!validation.valid) {
        setInternalError(validation.message || 'Data inválida.')
      } else {
        setInternalError(null)
        if (validation.isoDate) {
          onChange(validation.isoDate)
          const [y, m] = validation.isoDate.split('-')
          setCurrentMonth(new Date(Number(y), Number(m) - 1, 1))
        }
      }
    } else {
      // Data ainda incompleta
      setInternalError(null)
    }
  }

  // Manipulação da seleção de dia no calendário
  const handleSelectDay = (date: Date | undefined) => {
    if (!date) return
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${d}`
    const br = `${d}/${m}/${y}`

    const validation = validateDate(br, { isBirthDate, minYear })
    if (!validation.valid) {
      setInternalError(validation.message || 'Data inválida.')
      return
    }

    setInputValue(br)
    setInternalError(null)
    onChange(iso)
    setIsOpen(false)
  }

  // Anos disponíveis para a lista rápida
  const yearsList = React.useMemo(() => {
    const max = isBirthDate ? new Date().getFullYear() : maxYear
    const years: number[] = []
    for (let y = max; y >= minYear; y--) {
      years.push(y)
    }
    return years
  }, [isBirthDate, maxYear, minYear])

  const selectedDate = React.useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }, [value])

  const displayError = customError || internalError

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {isBirthDate && (
            <span className="text-[10px] text-muted-foreground font-normal">Máx: hoje</span>
          )}
        </label>
      )}

      {/* Input com ícone e trigger */}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          maxLength={10}
          className={`w-full h-10 px-3 pr-10 text-xs sm:text-sm rounded-xl border bg-surface-1 text-foreground transition-all outline-none font-mono
            ${
              displayError
                ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-surface focus:border-brand focus:ring-2 focus:ring-brand/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-2' : ''}
          `}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir calendário"
          className="absolute right-1 top-1 bottom-1 px-2.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-surface-2 transition-colors flex items-center justify-center"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Mensagem de Erro de Data */}
      {displayError && (
        <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{displayError}</span>
        </p>
      )}

      {/* POPUP / MODAL / DRAWER */}
      {isOpen && (
        <>
          {/* Backdrop no Mobile (Drawer) */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 sm:hidden animate-in fade-in-0 duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Container do Calendário */}
          <div
            className={`
              /* Mobile: Bottom Sheet / Drawer */
              fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 bg-surface-1 border-t border-surface shadow-2xl
              animate-in slide-in-from-bottom duration-300 sm:animate-none
              /* Desktop: Popover suspenso */
              sm:fixed sm:inset-auto sm:bottom-auto sm:left-auto sm:right-auto sm:absolute sm:top-full sm:mt-1.5 sm:w-auto
              sm:rounded-2xl sm:border sm:border-surface sm:p-4 sm:shadow-xl sm:z-40
            `}
          >
            {/* Puxador Drawer no Mobile */}
            <div className="w-12 h-1.5 bg-surface-3 rounded-full mx-auto mb-4 sm:hidden" />

            {/* Cabeçalho do Calendário com Seleção Rápida de Mês e Ano por LISTA */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-surface">
              <div className="flex items-center gap-1.5 flex-1">
                {/* Select Rápido de Mês */}
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => {
                    const m = Number(e.target.value)
                    setCurrentMonth(new Date(currentMonth.getFullYear(), m, 1))
                  }}
                  className="h-8 px-2 rounded-lg bg-surface-2 border border-surface text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-brand cursor-pointer"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>

                {/* Select Rápido de Ano (Essencial para Nascimento) */}
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => {
                    const y = Number(e.target.value)
                    setCurrentMonth(new Date(y, currentMonth.getMonth(), 1))
                  }}
                  className="h-8 px-2 rounded-lg bg-surface-2 border border-surface text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-brand cursor-pointer font-mono"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botões de Navegação Próximo/Anterior e Fechar */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => {
                    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    setCurrentMonth(prev)
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => {
                    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    setCurrentMonth(next)
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg sm:hidden text-muted-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Calendário react-day-picker pt-BR com estilização da marca */}
            <div className="modern-calendar-wrapper flex justify-center">
              <DayPicker
                mode="single"
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                selected={selectedDate}
                onSelect={handleSelectDay}
                locale={ptBR}
                disabled={
                  isBirthDate
                    ? { after: new Date(), before: new Date(minYear, 0, 1) }
                    : undefined
                }
                modifiersClassNames={{
                  selected: 'bg-brand text-white font-bold rounded-lg shadow-sm',
                  today: 'text-brand font-bold underline',
                }}
                className="text-xs"
              />
            </div>

            {/* Rodapé no Mobile com Ações */}
            <div className="mt-3 pt-3 border-t border-surface flex items-center justify-between sm:hidden">
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  handleSelectDay(today)
                }}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Hoje
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="text-xs rounded-xl h-8 px-4"
              >
                Fechar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
