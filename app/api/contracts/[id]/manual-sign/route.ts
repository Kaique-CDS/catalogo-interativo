import { NextRequest, NextResponse } from 'next/server'
import { registerManualPhysicalSignature } from '@/lib/contracts/signature-service'
import { getCloudinary } from '@/lib/cloudinary'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'

export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file')
    const signedBy = (formData.get('signedBy') || '') as string
    const slug = (formData.get('slug') || 'loja') as string

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: você não tem permissão para assinar contratos de outra loja.' },
        { status: 403 }
      )
    }

    if (!signedBy.trim()) {
      return NextResponse.json(
        { success: false, error: 'Informe o nome do responsável pelo registro da assinatura.' },
        { status: 400 }
      )
    }

    let fileUrl = ''

    if (file && file instanceof File) {
      // Faz upload do arquivo assinado (PDF ou Foto) para Cloudinary
      try {
        const cloudinary = getCloudinary()

        if (cloudinary) {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const publicId = `contrato_assinado_${id}_${Date.now()}`

          const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `${slug}/contratos/assinados`,
                public_id: publicId,
                resource_type: isPdf ? 'raw' : 'image',
                type: 'authenticated',
                overwrite: true,
              },
              (error, result) => {
                if (error || !result) return reject(error)
                resolve(result as any)
              }
            )
            stream.end(buffer)
          })

          fileUrl = uploadResult.secure_url
        }
      } catch (uploadErr) {
        console.warn('Erro ao salvar documento assinado no Cloudinary:', uploadErr)
      }
    }

    if (!fileUrl) {
      fileUrl = `/api/contracts/${id}/pdf`
    }

    const ip = getClientIp(req)

    const result = await registerManualPhysicalSignature({
      contractId: id,
      signedBy: signedBy.trim(),
      fileUrl,
      clientIp: ip,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Falha ao registrar assinatura física.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Assinatura física registrada com sucesso.',
      fileUrl,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/[id]/manual-sign:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao registrar assinatura' },
      { status: 500 }
    )
  }
}
