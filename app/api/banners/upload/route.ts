import { NextRequest, NextResponse } from 'next/server'
import { getCloudinary, generateVideoPosterUrl } from '@/lib/cloudinary'
import { IMAGE_SPECS, BANNER_SIZE_TOLERANCE_PX } from '@/lib/image-specs'
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

function isValidVideoFormat(mimeType: string, filename: string): boolean {
  const validMimes = ['video/mp4', 'video/webm', 'video/quicktime']
  const validExts = ['.mp4', '.webm', '.mov']
  const lowerName = filename.toLowerCase()
  return validMimes.includes(mimeType) || validExts.some(ext => lowerName.endsWith(ext))
}

const MAX_VIDEO_BYTES = 30 * 1024 * 1024 // 30 MB

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
    const device = (formData.get('device') || 'desktop') as 'desktop' | 'mobile'
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

    if (device !== 'desktop' && device !== 'mobile') {
      return NextResponse.json({ error: 'Dispositivo inválido (deve ser desktop ou mobile).' }, { status: 400 })
    }

    const isVideo = file.type.startsWith('video/') || isValidVideoFormat(file.type, file.name)
    const mediaType = isVideo ? 'video' : 'image'
    const folder = `${tenantSlug}/banners/${device}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ==========================================
    // 1. FLUXO DE VÍDEO (MP4 / WEBM)
    // ==========================================
    if (isVideo) {
      if (!isValidVideoFormat(file.type, file.name)) {
        return NextResponse.json(
          { error: 'Formato de vídeo não suportado. Utilize arquivos MP4 ou WebM.' },
          { status: 400 }
        )
      }

      if (file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json(
          {
            error: `O vídeo excede o tamanho máximo permitido de 30 MB (arquivo enviado tem ${(file.size / (1024 * 1024)).toFixed(1)} MB). Otimize o vídeo e tente novamente.`,
          },
          { status: 400 }
        )
      }

      const publicId = `banner_vid_${device}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

      const uploadResult = await new Promise<{
        secure_url: string
        public_id: string
        bytes: number
        format: string
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'video',
            overwrite: true,
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error('Falha no upload do vídeo para o Cloudinary.'))
              return
            }
            resolve(result as any)
          }
        )
        stream.end(buffer)
      })

      const posterUrl = generateVideoPosterUrl(uploadResult.secure_url)

      return NextResponse.json({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        poster_url: posterUrl,
        media_type: 'video',
        device,
      })
    }

    // ==========================================
    // 2. FLUXO DE IMAGEM (JPG / PNG / WEBP)
    // ==========================================
    const spec = device === 'desktop' ? IMAGE_SPECS.BANNER_DESKTOP : IMAGE_SPECS.BANNER_MOBILE

    if (file.size > spec.maxSizeBytes) {
      return NextResponse.json(
        {
          error: `A imagem excede o peso máximo de ${spec.maxSizeMB} MB (${(file.size / (1024 * 1024)).toFixed(1)} MB enviados).`,
        },
        { status: 400 }
      )
    }

    if (!isValidImageMagicBytes(buffer)) {
      return NextResponse.json(
        { error: 'Arquivo inválido. O conteúdo do arquivo não corresponde a uma imagem válida (JPG, PNG ou WEBP).' },
        { status: 400 }
      )
    }

    const publicId = `banner_img_${device}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

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

    // Validação estrita das dimensões conforme especificação
    if (
      Math.abs(uploadResult.width - spec.width) > BANNER_SIZE_TOLERANCE_PX ||
      Math.abs(uploadResult.height - spec.height) > BANNER_SIZE_TOLERANCE_PX
    ) {
      // Deleta imagem com tamanho incorreto do Cloudinary
      await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
      return NextResponse.json(
        {
          error: `O banner ${device === 'desktop' ? 'desktop' : 'mobile'} precisa ter exatamente ${spec.width} x ${spec.height} px. A imagem enviada tem ${uploadResult.width} x ${uploadResult.height} px. Ajuste a arte e envie novamente.`,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      poster_url: null,
      media_type: 'image',
      device,
      width: uploadResult.width,
      height: uploadResult.height,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/banners/upload:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar upload do banner.' },
      { status: 500 }
    )
  }
}
