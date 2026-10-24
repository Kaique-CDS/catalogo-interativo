import { NextRequest, NextResponse } from 'next/server'
import { getCloudinary, generateVideoPosterUrl } from '@/lib/cloudinary'
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

    if (!isValidVideoFormat(file.type, file.name)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um vídeo nos formatos MP4, WebM ou MOV.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        {
          error: `O vídeo excede o tamanho máximo de 30 MB (arquivo enviado tem ${(file.size / (1024 * 1024)).toFixed(1)} MB). Otimize o vídeo e tente novamente.`,
        },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const folder = `${tenantSlug}/institucional`
    const publicId = `welcome_vid_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

    const isMovOrHevc =
      file.name.toLowerCase().endsWith('.mov') ||
      file.type === 'video/quicktime'

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
          // Transcodificação eager em segundo plano para máxima compatibilidade com H.264 / AAC
          eager: [
            { format: 'mp4', video_codec: 'h264', audio_codec: 'aac', width: 720, quality: 'auto' },
            { format: 'mp4', video_codec: 'h264', audio_codec: 'aac', width: 320, quality: 'auto' },
          ],
          eager_async: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Falha no upload do vídeo institucional para o Cloudinary.'))
            return
          }
          resolve(result as any)
        }
      )
      stream.end(buffer)
    })

    const posterUrl = generateVideoPosterUrl(uploadResult.secure_url)
    const isOriginalMov = isMovOrHevc || uploadResult.format?.toLowerCase() === 'mov'

    return NextResponse.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      poster_url: posterUrl,
      is_mov_or_hevc: isOriginalMov,
      warning: isOriginalMov
        ? 'Vídeo enviado em formato Apple (.MOV / HEVC). O catálogo aplicará entrega transcodificada em MP4 H.264 para reprodução garantida em todos os navegadores e celulares.'
        : null,
    })
  } catch (err: any) {
    console.error('Erro em POST /api/welcome-video/upload:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao processar upload do vídeo institucional.' },
      { status: 500 }
    )
  }
}
