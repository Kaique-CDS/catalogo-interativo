import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateVehicleSaleContractPdf } from '@/lib/contracts/pdf-generator'
import { getTenantDemoStore } from '@/lib/tenants'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const isPrint = searchParams.get('print') === 'true'
    const isDownload = searchParams.get('download') === 'true'

    const supabase = createAdminClient()

    // 1. Busca dados do contrato
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*, stores(*)')
      .eq('id', id)
      .maybeSingle()

    if (error || !contract) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 })
    }

    const store = contract.stores || getTenantDemoStore('milhaticar')

    // 2. Gera os bytes do PDF no servidor
    const pdfBytes = await generateVehicleSaleContractPdf({
      number: contract.number,
      store,
      buyer: contract.buyer_data as any,
      vehicle: contract.vehicle_data as any,
      financial: contract.financial_data as any,
      clauses: contract.clauses as any,
      isPrintVersion: isPrint,
    })

    const filename = `Contrato-Venda-N${contract.number}-${isPrint ? 'Impressao' : 'Digital'}.pdf`
    const disposition = isDownload ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`

    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (err: any) {
    console.error('Error in GET /api/contracts/[id]/pdf:', err)
    return NextResponse.json({ error: err.message || 'Erro ao gerar PDF do contrato.' }, { status: 500 })
  }
}
