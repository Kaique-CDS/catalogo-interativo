import { AI_CONFIG } from '@/lib/ai-config'

const CACHE_PREFIX = 'vz_ai_desc_'
const memoryCache = new Map<string, string>()

/**
 * Obtém a chave do Gemini configurada exclusivamente nas variáveis de ambiente.
 * NUNCA possui chave em texto ou base64 no código-fonte.
 */
export function getGeminiApiKey(): string {
  if (typeof process !== 'undefined' && process.env) {
    const key = process.env.GEMINI_API_KEY
    if (key) return key.trim()
  }
  return ''
}

function hashPrompt(prompt: string): string {
  let h = 0
  for (let i = 0; i < prompt.length; i++) {
    h = (Math.imul(31, h) + prompt.charCodeAt(i)) | 0
  }
  return CACHE_PREFIX + Math.abs(h).toString(36)
}

/**
 * Gera legenda comercial com IA (Google Gemini Free Tier).
 * Possui cache inteligente em memória e sessionStorage para não gastar requisições à toa.
 */
export async function generateWithGemini(prompt: string, tenantSlug?: string): Promise<string> {
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

  // 2. Se executado no navegador, faz a requisição pela rota segura de backend (/api/ai/vehicle-description)
  // que gerencia o contador diário (margem 70%) e a trava global
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/ai/vehicle-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tenant_slug: tenantSlug }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar descrição com IA.')
    }

    const text = (data.text || '').trim()
    if (!text) {
      throw new Error('A IA não retornou um texto válido. Tente novamente.')
    }

    // Salva no cache local
    memoryCache.set(cacheKey, text)
    try {
      sessionStorage.setItem(cacheKey, text)
    } catch {}

    return text
  }

  // 3. Se executado em ambiente server:
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Chave do Gemini não configurada.')

  const model = AI_CONFIG.DEFAULT_MODEL
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 120,
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Erro na API do Gemini (${res.status}): ${errText.slice(0, 100)}`)
  }

  const data = await res.json()
  let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  text = text.replace(/[*#_>`~]/g, '').trim()

  memoryCache.set(cacheKey, text)
  return text
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
  // Prompt super enxuto (~70 tokens de entrada) para máxima economia de cota
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
