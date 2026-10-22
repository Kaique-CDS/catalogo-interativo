import { NextRequest, NextResponse } from 'next/server'
import {
  getSignerByToken,
  sendSignerOtp,
  verifySignerOtp,
  completeSignerSignature,
} from '@/lib/contracts/signature-service'

export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'Dispositivo Móvel / Navegador'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token não fornecido.' }, { status: 400 })
    }

    const result = await getSignerByToken(token)
    if (!result.success || !result.signer || !result.contract) {
      return NextResponse.json(
        { success: false, error: result.error || 'Contrato não encontrado.' },
        { status: 404 }
      )
    }

    const { signer, contract, isExpired, alreadySigned } = result

    // Retorna payload sanitizado para exibição pública
    return NextResponse.json({
      success: true,
      isExpired,
      alreadySigned,
      signer: {
        id: signer.id,
        role: signer.role,
        name: signer.name,
        document: signer.document,
        email: signer.email,
        phone: signer.phone,
        status: signer.status,
        signed_at: signer.signed_at,
        otp_verified_at: signer.otp_verified_at,
      },
      contract: {
        id: contract.id,
        number: contract.number,
        title: contract.title,
        status: contract.status,
        store: contract.seller_data,
        vehicle: contract.vehicle_data,
        financial: contract.financial_data,
        pdf_url: `/api/contracts/${contract.id}/pdf`,
        signed_pdf_url: contract.signed_pdf_url,
      },
    })
  } catch (err: any) {
    console.error('Erro em GET /api/contracts/sign/[token]:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao carregar dados de assinatura.' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await req.json()
    const { action, code, signature_base64 } = body as {
      action: 'request_otp' | 'verify_otp' | 'complete_signature'
      code?: string
      signature_base64?: string
    }

    const signerCheck = await getSignerByToken(token)
    if (!signerCheck.success || !signerCheck.signer || !signerCheck.contract) {
      return NextResponse.json(
        { success: false, error: 'Link de assinatura inválido ou expirado.' },
        { status: 403 }
      )
    }

    const { signer, contract, isExpired, alreadySigned } = signerCheck

    if (isExpired) {
      return NextResponse.json(
        { success: false, error: 'Este link de assinatura expirou.' },
        { status: 410 }
      )
    }

    if (alreadySigned && action !== 'complete_signature') {
      return NextResponse.json(
        { success: false, error: 'Este contrato já foi assinado por você.' },
        { status: 400 }
      )
    }

    const clientIp = getClientIp(req)
    const userAgent = getUserAgent(req)

    // 1. SOLICITAR CÓDIGO OTP
    if (action === 'request_otp') {
      const otpRes = await sendSignerOtp({
        signerId: signer.id,
        contractId: contract.id,
        clientIp,
        userAgent,
      })

      if (!otpRes.success) {
        return NextResponse.json({ success: false, error: otpRes.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `Código de verificação enviado para o e-mail cadastrado.`,
      })
    }

    // 2. VERIFICAR CÓDIGO OTP
    if (action === 'verify_otp') {
      if (!code || code.trim().length !== 6) {
        return NextResponse.json(
          { success: false, error: 'Informe o código de 6 dígitos recebido por e-mail.' },
          { status: 400 }
        )
      }

      const verifyRes = await verifySignerOtp({
        signerId: signer.id,
        contractId: contract.id,
        code: code.trim(),
        clientIp,
        userAgent,
      })

      if (!verifyRes.success) {
        return NextResponse.json({ success: false, error: verifyRes.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Código validado com sucesso!',
      })
    }

    // 3. CONCLUIR ASSINATURA ELETRÔNICA
    if (action === 'complete_signature') {
      if (!signature_base64) {
        return NextResponse.json(
          { success: false, error: 'A imagem da assinatura desenhada é obrigatória.' },
          { status: 400 }
        )
      }

      const signRes = await completeSignerSignature({
        signerId: signer.id,
        contractId: contract.id,
        signatureBase64: signature_base64,
        clientIp,
        userAgent,
      })

      if (!signRes.success) {
        return NextResponse.json({ success: false, error: signRes.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        allSigned: signRes.allSigned,
        message: signRes.allSigned
          ? 'Contrato assinado por todas as partes e concluído com sucesso!'
          : 'Sua assinatura foi registrada com sucesso!',
      })
    }

    return NextResponse.json({ success: false, error: 'Ação não reconhecida.' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/sign/[token]:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao processar assinatura.' },
      { status: 500 }
    )
  }
}
