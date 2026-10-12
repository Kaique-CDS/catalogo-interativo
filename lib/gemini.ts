// Modelos Flash-Lite: maior cota gratuita (Free Tier) no Google AI Studio e 0 gasto com tokens de "thinking"
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
]

const B64_FALLBACK = 'QVEuQWI4Uk42SmhCckRocVdmclJ3Wkl0WkJleGNYWjZLcWZWZ2l5UVljRkpmLXpCLTJDLUE='
const CACHE_PREFIX = 'vz_ai_desc_'
const memoryCache = new Map<string, string>()

export function getGeminiApiKey(): string {
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY.trim()
  }
  try {
    if (typeof atob === 'function') {
      return atob(B64_FALLBACK)
    }
    return Buffer.from(B64_FALLBACK, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

function hashPrompt(prompt: string): string {
  let h = 0
  for (let i = 0; i < prompt.length; i++) {
    h = (Math.imul(31, h) + prompt.charCodeAt(i)) | 0
  }
  return CACHE_PREFIX + Math.abs(h).toString(36)
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Chave do Gemini não configurada.')

  // 1. Verifica cache da sessão (evita gastar tokens se clicar 2x com os mesmos dados)
  const cacheKey = hashPrompt(prompt)
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!
  }
  if (typeof window !== 'undefined') {
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        memoryCache.set(cacheKey, cached)
        return cached
      }
    } catch {
      // ignore storage errors
    }
  }

  let lastError: unknown = null

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // maxOutputTokens: 130 garante texto direto (~250-350 caracteres) gastando ~65 tokens de saída
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 130,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        lastError = new Error(`Gemini (${model}) status ${res.status}: ${err}`)
        continue
      }

      const data = await res.json()
      let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      text = text.replace(/[*#_>`~]/g, '').trim()

      if (!text || text.length < 15) continue

      // Garante com rigor o limite máximo de 500 caracteres
      if (text.length > 500) {
        const cut = text.slice(0, 497)
        const lastPunctuation = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'))
        if (lastPunctuation > 200) {
          text = cut.slice(0, lastPunctuation + 1)
        } else {
          const lastSpace = cut.lastIndexOf(' ')
          text = (lastSpace > 300 ? cut.slice(0, lastSpace) : cut) + '...'
        }
      }

      // Salva no cache para economia máxima de tokens
      memoryCache.set(cacheKey, text)
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(cacheKey, text)
        } catch {
          // ignore
        }
      }

      return text
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Não foi possível gerar a descrição com o Gemini. Tente novamente.')
}

export function buildVehicleDescriptionPrompt({
  title,
  brand,
  model,
  year,
  mileage,
  price,
  fuel,
  transmission,
  color,
  features,
}: {
  title: string
  brand: string
  model: string
  year: number | string
  mileage: number | string
  price?: number | string
  fuel: string
  transmission: string
  color?: string
  features: string[]
}): string {
  // Prompt enxuto (~70 tokens de entrada) sem repetir dados desnecessários
  const items: string[] = []
  if (title) {
    items.push(title)
  } else if (brand || model) {
    items.push(`${brand} ${model}`.trim())
  }
  if (year) items.push(`Ano ${year}`)
  if (mileage !== undefined && mileage !== null && String(mileage).trim() !== '') {
    items.push(`${Number(mileage).toLocaleString('pt-BR')} km`)
  }
  if (fuel) items.push(fuel)
  if (transmission) items.push(`Câmbio ${transmission}`)
  if (color) items.push(`Cor ${color}`)
  if (price && Number(price) > 0) {
    items.push(`R$ ${Number(price).toLocaleString('pt-BR')}`)
  }
  if (features && features.length > 0) {
    items.push(`Opcionais: ${features.slice(0, 8).join(', ')}`)
  }

  return `Escreva APENAS 1 parágrafo curto de anúncio comercial para este seminovo (2 a 3 frases, máx 350 caracteres, texto corrido, sem markdown, sem opções e sem hashtags).\nDados: ${items.join(' | ')}\nAnúncio:`
}
