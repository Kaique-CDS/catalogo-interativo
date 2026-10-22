'use client'

import { parseBrlCurrency, normalizePlate, normalizeText } from '@/lib/normalization'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, X, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { generateSKU } from '@/lib/sku'

interface Props {
  slug: string
  onClose: () => void
  onSuccess: () => void
}

export default function BulkUploadModal({ slug, onClose, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [invalidRowsReport, setInvalidRowsReport] = useState<{ line: number; error: string }[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(10)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[]
          if (rows.length === 0) {
            toast.error('Planilha vazia ou formato inválido.')
            setUploading(false)
            return
          }

          let successCount = 0
          let errorCount = 0

          const reportList: { line: number; error: string }[] = []

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const lineNum = i + 2 // +2 considerando cabeçalho na linha 1
            
            // Se linha vazia
            if (!Object.values(row).some(v => String(v || '').trim() !== '')) {
              continue
            }

            // Validação das colunas obrigatórias
            if (!row.marca || String(row.marca).trim() === '') {
              reportList.push({ line: lineNum, error: 'Coluna "marca" não informada.' })
              errorCount++
              continue
            }
            if (!row.modelo || String(row.modelo).trim() === '') {
              reportList.push({ line: lineNum, error: 'Coluna "modelo" não informada.' })
              errorCount++
              continue
            }
            const yearNum = parseInt(String(row.ano || '').replace(/\D/g, ''), 10)
            if (isNaN(yearNum) || yearNum < 1950 || yearNum > 2035) {
              reportList.push({ line: lineNum, error: `Ano inválido (${row.ano || 'vazio'}).` })
              errorCount++
              continue
            }

            const parsedPrice = parseBrlCurrency(row.preco)
            if (parsedPrice <= 0) {
              reportList.push({ line: lineNum, error: `Preço inválido ou zerado (${row.preco || '0'}).` })
              errorCount++
              continue
            }

            const kmNum = parseInt(String(row.quilometragem || '0').replace(/\D/g, ''), 10) || 0

            // Fotos: suporta URLs separadas por vírgula ou ponto-e-vírgula
            const rawFotos = String(row.fotos || '')
            const fotosArray = rawFotos
              ? rawFotos
                  .split(/[,;]/)
                  .map((u: string) => u.trim())
                  .filter((url: string) => url.startsWith('http://') || url.startsWith('https://'))
              : []

            const payload = {
              slug,
              title: normalizeText(`${row.marca} ${row.modelo} ${row.versao || ''}`),
              brand: normalizeText(row.marca),
              model: normalizeText(row.modelo),
              year: yearNum,
              mileage: kmNum,
              price: parsedPrice,
              fuel: row.combustivel ? normalizeText(row.combustivel) : 'Flex',
              transmission: row.cambio ? normalizeText(row.cambio) : 'Automático',
              color: row.cor ? normalizeText(row.cor) : '',
              plate_end: row.placa_final ? normalizePlate(row.placa_final) : '',
              features: row.opcionais ? String(row.opcionais).split(/[,;]/).map((f: string) => normalizeText(f)).filter(Boolean) : [],
              description: row.descricao ? normalizeText(row.descricao) : 'Veículo em excelente estado.',
              images: fotosArray,
              is_active: String(row.ativo || '').toUpperCase().trim() === 'N' ? false : true,
              sku: row.sku && String(row.sku).trim() ? normalizeText(String(row.sku)) : generateSKU()
            }

            try {
              const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              })

              if (res.ok) {
                successCount++
              } else {
                errorCount++
                const errData = await res.json().catch(() => ({}))
                reportList.push({ line: lineNum, error: errData.error || 'Erro ao gravar veículo no servidor.' })
              }
            } catch (postErr: any) {
              errorCount++
              reportList.push({ line: lineNum, error: postErr.message || 'Falha de rede.' })
            }

            setProgress(10 + Math.floor(((i + 1) / rows.length) * 90))
          }

          setInvalidRowsReport(reportList)

          if (successCount > 0) {
            if (errorCount > 0) {
              toast.warning(`${successCount} importados, ${errorCount} com erro. Verifique os dados.`, { duration: 5000 })
            } else {
              toast.success(`${successCount} veículos importados com sucesso!`)
            }
            onSuccess()
          } else {
            toast.error('Nenhum veículo válido pôde ser importado. Verifique a planilha.')
          }
        } catch (err) {
          console.error(err)
          toast.error('Erro ao processar a planilha.')
        } finally {
          setUploading(false)
          onClose()
        }
      },
      error: () => {
        toast.error('Erro ao ler o arquivo CSV.')
        setUploading(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!uploading ? onClose : undefined} />
      
      <div className="relative w-full max-w-lg bg-surface-1 border border-surface rounded-2xl shadow-2xl p-6">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:bg-surface-2 transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
            <FileSpreadsheet className="h-6 w-6 text-brand" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Importação em Lote</h2>
          <p className="text-sm text-muted-foreground">Cadastre vários veículos de uma só vez usando uma planilha CSV.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-2 rounded-xl p-4 border border-surface flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-white mb-1">1. Baixe o modelo</p>
              <p className="text-xs text-muted-foreground mb-3">Preencha os dados seguindo a estrutura exata do cabeçalho.</p>
              <a href="/planilha-exemplo-veiculos.csv" download>
                <Button size="sm" variant="outline" className="h-8 text-xs bg-surface-1">
                  <Download className="h-3.5 w-3.5 mr-2" /> Baixar Planilha Exemplo
                </Button>
              </a>
            </div>
          </div>

          <div className="bg-surface-2 rounded-xl p-4 border border-surface">
            <p className="text-sm font-bold text-white mb-1">2. Envie o arquivo preenchido</p>
            <p className="text-xs text-muted-foreground mb-3">Selecione o arquivo CSV salvo no seu computador.</p>
            
            <label className={`flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed transition-colors ${
              uploading ? 'border-brand/50 bg-brand/5' : 'border-surface hover:border-muted-foreground bg-surface-1 cursor-pointer'
            }`}>
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 text-brand animate-spin mb-2" />
                  <span className="text-sm font-medium text-brand">Importando... {progress}%</span>
                  <div className="w-3/4 h-1.5 bg-surface-2 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-white">Clique para selecionar o CSV</span>
                  <span className="text-xs text-muted-foreground mt-1">Apenas arquivos .csv suportados</span>
                </>
              )}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
