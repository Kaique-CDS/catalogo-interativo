import { NextRequest, NextResponse } from 'next/server'
import { parseCrlvBuffer } from '@/lib/contracts/crlv-parser'
import { isContractsEnabled } from '@/lib/contracts/module-guard'
import { getCloudinary } from '@/lib/cloudinary'
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

function isValidCrlvMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false
  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true
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
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 })
    }

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

    // Barreira contra IDOR: lojista só pode processar CRLV na sua própria loja
    if (!canAccessTenant(auth, tenantSlug)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: você não tem permissão para esta loja.' },
        { status: 403 }
      )
    }

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

    // Validação real de magic bytes
    if (!isValidCrlvMagicBytes(buffer)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conteúdo do arquivo inválido. O arquivo enviado não é um PDF ou imagem autêntico.',
        },
        { status: 400 }
      )
    }

    // Executa leitura inteligente do CRLV (Camada de texto local do PDF)
    const parsedData = await parseCrlvBuffer(
      buffer,
      mime || (isPdfByName ? 'application/pdf' : 'image/jpeg'),
      file.name
    )

    // Upload seguro para Cloudinary em pasta privada do tenant
    let storedFileUrl: string | undefined = undefined
    try {
      const cloudinary = getCloudinary()
      if (cloudinary) {
        const isPdf = mime === 'application/pdf' || isPdfByName
        const folder = `${tenantSlug}/contratos/crlv`
        const publicId = `crlv_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`

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
