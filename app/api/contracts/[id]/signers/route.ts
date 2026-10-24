import { NextRequest, NextResponse } from 'next/server'
import { setupContractSigners } from '@/lib/contracts/signature-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    let contract: any = null

    try {
      const { data } = await supabase
        .from('contracts')
        .select('*, stores(slug), contract_signers(*)')
        .eq('id', id)
        .maybeSingle()
      if (data) {
        contract = {
          ...data,
          signers: data.contract_signers,
        }
      }
    } catch (err: any) {
      console.error('Erro na consulta de signatários:', err?.message)
    }

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contrato não encontrado.' }, { status: 404 })
    }

    const storeSlug = (contract.stores as any)?.slug || contract.tenant_id
    if (storeSlug && !canAccessTenant(auth, storeSlug)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado: você não tem permissão para esta loja.' },
        { status: 403 }
      )
    }

    // Se ainda não tiver signatários, gera os tokens automaticamente
    if (!contract.signers || contract.signers.length === 0) {
      const originUrl = req.nextUrl.origin || 'http://localhost:3000'
      const signersInfo = await setupContractSigners({
        contractId: contract.id,
        buyer: {
          name: contract.buyer_data?.name || 'Comprador',
          cpf_cnpj: contract.buyer_data?.cpf_cnpj || '',
          email: contract.buyer_data?.email || '',
          phone: contract.buyer_data?.phone || '',
        },
        store: {
          name: contract.seller_data?.name || 'Loja',
          contract_rep_nome: contract.seller_data?.rep_name,
          contract_rep_cpf: contract.seller_data?.rep_cpf,
          contract_cnpj: contract.seller_data?.cnpj,
          email: contract.seller_data?.email,
          whatsapp: contract.seller_data?.phone,
        },
        slug: storeSlug || 'loja',
        originUrl,
      })

      return NextResponse.json({
        success: true,
        signers: contract.signers || [],
        tokens: signersInfo,
      })
    }

    return NextResponse.json({
      success: true,
      signers: contract.signers || [],
    })
  } catch (err: any) {
    console.error('Erro em GET /api/contracts/[id]/signers:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao carregar signatários.' },
      { status: 500 }
    )
  }
}
