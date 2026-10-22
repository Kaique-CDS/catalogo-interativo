import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { IMAGE_SPECS, type AssetType, BANNER_SIZE_TOLERANCE_PX } from '@/lib/image-specs'

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
    const rawType = (formData.get('type') || '') as AssetType
    const rawSlug = (formData.get('slug') || '') as string

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (!rawSlug) {
      return NextResponse.json({ error: 'Slug da loja é obrigatório.' }, { status: 400 })
    }

    if (rawType !== 'logo' && rawType !== 'banner_desktop' && rawType !== 'banner_mobile' && rawType !== 'signature') {
      return NextResponse.json({ error: 'Tipo de asset inválido.' }, { status: 400 })
    }

    const tenantSlug = slugify(rawSlug)
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
    const publicId = `${rawType}_${Date.now()}`

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
        // Remove asset inválido que acabou de subir
        await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
        return NextResponse.json(
          {
            error: `O banner mobile precisa ter exatamente ${expected.width} x ${expected.height} px. A imagem enviada tem ${uploadResult.width} x ${uploadResult.height} px.`,
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: true,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Erro em POST /api/store-assets/upload:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar upload do asset.' },
      { status: 500 }
    )
  }
}
