const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-flash-latest']

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('Chave do Gemini não configurada. Adicione NEXT_PUBLIC_GEMINI_API_KEY no .env.local')

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
  const formattedPrice = price ? `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Consulte'
  return `Você é um especialista em vendas de veículos seminovos.
Escreva uma descrição de anúncio comercial atrativa, vendedora e profissional para o veículo abaixo.

REGRAS OBRIGATÓRIAS:
1. O texto DEVE ter no MÁXIMO 500 caracteres (imprescindível respeitar esse limite).
2. Baseie-se estritamente nas características preenchidas abaixo, sem inventar opcionais não listados.
3. Não use títulos, listas, hashtags ou markdown; escreva apenas texto corrido em português do Brasil.

DADOS DO VEÍCULO:
- Veículo: ${title}
- Marca: ${brand} | Modelo: ${model}
- Ano Modelo: ${year}
- Quilometragem: ${Number(mileage).toLocaleString('pt-BR')} km
- Preço: ${formattedPrice}
- Combustível: ${fuel} | Câmbio: ${transmission}
- Cor: ${color || 'Não informada'}
- Opcionais e Diferenciais: ${features.length > 0 ? features.join(', ') : 'Nenhum opcional informado'}

Descrição (máx. 500 caracteres):`
}

export function buildCakeDescriptionPrompt({
  name, category, price, servings, prepTime,
}: {
  name: string; category: string; price?: number | string;
  servings: string; prepTime: string
}): string {
  const formattedPrice = price ? `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''
  return `Você é uma chef confeiteira artesanal premiada.
Escreva uma descrição irresistível, apetitosa e comercial para o cardápio do doce/bolo abaixo.

REGRAS OBRIGATÓRIAS:
1. O texto DEVE ter no MÁXIMO 500 caracteres (imprescindível respeitar esse limite).
2. Baseie-se exatamente nas informações preenchidas (nome, rendimento, prazo e categoria).
3. Não use títulos, listas, hashtags ou markdown; escreva apenas texto corrido e envolvente em português do Brasil.

DADOS DO PRODUTO:
- Nome: ${name}
- Categoria: ${category}
${formattedPrice ? `- Preço: ${formattedPrice}` : ''}
- Rendimento: ${servings}
- Prazo de Encomenda: ${prepTime}

Descrição (máx. 500 caracteres):`
}
