import { normalizeDigits, normalizeEmail, normalizeText } from '@/lib/normalization'
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

    // Normalização estrita antes de gravar no banco (Fase 0.2)
    const normalizedWhatsApp = normalizeDigits(whatsapp)
    const normalizedPhone = phone ? normalizeText(phone) : null
    const normalizedEmail = email ? normalizeEmail(email) : null
    const normalizedCnpj = contract_cnpj ? normalizeDigits(contract_cnpj) : null
    const normalizedContractPhone = contract_phone ? normalizeText(contract_phone) : null
    const normalizedRepCpf = contract_rep_cpf ? normalizeDigits(contract_rep_cpf) : null
    const normalizedContractEmail = contract_email ? normalizeEmail(contract_email) : null

    const result = await saveStoreWithContacts({
      store_id,
      slug,
      name: normalizeText(name),
      slogan: slogan ? normalizeText(slogan) : null,
      address: address ? normalizeText(address) : null,
      opening_hours: opening_hours ? normalizeText(opening_hours) : null,
      phone: normalizedPhone,
      instagram: instagram ? normalizeText(instagram) : null,
      whatsapp: normalizedWhatsApp,
      whatsapp_financeiro: whatsapp_financeiro ? normalizeDigits(whatsapp_financeiro) : null,
      email: normalizedEmail,
      maps_embed_url: maps_embed_url || null,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
      banner_mobile_url: banner_mobile_url || null,
      contract_razao_social: contract_razao_social ? normalizeText(contract_razao_social) : null,
      contract_cnpj: normalizedCnpj,
      contract_address: contract_address ? normalizeText(contract_address) : null,
      contract_phone: normalizedContractPhone,
      contract_email: normalizedContractEmail,
      contract_foro_cidade: contract_foro_cidade ? normalizeText(contract_foro_cidade) : null,
      contract_foro_estado: contract_foro_estado ? normalizeText(contract_foro_estado).toUpperCase().slice(0, 2) : null,
      contract_rep_nome: contract_rep_nome ? normalizeText(contract_rep_nome) : null,
      contract_rep_cpf: normalizedRepCpf,
      contract_signature_url: contract_signature_url || null,
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
