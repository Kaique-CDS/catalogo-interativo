'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, X, FileSpreadsheet, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface Props {
  storeId: string
  onClose: () => void
  onSuccess: () => void
}

export default function BulkUploadModal({ storeId, onClose, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

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

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            
            // Basic validation - apenas o mínimo necessário
            if (!row.marca || !row.modelo || !row.ano) {
              // Verifica se a linha não está completamente vazia antes de contar como erro
              if (Object.values(row).some(v => v !== '')) errorCount++
              continue
            }

            const precoStr = String(row.preco || '0')
            const price = parseFloat(precoStr.replace(/\./g, '').replace(',', '.'))

            const payload = {
              store_id: storeId,
              title: `${row.marca} ${row.modelo} ${row.versao || ''}`.trim(),
              brand: row.marca,
              model: row.modelo,
              year: parseInt(row.ano, 10),
              mileage: parseInt(row.quilometragem || '0', 10),
              price: isNaN(price) ? 0 : price,
              fuel: row.combustivel || 'Flex',
              transmission: row.cambio || 'Automático',
              color: row.cor || '',
              plate_end: row.placa_final || '',
              features: row.opcionais ? String(row.opcionais).split(/[,;]/).map((f: string) => f.trim()).filter(Boolean) : [],
              description: row.descricao || 'Veículo em excelente estado.',
              images: row.fotos ? String(row.fotos).split(/[,;]/).map((f: string) => f.trim()).filter((url: string) => url.startsWith('http')) : [],
              is_active: String(row.ativo).toUpperCase() === 'N' ? false : true,
              sku: `BLK${Date.now().toString().slice(-4)}${i}`
            }

            // Post to API
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
              console.error(`Erro ao importar linha ${i + 2}:`, errData)
            }
            setProgress(10 + Math.floor(((i + 1) / rows.length) * 90))
          }

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
