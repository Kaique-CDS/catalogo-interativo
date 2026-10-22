import { getGeminiApiKey } from '@/lib/gemini'

export interface CrlvParsedData {
  plate?: string
  renavam?: string
  chassis?: string
  brand_model?: string
  year_fab?: number
  year_model?: number
  color?: string
  fuel?: string
  engine?: string
  owner_name?: string
  owner_cpf_cnpj?: string
  notes?: string
  has_alienacao: boolean
  alienacao_details?: string
  raw_text?: string
  source: 'text_layer' | 'gemini_ocr' | 'manual'
}

/**
 * Normaliza e limpa texto para extração via regex.
 */
function cleanLine(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

/**
 * Expressões regulares para mapear campos do CRLV-e digital brasileiro.
 */
export function parseCrlvText(rawText: string): CrlvParsedData {
  const norm = cleanLine(rawText)

  // 1. Placa (padrão antigo ABC1234 ou Mercosul ABC1D23)
  const placaMatch = norm.match(/\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b/)
  const plate = placaMatch ? placaMatch[1] : undefined

  // 2. Renavam (geralmente 9 a 11 dígitos)
  const renavamMatch =
    norm.match(/RENAVAM[^\d]*(\d{9,11})/) ||
    norm.match(/\b(\d{11})\b/)
  const renavam = renavamMatch ? renavamMatch[1] : undefined

  // 3. Chassi (17 caracteres alfanuméricos)
  const chassiMatch =
    norm.match(/CHASSI[^\w]*([A-HJ-NPR-Z0-9]{17})/) ||
    norm.match(/\b([A-HJ-NPR-Z0-9]{17})\b/)
  const chassis = chassiMatch ? chassiMatch[1] : undefined

  // 4. Marca / Modelo
  let brand_model: string | undefined = undefined
  const marcaMatch =
    norm.match(/MARCA\s*\/\s*MODELO[^\w]*([A-Z0-9\/\s\-]{3,40})(?=ANO|PLACA|COR|CHASSI|\n|$)/) ||
    norm.match(/MARCA[^\w]*([A-Z0-9\/\s\-]{3,35})/)

  if (marcaMatch) {
    brand_model = marcaMatch[1].trim().replace(/\s+/g, ' ')
  }

  // 5. Ano Fabricação e Modelo
  let year_fab: number | undefined = undefined
  let year_model: number | undefined = undefined
  const anoMatch =
    norm.match(/ANO\s*FABRICACAO[^\d]*(\d{4})[^\d]*ANO\s*MODELO[^\d]*(\d{4})/) ||
    norm.match(/FAB\/MOD[^\d]*(\d{4})\s*\/\s*(\d{4})/) ||
    norm.match(/\b(19\d{2}|20\d{2})\s*\/\s*(19\d{2}|20\d{2})\b/)

  if (anoMatch) {
    year_fab = parseInt(anoMatch[1], 10)
    year_model = parseInt(anoMatch[2], 10)
  }

  // 6. Cor
  let color: string | undefined = undefined
  const corMatch = norm.match(/COR\s*PREDOMINANTE[^\w]*([A-Z]+)/) || norm.match(/COR[^\w]*([A-Z]+)/)
  if (corMatch) {
    const rawCor = corMatch[1].trim().toLowerCase()
    color = rawCor.charAt(0).toUpperCase() + rawCor.slice(1)
  }

  // 7. Combustível
  let fuel: string | undefined = undefined
  if (norm.includes('ALCOOL/GASOLINA') || norm.includes('FLEX')) {
    fuel = 'Flex'
  } else if (norm.includes('GASOLINA')) {
    fuel = 'Gasolina'
  } else if (norm.includes('DIESEL')) {
    fuel = 'Diesel'
  } else if (norm.includes('ELETRICO')) {
    fuel = 'Elétrico'
  } else if (norm.includes('HIBRIDO')) {
    fuel = 'Híbrido'
  } else if (norm.includes('ETANOL') || norm.includes('ALCOOL')) {
    fuel = 'Etanol'
  }

  // 8. Proprietário (Nome e CPF/CNPJ)
  let owner_name: string | undefined = undefined
  let owner_cpf_cnpj: string | undefined = undefined

  const nomeMatch = norm.match(/NOME[^\w]*([A-Z\s]{4,60})(?=CPF|CNPJ|ENDERECO|\n)/)
  if (nomeMatch) {
    owner_name = nomeMatch[1].trim().replace(/\s+/g, ' ')
  }

  const docMatch =
    norm.match(/CPF\s*\/\s*CNPJ[^\d]*(\d{11}|\d{14})/) ||
    norm.match(/\b(\d{3}\.\d{3}\.\d{3}\-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2})\b/) ||
    norm.match(/\b(\d{11}|\d{14})\b/)

  if (docMatch) {
    owner_cpf_cnpj = docMatch[1].replace(/\D/g, '')
  }

  // 9. Alienação Fiduciária / Restrições Financeiras
  const hasAlienacao =
    norm.includes('ALIENACAO FIDUCIARIA') ||
    norm.includes('ALIENACAO') ||
    norm.includes('GRAVAME') ||
    norm.includes('ARRENDAMENTO MERCANTIL') ||
    norm.includes('RESERVA DE DOMINIO')

  let alienacao_details: string | undefined = undefined
  if (hasAlienacao) {
    const obsMatch = norm.match(/OBSERVACOES[^\n]*\n?([^\n\r]+)/)
    alienacao_details = obsMatch ? obsMatch[1].trim() : 'Consta Alienação Fiduciária / Gravame financeiro ativo no documento.'
  }

  return {
    plate,
    renavam,
    chassis,
    brand_model,
    year_fab,
    year_model,
    color,
    fuel,
    owner_name,
    owner_cpf_cnpj,
    has_alienacao: hasAlienacao,
    alienacao_details,
    raw_text: rawText,
    source: 'text_layer',
  }
}

