import { NextRequest, NextResponse } from 'next/server'
import {
  checkAiAvailability,
  recordAiUsage,
  tripAiGlobalLock,
  AI_CONFIG,
} from '@/lib/ai-governance'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, tenant_slug } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt é obrigatório.' }, { status: 400 })
    }

    // 1. Verifica governança de cota e trava global (máximo 70% da cota gratuita)
    const availability = await checkAiAvailability(tenant_slug)
    if (!availability.available) {
      return NextResponse.json(
        {
          error: availability.message || 'Limite gratuito de IA atingido. Volta amanhã.',
          isLocked: availability.isLocked,
          lockReason: availability.lockReason,
        },
        { status: 429 }
      )
    }

    // 2. Chave lida EXCLUSIVAMENTE de variável de ambiente no servidor (sem prefixo NEXT_PUBLIC para evitar vazamento)
    const apiKey = (process.env.GEMINI_API_KEY || '').trim()
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave da API do Gemini não configurada no servidor (.env.local).' },
        { status: 500 }
      )
    }

    // 3. Modelo configurável por env (padrão: família Flash-Lite gratuita)
    const model = AI_CONFIG.DEFAULT_MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    // 4. Chamada única com timeout de 8s (sem retry em loop) e saída restrita a 120 tokens (~300 caracteres)
    let res: Response
    try {
      res = await fetch(url, {
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
    } catch (fetchErr: any) {
      if (fetchErr.name === 'TimeoutError' || fetchErr.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Tempo limite da IA excedido (8s). Tente novamente mais tarde.' },
          { status: 504 }
        )
      }
      throw fetchErr
    }

    // 5. Se receber 429 (rate-limit / cota), 402/403 (billing/permissão), ativa a TRAVA GLOBAL imediatamente
    if (!res.ok) {
      const errText = await res.text()
      if (res.status === 429 || res.status === 403 || errText.includes('quota') || errText.includes('RESOURCE_EXHAUSTED')) {
        tripAiGlobalLock(`API do Gemini retornou status ${res.status}: ${errText.slice(0, 150)}`)
        return NextResponse.json(
          { error: 'Limite gratuito de IA atingido. Volta amanhã.', isLocked: true },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `Erro na API do Gemini (${res.status}).` },
        { status: 502 }
      )
    }

    const data = await res.json()
    let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    text = text.replace(/[*#_>`~]/g, '').trim()

    // 6. Registra consumo com margem de segurança de tokens
    await recordAiUsage(tenant_slug || 'global', 75)

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('Erro em POST /api/ai/vehicle-description:', err)
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar requisição de IA.' },
      { status: 500 }
    )
  }
}
