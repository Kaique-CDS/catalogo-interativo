import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateVehicleSaleContractPdf, generatePowerOfAttorneyPdf } from '@/lib/contracts/pdf-generator'
import { getTenantDemoStore } from '@/lib/tenants'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'

export const dynamic = 'force-dynamic'

function renderFriendlyPdfErrorHtml(title: string, message: string, statusCode: number = 404): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} | Documentos</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 1.5rem;
      padding: 2.5rem;
      max-width: 440px;
      margin: 1.5rem;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      width: 48px;
      height: 48px;
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-radius: 1rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }
    p {
      font-size: 0.875rem;
      color: #a1a1aa;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
    }
    .btn {
      display: inline-block;
      background: #fafafa;
      color: #09090b;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: background 0.15s;
    }
    .btn:hover {
      background: #e4e4e7;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <button class="btn" onclick="if(window.history.length > 1) { window.history.back(); } else { window.close(); }">Voltar ao Painel</button>
  </div>
</body>
</html>`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificação de Autenticação
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return new NextResponse(
        renderFriendlyPdfErrorHtml(
          'Acesso Não Autorizado',
          'Você precisa estar autenticado no painel para visualizar o documento PDF.',
          401
        ),
        { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const isPrint = searchParams.get('print') === 'true'
    const isDownload = searchParams.get('download') === 'true'

    const supabase = createAdminClient()

    let contract: any = null
    let store: any = null

    // 2. Busca o contrato no Supabase
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
    } catch (err: any) {
      console.error('Erro na consulta do contrato para PDF:', err?.message)
    }

    if (!contract) {
      return new NextResponse(
        renderFriendlyPdfErrorHtml(
          'Contrato Não Encontrado',
          'O documento solicitado não foi encontrado no banco de dados. Verifique se o contrato foi emitido com sucesso.',
          404
        ),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    if (!store) {
      store = getTenantDemoStore(contract.store_id || 'milhaticar')
    }

    // 3. Validação de Isolamento de Tenant (IDOR Protection)
    const storeSlug = store?.slug || (contract.stores as any)?.slug || contract.tenant_id
    if (storeSlug && !canAccessTenant(auth, storeSlug)) {
      return new NextResponse(
        renderFriendlyPdfErrorHtml(
          'Acesso Negado',
          'Você não possui permissão para acessar contratos de outro lojista.',
          403
        ),
        { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    const isSigned =
      searchParams.get('signed') === 'true' ||
      (!isPrint && contract.status === 'signed')

    // 4. Monta lista de signatários
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
    return new NextResponse(
      renderFriendlyPdfErrorHtml(
        'Erro na Geração do PDF',
        'Ocorreu uma falha ao compilar o arquivo PDF. Nossa equipe técnica já foi notificada.',
        500
      ),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
