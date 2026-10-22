import { NextRequest, NextResponse } from 'next/server'
import {
  createTicket,
  listTickets,
  notifyOwnerNewTicket,
  type TicketType,
  type TicketStatus,
} from '@/lib/tickets-service'
import { v2 as cloudinary } from 'cloudinary'
import { getTenantBrand } from '@/lib/tenants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MAX_PRINT_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

function getCloudinary() {
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
    return cloudinary
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenant_id = searchParams.get('tenant_id') || searchParams.get('slug') || undefined
    const status = (searchParams.get('status') as TicketStatus) || undefined
    const type = (searchParams.get('type') as TicketType) || undefined

    const tickets = await listTickets({
      tenant_id,
      status,
      type,
    })

    return NextResponse.json({ tickets }, { status: 200 })
  } catch (err: any) {
    console.error('[API TICKETS GET]', err)
    return NextResponse.json({ error: err.message || 'Erro ao listar tickets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let tenant_id = ''
    let title = ''
    let description = ''
    let type: TicketType = 'melhoria'
    let created_by: string | null = null
    const attachments: { public_id: string; url: string; file_size: number }[] = []

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      tenant_id = (formData.get('tenant_id') || formData.get('slug') || '').toString().trim()
      title = (formData.get('title') || '').toString().trim()
      description = (formData.get('description') || '').toString().trim()
      type = (formData.get('type') as TicketType) || 'melhoria'
      created_by = (formData.get('created_by') || '').toString().trim() || null

      const files = formData.getAll('prints') as File[]
      const validFiles = files.filter((f) => f && f.size > 0).slice(0, 3)

      if (validFiles.length > 0) {
        const c = getCloudinary()
        if (c) {
          const tempTicketId = crypto.randomUUID().slice(0, 8)
          const folder = `${tenant_id || 'geral'}/tickets/${tempTicketId}`

          for (const file of validFiles) {
            if (file.size > MAX_PRINT_SIZE_BYTES) {
              return NextResponse.json(
                { error: `O print "${file.name}" excede o tamanho máximo de 2 MB.` },
                { status: 400 }
              )
            }

            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const uploadRes = await new Promise<{
              secure_url: string
              public_id: string
              bytes?: number
            }>((resolve, reject) => {
              const stream = c.uploader.upload_stream(
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

            attachments.push({
              public_id: uploadRes.public_id,
              url: uploadRes.secure_url,
              file_size: uploadRes.bytes || file.size,
            })
          }
        }
      }
    } else {
      const body = await req.json()
      tenant_id = (body.tenant_id || body.slug || '').trim()
      title = (body.title || '').trim()
      description = (body.description || '').trim()
      type = body.type || 'melhoria'
      created_by = body.created_by ? String(body.created_by).trim() : null
      if (Array.isArray(body.attachments)) {
        attachments.push(...body.attachments.slice(0, 3))
      }
    }

    if (!tenant_id) {
      return NextResponse.json({ error: 'Identificador da empresa (tenant_id) é obrigatório.' }, { status: 400 })
    }

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'Título do ticket deve ter pelo menos 3 caracteres.' }, { status: 400 })
    }

    if (!description || description.length < 5) {
      return NextResponse.json({ error: 'Descrição do ticket deve ter pelo menos 5 caracteres.' }, { status: 400 })
    }

    if (!['melhoria', 'problema', 'duvida'].includes(type)) {
      type = 'melhoria'
    }

    const ticket = await createTicket({
      tenant_id,
      title,
      description,
      type,
      created_by,
      attachments,
    })

    // Dispara notificação por e-mail para o proprietário da plataforma
    const brand = getTenantBrand(tenant_id)
    notifyOwnerNewTicket(ticket, brand.name).catch(() => {})

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (err: any) {
    console.error('[API TICKETS POST]', err)
    return NextResponse.json({ error: err.message || 'Erro ao criar ticket' }, { status: 500 })
  }
}
