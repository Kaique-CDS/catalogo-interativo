import { NextRequest, NextResponse } from 'next/server'
import { getCloudinary, normalizeCustomerPhotoUrl } from '@/lib/cloudinary'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import crypto from 'crypto'

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

function isValidImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true
  // WEBP: RIFF ... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return true
  return false
}

const MAX_PHOTO_BYTES = 12 * 1024 * 1024 // 12 MB

export async function POST(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const cloudinary = getCloudinary()
    if (!cloudinary) {
      return NextResponse.json(
        { error: 'Credenciais do Cloudinary não configuradas no servidor.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const rawSlug = (formData.get('slug') || '') as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (!rawSlug) {
      return NextResponse.json({ error: 'Slug da loja é obrigatório.' }, { status: 400 })
    }

    const tenantSlug = slugify(rawSlug)

    if (!canAccessTenant(auth, tenantSlug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para alterar arquivos de outra loja.' },
        { status: 403 }
      )
    }

    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        {
          error: `A foto excede o limite de 12 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB enviados).`,
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'Arquivo inválido. Envie uma imagem JPG, PNG ou WEBP.' },
        { status: 400 }
      )
    }

    const publicId = `cliente_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    const folder = `${tenantSlug}/clientes`

    const uploadResult = await new Promise<{
      secure_url: string
      public_id: string
      width: number
      height: number
      format: string
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
          // Normalização uniforme via Cloudinary: corte inteligente focado no rosto/sujeito,
          // proporção recomendada 4:5 (800x1000) e compressão automática
          transformation: [
            {
              width: 1000,
              height: 1250,
              crop: 'fill',
              gravity: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
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

    const finalUrl = normalizeCustomerPhotoUrl(uploadResult.secure_url)

    return NextResponse.json({
      url: finalUrl,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/customer-photos/upload:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar upload da foto do cliente.' },
      { status: 500 }
    )
  }
}
