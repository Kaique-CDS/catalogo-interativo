import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateVehicleSaleContractPdf, generatePowerOfAttorneyPdf } from '@/lib/contracts/pdf-generator'
import { getTenantDemoStore } from '@/lib/tenants'

import { getLocalContractById } from '@/lib/contracts/cache'

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

    let contract: any = null
    let store: any = null

    // 1. Tenta buscar no Supabase se não for ID local
    if (!id.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*, stores(*)')
          .eq('id', id)
          .maybeSingle()

        if (!error && data) {
          contract = data
          store = data.stores
        }
      } catch {
        // Fallback para cache local
      }
    }

    // 2. Fallback para cache local (suporta testes locais antes do deploy de migrations)
    if (!contract) {
      contract = getLocalContractById(id)
      if (contract?.seller_data) {
        store = {
          ...getTenantDemoStore('milhaticar'),
          ...contract.seller_data,
          name: contract.seller_data.name || 'Milhaticar',
        }
      }
    }

    if (!contract) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 })
    }

    if (!store) {
      store = getTenantDemoStore('milhaticar')
    }

    const isSigned =
      searchParams.get('signed') === 'true' ||
      (!isPrint && contract.status === 'signed')

    // 2. Gera os bytes do PDF no servidor
    const signersList = (contract.signers || []).map((s: any) => ({
      role: s.role,
      name: s.name,
      document: s.document,
      email: s.email,
      phone: s.phone,
      signedAt: s.signed_at || s.signedAt,
      signatureImageUrl: s.signature_image_url || s.signatureImageUrl,
      ip: s.ip,
      userAgent: s.user_agent || s.userAgent,
      otpVerifiedAt: s.otp_verified_at || s.otpVerifiedAt,
    }))

    let pdfBytes: Uint8Array
    let filename: string
    const isPoa = contract.type === 'procuracao'

    if (isPoa) {
      pdfBytes = await generatePowerOfAttorneyPdf({
        number: contract.number,
        store,
        grantor: contract.buyer_data as any,
        grantee: contract.seller_data as any,
        vehicle: contract.vehicle_data as any,
        validityDays: contract.validity_days || 365,
        additionalPowers: contract.additional_powers,
        observations: contract.notes,
        isPrintVersion: isPrint,
        isFinalSigned: isSigned,
        signers: signersList,
        sha256Hash: contract.pdf_sha256,
      })
      filename = `Procuracao-N${contract.number}-${isPrint ? 'Impressao' : isSigned ? 'Assinado' : 'Digital'}.pdf`
    } else {
      pdfBytes = await generateVehicleSaleContractPdf({
        number: contract.number,
        store,
        buyer: contract.buyer_data as any,
        vehicle: contract.vehicle_data as any,
        financial: contract.financial_data as any,
        clauses: contract.clauses as any,
        isPrintVersion: isPrint,
        isFinalSigned: isSigned,
        signers: signersList,
        sha256Hash: contract.pdf_sha256,
      })
      filename = `Contrato-Venda-N${contract.number}-${isPrint ? 'Impressao' : isSigned ? 'Assinado' : 'Digital'}.pdf`
    }

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
