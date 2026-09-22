const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest']

const B64_FALLBACK = 'QVEuQWI4Uk42SmhCckRocVdmclJ3Wkl0WkJleGNYWjZLcWZWZ2l5UVljRkpmLXpCLTJDLUE='

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

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) throw new Error('Chave do Gemini não configurada.')

  let lastError: unknown = null

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        lastError = new Error(`Gemini (${model}) status ${res.status}: ${err}`)
        continue
      }

      const data = await res.json()
      let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      text = text.trim()

      if (!text) continue

      // Garante com rigor o limite máximo de 500 caracteres
      if (text.length > 500) {
        const cut = text.slice(0, 497)
        const lastPunctuation = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'))
        if (lastPunctuation > 300) {
          text = cut.slice(0, lastPunctuation + 1)
        } else {
          const lastSpace = cut.lastIndexOf(' ')
          text = (lastSpace > 350 ? cut.slice(0, lastSpace) : cut) + '...'
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
  title, brand, model, year, mileage, price, fuel, transmission, color, features,
}: {
  title: string; brand: string; model: string; year: number | string;
  mileage: number | string; price?: number | string; fuel: string;
  transmission: string; color?: string; features: string[]
}): string {
  // Filtra estritamente os campos preenchidos para gastar o mínimo de tokens
  const items: string[] = []
  if (title) items.push(`Veículo: ${title}`)
  if (brand || model) items.push(`Modelo: ${brand} ${model}`)
  if (year) items.push(`Ano: ${year}`)
  if (mileage !== undefined && mileage !== null && String(mileage).trim() !== '') {
    items.push(`Km: ${Number(mileage).toLocaleString('pt-BR')}`)
  }
  if (price && Number(price) > 0) {
    items.push(`Preço: R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  }
  if (fuel) items.push(`Combustível: ${fuel}`)
  if (transmission) items.push(`Câmbio: ${transmission}`)
  if (color) items.push(`Cor: ${color}`)
  if (features && features.length > 0) items.push(`Opcionais: ${features.join(', ')}`)

  return `Escreva um anúncio de venda atrativo e profissional para este seminovo.
Máximo de 450 caracteres (2 a 3 frases). Apenas texto corrido, sem markdown e sem hashtags.
Dados: ${items.join(' | ')}
Descrição:`
}


export function buildCakeDescriptionPrompt({
  name, category, price, servings, prepTime,
}: {
  name: string; category: string; price?: number | string;
  servings?: string; prepTime?: string
}): string {
  // Filtra estritamente os campos preenchidos para gastar o mínimo de tokens
  const items: string[] = []
  if (name) items.push(`Produto: ${name}`)
  if (category) items.push(`Categoria: ${category}`)
  if (price && Number(price) > 0) {
    items.push(`Preço: R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
  }
  if (servings) items.push(`Rendimento: ${servings}`)
  if (prepTime) items.push(`Prazo: ${prepTime}`)

  return `Escreva uma descrição irresistível, apetitosa e profissional de cardápio para este doce artesanal.
Máximo de 450 caracteres (2 a 3 frases). Apenas texto corrido, sem markdown e sem hashtags.
Dados: ${items.join(' | ')}
Descrição:`
}
