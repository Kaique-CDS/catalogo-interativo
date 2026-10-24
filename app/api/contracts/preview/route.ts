import { NextRequest, NextResponse } from 'next/server'
import { generateVehicleSaleContractPdf, generatePowerOfAttorneyPdf } from '@/lib/contracts/pdf-generator'
import { getStoreContractSettings, isContractsEnabled } from '@/lib/contracts/module-guard'
import { validateRequestAuth, canAccessTenant } from '@/lib/security/auth-guard'
import { DEFAULT_SALE_CLAUSES } from '@/lib/contracts/utils'
import { parseBrlCurrency } from '@/lib/normalization'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const auth = await validateRequestAuth(req)
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

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
      additional_powers,
      validity_days,
      delivery_days,
    } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug é obrigatório.' }, { status: 400 })
    }

    if (!canAccessTenant(auth, slug)) {
      return NextResponse.json(
        { error: 'Acesso negado: você não tem permissão para visualizar contratos desta loja.' },
        { status: 403 }
      )
    }

    const enabled = await isContractsEnabled(slug)
    if (!enabled) {
      return NextResponse.json({ error: 'Módulo de contratos desativado.' }, { status: 403 })
    }

    const { store } = await getStoreContractSettings(slug)
    const isPoa = type === 'procuracao'

    let pdfBytes: Uint8Array

    if (isPoa) {
      const activeGrantor = grantor || buyer || {
        name: 'OUTORGANTE MODELO',
        cpf_cnpj: '000.000.000-00',
        address: 'Endereço não informado',
        city: store.contract_foro_cidade || 'São Paulo',
        state: store.contract_foro_estado || 'SP',
      }
      const activeGrantee = grantee || {
        name: store.contract_razao_social || store.name,
        cpf_cnpj: store.contract_cnpj || '00.000.000/0001-00',
        address: store.contract_address || store.address || '',
        city: store.contract_foro_cidade || 'São Paulo',
        state: store.contract_foro_estado || 'SP',
      }
      const activeVehicle = vehicle || {
        brand: 'MARCA',
        model: 'MODELO',
        year_fab: new Date().getFullYear(),
        year_model: new Date().getFullYear(),
        plate: 'ABC-1234',
        chassis: '9BWZZZ00000000000',
        renavam: '00000000000',
        color: 'Branco',
        fuel: 'Flex',
      }

      pdfBytes = await generatePowerOfAttorneyPdf({
        number: 0,
        store,
        grantor: activeGrantor as any,
        grantee: activeGrantee as any,
        vehicle: activeVehicle as any,
        validityDays: Number(validity_days) || 365,
        additionalPowers: additional_powers || '',
        observations: notes || '',
        isPrintVersion: false,
        isFinalSigned: false,
        signers: [],
      })
    } else {
      const activeBuyer = buyer || {
        name: 'COMPRADOR MODELO',
        cpf_cnpj: '000.000.000-00',
        address: 'Endereço não informado',
        city: store.contract_foro_cidade || 'São Paulo',
        state: store.contract_foro_estado || 'SP',
      }
      const activeVehicle = vehicle || {
        brand: 'MARCA',
        model: 'MODELO',
        year_fab: new Date().getFullYear(),
        year_model: new Date().getFullYear(),
        plate: 'ABC-1234',
        chassis: '9BWZZZ00000000000',
        renavam: '00000000000',
        color: 'Branco',
        fuel: 'Flex',
      }
      const activeClauses = clauses && clauses.length > 0 ? clauses : DEFAULT_SALE_CLAUSES

      const normalizedFinancial = financial ? {
        ...financial,
        total_amount: parseBrlCurrency(financial.total_amount),
        down_payment: parseBrlCurrency(financial.down_payment),
        transfer_fee_amount: parseBrlCurrency(financial.transfer_fee_amount || financial.transfer_fee),
        installments: Array.isArray(financial.installments) ? financial.installments.map((inst: any) => ({
          ...inst,
          amount: parseBrlCurrency(inst.amount),
        })) : [],
      } : {
        total_amount: 0,
        down_payment: 0,
        transfer_fee_amount: 0,
        installments: [],
      }

      pdfBytes = await generateVehicleSaleContractPdf({
        number: 0,
        store,
        buyer: activeBuyer as any,
        vehicle: activeVehicle as any,
        financial: normalizedFinancial as any,
        clauses: activeClauses as any,
        isPrintVersion: false,
        isFinalSigned: false,
        signers: [],
        deliveryDays: String(delivery_days || 5),
      } as any)
    }

    const buffer = Buffer.from(pdfBytes)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Previa-Contrato.pdf"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    })
  } catch (err: any) {
    console.error('Erro em POST /api/contracts/preview:', err)
    return NextResponse.json(
      { error: err.message || 'Falha ao compilar prévia do PDF.' },
      { status: 500 }
    )
  }
}
