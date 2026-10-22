import { PDFDocument, StandardFonts, rgb, grayscale } from 'pdf-lib'
import { formatCurrency, valorPorExtenso, type ContractClause } from './utils'
import type { Store } from '@/lib/supabase/types'

export interface BuyerData {
  type: 'pf' | 'pj'
  name: string
  cpf_cnpj: string
  rg_ie?: string
  cnh?: string
  birth_date?: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  rep_name?: string
  rep_cpf?: string
}

export interface VehicleData {
  brand: string
  model: string
  year_fab: string | number
  year_model: string | number
  plate: string
  chassis: string
  renavam: string
  color: string
  fuel: string
  mileage?: string | number
  engine?: string
  features?: string
}

export interface PaymentInstallment {
  number: number
  amount: number
  due_date: string
  method: string
  description?: string
}

export interface FinancialData {
  total_amount: number
  down_payment?: number
  down_payment_date?: string
  transfer_fee_amount?: number
  transfer_responsible: 'comprador' | 'vendedor' | 'dividido'
  installments: PaymentInstallment[]
  notes?: string
}

export interface ContractSignerEvidence {
  role: 'buyer' | 'seller' | 'outorgante' | 'outorgado'
  name: string
  document: string
  email?: string
  phone?: string
  signedAt?: string
  signatureImageUrl?: string
  ip?: string
  userAgent?: string
  otpVerifiedAt?: string
}

export interface GenerateContractPdfOptions {
  number: number
  store: Store
  buyer: BuyerData
  vehicle: VehicleData
  financial: FinancialData
  clauses: ContractClause[]
  isPrintVersion?: boolean // true = linhas para assinatura manual; false = assinatura online
  date?: string
  signers?: ContractSignerEvidence[]
  isFinalSigned?: boolean
  sha256Hash?: string
}

/**
 * Remove caracteres incompatíveis com WinAnsiEncoding do pdf-lib.
 */
function cleanText(text: string | null | undefined): string {
  if (!text) return ''
  return String(text)
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .trim()
}

/**
 * Converte base64 ou URL de assinatura em imagem embutida no PDF.
 */
async function embedSignatureImage(pdfDoc: PDFDocument, base64OrUrl?: string) {
  if (!base64OrUrl) return null
  try {
    let buf: Buffer | null = null
    if (base64OrUrl.startsWith('data:image/')) {
      const b64Data = base64OrUrl.split(',')[1] || ''
      buf = Buffer.from(b64Data, 'base64')
    } else if (base64OrUrl.startsWith('http')) {
      const res = await fetch(base64OrUrl)
      if (res.ok) buf = Buffer.from(await res.arrayBuffer())
    }
    if (!buf) return null
    try {
      return await pdfDoc.embedPng(buf)
    } catch {
      try {
        return await pdfDoc.embedJpg(buf)
      } catch {
        return null
      }
    }
  } catch (err) {
    console.warn('Erro ao embutir imagem de assinatura no PDF:', err)
    return null
  }
}

