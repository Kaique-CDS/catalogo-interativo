import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'
import { deleteCloudinaryAsset } from '@/lib/cloudinary'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import { revalidatePath } from 'next/cache'
import type { TenantCustomerPhoto } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/customer-photos?slug=...&admin=true
 * Retorna as fotos de clientes ordenadas.
 * No modo público (vitrine), retorna apenas is_active = true.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const store_id = searchParams.get('store_id')
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
      .from('tenant_customer_photos')
      .select('*')
      .eq('tenant_id', finalStoreId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!adminMode) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Aviso ao consultar tenant_customer_photos:', error.message)
      return NextResponse.json([], { status: 200 })
    }

    const photos: TenantCustomerPhoto[] = (data as TenantCustomerPhoto[]) || []
    return NextResponse.json(photos, { status: 200 })
  } catch (err: any) {
    console.error('Erro em GET /api/customer-photos:', err)
    return NextResponse.json({ error: 'Erro interno ao consultar fotos de clientes.' }, { status: 500 })
  }
}

/**
 * POST /api/customer-photos
 * Adiciona uma nova foto de cliente
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, store_id, url, public_id, caption, sort_order, is_active } = body

    if ((!slug && !store_id) || !url) {
      return NextResponse.json({ error: 'Dados incompletos para criação da foto.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const finalStoreId = store_id || (await resolveStoreId(supabase, slug))

    if (!finalStoreId) {
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 })
    }

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    let order = Number(sort_order)
    if (isNaN(order)) {
      const { count } = await supabase
        .from('tenant_customer_photos')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', finalStoreId)
      order = count || 0
    }

    const { data: newPhoto, error } = await supabase
      .from('tenant_customer_photos')
      .insert([
        {
          tenant_id: finalStoreId,
          url,
          public_id: public_id || null,
          caption: caption ? String(caption).trim() : null,
          sort_order: order,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir foto em tenant_customer_photos:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (slug) {
      try { revalidatePath(`/${slug}`) } catch {}
      try { revalidatePath(`/${slug}/admin/configuracoes`) } catch {}
    }

    return NextResponse.json(newPhoto, { status: 201 })
  } catch (err: any) {
    console.error('Erro em POST /api/customer-photos:', err)
    return NextResponse.json({ error: 'Erro interno ao salvar foto do cliente.' }, { status: 500 })
  }
}

/**
 * PUT /api/customer-photos
 * Atualização: reordenação em lote ou edição de foto individual (legenda, status, ordem)
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, items, photoId, updates } = body

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // 1. Reordenação em lote: { items: [{ id, sort_order }] }
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id && typeof item.sort_order === 'number') {
          await supabase
            .from('tenant_customer_photos')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
        }
      }

      if (slug) {
        try { revalidatePath(`/${slug}`) } catch {}
      }
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // 2. Atualização individual: { photoId, updates: { caption, is_active, sort_order } }
    if (photoId && updates) {
      const allowedUpdates: Record<string, any> = {}
      if (typeof updates.is_active === 'boolean') allowedUpdates.is_active = updates.is_active
      if (updates.caption !== undefined) {
        allowedUpdates.caption = updates.caption ? String(updates.caption).trim() : null
      }
      if (typeof updates.sort_order === 'number') allowedUpdates.sort_order = updates.sort_order

      const { data: updated, error } = await supabase
        .from('tenant_customer_photos')
        .update(allowedUpdates)
        .eq('id', photoId)
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
    console.error('Erro em PUT /api/customer-photos:', err)
    return NextResponse.json({ error: 'Erro interno ao atualizar foto do cliente.' }, { status: 500 })
  }
}

/**
 * DELETE /api/customer-photos?id=...&slug=...
 * Exclui a foto do cliente e apaga o arquivo associado no Cloudinary
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const photoId = searchParams.get('id')
    const slug = searchParams.get('slug')

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto é obrigatório.' }, { status: 400 })
    }

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // 1. Busca os metadados da foto para obter o public_id do Cloudinary
    const { data: photoData, error: fetchErr } = await supabase
      .from('tenant_customer_photos')
      .select('id, public_id, tenant_id')
      .eq('id', photoId)
      .maybeSingle()

    if (fetchErr || !photoData) {
      return NextResponse.json({ error: 'Foto não encontrada.' }, { status: 404 })
    }

    // 2. Exclui o arquivo no Cloudinary
    if (photoData.public_id) {
      try {
        await deleteCloudinaryAsset(photoData.public_id, 'image')
      } catch (err) {
        console.warn('Aviso: erro ao excluir foto no Cloudinary:', err)
      }
    }

    // 3. Exclui o registro no Supabase
    const { error: delErr } = await supabase
      .from('tenant_customer_photos')
      .delete()
      .eq('id', photoId)

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    if (slug) {
      try { revalidatePath(`/${slug}`) } catch {}
      try { revalidatePath(`/${slug}/admin/configuracoes`) } catch {}
    }

    return NextResponse.json({ success: true, message: 'Foto excluída com sucesso.' }, { status: 200 })
  } catch (err: any) {
    console.error('Erro em DELETE /api/customer-photos:', err)
    return NextResponse.json({ error: 'Erro interno ao excluir foto do cliente.' }, { status: 500 })
  }
}
