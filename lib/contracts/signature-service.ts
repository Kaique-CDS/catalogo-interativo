import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getLocalContractById,
  saveLocalContract,
  getLocalSignerByTokenHash,
  updateLocalSigner,
  addLocalContractEvent,
} from '@/lib/contracts/cache'
import {
  sendSigningLinkEmail,
  sendOtpCodeEmail,
  sendContractCompletedEmail,
} from '@/lib/contracts/mailer'
import {
  generateContractPdf,
  generatePowerOfAttorneyPdf,
  type ContractSignerEvidence,
} from '@/lib/contracts/pdf-generator'

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex')
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Cria ou recupera os signatários de um contrato (Comprador e Loja) gerando tokens únicos.
 */
export async function setupContractSigners({
  contractId,
  buyer,
  store,
  slug,
  expiresInDays = 7,
  originUrl = 'http://localhost:3000',
  type = 'venda',
  grantor,
  grantee,
}: {
  contractId: string
  buyer?: { name: string; cpf_cnpj: string; email: string; phone: string }
  store: { name: string; contract_rep_nome?: string; contract_rep_cpf?: string; contract_cnpj?: string; email?: string; whatsapp?: string }
  slug: string
  expiresInDays?: number
  originUrl?: string
  type?: 'venda' | 'procuracao' | string
  grantor?: { name: string; cpf_cnpj: string; email: string; phone: string }
  grantee?: { name: string; cpf_cnpj: string; email: string; phone: string }
}): Promise<{
  buyerToken: string
  sellerToken: string
  buyerSigningUrl: string
  sellerSigningUrl: string
  grantorSigningUrl?: string
  granteeSigningUrl?: string
}> {
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

  const isPoa = type === 'procuracao'

  const party1 = isPoa && grantor ? grantor : (buyer || { name: 'Comprador', cpf_cnpj: '', email: '', phone: '' })
  const party2 = isPoa && grantee ? grantee : {
    name: store.contract_rep_nome || store.name,
    cpf_cnpj: store.contract_rep_cpf || store.contract_cnpj || '',
    email: store.email || '',
    phone: store.whatsapp || '',
  }

  const role1 = isPoa ? 'outorgante' : 'buyer'
  const role2 = isPoa ? 'outorgado' : 'seller'

  const token1Raw = generateSecureToken()
  const token1Hash = hashToken(token1Raw)

  const token2Raw = generateSecureToken()
  const token2Hash = hashToken(token2Raw)

  const signer1Data = {
    id: `sgn-1-${Date.now()}`,
    contract_id: contractId,
    role: role1,
    name: party1.name,
    document: party1.cpf_cnpj,
    email: party1.email || '',
    phone: party1.phone || '',
    token_hash: token1Hash,
    token_expires_at: expiresAt,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  const signer2Data = {
    id: `sgn-2-${Date.now()}`,
    contract_id: contractId,
    role: role2,
    name: party2.name,
    document: party2.cpf_cnpj,
    email: party2.email || '',
    phone: party2.phone || '',
    token_hash: token2Hash,
    token_expires_at: expiresAt,
    status: 'pending',
    created_at: new Date().toISOString(),
  }

  // 1. Tenta salvar no Supabase
  try {
    const supabase = createAdminClient()
    await supabase.from('contract_signers').insert([signer1Data, signer2Data])
  } catch (err) {
    console.warn('Fallback: salvando signatários no cache local:', err)
  }

  // 2. Salva no cache local para resiliência offline e dev
  const localContract = getLocalContractById(contractId)
  if (localContract) {
    localContract.signers = [signer1Data, signer2Data]
    saveLocalContract(localContract)
  }

  const signingUrl1 = `${originUrl}/assinar/${token1Raw}`
  const signingUrl2 = `${originUrl}/assinar/${token2Raw}`

  // Envia e-mail de convite para a primeira parte se houver e-mail válido
  if (party1.email && party1.email.includes('@')) {
    sendSigningLinkEmail({
      to: party1.email,
      signerName: party1.name,
      storeName: store.name,
      contractTitle: localContract?.title || `${isPoa ? 'Procuração' : 'Contrato'} Nº ${localContract?.number || ''}`,
      signingUrl: signingUrl1,
    }).catch(() => {})
  }

  return {
    buyerToken: token1Raw,
    sellerToken: token2Raw,
    buyerSigningUrl: signingUrl1,
    sellerSigningUrl: signingUrl2,
    grantorSigningUrl: signingUrl1,
    granteeSigningUrl: signingUrl2,
  }
}

/**
 * Busca signatário e contrato a partir de um token bruto (/assinar/[token]).
 */
export async function getSignerByToken(rawToken: string): Promise<{
  success: boolean
  error?: string
  isExpired?: boolean
  alreadySigned?: boolean
  signer?: any
  contract?: any
}> {
  const tokenHash = hashToken(rawToken)

  // 1. Tenta buscar no Supabase
  let signer: any = null
  let contract: any = null

  try {
    const supabase = createAdminClient()
    const { data: sgnData } = await supabase
      .from('contract_signers')
      .select('*, contracts(*)')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (sgnData) {
      signer = sgnData
      contract = sgnData.contracts
    }
  } catch {}

  // 2. Fallback para cache local
  if (!signer || !contract) {
    const local = getLocalSignerByTokenHash(tokenHash)
    if (local) {
      signer = local.signer
      contract = local.contract
    }
  }

  if (!signer || !contract) {
    return { success: false, error: 'Link de assinatura inválido ou não encontrado.' }
  }

  const isExpired = new Date(signer.token_expires_at).getTime() < Date.now()
  const alreadySigned = signer.status === 'signed'

  return {
    success: true,
    isExpired,
    alreadySigned,
    signer,
    contract,
  }
}

/**
 * Gera e envia código OTP para o signatário por e-mail.
 */
export async function sendSignerOtp({
  signerId,
  contractId,
  clientIp,
  userAgent,
}: {
  signerId: string
  contractId: string
  clientIp?: string
  userAgent?: string
}): Promise<{ success: boolean; error?: string }> {
  // Localiza signatário
  const local = getLocalContractById(contractId)
  const signer = local?.signers?.find((s: any) => s.id === signerId)
  const contract = local

  if (!signer) {
    return { success: false, error: 'Signatário não encontrado.' }
  }

  if (signer.otp_attempts && signer.otp_attempts >= 5) {
    return {
      success: false,
      error: 'Limite de tentativas excedido por segurança. Solicite um novo link.',
    }
  }

  // Gera código numérico de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const codeHash = hashToken(code)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

  // Atualiza signatário
  const updates = {
    otp_code_hash: codeHash,
    otp_sent_at: new Date().toISOString(),
    otp_expires_at: expiresAt,
    otp_attempts: (signer.otp_attempts || 0) + 1,
  }

  updateLocalSigner(contractId, signerId, updates)

  try {
    const supabase = createAdminClient()
    await supabase.from('contract_signers').update(updates).eq('id', signerId)
  } catch {}

  // Registra auditoria
  addLocalContractEvent(contractId, {
    signer_id: signerId,
    event_type: 'otp_sent',
    ip: clientIp,
    user_agent: userAgent,
    metadata: { email: signer.email },
  })

  // Dispara e-mail via Resend
  const storeName = contract?.seller_data?.name || 'Loja'
  if (signer.email) {
    await sendOtpCodeEmail({
      to: signer.email,
      signerName: signer.name,
      storeName,
      otpCode: code,
    })
  }

  return { success: true }
}

/**
 * Valida o código OTP informado pelo signatário.
 */
export async function verifySignerOtp({
  signerId,
  contractId,
  code,
  clientIp,
  userAgent,
}: {
  signerId: string
  contractId: string
  code: string
  clientIp?: string
  userAgent?: string
}): Promise<{ success: boolean; error?: string }> {
  const local = getLocalContractById(contractId)
  const signer = local?.signers?.find((s: any) => s.id === signerId)

  if (!signer) {
    return { success: false, error: 'Signatário não encontrado.' }
  }

  if (!signer.otp_code_hash) {
    return { success: false, error: 'Nenhum código OTP foi solicitado.' }
  }

  const isExpired = new Date(signer.otp_expires_at).getTime() < Date.now()
  if (isExpired) {
    return { success: false, error: 'Código expirado. Solicite um novo código.' }
  }

  const expectedHash = signer.otp_code_hash
  const inputHash = hashToken(code)

  if (expectedHash !== inputHash) {
    addLocalContractEvent(contractId, {
      signer_id: signerId,
      event_type: 'otp_failed',
      ip: clientIp,
      user_agent: userAgent,
      metadata: { attempts: signer.otp_attempts },
    })
    return { success: false, error: 'Código de verificação incorreto.' }
  }

  // Código validado com sucesso!
  const updates = {
    otp_verified_at: new Date().toISOString(),
  }

  updateLocalSigner(contractId, signerId, updates)

  try {
    const supabase = createAdminClient()
    await supabase.from('contract_signers').update(updates).eq('id', signerId)
  } catch {}

  addLocalContractEvent(contractId, {
    signer_id: signerId,
    event_type: 'otp_verified',
    ip: clientIp,
    user_agent: userAgent,
  })

  return { success: true }
}

/**
 * Conclui a assinatura eletrônica do signatário com a imagem desenhada no canvas.
 */
export async function completeSignerSignature({
  signerId,
  contractId,
  signatureBase64,
  clientIp,
  userAgent,
}: {
  signerId: string
  contractId: string
  signatureBase64: string
  clientIp?: string
  userAgent?: string
}): Promise<{ success: boolean; allSigned: boolean; error?: string }> {
  const contract = getLocalContractById(contractId)
  if (!contract) {
    return { success: false, allSigned: false, error: 'Contrato não encontrado.' }
  }

  const now = new Date().toISOString()
  const signerUpdates = {
    status: 'signed',
    signed_at: now,
    signature_image_url: signatureBase64,
    ip: clientIp || '127.0.0.1',
    user_agent: userAgent || 'Navegador Web',
  }

  updateLocalSigner(contractId, signerId, signerUpdates)

  try {
    const supabase = createAdminClient()
    await supabase.from('contract_signers').update(signerUpdates).eq('id', signerId)
  } catch {}

  // Registra evento de auditoria
  addLocalContractEvent(contractId, {
    signer_id: signerId,
    event_type: 'signed',
    ip: clientIp,
    user_agent: userAgent,
  })

  // Recarrega contrato atualizado
  const updatedContract = getLocalContractById(contractId) || contract
  const allSigners = updatedContract.signers || []
  const allSigned = allSigners.length > 0 && allSigners.every((s: any) => s.status === 'signed')

  if (allSigned) {
    // -------------------------------------------------------------
    // TODOS ASSINARAM: Gera PDF Final com Certificado de Auditoria
    // -------------------------------------------------------------
    const signersEvidence: ContractSignerEvidence[] = allSigners.map((s: any) => ({
      role: s.role,
      name: s.name,
      document: s.document,
      email: s.email,
      phone: s.phone,
      signedAt: s.signedAt || s.signed_at,
      signatureImageUrl: s.signature_image_url,
      ip: s.ip,
      userAgent: s.user_agent,
      otpVerifiedAt: s.otp_verified_at,
    }))

    // Gera hash de integridade
    const docHash = crypto
      .createHash('sha256')
      .update(`${contractId}-${updatedContract.number}-${now}`)
      .digest('hex')

    try {
      let finalPdfBytes: Uint8Array
      if (updatedContract.type === 'procuracao') {
        finalPdfBytes = await generatePowerOfAttorneyPdf({
          number: updatedContract.number,
          store: updatedContract.seller_data,
          grantor: updatedContract.buyer_data,
          grantee: updatedContract.seller_data,
          vehicle: updatedContract.vehicle_data,
          validityDays: updatedContract.validity_days || 365,
          additionalPowers: updatedContract.additional_powers || '',
          observations: updatedContract.notes || '',
          isPrintVersion: false,
          isFinalSigned: true,
          signers: signersEvidence,
          sha256Hash: docHash,
        })
      } else {
        finalPdfBytes = await generateContractPdf({
          number: updatedContract.number,
          store: updatedContract.seller_data,
          buyer: updatedContract.buyer_data,
          vehicle: updatedContract.vehicle_data,
          financial: updatedContract.financial_data,
          clauses: updatedContract.clauses || [],
          isPrintVersion: false,
          isFinalSigned: true,
          signers: signersEvidence,
          sha256Hash: docHash,
        })
      }

      updatedContract.status = 'signed'
      updatedContract.signed_at = now
      updatedContract.pdf_sha256 = docHash
      updatedContract.signed_pdf_url = `/api/contracts/${contractId}/pdf?signed=true`
      saveLocalContract(updatedContract)

      try {
        const supabase = createAdminClient()
        await supabase
          .from('contracts')
          .update({
            status: 'signed',
            pdf_sha256: docHash,
            updated_at: now,
          })
          .eq('id', contractId)
      } catch {}

      addLocalContractEvent(contractId, {
        event_type: 'pdf_generated',
        ip: clientIp,
        metadata: { sha256: docHash },
      })

      // Envia e-mails de finalização para todas as partes com o link
      const storeName = updatedContract.seller_data?.name || 'Loja'
      const pdfFullUrl = `http://localhost:3000/api/contracts/${contractId}/pdf?signed=true`

      for (const s of allSigners) {
        if (s.email && s.email.includes('@')) {
          sendContractCompletedEmail({
            to: s.email,
            signerName: s.name,
            storeName,
            contractTitle: updatedContract.title,
            pdfUrl: pdfFullUrl,
          }).catch(() => {})
        }
      }
    } catch (pdfErr) {
      console.error('Erro ao gerar PDF final assinado:', pdfErr)
    }
  } else {
    // Parcialmente assinado
    updatedContract.status = 'partially_signed'
    saveLocalContract(updatedContract)
    try {
      const supabase = createAdminClient()
      await supabase
        .from('contracts')
        .update({ status: 'partially_signed', updated_at: now })
        .eq('id', contractId)
    } catch {}
  }

  return { success: true, allSigned }
}

/**
 * Registra assinatura presencial (upload de contrato físico escaneado ou fotografado).
 */
export async function registerManualPhysicalSignature({
  contractId,
  fileUrl,
  signedBy,
  notes,
  clientIp,
  userAgent,
}: {
  contractId: string
  fileUrl: string
  signedBy: string
  notes?: string
  clientIp?: string
  userAgent?: string
}): Promise<{ success: boolean; error?: string }> {
  const contract = getLocalContractById(contractId)
  if (!contract) {
    return { success: false, error: 'Contrato não encontrado.' }
  }

  const now = new Date().toISOString()
  contract.status = 'signed'
  contract.is_manual_signed = true
  contract.manual_signed_file_url = fileUrl
  contract.manual_signed_by = signedBy
  contract.manual_signed_at = now
  contract.signed_pdf_url = fileUrl
  contract.notes = notes ? `${contract.notes || ''}\n[Presencial]: ${notes}` : contract.notes

  saveLocalContract(contract)

  try {
    const supabase = createAdminClient()
    await supabase
      .from('contracts')
      .update({
        status: 'signed',
        is_manual_signed: true,
        manual_signed_file_url: fileUrl,
        manual_signed_by: signedBy,
        manual_signed_at: now,
        updated_at: now,
      })
      .eq('id', contractId)
  } catch {}

  addLocalContractEvent(contractId, {
    event_type: 'manual_signed',
    ip: clientIp,
    user_agent: userAgent,
    metadata: { signedBy, fileUrl },
  })

  return { success: true }
}
