import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Store } from '@/lib/supabase/types'
import { getTenantDemoStore, getTenantBrand } from '@/lib/tenants'

/** Recupera os contatos estendidos (telefone de chamadas e instagram) salvos para a loja */
export async function getExtendedStoreContacts(slug: string): Promise<{ phone?: string | null; instagram?: string | null }> {
  try {
    const supabase = await createClient()
    const { data: erpRow } = await supabase
      .from('stores')
      .select('slogan')
      .eq('slug', '__erp_system_state__')
      .maybeSingle()

    if (erpRow?.slogan) {
      const state = JSON.parse(erpRow.slogan)
      const contact = state?.store_contacts?.[slug.toLowerCase()]
      if (contact) {
        return {
          phone: contact.phone || null,
          instagram: contact.instagram || null,
        }
      }
    }
  } catch (err) {
    console.error('Erro ao ler contatos estendidos do ERP state:', err)
  }

  // Fallback nos valores padrão da marca
  const brand = getTenantBrand(slug)
  return {
    phone: brand.phone.display,
    instagram: brand.instagram.url,
  }
}

/** Obtém a loja mesclando os dados da tabela `stores` com os contatos configurados */
export async function getStoreWithContacts(slug: string): Promise<Store> {
  const demoStore = getTenantDemoStore(slug)
  let store: Store = { ...demoStore }

  try {
    const supabase = await createClient()
    const { data: dbStore } = await supabase
      .from('stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (dbStore) {
      store = { ...store, ...dbStore }
    }
  } catch (err) {
    console.error('Erro ao buscar store do banco:', err)
  }

  // Se o banco não tiver as colunas phone/instagram ou estiverem vazias, busca dos contatos estendidos
  if (!store.phone || !store.instagram) {
    const extra = await getExtendedStoreContacts(slug)
    if (!store.phone && extra.phone) store.phone = extra.phone
    if (!store.instagram && extra.instagram) store.instagram = extra.instagram
  }

  return store
}

/** Salva as configurações da loja, com suporte a phone e instagram com ou sem migração no banco */
export async function saveStoreWithContacts(payload: {
  store_id: string
  slug: string
  name: string
  slogan?: string | null
  address?: string | null
  opening_hours?: string | null
  phone?: string | null
  instagram?: string | null
  whatsapp: string
  whatsapp_financeiro?: string | null
  email?: string | null
  maps_embed_url?: string | null
  logo_url?: string | null
  banner_url?: string | null
  banner_mobile_url?: string | null
  contract_razao_social?: string | null
  contract_cnpj?: string | null
  contract_address?: string | null
  contract_phone?: string | null
  contract_email?: string | null
  contract_foro_cidade?: string | null
  contract_foro_estado?: string | null
  contract_rep_nome?: string | null
  contract_rep_cpf?: string | null
  contract_signature_url?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // 1. Tenta atualizar com todas as colunas diretamente na tabela stores
  const { error: fullUpdateError } = await supabase
    .from('stores')
    .update({
      name: payload.name,
      slogan: payload.slogan || null,
      address: payload.address || null,
      opening_hours: payload.opening_hours || null,
      phone: payload.phone || null,
      instagram: payload.instagram || null,
      whatsapp: payload.whatsapp,
      whatsapp_financeiro: payload.whatsapp_financeiro || null,
      email: payload.email || null,
      maps_embed_url: payload.maps_embed_url || null,
      logo_url: payload.logo_url,
      banner_url: payload.banner_url,
      banner_mobile_url: payload.banner_mobile_url || null,
      contract_razao_social: payload.contract_razao_social || null,
      contract_cnpj: payload.contract_cnpj || null,
      contract_address: payload.contract_address || null,
      contract_phone: payload.contract_phone || null,
      contract_email: payload.contract_email || null,
      contract_foro_cidade: payload.contract_foro_cidade || null,
      contract_foro_estado: payload.contract_foro_estado || null,
      contract_rep_nome: payload.contract_rep_nome || null,
      contract_rep_cpf: payload.contract_rep_cpf || null,
      contract_signature_url: payload.contract_signature_url || null,
    })
    .eq('id', payload.store_id)

  // Se atualizou com sucesso, garante também cópia no estado estendido
  if (!fullUpdateError) {
    await persistExtendedContacts(payload.slug, {
      phone: payload.phone,
      instagram: payload.instagram,
    })
    return { success: true }
  }

  // 2. Se alguma coluna opcional falhar (ex: migration pendente), tenta o fallback com campos essenciais
  const { error: fallbackError } = await supabase
    .from('stores')
    .update({
      name: payload.name,
      slogan: payload.slogan || null,
      address: payload.address || null,
      opening_hours: payload.opening_hours || null,
      whatsapp: payload.whatsapp,
      whatsapp_financeiro: payload.whatsapp_financeiro || null,
      logo_url: payload.logo_url,
      banner_url: payload.banner_url,
      banner_mobile_url: payload.banner_mobile_url || null,
    })
    .eq('id', payload.store_id)

  if (fallbackError) {
    return { success: false, error: fallbackError.message }
  }

  // 3. Salva os contatos estendidos no estado do sistema para persistência garantida
  await persistExtendedContacts(payload.slug, {
    phone: payload.phone,
    instagram: payload.instagram,
  })

  return { success: true }
}

async function persistExtendedContacts(slug: string, contacts: { phone?: string | null; instagram?: string | null }) {
  try {
    const supabase = createAdminClient()
    const { data: erpRow } = await supabase
      .from('stores')
      .select('slogan')
      .eq('slug', '__erp_system_state__')
      .maybeSingle()

    if (erpRow?.slogan) {
      const state = JSON.parse(erpRow.slogan)
      state.store_contacts = state.store_contacts || {}
      state.store_contacts[slug.toLowerCase()] = {
        phone: contacts.phone || null,
        instagram: contacts.instagram || null,
      }
      await supabase
        .from('stores')
        .update({ slogan: JSON.stringify(state) })
        .eq('slug', '__erp_system_state__')
    }
  } catch (err) {
    console.error('Erro ao persistir contatos estendidos no estado do ERP:', err)
  }
}