/**
 * Quebra um texto em linhas respeitando uma largura máxima em pontos.
 */
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number
): string[] {
  const clean = cleanText(text)
  const paragraphs = clean.split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('')
      continue
    }

    const words = para.split(' ')
    let currentLine = words[0] || ''

    for (let i = 1; i < words.length; i++) {
      const word = words[i]
      const testLine = `${currentLine} ${word}`
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width <= maxWidth) {
        currentLine = testLine
      } else {
        lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/**
 * Converte data ISO ou YYYY-MM-DD para formato brasileiro.
 */
function formatDateBr(iso: string | null | undefined): string {
  if (!iso) return ''
  const parts = iso.split('T')[0].split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return iso
}

/**
 * Converte cor hex (#4B1F8F) em RGB do pdf-lib.
 */
function hexToRgb(hex: string | null | undefined) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) {
    return rgb(0.1, 0.1, 0.15)
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

/**
 * Motor de geração de PDF para Contrato de Compra e Venda de Veículo.
 */
export async function generateVehicleSaleContractPdf(
  opts: GenerateContractPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const PAGE_WIDTH = 595.28 // A4
  const PAGE_HEIGHT = 841.89
  const MARGIN_X = 40
  const MARGIN_BOTTOM = 50
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

  const brandColor = hexToRgb(opts.store.primary_color || '#18181b')
  const grayLight = rgb(0.94, 0.94, 0.95)
  const grayBorder = rgb(0.82, 0.82, 0.85)
  const textColor = rgb(0.12, 0.12, 0.14)
  const textMuted = rgb(0.4, 0.4, 0.45)

  // Controle de páginas e cursor
  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let cursorY = PAGE_HEIGHT - 40
  const pages = [currentPage]

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY - neededHeight < MARGIN_BOTTOM) {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      pages.push(currentPage)
      cursorY = PAGE_HEIGHT - 45
    }
  }

  // Tenta baixar e embutir o logo da loja (se houver)
  let embeddedLogo: any = null
  if (opts.store.logo_url) {
    try {
      const res = await fetch(opts.store.logo_url)
      if (res.ok) {
        const logoBytes = await res.arrayBuffer()
        if (opts.store.logo_url.toLowerCase().endsWith('.png')) {
          embeddedLogo = await pdfDoc.embedPng(logoBytes)
        } else if (
          opts.store.logo_url.toLowerCase().endsWith('.jpg') ||
          opts.store.logo_url.toLowerCase().endsWith('.jpeg')
        ) {
          embeddedLogo = await pdfDoc.embedJpg(logoBytes)
        }
      }
    } catch {
      // Ignora erro de download e segue com cabeçalho textual
    }
  }

  // -------------------------------------------------------------
  // 1. CABEÇALHO DO DOCUMENTO
  // -------------------------------------------------------------
  // Barra de destaque com cor da marca no topo
  currentPage.drawRectangle({
    x: MARGIN_X,
    y: cursorY - 4,
    width: CONTENT_WIDTH,
    height: 4,
    color: brandColor,
  })
  cursorY -= 16

  const headerTop = cursorY
  let headerTextLeft = MARGIN_X

  if (embeddedLogo) {
    try {
      const logoDims = embeddedLogo.scaleToFit(100, 45)
      currentPage.drawImage(embeddedLogo, {
        x: MARGIN_X,
        y: headerTop - logoDims.height + 6,
        width: logoDims.width,
        height: logoDims.height,
      })
      headerTextLeft = MARGIN_X + logoDims.width + 16
    } catch {
      headerTextLeft = MARGIN_X
    }
  }

  // Dados da loja no cabeçalho
  const storeName = cleanText(opts.store.contract_razao_social || opts.store.name)
  currentPage.drawText(storeName, {
    x: headerTextLeft,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: textColor,
  })
  cursorY -= 12

  const storeInfoParts: string[] = []
  if (opts.store.contract_cnpj) storeInfoParts.push(`CNPJ: ${cleanText(opts.store.contract_cnpj)}`)
  if (opts.store.contract_phone || opts.store.whatsapp) {
    storeInfoParts.push(`Tel: ${cleanText(opts.store.contract_phone || opts.store.whatsapp)}`)
  }
  if (opts.store.contract_email || opts.store.email) {
    storeInfoParts.push(`E-mail: ${cleanText(opts.store.contract_email || opts.store.email)}`)
  }

  if (storeInfoParts.length > 0) {
    currentPage.drawText(storeInfoParts.join('  |  '), {
      x: headerTextLeft,
      y: cursorY,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    })
    cursorY -= 10
  }

  const storeAddress = cleanText(opts.store.contract_address || opts.store.address)
  if (storeAddress) {
    currentPage.drawText(storeAddress, {
      x: headerTextLeft,
      y: cursorY,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    })
    cursorY -= 10
  }

  cursorY = Math.min(cursorY, headerTop - 45) - 8

  // Linha divisória
  currentPage.drawLine({
    start: { x: MARGIN_X, y: cursorY },
    end: { x: MARGIN_X + CONTENT_WIDTH, y: cursorY },
    thickness: 0.8,
    color: grayBorder,
  })
  cursorY -= 16

  // Título do Contrato
  const contractTitle = 'CONTRATO DE COMPRA E VENDA DE VEÍCULO AUTOMOTOR'
  const titleWidth = fontBold.widthOfTextAtSize(contractTitle, 12)
  currentPage.drawText(contractTitle, {
    x: MARGIN_X + (CONTENT_WIDTH - titleWidth) / 2,
    y: cursorY,
    size: 12,
    font: fontBold,
    color: textColor,
  })
  cursorY -= 13

  const currentYear = new Date().getFullYear()
  const contractSubtitle = `Instrumento Particular de Compra e Venda Nº ${opts.number}/${currentYear}`
  const subtitleWidth = fontRegular.widthOfTextAtSize(contractSubtitle, 8.5)
  currentPage.drawText(contractSubtitle, {
    x: MARGIN_X + (CONTENT_WIDTH - subtitleWidth) / 2,
    y: cursorY,
    size: 8.5,
    font: fontRegular,
    color: textMuted,
  })
  cursorY -= 16

  // -------------------------------------------------------------
  // HELPER PARA SEÇÕES COM TÍTULO E CAIXA
  // -------------------------------------------------------------
  const drawSectionTitle = (title: string) => {
    checkPageBreak(30)
    currentPage.drawRectangle({
      x: MARGIN_X,
      y: cursorY - 14,
      width: CONTENT_WIDTH,
      height: 16,
      color: grayLight,
    })
    currentPage.drawText(cleanText(title), {
      x: MARGIN_X + 8,
      y: cursorY - 10,
      size: 8.5,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 22
  }

  // -------------------------------------------------------------
  // 2. QUALIFICAÇÃO DAS PARTES
  // -------------------------------------------------------------
  drawSectionTitle('1. QUALIFICAÇÃO DAS PARTES')

  // VENDEDOR
  const sellerText = `VENDEDOR(A): ${cleanText(opts.store.contract_razao_social || opts.store.name)}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cleanText(opts.store.contract_cnpj || 'Não informado')}, com sede em ${cleanText(opts.store.contract_address || opts.store.address || 'Endereço cadastral da loja')}${opts.store.contract_rep_nome ? `, neste ato representada por seu responsável legal ${cleanText(opts.store.contract_rep_nome)}, inscrito no CPF nº ${cleanText(opts.store.contract_rep_cpf || '')}` : ''}.`

  const sellerLines = wrapText(sellerText, CONTENT_WIDTH - 8, fontRegular, 8)
  for (const line of sellerLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X + 4,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 10
  }
  cursorY -= 4

  // COMPRADOR
  let buyerText = ''
  if (opts.buyer.type === 'pj') {
    buyerText = `COMPRADOR(A): ${cleanText(opts.buyer.name)}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${cleanText(opts.buyer.cpf_cnpj)}, com sede em ${cleanText(opts.buyer.address)}, ${cleanText(opts.buyer.city)} - ${cleanText(opts.buyer.state)}, CEP ${cleanText(opts.buyer.zip)}${opts.buyer.rep_name ? `, neste ato representada por seu responsável legal ${cleanText(opts.buyer.rep_name)}, inscrito no CPF nº ${cleanText(opts.buyer.rep_cpf || '')}` : ''}, telefone ${cleanText(opts.buyer.phone)}, e-mail ${cleanText(opts.buyer.email)}.`
  } else {
    buyerText = `COMPRADOR(A): ${cleanText(opts.buyer.name)}, brasileiro(a), inscrito(a) no CPF sob o nº ${cleanText(opts.buyer.cpf_cnpj)}${opts.buyer.rg_ie ? `, portador(a) do RG/RNE nº ${cleanText(opts.buyer.rg_ie)}` : ''}${opts.buyer.cnh ? `, CNH nº ${cleanText(opts.buyer.cnh)}` : ''}, residente e domiciliado(a) em ${cleanText(opts.buyer.address)}, ${cleanText(opts.buyer.city)} - ${cleanText(opts.buyer.state)}, CEP ${cleanText(opts.buyer.zip)}, telefone ${cleanText(opts.buyer.phone)}, e-mail ${cleanText(opts.buyer.email)}.`
  }

  const buyerLines = wrapText(buyerText, CONTENT_WIDTH - 8, fontRegular, 8)
  for (const line of buyerLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X + 4,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 10
  }
  cursorY -= 8

  // -------------------------------------------------------------
  // 3. DO OBJETO (VEÍCULO)
  // -------------------------------------------------------------
  drawSectionTitle('2. DO OBJETO (DESCRIÇÃO DO VEÍCULO)')

  const v = opts.vehicle
  const vehicleGrid = [
    [
      `Marca/Modelo: ${cleanText(v.brand)} ${cleanText(v.model)}`,
      `Ano Fab/Mod: ${cleanText(String(v.year_fab))}/${cleanText(String(v.year_model))}`,
    ],
    [
      `Placa: ${cleanText(v.plate)}`,
      `Renavam: ${cleanText(v.renavam)}`,
    ],
    [
      `Chassi: ${cleanText(v.chassis)}`,
      `Cor: ${cleanText(v.color)}`,
    ],
    [
      `Combustível: ${cleanText(v.fuel)}`,
      `Km Atual: ${v.mileage ? cleanText(String(v.mileage)) + ' km' : 'Não informado'}`,
    ],
  ]

  const colWidth = (CONTENT_WIDTH - 12) / 2
  for (const row of vehicleGrid) {
    checkPageBreak(12)
    currentPage.drawText(row[0], {
      x: MARGIN_X + 4,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    currentPage.drawText(row[1], {
      x: MARGIN_X + colWidth + 8,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 11
  }

  if (v.features) {
    checkPageBreak(12)
    const optLine = `Opcionais / Acessórios: ${cleanText(v.features)}`
    const optLines = wrapText(optLine, CONTENT_WIDTH - 8, fontRegular, 7.5)
    for (const ol of optLines) {
      currentPage.drawText(ol, {
        x: MARGIN_X + 4,
        y: cursorY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      })
      cursorY -= 9.5
    }
  }
  cursorY -= 8

  // -------------------------------------------------------------
  // 4. PREÇO E CONDIÇÕES DE PAGAMENTO
  // -------------------------------------------------------------
  drawSectionTitle('3. DO PREÇO E CONDIÇÕES DE PAGAMENTO')

  const totalStr = formatCurrency(opts.financial.total_amount)
  const totalExtenso = valorPorExtenso(opts.financial.total_amount)
  const priceStatement = `O valor total da presente compra e venda é de ${totalStr} (${totalExtenso}), a ser pago na seguinte conformidade:`

  const priceLines = wrapText(priceStatement, CONTENT_WIDTH - 8, fontRegular, 8)
  for (const pl of priceLines) {
    checkPageBreak(11)
    currentPage.drawText(pl, {
      x: MARGIN_X + 4,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 10
  }
  cursorY -= 4

  // Sinal / Arras
  if (opts.financial.down_payment && opts.financial.down_payment > 0) {
    checkPageBreak(12)
    const sinalText = `• Sinal e Princípio de Pagamento (Arras): ${formatCurrency(opts.financial.down_payment)}${opts.financial.down_payment_date ? ` pago em ${formatDateBr(opts.financial.down_payment_date)}` : ''}.`
    currentPage.drawText(sinalText, {
      x: MARGIN_X + 8,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 11
  }

  // Tabela de parcelas
  if (opts.financial.installments && opts.financial.installments.length > 0) {
    checkPageBreak(20)
    currentPage.drawText('Cronograma e Formas de Pagamento:', {
      x: MARGIN_X + 8,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 11

    for (const inst of opts.financial.installments) {
      checkPageBreak(12)
      const instLine = `  Parcela ${inst.number}: ${formatCurrency(inst.amount)}  |  Vencimento: ${formatDateBr(inst.due_date)}  |  Forma: ${cleanText(inst.method)}${inst.description ? ` (${cleanText(inst.description)})` : ''}`
      currentPage.drawText(instLine, {
        x: MARGIN_X + 8,
        y: cursorY,
        size: 7.5,
        font: fontRegular,
        color: textColor,
      })
      cursorY -= 10
    }
  }

  // Transferência e taxas
  checkPageBreak(14)
  const respLabel =
    opts.financial.transfer_responsible === 'comprador'
      ? 'COMPRADOR'
      : opts.financial.transfer_responsible === 'vendedor'
      ? 'VENDEDOR'
      : 'dividida igualmente entre COMPRADOR e VENDEDOR (50% cada)'

  let despLine = `• Responsabilidade pelas despesas de transferência e vistoria: ${respLabel}.`
  if (opts.financial.transfer_fee_amount && opts.financial.transfer_fee_amount > 0) {
    despLine += ` Valor estimado das taxas/documento: ${formatCurrency(opts.financial.transfer_fee_amount)}.`
  }
  currentPage.drawText(despLine, {
    x: MARGIN_X + 8,
    y: cursorY,
    size: 7.5,
    font: fontRegular,
    color: textColor,
  })
  cursorY -= 11

  // Observações financeiras
  if (opts.financial.notes) {
    checkPageBreak(12)
    const notesText = `Observações financeiras: ${cleanText(opts.financial.notes)}`
    const notesLines = wrapText(notesText, CONTENT_WIDTH - 16, fontRegular, 7.5)
    for (const nl of notesLines) {
      currentPage.drawText(nl, {
        x: MARGIN_X + 8,
        y: cursorY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      })
      cursorY -= 9.5
    }
  }
  cursorY -= 8

  // -------------------------------------------------------------
  // 5. CLÁUSULAS CONTRATUAIS
  // -------------------------------------------------------------
  drawSectionTitle('4. DAS CLÁUSULAS E CONDIÇÕES GERAIS')

  const foroCidade = opts.store.contract_foro_cidade || 'São Paulo'
  const foroEstado = opts.store.contract_foro_estado || 'SP'

  for (const clause of opts.clauses) {
    checkPageBreak(25)

    // Título da cláusula
    currentPage.drawText(cleanText(clause.title), {
      x: MARGIN_X + 4,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 10.5

    // Substitui placeholders caso existam
    let text = clause.text
      .replace(/{cidade_foro}/g, foroCidade)
      .replace(/{estado_foro}/g, foroEstado)
      .replace(/{prazo_entrega_dias}/g, '5')

    const lines = wrapText(text, CONTENT_WIDTH - 8, fontRegular, 7.5)
    for (const line of lines) {
      checkPageBreak(11)
      currentPage.drawText(line, {
        x: MARGIN_X + 4,
        y: cursorY,
        size: 7.5,
        font: fontRegular,
        color: textColor,
      })
      cursorY -= 9.5
    }
    cursorY -= 4
  }

  // -------------------------------------------------------------
  // 6. LOCAL, DATA E ASSINATURAS
  // -------------------------------------------------------------
  checkPageBreak(140)

  const meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]
  const today = new Date()
  const dateFormatted = `${foroCidade} - ${foroEstado}, ${today.getDate()} de ${meses[today.getMonth()]} de ${today.getFullYear()}.`

  currentPage.drawText(
    `E por estarem assim justos e contratados, firmam o presente instrumento em vias de igual teor e forma.`,
    {
      x: MARGIN_X + 4,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    }
  )
  cursorY -= 12

  currentPage.drawText(dateFormatted, {
    x: MARGIN_X + 4,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: textColor,
  })
  cursorY -= 35

  // ASSINATURAS (Modo Impressão vs Assinatura Digital)
  const halfColWidth = (CONTENT_WIDTH - 24) / 2

  if (opts.isPrintVersion) {
    // Linha Vendedor
    currentPage.drawLine({
      start: { x: MARGIN_X, y: cursorY },
      end: { x: MARGIN_X + halfColWidth, y: cursorY },
      thickness: 0.8,
      color: textColor,
    })

    // Linha Comprador
    currentPage.drawLine({
      start: { x: MARGIN_X + halfColWidth + 24, y: cursorY },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: cursorY },
      thickness: 0.8,
      color: textColor,
    })
    cursorY -= 12

    // Textos Vendedor
    currentPage.drawText(cleanText(opts.store.contract_razao_social || opts.store.name), {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    currentPage.drawText(cleanText(opts.buyer.name), {
      x: MARGIN_X + halfColWidth + 24,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 10

    currentPage.drawText(`VENDEDOR (CNPJ: ${cleanText(opts.store.contract_cnpj || '')})`, {
      x: MARGIN_X,
      y: cursorY,
      size: 7,
      font: fontRegular,
      color: textMuted,
    })
    currentPage.drawText(`COMPRADOR (${cleanText(opts.buyer.cpf_cnpj)})`, {
      x: MARGIN_X + halfColWidth + 24,
      y: cursorY,
      size: 7,
      font: fontRegular,
      color: textMuted,
    })
    cursorY -= 35

    // Linhas para Testemunhas
    currentPage.drawLine({
      start: { x: MARGIN_X, y: cursorY },
      end: { x: MARGIN_X + halfColWidth, y: cursorY },
      thickness: 0.6,
      color: grayBorder,
    })
    currentPage.drawLine({
      start: { x: MARGIN_X + halfColWidth + 24, y: cursorY },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: cursorY },
      thickness: 0.6,
      color: grayBorder,
    })
    cursorY -= 11

    currentPage.drawText('Testemunha 1: ___________________________  CPF: ___________________', {
      x: MARGIN_X,
      y: cursorY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    })
    currentPage.drawText('Testemunha 2: ___________________________  CPF: ___________________', {
      x: MARGIN_X + halfColWidth + 24,
      y: cursorY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    })
  } else if (opts.isFinalSigned && opts.signers && opts.signers.length > 0) {
    // -------------------------------------------------------------
    // ASSINATURAS DIGITAIS EFETUADAS (FASE 4)
    // -------------------------------------------------------------
    const sellerSigner = opts.signers.find((s) => s.role === 'seller')
    const buyerSigner = opts.signers.find((s) => s.role === 'buyer')

    // Tenta embutir imagens das assinaturas
    const sellerImg = sellerSigner?.signatureImageUrl
      ? await embedSignatureImage(pdfDoc, sellerSigner.signatureImageUrl)
      : null
    const buyerImg = buyerSigner?.signatureImageUrl
      ? await embedSignatureImage(pdfDoc, buyerSigner.signatureImageUrl)
      : null

    if (sellerImg) {
      currentPage.drawImage(sellerImg, {
        x: MARGIN_X,
        y: cursorY - 10,
        width: Math.min(sellerImg.width * 0.25, 120),
        height: 35,
      })
    }
    if (buyerImg) {
      currentPage.drawImage(buyerImg, {
        x: MARGIN_X + halfColWidth + 24,
        y: cursorY - 10,
        width: Math.min(buyerImg.width * 0.25, 120),
        height: 35,
      })
    }

    cursorY -= 15

    // Linha Vendedor
    currentPage.drawLine({
      start: { x: MARGIN_X, y: cursorY },
      end: { x: MARGIN_X + halfColWidth, y: cursorY },
      thickness: 0.8,
      color: brandColor,
    })

    // Linha Comprador
    currentPage.drawLine({
      start: { x: MARGIN_X + halfColWidth + 24, y: cursorY },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: cursorY },
      thickness: 0.8,
      color: brandColor,
    })
    cursorY -= 12

    // Dados Vendedor
    currentPage.drawText(cleanText(sellerSigner?.name || opts.store.contract_razao_social || opts.store.name), {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    currentPage.drawText(cleanText(buyerSigner?.name || opts.buyer.name), {
      x: MARGIN_X + halfColWidth + 24,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 10

    const sellerSub = `VENDEDOR • Assinado em ${sellerSigner?.signedAt ? new Date(sellerSigner.signedAt).toLocaleDateString('pt-BR') : dateFormatted}`
    const buyerSub = `COMPRADOR • Assinado em ${buyerSigner?.signedAt ? new Date(buyerSigner.signedAt).toLocaleDateString('pt-BR') : dateFormatted}`

    currentPage.drawText(cleanText(sellerSub), {
      x: MARGIN_X,
      y: cursorY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    })
    currentPage.drawText(cleanText(buyerSub), {
      x: MARGIN_X + halfColWidth + 24,
      y: cursorY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    })
    cursorY -= 9

    const sellerIp = `IP: ${cleanText(sellerSigner?.ip || 'Autenticado no Admin')} • Lei 14.063/2020`
    const buyerIp = `IP: ${cleanText(buyerSigner?.ip || 'Assinatura Eletrônica')} • Lei 14.063/2020`

    currentPage.drawText(sellerIp, {
      x: MARGIN_X,
      y: cursorY,
      size: 6,
      font: fontRegular,
      color: brandColor,
    })
    currentPage.drawText(buyerIp, {
      x: MARGIN_X + halfColWidth + 24,
      y: cursorY,
      size: 6,
      font: fontRegular,
      color: brandColor,
    })
  } else {
    // Área de Assinatura Eletrônica (Fase 4 / Prévia)
    currentPage.drawRectangle({
      x: MARGIN_X,
      y: cursorY - 50,
      width: CONTENT_WIDTH,
      height: 55,
      color: grayLight,
      borderColor: grayBorder,
      borderWidth: 0.8,
    })

    currentPage.drawText('ASSINATURA ELETRÔNICA (LEI 14.063/2020)', {
      x: MARGIN_X + 12,
      y: cursorY - 14,
      size: 8,
      font: fontBold,
      color: brandColor,
    })

    currentPage.drawText(
      'Este documento será assinado eletronicamente através de link único com verificação OTP e registro de auditoria.',
      {
        x: MARGIN_X + 12,
        y: cursorY - 26,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      }
    )

    currentPage.drawText(
      `Signatários: ${cleanText(opts.buyer.name)} (${cleanText(opts.buyer.email)}) e ${cleanText(opts.store.contract_razao_social || opts.store.name)}.`,
      {
        x: MARGIN_X + 12,
        y: cursorY - 38,
        size: 7.5,
        font: fontRegular,
        color: textColor,
      }
    )
  }

  // -------------------------------------------------------------
  // CERTIFICADO DE EVIDÊNCIAS DE ASSINATURA ELETRÔNICA (FASE 4)
  // -------------------------------------------------------------
  if (opts.isFinalSigned && opts.signers && opts.signers.length > 0) {
    const certPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    pages.push(certPage)

    let certY = PAGE_HEIGHT - MARGIN_X

    // Faixa superior decorativa
    certPage.drawRectangle({
      x: MARGIN_X,
      y: certY - 2,
      width: CONTENT_WIDTH,
      height: 3,
      color: brandColor,
    })
    certY -= 20

    certPage.drawText('CERTIFICADO DE CONFORMIDADE E EVIDÊNCIAS', {
      x: MARGIN_X,
      y: certY,
      size: 13,
      font: fontBold,
      color: brandColor,
    })
    certY -= 14

    certPage.drawText('VALIDAÇÃO JURÍDICA DE ASSINATURA ELETRÔNICA • LEI FEDERAL Nº 14.063/2020', {
      x: MARGIN_X,
      y: certY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    certY -= 16

    certPage.drawText(
      'As partes abaixo identificadas assinaram eletronicamente o presente contrato após validação de identidade e código de uso único (OTP), com registro cronológico e integridade garantida por hash criptográfico.',
      {
        x: MARGIN_X,
        y: certY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      }
    )
    certY -= 25

    // Caixa de Informações do Documento
    certPage.drawRectangle({
      x: MARGIN_X,
      y: certY - 45,
      width: CONTENT_WIDTH,
      height: 50,
      color: grayLight,
      borderColor: grayBorder,
      borderWidth: 0.8,
    })

    certPage.drawText(`Documento: Contrato de Compra e Venda Nº ${opts.number}/${currentYear}`, {
      x: MARGIN_X + 10,
      y: certY - 14,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    certPage.drawText(`Veículo: ${cleanText(opts.vehicle.brand)} ${cleanText(opts.vehicle.model)} • Placa: ${cleanText(opts.vehicle.plate)} • Chassi: ${cleanText(opts.vehicle.chassis)}`, {
      x: MARGIN_X + 10,
      y: certY - 26,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    })
    certPage.drawText(`Hash Criptográfico do Contrato (SHA-256): ${opts.sha256Hash || 'Verificação nativa do documento digital'}`, {
      x: MARGIN_X + 10,
      y: certY - 38,
      size: 6.5,
      font: fontRegular,
      color: brandColor,
    })
    certY -= 65

    // Lista de Evidências por Signatário
    for (const signer of opts.signers) {
      const cardHeight = 110
      certPage.drawRectangle({
        x: MARGIN_X,
        y: certY - cardHeight,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: grayLight,
        borderColor: grayBorder,
        borderWidth: 0.8,
      })

      // Barra lateral de status no card
      certPage.drawRectangle({
        x: MARGIN_X,
        y: certY - cardHeight,
        width: 4,
        height: cardHeight,
        color: brandColor,
      })

      let cardY = certY - 14
      const isBuyer = signer.role === 'buyer'
      const roleLabel = isBuyer ? 'COMPRADOR' : 'VENDEDOR / REPRESENTANTE'

      certPage.drawText(`[ASSINADO ELETRONICAMENTE] ${roleLabel}`, {
        x: MARGIN_X + 14,
        y: cardY,
        size: 8,
        font: fontBold,
        color: brandColor,
      })
      cardY -= 14

      certPage.drawText(`Nome Completo: ${cleanText(signer.name)}`, {
        x: MARGIN_X + 14,
        y: cardY,
        size: 8,
        font: fontBold,
        color: textColor,
      })
      cardY -= 12

      certPage.drawText(`Documento (CPF/CNPJ): ${cleanText(signer.document)} • E-mail: ${cleanText(signer.email || 'Não informado')}`, {
        x: MARGIN_X + 14,
        y: cardY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      })
      cardY -= 12

      if (signer.phone) {
        certPage.drawText(`Telefone / WhatsApp: ${cleanText(signer.phone)}`, {
          x: MARGIN_X + 14,
          y: cardY,
          size: 7.5,
          font: fontRegular,
          color: textMuted,
        })
        cardY -= 12
      }

      const signedDateStr = signer.signedAt
        ? new Date(signer.signedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'Assinado eletronicamente'

      certPage.drawText(`Data/Hora da Assinatura: ${signedDateStr} (Horário de Brasília)`, {
        x: MARGIN_X + 14,
        y: cardY,
        size: 7.5,
        font: fontBold,
        color: textColor,
      })
      cardY -= 12

      certPage.drawText(`Autenticação: Código OTP verificado via e-mail • IP de Origem: ${cleanText(signer.ip || '127.0.0.1')}`, {
        x: MARGIN_X + 14,
        y: cardY,
        size: 7,
        font: fontRegular,
        color: textMuted,
      })
      cardY -= 11

      const ua = signer.userAgent ? cleanText(signer.userAgent).slice(0, 75) : 'Navegador Web Conforme'
      certPage.drawText(`Dispositivo / Navegador: ${ua}`, {
        x: MARGIN_X + 14,
        y: cardY,
        size: 6.5,
        font: fontRegular,
        color: textMuted,
      })

      // Se houver imagem da assinatura, desenha à direita do card
      if (signer.signatureImageUrl) {
        const sigImg = await embedSignatureImage(pdfDoc, signer.signatureImageUrl)
        if (sigImg) {
          certPage.drawImage(sigImg, {
            x: MARGIN_X + CONTENT_WIDTH - 120,
            y: certY - cardHeight + 20,
            width: 100,
            height: 38,
          })
        }
      }

      certY -= cardHeight + 15
    }

    // Declaração jurídica final
    certPage.drawText(
      'DECLARAÇÃO DE EFICÁCIA PROBATÓRIA: Este certificado atesta a autenticidade e integridade das assinaturas eletrônicas apostas,',
      {
        x: MARGIN_X,
        y: certY,
        size: 6.5,
        font: fontBold,
        color: textColor,
      }
    )
    certY -= 9
    certPage.drawText(
      'nos termos do art. 10, § 2º da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020. O hash garante a não alteração posterior do documento.',
      {
        x: MARGIN_X,
        y: certY,
        size: 6.5,
        font: fontRegular,
        color: textMuted,
      }
    )
  }

  // -------------------------------------------------------------
  // 7. RODAPÉ COM PAGINAÇÃO EM TODAS AS PÁGINAS
  // -------------------------------------------------------------
  const totalPages = pages.length
  for (let i = 0; i < totalPages; i++) {
    const p = pages[i]
    p.drawLine({
      start: { x: MARGIN_X, y: 32 },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: 32 },
      thickness: 0.5,
      color: grayBorder,
    })

    const footerLeft = `Contrato Nº ${opts.number}/${currentYear} • ${cleanText(opts.store.name)}`
    p.drawText(footerLeft, {
      x: MARGIN_X,
      y: 22,
      size: 7,
      font: fontRegular,
      color: textMuted,
    })

    const pageStr = `Página ${i + 1} de ${totalPages}`
    const pageStrWidth = fontRegular.widthOfTextAtSize(pageStr, 7)
    p.drawText(pageStr, {
      x: MARGIN_X + CONTENT_WIDTH - pageStrWidth,
      y: 22,
      size: 7,
      font: fontRegular,
      color: textMuted,
    })
  }

  return await pdfDoc.save()
}

export const generateContractPdf = generateVehicleSaleContractPdf

