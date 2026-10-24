import { NextRequest, NextResponse } from 'next/server'
import { getCloudinary } from '@/lib/cloudinary'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractCloudinaryPublicId, type AssetType } from '@/lib/image-specs'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'

export const dynamic = 'force-dynamic'

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

    const body = await req.json()
    const { store_id, slug, asset_type, public_id, current_url } = body as {
      store_id: string
      slug: string
      asset_type: AssetType
      public_id?: string
      current_url?: string
    }

    if (!store_id || !slug || !asset_type) {
      return NextResponse.json(
        { error: 'store_id, slug e asset_type são obrigatórios.' },
        { status: 400 }
      )
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para remover assets de outra loja.' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()

    // 1. Atualiza primeiro o banco de dados
    const updatePayload: Record<string, null> = {}
    if (asset_type === 'logo') updatePayload.logo_url = null
    else if (asset_type === 'banner_desktop') updatePayload.banner_url = null
    else if (asset_type === 'banner_mobile') updatePayload.banner_mobile_url = null
    else if (asset_type === 'signature') updatePayload.contract_signature_url = null

    const { error: dbError } = await supabase
      .from('stores')
      .update(updatePayload)
      .eq('id', store_id)

    if (dbError) {
      console.error('Falha ao atualizar banco antes de deletar imagem:', dbError)
      return NextResponse.json(
        { error: `Erro no banco ao remover asset: ${dbError.message}` },
        { status: 500 }
      )
    }

    // 2. SÓ DEPOIS de confirmar o banco com sucesso, remove do Cloudinary
    const targetPublicId = public_id || extractCloudinaryPublicId(current_url)

    if (targetPublicId) {
      try {
        await cloudinary.uploader.destroy(targetPublicId)
      } catch (cloudErr) {
        console.warn('Aviso: erro ao apagar asset do Cloudinary:', cloudErr)
      }
    }

    try {
      revalidatePath(`/${slug}`)
      revalidatePath(`/${slug}/quem-somos`)
    } catch {}

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Erro em POST /api/store-assets/delete:', err)
    return NextResponse.json(
      { error: err?.message || 'Erro ao remover asset.' },
      { status: 500 }
    )
  }
}
