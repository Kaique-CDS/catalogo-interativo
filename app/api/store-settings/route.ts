import { NextResponse } from 'next/server'
import { saveStoreWithContacts, getStoreWithContacts } from '@/lib/store-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 })
    }

    const store = await getStoreWithContacts(slug)
    return NextResponse.json({ store })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao carregar configurações' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { store_id, slug, name, slogan, address, opening_hours, phone, instagram, whatsapp, whatsapp_financeiro, logo_url, banner_url } = body

    if (!store_id || !slug || !name || !whatsapp) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const result = await saveStoreWithContacts({
      store_id,
      slug,
      name,
      slogan,
      address,
      opening_hours,
      phone,
      instagram,
      whatsapp,
      whatsapp_financeiro,
      logo_url,
      banner_url,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Erro ao salvar configurações' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na API store-settings:', error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