const OCR_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
]

/**
 * Fallback de OCR com Gemini Multimodal (PDF ou Imagem).
 */
export async function parseCrlvWithGemini(
  base64Data: string,
  mimeType: string
): Promise<CrlvParsedData> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Chave do Gemini não configurada para leitura OCR.')
  }

  const prompt = `Analise este documento brasileiro (CRLV - Certificado de Registro e Licenciamento de Veículo ou foto/digital do documento) e extraia com precisão os dados cadastrais do veículo e do proprietário.
Responda APENAS um JSON válido e estrito, sem markdown, sem explicações, no seguinte formato:
{
  "plate": "placa do veículo (ex: ABC1D23 ou ABC1234)",
  "renavam": "código renavam (somente números)",
  "chassis": "número do chassi (17 caracteres)",
  "brand_model": "marca e modelo do veículo (ex: HONDA/CIVIC TOURING)",
  "year_fab": 2022,
  "year_model": 2023,
  "color": "cor predominante (ex: Branco)",
  "fuel": "combustível (Flex, Gasolina, Diesel, etc)",
  "engine": "motor ou cilindrada se houver",
  "owner_name": "nome completo do proprietário",
  "owner_cpf_cnpj": "CPF ou CNPJ do proprietário (somente números)",
  "has_alienacao": true ou false (true se constar alienação fiduciária, arrendamento mercantil, gravame ou reserva de domínio),
  "alienacao_details": "detalhes do gravame/alienação fiduciária se houver, incluindo nome do banco/financeira"
}`

  let lastError: unknown = null

  for (const model of OCR_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        lastError = new Error(`Erro na API do Gemini (${model}): ${res.status} - ${errText}`)
        continue
      }

      const data = await res.json()
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      const parsed = JSON.parse(rawJson)

      return {
        plate: parsed.plate ? String(parsed.plate).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : undefined,
        renavam: parsed.renavam ? String(parsed.renavam).replace(/\D/g, '') : undefined,
        chassis: parsed.chassis ? String(parsed.chassis).replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : undefined,
        brand_model: parsed.brand_model ? String(parsed.brand_model).trim().toUpperCase() : undefined,
        year_fab: parsed.year_fab ? Number(parsed.year_fab) : undefined,
        year_model: parsed.year_model ? Number(parsed.year_model) : undefined,
        color: parsed.color ? String(parsed.color).trim() : undefined,
        fuel: parsed.fuel ? String(parsed.fuel).trim() : undefined,
        engine: parsed.engine ? String(parsed.engine).trim() : undefined,
        owner_name: parsed.owner_name ? String(parsed.owner_name).trim().toUpperCase() : undefined,
        owner_cpf_cnpj: parsed.owner_cpf_cnpj ? String(parsed.owner_cpf_cnpj).replace(/\D/g, '') : undefined,
        has_alienacao: Boolean(parsed.has_alienacao),
        alienacao_details: parsed.alienacao_details ? String(parsed.alienacao_details).trim() : undefined,
        source: 'gemini_ocr',
      }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Não foi possível realizar a leitura do CRLV.')
}

/**
 * Lê arquivo CRLV (Buffer) via camada de texto do PDF com fallback para OCR Gemini.
 */
export async function parseCrlvBuffer(
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<CrlvParsedData> {
  const isPdf =
    mimeType === 'application/pdf' ||
    (filename && filename.toLowerCase().endsWith('.pdf'))

  // 1. Se for PDF, tenta primeiro a extração via camada de texto nativa
  if (isPdf) {
    try {
      // Importa dinamicamente pdf-parse
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      if (pdfData?.text && pdfData.text.length > 40) {
        const parsed = parseCrlvText(pdfData.text)
        // Se encontrou dados chave essenciais
        if (parsed.plate || parsed.renavam || parsed.chassis) {
          return parsed
        }
      }
    } catch (err) {
      console.warn('Falha na leitura direta da camada de texto do PDF, acionando OCR:', err)
    }
  }

  // 2. Se for imagem ou se o PDF não possuía camada de texto (escaneado/foto), usa OCR multimodal
  const targetMime = isPdf ? 'application/pdf' : mimeType || 'image/jpeg'
  return await parseCrlvWithGemini(buffer.toString('base64'), targetMime)
}

