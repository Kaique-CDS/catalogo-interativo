import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])
const MAX_FILE_SIZE_BYTES = 35 * 1024 * 1024 // 35MB (aceita arquivos grandes sem barrar no upload)

function slugifyMarca(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'sem-marca'
}

function sanitizeIdVeiculo(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || crypto.randomUUID()
}

export async function POST(req: NextRequest) {
  try {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || 'prnrnxaw').trim()
    const apiKey = (process.env.CLOUDINARY_API_KEY || '311883981717173').trim()
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || 'SaJiLBB4hgByAIWoSYRtgqcGFUc').trim()

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Credenciais do Cloudinary não configuradas no servidor.' },
        { status: 500 }
      )
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })

    const formData = await req.formData()
    const file = formData.get('file')
    const rawMarca = (formData.get('marca') || formData.get('brand') || '') as string
    const rawIdVeiculo = (formData.get('id_veiculo') || formData.get('vehicleId') || '') as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de imagem enviado.' },
        { status: 400 }
      )
    }

    const fileType = (file.type || '').toLowerCase()
    const fileName = (file.name || '').toLowerCase()
    const isImage =
      ALLOWED_MIME_TYPES.has(fileType) ||
      fileType.startsWith('image/') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')

    if (!isImage) {
      return NextResponse.json(
        { error: `Formato inválido (${file.type || 'desconhecido'}). Envie apenas JPG, PNG, WEBP ou HEIC.` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'O arquivo excede o limite máximo permitido.' },
        { status: 400 }
      )
    }

    const rawTenant = (formData.get('slug') || formData.get('tenant') || 'milhaticar') as string
    const tenantSlug = slugifyMarca(rawTenant)
    const marcaSlug = slugifyMarca(rawMarca)
    const idVeiculo = sanitizeIdVeiculo(rawIdVeiculo)
    const folder = `${tenantSlug}/veiculos/${marcaSlug}/${idVeiculo}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadResult = await new Promise<{
      secure_url: string
      public_id: string
      width?: number
      height?: number
      bytes?: number
      format?: string
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          overwrite: false,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Falha no upload para o Cloudinary.'))
            return
          }
          resolve(result)
        }
      )

      stream.end(buffer)
    })

    return NextResponse.json(
      {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        folder,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        format: uploadResult.format,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Erro em POST /api/upload-foto:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao enviar foto para o Cloudinary.' },
      { status: 500 }
    )
  }
}
