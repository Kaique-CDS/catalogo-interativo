import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'
import { deleteCloudinaryAsset } from '@/lib/cloudinary'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import { revalidatePath } from 'next/cache'
import type { TenantBanner } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/banners?slug=...&device=...
 * Retorna os banners do tenant com ordenação e retrocompatibilidade com stores.banner_url
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const store_id = searchParams.get('store_id')
    const device = searchParams.get('device') // 'desktop' | 'mobile' | null (ambos)
    const adminMode = searchParams.get('admin') === 'true'

    if (!slug && !store_id) {
      return NextResponse.json({ error: 'slug ou store_id é obrigatório.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const finalStoreId = store_id || (await resolveStoreId(supabase, slug!))

    if (!finalStoreId) {
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 })
    }

    let query = supabase
      .from('tenant_banners')
      .select('*')
      .eq('tenant_id', finalStoreId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!adminMode) {
      query = query.eq('is_active', true)
    }

    if (device && (device === 'desktop' || device === 'mobile')) {
      query = query.eq('device', device)
    }

    const { data, error } = await query

    // Se a tabela ainda não foi populada ou houve erro de tabela inexistente, usamos fallback da tabela stores
    if (error) {
      console.warn('Aviso ao consultar tenant_banners:', error.message)
    }

    let banners: TenantBanner[] = (data as TenantBanner[]) || []

    // Retrocompatibilidade garantida: se não há banners cadastrados na nova tabela,
    // verifica se existem banners nas colunas antigas da tabela stores
    if (banners.length === 0) {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, banner_url, banner_mobile_url')
        .eq('id', finalStoreId)
        .maybeSingle()

      if (storeData) {
        if (storeData.banner_url && (!device || device === 'desktop')) {
          banners.push({
            id: 'legacy-desktop',
            tenant_id: storeData.id,
            device: 'desktop',
            media_type: 'image',
            url: storeData.banner_url,
            public_id: null,
            poster_url: null,
            link_url: null,
            sort_order: 0,
            is_active: true,
            created_at: new Date().toISOString(),
          })
        }
        if (storeData.banner_mobile_url && (!device || device === 'mobile')) {
          banners.push({
            id: 'legacy-mobile',
            tenant_id: storeData.id,
            device: 'mobile',
            media_type: 'image',
            url: storeData.banner_mobile_url,
            public_id: null,
            poster_url: null,
            link_url: null,
            sort_order: 0,
            is_active: true,
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    return NextResponse.json(banners, { status: 200 })
  } catch (err: any) {
    console.error('Erro em GET /api/banners:', err)
    return NextResponse.json({ error: 'Erro interno ao consultar banners.' }, { status: 500 })
  }
}

/**
 * POST /api/banners
 * Adiciona um novo banner na tabela tenant_banners
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, store_id, device, media_type, url, public_id, poster_url, link_url, sort_order, is_active } = body

    if ((!slug && !store_id) || !device || !url) {
      return NextResponse.json({ error: 'Dados incompletos para criação do banner.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const finalStoreId = store_id || (await resolveStoreId(supabase, slug))

    if (!finalStoreId) {
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 })
    }

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    // Calcula sort_order automático se não fornecido
    let order = Number(sort_order)
    if (isNaN(order)) {
      const { count } = await supabase
        .from('tenant_banners')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', finalStoreId)
        .eq('device', device)
      order = count || 0
    }

    const { data: newBanner, error } = await supabase
      .from('tenant_banners')
      .insert([
        {
          tenant_id: finalStoreId,
          device,
          media_type: media_type || 'image',
          url,
          public_id: public_id || null,
          poster_url: poster_url || null,
          link_url: link_url || null,
          sort_order: order,
          is_active: is_active !== undefined ? is_active : true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir tenant_banner:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mantém retrocompatibilidade atualizando coluna antiga da tabela stores se for o 1º banner
    if (order === 0) {
      const field = device === 'desktop' ? 'banner_url' : 'banner_mobile_url'
      try {
        await supabase.from('stores').update({ [field]: url }).eq('id', finalStoreId)
      } catch {}
    }

    if (slug) {
      try { revalidatePath(`/${slug}`) } catch {}
    }

    return NextResponse.json(newBanner, { status: 201 })
  } catch (err: any) {
    console.error('Erro em POST /api/banners:', err)
    return NextResponse.json({ error: 'Erro interno ao criar banner.' }, { status: 500 })
  }
}

/**
 * PUT /api/banners
 * Atualização: reordenação em lote ou edição de campos de um banner individual
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, items, bannerId, updates } = body

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // 1. Reordenação em lote: { items: [{ id, sort_order }] }
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id && typeof item.sort_order === 'number') {
          await supabase
            .from('tenant_banners')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
        }
      }

      if (slug) {
        try { revalidatePath(`/${slug}`) } catch {}
      }
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // 2. Atualização individual: { bannerId, updates: { is_active, link_url, etc. } }
    if (bannerId && updates) {
      const allowedUpdates: Record<string, any> = {}
      if (typeof updates.is_active === 'boolean') allowedUpdates.is_active = updates.is_active
      if (updates.link_url !== undefined) allowedUpdates.link_url = updates.link_url || null
      if (typeof updates.sort_order === 'number') allowedUpdates.sort_order = updates.sort_order

      const { data: updated, error } = await supabase
        .from('tenant_banners')
        .update(allowedUpdates)
        .eq('id', bannerId)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (slug) {
        try { revalidatePath(`/${slug}`) } catch {}
      }
      return NextResponse.json(updated, { status: 200 })
    }

    return NextResponse.json({ error: 'Formato de payload inválido para atualização.' }, { status: 400 })
  } catch (err: any) {
    console.error('Erro em PUT /api/banners:', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar banners.' }, { status: 500 })
  }
}

/**
 * DELETE /api/banners?id=...&slug=...
 * Exclui o banner da tabela e limpa os arquivos no Cloudinary (imagem/vídeo e poster)
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (!id) {
      return NextResponse.json({ error: 'ID do banner é obrigatório.' }, { status: 400 })
    }

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // 1. Busca dados do banner para saber o public_id e tipo de mídia
    const { data: banner } = await supabase
      .from('tenant_banners')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    // 2. Remove do banco de dados
    const { error: dbError } = await supabase
      .from('tenant_banners')
      .delete()
      .eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 3. Apaga do Cloudinary com o resource_type correto
    if (banner?.public_id) {
      const resourceType = banner.media_type === 'video' ? 'video' : 'image'
      await deleteCloudinaryAsset(banner.public_id, resourceType)
    }

    // 4. Se a vitrine estava usando esse banner como primeiro, atualiza com o próximo ativo
    if (banner?.tenant_id && banner?.device) {
      const { data: nextBanner } = await supabase
        .from('tenant_banners')
        .select('url')
        .eq('tenant_id', banner.tenant_id)
        .eq('device', banner.device)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle()

      const field = banner.device === 'desktop' ? 'banner_url' : 'banner_mobile_url'
      try {
        await supabase
          .from('stores')
          .update({ [field]: nextBanner?.url || null })
          .eq('id', banner.tenant_id)
      } catch {}
    }

    if (slug) {
      try { revalidatePath(`/${slug}`) } catch {}
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Erro em DELETE /api/banners:', err)
    return NextResponse.json({ error: 'Erro interno ao excluir banner.' }, { status: 500 })
  }
}
