import { NextRequest, NextResponse } from 'next/server'
import { registerManualPhysicalSignature } from '@/lib/contracts/signature-service'
import { v2 as cloudinary } from 'cloudinary'

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
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file')
    const signedBy = (formData.get('signed_by') || '') as string
    const notes = (formData.get('notes') || '') as string
    const slug = (formData.get('slug') || 'loja') as string

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
        const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || 'prnrnxaw').trim()
        const apiKey = (process.env.CLOUDINARY_API_KEY || '311883981717173').trim()
        const apiSecret = (process.env.CLOUDINARY_API_SECRET || 'SaJiLBB4hgByAIWoSYRtgqcGFUc').trim()

        if (cloudName && apiKey && apiSecret) {
          cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
          })

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

    const clientIp = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || 'Admin'

    const res = await registerManualPhysicalSignature({
      contractId: id,
      fileUrl,
      signedBy: signedBy.trim(),
      notes: notes.trim(),
      clientIp,
      userAgent,
    })

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Contrato marcado como assinado presencialmente com sucesso!',
      fileUrl,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/[id]/manual-sign:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao registrar assinatura presencial.' },
      { status: 500 }
    )
  }
}
