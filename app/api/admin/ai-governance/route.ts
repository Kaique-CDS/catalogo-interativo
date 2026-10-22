import { NextRequest, NextResponse } from 'next/server'
import { getAiGovernanceMetrics, resetAiGlobalLock } from '@/lib/ai-governance'

export async function GET() {
  try {
    const metrics = await getAiGovernanceMetrics()
    return NextResponse.json({ success: true, metrics })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao obter métricas de IA' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.action === 'reset') {
      resetAiGlobalLock()
      const metrics = await getAiGovernanceMetrics()
      return NextResponse.json({ success: true, message: 'Trava global de IA reiniciada com sucesso.', metrics })
    }
    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar ação de governança de IA' }, { status: 500 })
  }
}
