import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStoreContractSettings, isContractsEnabled } from '@/lib/contracts/module-guard'
import {
  type BuyerData,
  type VehicleData,
  type FinancialData,
} from '@/lib/contracts/pdf-generator'
import { type ContractClause, DEFAULT_SALE_CLAUSES } from '@/lib/contracts/utils'

import { saveLocalContract, getLocalContracts, getNextLocalContractNumber } from '@/lib/contracts/cache'
import { setupContractSigners } from '@/lib/contracts/signature-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getRequestIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const status = searchParams.get('status')
    const q = searchParams.get('q')

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    let dbContracts: any[] = []
    try {
      let query = supabase
        .from('contracts')
        .select('*')
        .eq('store_id', store.id)
        .is('deleted_at', null)
        .order('number', { ascending: false })

      if (status && status !== 'todos') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (!error && data) {
        dbContracts = data
      }
    } catch {
      // Ignora erro e usa cache local
    }

    // Mescla com cache local para suportar testes antes de migrations
    const localContracts = getLocalContracts(store.id)
    const allContractsMap = new Map<string, any>()

    for (const c of dbContracts) {
      allContractsMap.set(c.id, c)
    }
    for (const c of localContracts) {
      if (!allContractsMap.has(c.id)) {
        if (!status || status === 'todos' || c.status === status) {
          allContractsMap.set(c.id, c)
        }
      }
    }

    const merged = Array.from(allContractsMap.values()).sort(
      (a, b) => (b.number || 0) - (a.number || 0)
    )

    // Filtro em memória para busca textual
    let filtered = merged
    if (q && q.trim()) {
      const term = q.trim().toLowerCase()
      filtered = filtered.filter((c: any) => {
        const buyerName = String(c.buyer_data?.name || '').toLowerCase()
        const plate = String(c.vehicle_data?.plate || '').toLowerCase()
        const model = String(c.vehicle_data?.model || '').toLowerCase()
        return buyerName.includes(term) || plate.includes(term) || model.includes(term)
      })
    }

    return NextResponse.json({ contracts: filtered })
  } catch (err: any) {
    console.error('Error in GET /api/contracts:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      slug,
      type = 'venda_veiculo',
      buyer,
      grantor,
      grantee,
      vehicle,
      financial,
      clauses,
      notes,
      vehicle_id,
      status: reqStatus,
      crlv_data,
      crlv_file_url,
      validity_days,
      additional_powers,
    } = body as {
      slug: string
      type?: 'venda_veiculo' | 'venda' | 'procuracao'
      buyer?: BuyerData
      grantor?: any
      grantee?: any
      vehicle: VehicleData
      financial?: FinancialData
      clauses?: ContractClause[]
      notes?: string
      vehicle_id?: string
      status?: string
      crlv_data?: any
      crlv_file_url?: string
      validity_days?: number
      additional_powers?: string
    }

    if (!slug) {
      return NextResponse.json({ error: 'Slug da loja é obrigatório.' }, { status: 400 })
    }

    const isPoa = type === 'procuracao'

    if (isPoa) {
      const activeGrantor = grantor || buyer
      if (!activeGrantor || !activeGrantor.name || !activeGrantor.cpf_cnpj) {
        return NextResponse.json({ error: 'Dados do Outorgante incompletos.' }, { status: 400 })
      }
      if (!grantee || !grantee.name || !grantee.cpf_cnpj) {
        return NextResponse.json({ error: 'Dados do Outorgado incompletos.' }, { status: 400 })
      }
    } else {
      if (!buyer || !buyer.name || !buyer.cpf_cnpj) {
        return NextResponse.json({ error: 'Dados do comprador incompletos.' }, { status: 400 })
      }
      if (!financial || !financial.total_amount) {
        return NextResponse.json({ error: 'Valor total da venda é obrigatório.' }, { status: 400 })
      }
    }

    if (!vehicle || !vehicle.brand || !vehicle.model || !vehicle.plate) {
      return NextResponse.json({ error: 'Dados do veículo incompletos.' }, { status: 400 })
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const supabase = createAdminClient()

    // 1. GERAÇÃO DE NÚMERO SEQUENCIAL ATÔMICO
    let nextNumber = 1
    const counterType = isPoa ? 'procuracao' : 'venda_veiculo'
    try {
      const { data: numData, error: rpcErr } = await supabase.rpc('get_next_contract_number', {
        p_store_id: store.id,
        p_type: counterType,
      })
      if (!rpcErr && numData) {
        nextNumber = Number(numData)
      } else {
        // Fallback local ou via query na tabela
        const { data: maxRow } = await supabase
          .from('contracts')
          .select('number')
          .eq('store_id', store.id)
          .eq('type', counterType)
          .order('number', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (maxRow?.number) {
          nextNumber = Number(maxRow.number) + 1
        } else {
          nextNumber = isPoa
            ? getNextLocalContractNumber('procuracao', store.id)
            : getNextLocalContractNumber('venda_veiculo', store.id)
        }
      }
    } catch {
      nextNumber = isPoa
        ? getNextLocalContractNumber('procuracao', store.id)
        : getNextLocalContractNumber('venda_veiculo', store.id)
    }

    const contractClauses = clauses && clauses.length > 0 ? clauses : DEFAULT_SALE_CLAUSES

    const defaultSellerData = {
      name: store.contract_razao_social || store.name,
      cnpj: store.contract_cnpj || null,
      address: store.contract_address || store.address || null,
      phone: store.contract_phone || store.whatsapp || null,
      email: store.contract_email || store.email || null,
      rep_name: store.contract_rep_nome || null,
      rep_cpf: store.contract_rep_cpf || null,
      foro_cidade: store.contract_foro_cidade || 'São Paulo',
      foro_estado: store.contract_foro_estado || 'SP',
    }

    const initialStatus = reqStatus || 'rascunho'

    // 2. INSERE O CONTRATO OU PROCURAÇÃO NA TABELA
    const title = isPoa
      ? `Procuração Nº ${nextNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
      : `Contrato de Venda Nº ${nextNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`

    const insertPayload: any = {
      store_id: store.id,
      type: isPoa ? 'procuracao' : 'venda_veiculo',
      number: nextNumber,
      title,
      status: initialStatus,
      buyer_type: isPoa ? (grantor?.type || buyer?.type || 'pf') : (buyer?.type || 'pf'),
      buyer_data: isPoa ? (grantor || buyer) : buyer,
      seller_data: isPoa ? (grantee || defaultSellerData) : defaultSellerData,
      vehicle_data: vehicle,
      vehicle_id: vehicle_id || null,
      financial_data: isPoa ? null : financial,
      clauses: isPoa ? [] : contractClauses,
      validity_days: isPoa ? (validity_days || 365) : null,
      additional_powers: isPoa ? (additional_powers || null) : null,
      notes: notes || null,
      crlv_data: crlv_data || null,
      crlv_file_url: crlv_file_url || null,
      pdf_draft_url: `/${slug}/admin/contratos/pdf?id=${nextNumber}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: createdContract } = await supabase
      .from('contracts')
      .insert([insertPayload])
      .select('*')
      .single()

    const contractResult = createdContract || { ...insertPayload, id: `local-${nextNumber}` }

    // Salva no cache local para resiliência e suporte a testes locais
    saveLocalContract(contractResult)

    // Configura os signatários (Comprador/Vendedor ou Outorgante/Outorgado) e gera tokens seguros
    let signersInfo = null
    try {
      const originUrl = req.nextUrl.origin || 'http://localhost:3000'
      signersInfo = await setupContractSigners({
        contractId: contractResult.id,
        type: isPoa ? 'procuracao' : 'venda',
        grantor: isPoa ? (grantor || buyer) : undefined,
        grantee: isPoa ? (grantee || defaultSellerData) : undefined,
        buyer: !isPoa && buyer ? {
          name: buyer.name,
          cpf_cnpj: buyer.cpf_cnpj,
          email: buyer.email || '',
          phone: buyer.phone || '',
        } : undefined,
        store: {
          name: store.name,
          contract_rep_nome: store.contract_rep_nome || undefined,
          contract_rep_cpf: store.contract_rep_cpf || undefined,
          contract_cnpj: store.contract_cnpj || undefined,
          email: store.contract_email || store.email || undefined,
          whatsapp: store.contract_phone || store.whatsapp || undefined,
        },
        slug,
        originUrl,
      })
    } catch (sgnErr) {
      console.warn('Erro ao configurar signatários do contrato:', sgnErr)
    }


    // 3. REGISTRA EVENTO DE AUDITORIA
    try {
      const party1Name = isPoa ? (grantor?.name || buyer?.name || 'Outorgante') : (buyer?.name || 'Comprador')
      const docDesc = isPoa
        ? `Procuração Nº ${nextNumber} criada com sucesso por ${store.name}`
        : `Contrato de Venda Nº ${nextNumber} criado com sucesso por ${store.name}`

      await supabase.from('contract_events').insert([
        {
          contract_id: contractResult.id,
          event_type: 'created',
          description: docDesc,
          ip: getRequestIp(req),
          user_agent: req.headers.get('user-agent') || 'Browser',
          metadata: {
            party_name: party1Name,
            vehicle_plate: vehicle.plate,
            total_amount: financial?.total_amount || 0,
          },
        },
      ])
    } catch (evErr) {
      console.warn('Erro ao registrar evento de contrato:', evErr)
    }


    return NextResponse.json({
      success: true,
      contract: contractResult,
      contract_id: contractResult.id,
      number: nextNumber,
      signers: signersInfo,
    })
  } catch (err: any) {
    console.error('Error in POST /api/contracts:', err)
    return NextResponse.json({ error: err.message || 'Erro interno ao criar contrato' }, { status: 500 })
  }
}
