const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) throw new Error('Chave do Gemini nao configurada. Adicione NEXT_PUBLIC_GEMINI_API_KEY no .env.local')

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 350 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return text.trim()
}

export function buildVehicleDescriptionPrompt({
  title, brand, model, year, mileage, fuel, transmission, features,
}: {
  title: string; brand: string; model: string; year: number | string;
  mileage: number | string; fuel: string; transmission: string; features: string[]
}): string {
  return `Voce e um especialista em vendas de veiculos seminovos. Escreva uma descricao de anuncio comercial curta, atrativa e profissional para o seguinte veiculo, em portugues do Brasil. Maximo 3 frases. Nao use markdown, apenas texto corrido.

Veiculo: ${title}
Marca: ${brand} | Modelo: ${model} | Ano: ${year}
Quilometragem: ${Number(mileage).toLocaleString('pt-BR')} km
Combustivel: ${fuel} | Cambio: ${transmission}
Opcionais: ${features.length > 0 ? features.join(', ') : 'Nao informado'}

Descricao:`
}

export function buildCakeDescriptionPrompt({
  name, category, servings, prepTime,
}: {
  name: string; category: string; servings?: string; prepTime?: string
}): string {
  return `Voce e uma confeiteira artesanal especialista em marketing de alimentos. Escreva uma descricao de cardapio irresistivel, curta e apetitosa para o seguinte produto de confeitaria, em portugues do Brasil. Maximo 2-3 frases. Destaque massa, recheios e textura. Nao use markdown.

Nome: ${name}
Categoria: ${category}${servings ? `\nRendimento: ${servings}` : ''}${prepTime ? `\nPrazo: ${prepTime}` : ''}

Descricao:`
}
