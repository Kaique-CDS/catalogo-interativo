import { Resend } from 'resend'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY não configurada no ambiente. E-mails serão simulados no console.')
    return null
  }
  return new Resend(apiKey)
}

/**
 * Envia e-mail com link de assinatura para o signatário.
 */
export async function sendSigningLinkEmail({
  to,
  signerName,
  storeName,
  contractTitle,
  signingUrl,
}: {
  to: string
  signerName: string
  storeName: string
  contractTitle: string
  signingUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient()
    const sender = `${storeName} <onboarding@resend.dev>`

    if (!resend) {
      console.log(`[MOCK EMAIL] Para: ${to} | Assunto: Link de assinatura | URL: ${signingUrl}`)
      return { success: true }
    }

    const { error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject: `Assinatura solicitada: ${contractTitle} - ${storeName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">${storeName}</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Assinatura Eletrônica de Documento</p>
          </div>

          <p style="font-size: 15px; line-height: 1.5;">Olá, <strong>${signerName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #334155;">
            Você foi convidado(a) para assinar eletronicamente o documento <strong>${contractTitle}</strong> com <strong>${storeName}</strong>.
          </p>

          <div style="margin: 28px 0; text-align: center;">
            <a href="${signingUrl}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              Revisar e Assinar Contrato
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
            Se o botão não funcionar, copie e cole o link no seu navegador:<br>
            <a href="${signingUrl}" style="color: #2563eb; word-break: break-all;">${signingUrl}</a>
          </p>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0;">Este documento possui validade jurídica conforme Lei Federal nº 14.063/2020. O link é pessoal e intransferível.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Erro Resend ao enviar link de assinatura:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Falha no envio de e-mail de assinatura:', err)
    return { success: false, error: err.message || 'Falha ao enviar e-mail' }
  }
}

/**
 * Envia código OTP para validação da assinatura eletrônica.
 */
export async function sendOtpCodeEmail({
  to,
  signerName,
  storeName,
  otpCode,
}: {
  to: string
  signerName: string
  storeName: string
  otpCode: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient()
    const sender = `${storeName} <onboarding@resend.dev>`

    if (!resend) {
      console.log(`[MOCK OTP] Para: ${to} | Código OTP: ${otpCode}`)
      return { success: true }
    }

    const { error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject: `Seu código de assinatura: ${otpCode} - ${storeName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 18px;">Código de Verificação de Assinatura</h2>
          <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0;">Olá, ${signerName}. Utilize o código abaixo para validar sua assinatura:</p>

          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${otpCode}</span>
          </div>

          <p style="font-size: 12px; color: #64748b; margin: 0;">
            Este código é válido por <strong>15 minutos</strong>. Não compartilhe com terceiros.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Erro Resend ao enviar OTP:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Falha no envio de OTP por e-mail:', err)
    return { success: false, error: err.message || 'Falha ao enviar código' }
  }
}

/**
 * Envia notificação de contrato 100% concluído com o PDF final.
 */
export async function sendContractCompletedEmail({
  to,
  signerName,
  storeName,
  contractTitle,
  pdfUrl,
}: {
  to: string
  signerName: string
  storeName: string
  contractTitle: string
  pdfUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient()
    const sender = `${storeName} <onboarding@resend.dev>`

    if (!resend) {
      console.log(`[MOCK EMAIL] Contrato concluído para: ${to} | PDF: ${pdfUrl}`)
      return { success: true }
    }

    const { error } = await resend.emails.send({
      from: sender,
      to: [to],
      subject: `Contrato Concluído: ${contractTitle} - ${storeName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b;">
          <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 18px;">Contrato Assinado com Sucesso! 🎉</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            Olá, <strong>${signerName}</strong>! Todas as partes concluíram a assinatura do documento <strong>${contractTitle}</strong>.
          </p>

          <p style="font-size: 14px; color: #334155; margin: 16px 0;">
            Você pode visualizar e fazer o download da sua via final assinada com o certificado de autenticidade no botão abaixo:
          </p>

          <div style="margin: 24px 0; text-align: center;">
            <a href="${pdfUrl}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
              Baixar Contrato Assinado (PDF)
            </a>
          </div>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0;">${storeName} • Assinatura Eletrônica em conformidade com a Lei Federal nº 14.063/2020.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Erro Resend ao enviar confirmação de contrato:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Falha no envio de e-mail de conclusão:', err)
    return { success: false, error: err.message || 'Falha ao enviar confirmação' }
  }
}
