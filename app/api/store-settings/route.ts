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

import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
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
      email,
      maps_embed_url,
      logo_url,
      banner_url,
      banner_mobile_url,
      contract_razao_social,
      contract_cnpj,
      contract_address,
      contract_phone,
      contract_email,
      contract_foro_cidade,
      contract_foro_estado,
      contract_rep_nome,
      contract_rep_cpf,
      contract_signature_url,
    } = body

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
      email,
      maps_embed_url,
      logo_url,
      banner_url,
      banner_mobile_url,
      contract_razao_social,
      contract_cnpj,
      contract_address,
      contract_phone,
      contract_email,
      contract_foro_cidade,
      contract_foro_estado,
      contract_rep_nome,
      contract_rep_cpf,
      contract_signature_url,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Erro ao salvar configurações' }, { status: 500 })
    }

    // Revalida páginas públicas da vitrine para refletir alterações imediatamente
    try {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/quem-somos`)
    } catch (e) {
      console.warn('Erro ao revalidar caminhos:', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro na API store-settings:', error)
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 })
  }
}
