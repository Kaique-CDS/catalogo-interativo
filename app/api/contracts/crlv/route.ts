import { NextRequest, NextResponse } from 'next/server'
import { parseCrlvBuffer } from '@/lib/contracts/crlv-parser'
import { isContractsEnabled } from '@/lib/contracts/module-guard'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

function slugify(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sem-slug'
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const rawSlug = (formData.get('slug') || '') as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo de CRLV enviado.' },
        { status: 400 }
      )
    }

    if (!rawSlug) {
      return NextResponse.json(
        { success: false, error: 'Slug da loja é obrigatório.' },
        { status: 400 }
      )
    }

    const tenantSlug = slugify(rawSlug)

    // Valida se módulo de contratos está habilitado
    const enabled = await isContractsEnabled(tenantSlug)
    if (!enabled) {
      return NextResponse.json(
        { success: false, error: 'Módulo de contratos desativado para esta loja.' },
        { status: 403 }
      )
    }

    // Valida tamanho máximo de 12 MB
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'O arquivo excede o limite de 12 MB.' },
        { status: 400 }
      )
    }

    // Valida formato aceito (PDF, JPEG, PNG, WEBP)
    const validMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]

    const mime = file.type || ''
    const isPdfByName = file.name?.toLowerCase().endsWith('.pdf')
    const isImgByName = /\.(jpe?g|png|webp)$/i.test(file.name || '')

    if (!validMimes.includes(mime) && !isPdfByName && !isImgByName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato não suportado. Envie o CRLV digital em PDF ou foto (JPG/PNG).',
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Executa leitura inteligente do CRLV (Camada de texto PDF ou Gemini Multimodal OCR)
    const parsedData = await parseCrlvBuffer(
      buffer,
      mime || (isPdfByName ? 'application/pdf' : 'image/jpeg'),
      file.name
    )

    // Upload seguro para Cloudinary em pasta privada do tenant
    let storedFileUrl: string | undefined = undefined
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

        const isPdf = mime === 'application/pdf' || isPdfByName
        const folder = `${tenantSlug}/contratos/crlv`
        const publicId = `crlv_${Date.now()}`

        const uploadResult = await new Promise<{
          secure_url: string
          public_id: string
        }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              public_id: publicId,
              resource_type: isPdf ? 'raw' : 'image',
              type: 'authenticated', // Armazenamento privado/autenticado
              overwrite: true,
            },
            (error, result) => {
              if (error || !result) {
                reject(error || new Error('Falha no upload para o Cloudinary.'))
                return
              }
              resolve(result as any)
            }
          )
          stream.end(buffer)
        })

        storedFileUrl = uploadResult.secure_url
      }
    } catch (uploadErr) {
      console.warn('Não foi possível salvar arquivo CRLV no Cloudinary (prosseguindo com dados lidos):', uploadErr)
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      fileUrl: storedFileUrl,
      fileName: file.name,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/crlv:', err)
    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          'Não foi possível extrair os dados do CRLV. Por favor, confira o arquivo ou preencha manualmente.',
      },
      { status: 500 }
    )
  }
}
