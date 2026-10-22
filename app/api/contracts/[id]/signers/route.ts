import { NextRequest, NextResponse } from 'next/server'
import { getLocalContractById } from '@/lib/contracts/cache'
import { setupContractSigners } from '@/lib/contracts/signature-service'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    let contract = getLocalContractById(id)

    if (!contract && !id.startsWith('local-')) {
      try {
        const supabase = createAdminClient()
        const { data } = await supabase
          .from('contracts')
          .select('*, contract_signers(*)')
          .eq('id', id)
          .maybeSingle()
        if (data) {
          contract = {
            ...data,
            signers: data.contract_signers,
          }
        }
      } catch {}
    }

    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contrato não encontrado.' }, { status: 404 })
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
        slug: 'loja',
        originUrl,
      })

      contract = getLocalContractById(id) || contract
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
