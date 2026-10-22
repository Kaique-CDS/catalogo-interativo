'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Download,
  ExternalLink,
  Lock,
  Mail,
  UserCheck,
  Car,
  ChevronRight,
  PenTool,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/contracts/utils'

export default function PublicSigningPage() {
  const params = useParams()
  const rawToken = (params?.token || '') as string

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [alreadySigned, setAlreadySigned] = useState(false)

  const [signer, setSigner] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)

  // Etapas do fluxo de assinatura:
  // 1 = Revisão & Identidade
  // 2 = Código OTP
  // 3 = Canvas de Assinatura & Aceite
  // 4 = Sucesso
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // OTP
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpResendCountdown, setOtpResendCountdown] = useState(0)

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submittingSignature, setSubmittingSignature] = useState(false)

  // Modal PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  useEffect(() => {
    if (!rawToken) return
    loadSigningData()
  }, [rawToken])

  // Contagem regressiva de reenvio de OTP
  useEffect(() => {
    if (otpResendCountdown <= 0) return
    const timer = setInterval(() => {
      setOtpResendCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [otpResendCountdown])

  const loadSigningData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/contracts/sign/${rawToken}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Não foi possível carregar os dados de assinatura.')
        return
      }

      setIsExpired(Boolean(data.isExpired))
      setAlreadySigned(Boolean(data.alreadySigned))
      setSigner(data.signer)
      setContract(data.contract)

      if (data.alreadySigned) {
        setStep(4)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------
  // SOLICITAR CÓDIGO OTP
  // -------------------------------------------------------------
  const handleRequestOtp = async () => {
    setOtpSending(true)
    try {
      const res = await fetch(`/api/contracts/sign/${rawToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp' }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao enviar código de verificação.')
      }

      toast.success('Código de 6 dígitos enviado para seu e-mail!')
      setStep(2)
      setOtpResendCountdown(60)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao enviar código OTP.')
    } finally {
      setOtpSending(false)
    }
  }

  // -------------------------------------------------------------
  // VALIDAR CÓDIGO OTP
  // -------------------------------------------------------------
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Informe o código de 6 dígitos.')
      return
    }

    setOtpVerifying(true)
    try {
      const res = await fetch(`/api/contracts/sign/${rawToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', code: otpCode.trim() }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Código incorreto.')
      }

      toast.success('Identidade verificada com sucesso! Desenhe sua assinatura.')
      setStep(3)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao validar código.')
    } finally {
      setOtpVerifying(false)
    }
  }

  // -------------------------------------------------------------
  // CANVAS DRAWING (TOUCH & MOUSE)
  // -------------------------------------------------------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  // -------------------------------------------------------------
  // CONCLUIR ASSINATURA ELETRÔNICA
  // -------------------------------------------------------------
  const handleCompleteSignature = async () => {
    if (!hasSignature) {
      toast.error('Por favor, desenhe sua assinatura no campo indicado.')
      return
    }
    if (!acceptedTerms) {
      toast.error('Marque a declaração de concordância para prosseguir.')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const signatureBase64 = canvas.toDataURL('image/png')

    setSubmittingSignature(true)
    const toastId = toast.loading('Registrando assinatura e gerando certificado...')

    try {
      const res = await fetch(`/api/contracts/sign/${rawToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_signature',
          signature_base64: signatureBase64,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao registrar assinatura.')
      }

      toast.success('Assinatura registrada com sucesso! 🎉', { id: toastId })
      setStep(4)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao assinar documento.', { id: toastId })
    } finally {
      setSubmittingSignature(false)
    }
  }

  // -------------------------------------------------------------
  // RENDERS DE ESTADOS ESPECIAIS
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Carregando ambiente seguro de assinatura...</p>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-surface bg-surface-1 shadow-xl text-center p-6 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Link Inválido ou Inexistente</h2>
          <p className="text-xs text-muted-foreground">{errorMsg}</p>
          <p className="text-[11px] text-muted-foreground">
            Verifique o link enviado ou entre em contato com a loja responsável para solicitar uma nova via.
          </p>
        </Card>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-surface bg-surface-1 shadow-xl text-center p-6 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Link de Assinatura Expirado</h2>
          <p className="text-xs text-muted-foreground">
            O prazo padrão para assinatura deste documento (7 dias) expirou.
          </p>
          <p className="text-xs text-muted-foreground">
            Por favor, contate <strong>{contract?.store?.name}</strong> para que enviem um novo link atualizado.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* Cabeçalho Seguro */}
        <div className="flex items-center justify-between pb-3 border-b border-surface">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">
                {contract?.store?.name || 'Catálogo Automotivo'}
              </p>
              <p className="text-[10px] text-muted-foreground">Assinatura Eletrônica Segura</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <Lock className="h-3 w-3" /> Conexão Criptografada
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* PASSO 1: REVISÃO E CONFIRMAÇÃO DE IDENTIDADE                  */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <Card className="border-surface bg-surface-1 shadow-lg">
            <CardHeader className="pb-3 border-b border-surface">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Contrato de Compra e Venda
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Revise os dados antes de prosseguir com a assinatura digital.
                  </p>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-surface-2 text-foreground">
                  Nº {contract?.number}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Card do Veículo */}
              <div className="rounded-xl border border-surface bg-surface-2/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-brand" />
                    <span className="text-xs font-bold text-foreground">
                      {contract?.vehicle?.brand} {contract?.vehicle?.model}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-foreground uppercase">
                    {contract?.vehicle?.plate}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-surface">
                  <div>
                    Ano: <span className="text-foreground font-medium">{contract?.vehicle?.year_fab}/{contract?.vehicle?.year_model}</span>
                  </div>
                  <div>
                    Cor: <span className="text-foreground font-medium">{contract?.vehicle?.color}</span>
                  </div>
                </div>
              </div>

              {/* Card Financeiro / Documento */}
              {contract?.financial?.total_amount ? (
                <div className="rounded-xl border border-surface bg-surface-2/40 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Valor Total</span>
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(contract.financial.total_amount)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(contract?.pdf_url, '_blank')}
                    className="gap-1.5 text-xs rounded-xl border-surface hover:bg-surface-2 h-8"
                  >
                    <FileText className="h-3.5 w-3.5 text-brand" /> Ler PDF Completo
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-surface bg-surface-2/40 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Documento</span>
                    <p className="text-xs font-bold text-foreground">
                      Procuração de Gestão e Venda de Veículo
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(contract?.pdf_url, '_blank')}
                    className="gap-1.5 text-xs rounded-xl border-surface hover:bg-surface-2 h-8"
                  >
                    <FileText className="h-3.5 w-3.5 text-brand" /> Ler PDF Completo
                  </Button>
                </div>
              )}

              {/* Confirmação de Identidade */}
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <UserCheck className="h-4 w-4 text-brand" /> Confirmação do Signatário
                </div>
                <p className="text-xs text-foreground">
                  Você está assinando como{' '}
                  <span className="font-bold text-brand uppercase">
                    {signer?.role === 'outorgante'
                      ? 'Outorgante (Proprietário)'
                      : signer?.role === 'outorgado'
                      ? 'Outorgado(a)'
                      : signer?.role === 'buyer'
                      ? 'Comprador'
                      : 'Vendedor'}
                  </span>
                  :
                </p>

                <div className="space-y-0.5 text-xs text-muted-foreground bg-surface-1 p-2.5 rounded-lg border border-surface">
                  <p>
                    Nome: <strong className="text-foreground">{signer?.name}</strong>
                  </p>
                  <p>
                    CPF/CNPJ: <strong className="text-foreground">{signer?.document}</strong>
                  </p>
                  <p>
                    E-mail: <strong className="text-foreground">{signer?.email}</strong>
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full btn-brand rounded-xl font-bold text-xs h-11 gap-2 shadow-sm"
              >
                {otpSending ? (
                  <>Enviando código de verificação...</>
                ) : (
                  <>
                    Confirmar e Receber Código por E-mail <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* PASSO 2: CÓDIGO DE VERIFICAÇÃO OTP VIA E-MAIL                 */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <Card className="border-surface bg-surface-1 shadow-lg">
            <CardHeader className="pb-3 border-b border-surface text-center">
              <div className="h-10 w-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-2">
                <Mail className="h-5 w-5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                Digite o Código de Verificação
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Enviamos um código de 6 dígitos para o e-mail{' '}
                <strong className="text-foreground">{signer?.email}</strong>.
              </p>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              <div className="max-w-xs mx-auto space-y-2">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="h-14 text-center font-mono text-2xl font-black tracking-widest bg-surface-2 border-surface focus:border-brand rounded-xl"
                  autoFocus
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  O código expira em 15 minutos.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpCode.length !== 6}
                  className="w-full btn-brand rounded-xl font-bold text-xs h-11 gap-2 shadow-sm"
                >
                  {otpVerifying ? 'Validando...' : 'Verificar Código & Prosseguir'}
                </Button>

                <div className="text-center">
                  {otpResendCountdown > 0 ? (
                    <span className="text-[11px] text-muted-foreground">
                      Reenviar novo código em {otpResendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={otpSending}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Não recebi o código. Reenviar agora
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* PASSO 3: DESENHO DA ASSINATURA NO CANVAS & ACEITE LEGAL       */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <Card className="border-surface bg-surface-1 shadow-lg">
            <CardHeader className="pb-3 border-b border-surface">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <PenTool className="h-4 w-4 text-brand" /> Assinatura na Tela
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desenhe sua assinatura com o dedo ou mouse no quadro abaixo.
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <div className="relative border-2 border-dashed border-surface rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={(e) => { e.preventDefault(); startDrawing(e) }}
                    onTouchMove={(e) => { e.preventDefault(); draw(e) }}
                    onTouchEnd={(e) => { e.preventDefault(); stopDrawing() }}
                    className="w-full h-44 cursor-crosshair block touch-none"
                    style={{ touchAction: 'none' }}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-zinc-400 font-medium">
                      Assine aqui com o dedo ou mouse
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium p-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Limpar assinatura
                  </button>
                </div>
              </div>

              {/* Termo de Aceite Legal */}
              <div className="rounded-xl border border-surface bg-surface-2/40 p-3.5 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface text-brand focus:ring-brand"
                  />
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-foreground leading-snug block">
                      Declaro que li e concordo integralmente com todas as cláusulas e condições deste Contrato de Compra e Venda.
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Reconheço a validade jurídica desta assinatura eletrônica com eficácia probatória nos termos da Lei Federal nº 14.063/2020 e Medida Provisória nº 2.200-2/2001.
                    </p>
                  </div>
                </label>
              </div>

              {/* Aviso Cartório / Detran */}
              <p className="text-[10px] text-muted-foreground leading-relaxed text-center px-2">
                * Observação: A assinatura eletrônica é válida legalmente para a compra e venda. Procedimentos que exijam reconhecimento de firma por normas específicas de cartórios ou Detran local devem seguir as diretrizes do respectivo órgão.
              </p>

              <Button
                type="button"
                onClick={handleCompleteSignature}
                disabled={submittingSignature || !hasSignature || !acceptedTerms}
                className="w-full btn-brand rounded-xl font-bold text-xs h-11 gap-2 shadow-md"
              >
                {submittingSignature ? (
                  <>Registrando Assinatura...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Concluir e Assinar Documento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═════════════════════════════════════════════════════════════ */}
        {/* PASSO 4: DOCUMENTO ASSINADO COM SUCESSO                       */}
        {/* ═════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <Card className="border-surface bg-surface-1 shadow-xl text-center p-6 space-y-5">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">Documento Assinado com Sucesso!</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Sua assinatura eletrônica foi autenticada e vinculada ao contrato com registro cronológico e integridade garantida por hash criptográfico.
              </p>
            </div>

            <div className="rounded-xl border border-surface bg-surface-2/40 p-4 max-w-sm mx-auto text-xs space-y-1 text-left">
              <p>
                Signatário: <strong className="text-foreground">{signer?.name}</strong>
              </p>
              <p>
                Documento: <strong className="text-foreground">{contract?.title}</strong>
              </p>
              <p>
                Validação: <span className="text-emerald-600 font-semibold">Código OTP + Trilha de Evidências</span>
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                onClick={() => window.open(contract?.signed_pdf_url || contract?.pdf_url, '_blank')}
                className="btn-brand rounded-xl font-bold text-xs h-11 gap-2"
              >
                <Download className="h-4 w-4" /> Baixar Via em PDF
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Rodapé legal discreto */}
      <footer className="text-center text-[10px] text-muted-foreground pt-6">
        {contract?.store?.name || 'Catálogo Interativo'} • Assinatura Eletrônica em conformidade com a Lei nº 14.063/2020
      </footer>
    </div>
  )
}
