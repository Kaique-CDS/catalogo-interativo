import { NextRequest, NextResponse } from 'next/server'
import { getCloudinary } from '@/lib/cloudinary'
import { IMAGE_SPECS, type AssetType, BANNER_SIZE_TOLERANCE_PX } from '@/lib/image-specs'
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

export async function POST(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const cloudinary = getCloudinary()
    if (!cloudinary) {
      return NextResponse.json(
        { error: 'O servidor ainda não tem as chaves do Cloudinary. Avise o administrador da plataforma.' },
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const rawType = (formData.get('type') || '') as AssetType
    const rawSlug = (formData.get('slug') || '') as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (!rawSlug) {
      return NextResponse.json({ error: 'Slug da loja é obrigatório.' }, { status: 400 })
    }

    const tenantSlug = slugify(rawSlug)

    // Barreira contra IDOR: lojista só pode subir assets na sua própria loja
    if (!canAccessTenant(auth, tenantSlug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para alterar arquivos de outra loja.' },
        { status: 403 }
      )
    }

    if (rawType !== 'logo' && rawType !== 'banner_desktop' && rawType !== 'banner_mobile' && rawType !== 'signature') {
      return NextResponse.json({ error: 'Tipo de asset inválido.' }, { status: 400 })
    }

    let folder = `${tenantSlug}/logo`
    if (rawType === 'banner_desktop') folder = `${tenantSlug}/banners/desktop`
    if (rawType === 'banner_mobile') folder = `${tenantSlug}/banners/mobile`
    if (rawType === 'signature') folder = `${tenantSlug}/contratos/assinatura`

    // Valida peso no servidor
    const spec =
      rawType === 'logo'
        ? IMAGE_SPECS.LOGO
        : rawType === 'banner_desktop'
        ? IMAGE_SPECS.BANNER_DESKTOP
        : rawType === 'banner_mobile'
        ? IMAGE_SPECS.BANNER_MOBILE
        : IMAGE_SPECS.SIGNATURE

    if (file.size > spec.maxSizeBytes) {
      return NextResponse.json(
        {
          error: `O arquivo excede o peso máximo de ${spec.maxSizeMB} MB (${(file.size / (1024 * 1024)).toFixed(1)} MB enviados).`,
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validação de tipo real por Magic Bytes (impede arquivos executáveis/maliciosos)
    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'Arquivo inválido. O conteúdo real do arquivo não corresponde a uma imagem suportada (JPG, PNG ou WEBP).' },
        { status: 400 }
      )
    }

    const publicId = `${rawType}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

    const uploadResult = await new Promise<{
      secure_url: string
      public_id: string
      width: number
      height: number
      bytes: number
      format: string
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'image',
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

    // Validação rígida das dimensões no servidor
    if (rawType === 'banner_desktop') {
      const expected = IMAGE_SPECS.BANNER_DESKTOP
      if (
        Math.abs(uploadResult.width - expected.width) > BANNER_SIZE_TOLERANCE_PX ||
        Math.abs(uploadResult.height - expected.height) > BANNER_SIZE_TOLERANCE_PX
      ) {
        // Remove asset inválido que acabou de subir
        await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
        return NextResponse.json(
          {
            error: `O banner desktop precisa ter exatamente ${expected.width} x ${expected.height} px. A imagem enviada tem ${uploadResult.width} x ${uploadResult.height} px.`,
          },
          { status: 400 }
        )
      }
    }

    if (rawType === 'banner_mobile') {
      const expected = IMAGE_SPECS.BANNER_MOBILE
      if (
        Math.abs(uploadResult.width - expected.width) > BANNER_SIZE_TOLERANCE_PX ||
        Math.abs(uploadResult.height - expected.height) > BANNER_SIZE_TOLERANCE_PX
      ) {
        await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
        return NextResponse.json(
          {
            error: `O banner mobile precisa ter exatamente ${expected.width} x ${expected.height} px. A imagem enviada tem ${uploadResult.width} x ${uploadResult.height} px.`,
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      format: uploadResult.format,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/store-assets/upload:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no upload' }, { status: 500 })
  }
}
