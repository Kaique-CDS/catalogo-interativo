import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, resolveStoreId } from '@/lib/supabase/admin'
import { deleteCloudinaryAsset } from '@/lib/cloudinary'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/welcome-video
 * Atualiza as configurações do vídeo institucional da loja
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { slug, store_id, welcome_video_url, welcome_video_public_id, welcome_video_poster_url, welcome_video_enabled } = body

    if (!slug && !store_id) {
      return NextResponse.json({ error: 'slug ou store_id é obrigatório.' }, { status: 400 })
    }

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const finalStoreId = store_id || (await resolveStoreId(supabase, slug))

    const updatePayload: Record<string, any> = {}
    if (welcome_video_url !== undefined) updatePayload.welcome_video_url = welcome_video_url
    if (welcome_video_public_id !== undefined) updatePayload.welcome_video_public_id = welcome_video_public_id
    if (welcome_video_poster_url !== undefined) updatePayload.welcome_video_poster_url = welcome_video_poster_url
    if (typeof welcome_video_enabled === 'boolean') updatePayload.welcome_video_enabled = welcome_video_enabled

    const { data: updated, error } = await supabase
      .from('stores')
      .update(updatePayload)
      .eq('id', finalStoreId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar vídeo institucional no banco:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (slug) {
      try { revalidatePath(`/${slug}`) } catch {}
    }

    return NextResponse.json(updated, { status: 200 })
  } catch (err: any) {
    console.error('Erro em PUT /api/welcome-video:', err)
    return NextResponse.json({ error: 'Erro interno ao salvar vídeo institucional.' }, { status: 500 })
  }
}

/**
 * DELETE /api/welcome-video?slug=...
 * Remove o vídeo institucional da loja e apaga o arquivo do Cloudinary
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const store_id = searchParams.get('store_id')

    if (!slug && !store_id) {
      return NextResponse.json({ error: 'slug ou store_id é obrigatório.' }, { status: 400 })
    }

    if (slug && !canAccessTenant(auth, slug)) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const finalStoreId = store_id || (await resolveStoreId(supabase, slug!))

    // 1. Busca public_id atual
    const { data: store } = await supabase
      .from('stores')
      .select('id, welcome_video_public_id')
      .eq('id', finalStoreId)
      .maybeSingle()

    // 2. Limpa colunas no banco
    const { error: dbError } = await supabase
      .from('stores')
      .update({
        welcome_video_url: null,
        welcome_video_public_id: null,
        welcome_video_poster_url: null,
        welcome_video_enabled: false,
      })
      .eq('id', finalStoreId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // 3. Deleta arquivo de vídeo do Cloudinary
    if (store?.welcome_video_public_id) {
      await deleteCloudinaryAsset(store.welcome_video_public_id, 'video')
    }

    if (slug) {
      try { revalidatePath(`/${slug}`) } catch {}
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Erro em DELETE /api/welcome-video:', err)
    return NextResponse.json({ error: 'Erro interno ao remover vídeo institucional.' }, { status: 500 })
  }
}
