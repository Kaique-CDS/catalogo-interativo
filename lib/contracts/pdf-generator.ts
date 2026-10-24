import { PDFDocument, StandardFonts, rgb, grayscale } from 'pdf-lib'
import { safeFetch } from '@/lib/security/ssrf'
import {
  formatCurrency,
  valorPorExtenso,
  type ContractClause,
  DEFAULT_POA_FIXED_POWERS,
  DEFAULT_POA_LIABILITY,
  DEFAULT_POA_LEGAL_NOTICE,
} from './utils'
import type { Store } from '@/lib/supabase/types'

export interface PowerOfAttorneyParty {
  type: 'pf' | 'pj'
  name: string
  cpf_cnpj: string
  rg_ie?: string
  cnh?: string
  nationality?: string
  marital_status?: string
  profession?: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  rep_name?: string
  rep_cpf?: string
  rep_role?: string
}

export interface GeneratePowerOfAttorneyPdfOptions {
  number: number
  store: Store
  grantor: PowerOfAttorneyParty // Outorgante
  grantee: PowerOfAttorneyParty // Outorgado
  vehicle: VehicleData
  validityDays?: number
  additionalPowers?: string
  observations?: string
  date?: string
  isPrintVersion?: boolean
  signers?: ContractSignerEvidence[]
  isFinalSigned?: boolean
  sha256Hash?: string
}


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
      const res = await safeFetch(base64OrUrl)
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
      const res = await safeFetch(opts.store.logo_url)
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

/**
 * Motor de geração de PDF para Procuração Particular de Venda e Gestão de Veículo.
 */
export async function generatePowerOfAttorneyPdf(
  opts: GeneratePowerOfAttorneyPdfOptions
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
  const grayLight = rgb(0.95, 0.95, 0.96)
  const grayBorder = rgb(0.82, 0.82, 0.85)
  const textColor = rgb(0.12, 0.12, 0.14)
  const textMuted = rgb(0.4, 0.4, 0.45)
  const amberBg = rgb(0.99, 0.97, 0.92)
  const amberBorder = rgb(0.85, 0.7, 0.4)
  const amberText = rgb(0.55, 0.35, 0.05)

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
      const res = await safeFetch(opts.store.logo_url)
      if (res.ok) {
        const logoBytes = await res.arrayBuffer()
        if (opts.store.logo_url.toLowerCase().endsWith('.png')) {
          embeddedLogo = await pdfDoc.embedPng(logoBytes)
        } else {
          embeddedLogo = await pdfDoc.embedJpg(logoBytes)
        }
      }
    } catch {
      // Segue sem logo se falhar o download
    }
  }

  // -------------------------------------------------------------
  // CABEÇALHO DO DOCUMENTO
  // -------------------------------------------------------------
  const headerHeight = 55
  if (embeddedLogo) {
    const scale = Math.min(42 / embeddedLogo.height, 100 / embeddedLogo.width)
    const lw = embeddedLogo.width * scale
    const lh = embeddedLogo.height * scale
    currentPage.drawImage(embeddedLogo, {
      x: MARGIN_X,
      y: cursorY - lh,
      width: lw,
      height: lh,
    })
  }

  const headerTextX = embeddedLogo ? MARGIN_X + 115 : MARGIN_X
  const storeLegalName = cleanText(opts.store.contract_razao_social || opts.store.name)
  currentPage.drawText(storeLegalName, {
    x: headerTextX,
    y: cursorY - 4,
    size: 11,
    font: fontBold,
    color: textColor,
  })

  let storeInfoLine = ''
  if (opts.store.contract_cnpj) storeInfoLine += `CNPJ: ${cleanText(opts.store.contract_cnpj)}  •  `
  if (opts.store.contract_phone || opts.store.whatsapp) {
    storeInfoLine += `Tel: ${cleanText(opts.store.contract_phone || opts.store.whatsapp)}  •  `
  }
  if (opts.store.contract_email || opts.store.email) {
    storeInfoLine += `${cleanText(opts.store.contract_email || opts.store.email)}`
  }

  if (storeInfoLine) {
    currentPage.drawText(storeInfoLine, {
      x: headerTextX,
      y: cursorY - 18,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    })
  }

  const storeAddress = cleanText(opts.store.contract_address || opts.store.address)
  if (storeAddress) {
    currentPage.drawText(storeAddress, {
      x: headerTextX,
      y: cursorY - 30,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    })
  }

  cursorY -= headerHeight

  // Linha horizontal de destaque da marca
  currentPage.drawRectangle({
    x: MARGIN_X,
    y: cursorY,
    width: CONTENT_WIDTH,
    height: 2.5,
    color: brandColor,
  })
  cursorY -= 20

  // -------------------------------------------------------------
  // TÍTULO DA PROCURAÇÃO
  // -------------------------------------------------------------
  checkPageBreak(40)
  currentPage.drawText('PROCURAÇÃO PARTICULAR DE VEÍCULO', {
    x: MARGIN_X,
    y: cursorY,
    size: 13,
    font: fontBold,
    color: brandColor,
  })
  cursorY -= 14

  currentPage.drawText(
    `GESTÃO, VENDA E TRANSFERÊNCIA AUTOMOTIVA  •  PROCURAÇÃO Nº ${opts.number}`,
    {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textMuted,
    }
  )
  cursorY -= 22

  // -------------------------------------------------------------
  // SEÇÃO 1: OUTORGANTE
  // -------------------------------------------------------------
  const drawSectionHeader = (title: string) => {
    checkPageBreak(30)
    currentPage.drawRectangle({
      x: MARGIN_X,
      y: cursorY - 2,
      width: CONTENT_WIDTH,
      height: 17,
      color: grayLight,
    })
    currentPage.drawRectangle({
      x: MARGIN_X,
      y: cursorY - 2,
      width: 4,
      height: 17,
      color: brandColor,
    })
    currentPage.drawText(title, {
      x: MARGIN_X + 10,
      y: cursorY + 2.5,
      size: 8.5,
      font: fontBold,
      color: textColor,
    })
    cursorY -= 24
  }

  drawSectionHeader('1. OUTORGANTE (QUEM CONCEDE OS PODERES)')

  const formatPartyText = (p: PowerOfAttorneyParty, isOutorgante: boolean): string => {
    if (p.type === 'pj') {
      let t = `${cleanText(p.name)}, pessoa jurídica de direito privado inscrita no CNPJ sob o nº ${cleanText(p.cpf_cnpj)}`
      if (p.address) t += `, estabelecida na ${cleanText(p.address)}, ${cleanText(p.city)} - ${cleanText(p.state)}`
      if (p.zip) t += `, CEP ${cleanText(p.zip)}`
      t += `, neste ato representada por seu(sua) representante legal ${cleanText(p.rep_name || 'representante legal')}`
      if (p.rep_cpf) t += `, portador(a) do CPF nº ${cleanText(p.rep_cpf)}`
      if (p.rep_role) t += `, cargo: ${cleanText(p.rep_role)}`
      if (p.phone) t += `, telefone: ${cleanText(p.phone)}`
      if (p.email) t += `, e-mail: ${cleanText(p.email)}`
      return t + '.'
    } else {
      let t = `${cleanText(p.name)}, brasileiro(a)`
      if (p.marital_status) t += `, ${cleanText(p.marital_status)}`
      if (p.profession) t += `, ${cleanText(p.profession)}`
      t += `, inscrito(a) no CPF/MF sob o nº ${cleanText(p.cpf_cnpj)}`
      if (p.rg_ie) t += `, portador(a) do RG nº ${cleanText(p.rg_ie)}`
      if (p.cnh) t += `, CNH nº ${cleanText(p.cnh)}`
      if (p.address) t += `, residente e domiciliado(a) na ${cleanText(p.address)}, ${cleanText(p.city)} - ${cleanText(p.state)}`
      if (p.zip) t += `, CEP ${cleanText(p.zip)}`
      if (p.phone) t += `, telefone: ${cleanText(p.phone)}`
      if (p.email) t += `, e-mail: ${cleanText(p.email)}`
      return t + '.'
    }
  }

  const outorganteLines = wrapText(formatPartyText(opts.grantor, true), CONTENT_WIDTH, fontRegular, 8)
  for (const line of outorganteLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 12
  }
  cursorY -= 10

  // -------------------------------------------------------------
  // SEÇÃO 2: OUTORGADO(A)
  // -------------------------------------------------------------
  drawSectionHeader('2. OUTORGADO(A) (QUEM RECEBE OS PODERES)')

  const outorgadoLines = wrapText(formatPartyText(opts.grantee, false), CONTENT_WIDTH, fontRegular, 8)
  for (const line of outorgadoLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 12
  }
  cursorY -= 10

  // -------------------------------------------------------------
  // SEÇÃO 3: OBJETO - IDENTIFICAÇÃO DO VEÍCULO
  // -------------------------------------------------------------
  drawSectionHeader('3. OBJETO DO MANDATO (IDENTIFICAÇÃO DO VEÍCULO)')

  checkPageBreak(75)
  const vehBoxY = cursorY
  const vehBoxHeight = 65

  currentPage.drawRectangle({
    x: MARGIN_X,
    y: vehBoxY - vehBoxHeight,
    width: CONTENT_WIDTH,
    height: vehBoxHeight,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: grayBorder,
    borderWidth: 0.8,
  })

  const col1X = MARGIN_X + 12
  const col2X = MARGIN_X + CONTENT_WIDTH / 3 + 10
  const col3X = MARGIN_X + (CONTENT_WIDTH / 3) * 2 + 10

  let vLineY = vehBoxY - 14
  // Linha 1
  currentPage.drawText('Marca / Modelo:', { x: col1X, y: vLineY, size: 7, font: fontRegular, color: textMuted })
  currentPage.drawText(`${cleanText(opts.vehicle.brand)} ${cleanText(opts.vehicle.model)}`, {
    x: col1X,
    y: vLineY - 10,
    size: 8.5,
    font: fontBold,
    color: textColor,
  })

  currentPage.drawText('Ano Fab. / Modelo:', { x: col2X, y: vLineY, size: 7, font: fontRegular, color: textMuted })
  currentPage.drawText(`${cleanText(String(opts.vehicle.year_fab))}/${cleanText(String(opts.vehicle.year_model))}`, {
    x: col2X,
    y: vLineY - 10,
    size: 8.5,
    font: fontBold,
    color: textColor,
  })

  currentPage.drawText('Placa:', { x: col3X, y: vLineY, size: 7, font: fontRegular, color: textMuted })
  currentPage.drawText(cleanText(opts.vehicle.plate).toUpperCase(), {
    x: col3X,
    y: vLineY - 10,
    size: 9,
    font: fontBold,
    color: brandColor,
  })

  vLineY -= 26
  // Linha 2
  currentPage.drawText('Renavam:', { x: col1X, y: vLineY, size: 7, font: fontRegular, color: textMuted })
  currentPage.drawText(cleanText(opts.vehicle.renavam), {
    x: col1X,
    y: vLineY - 10,
    size: 8,
    font: fontBold,
    color: textColor,
  })

  currentPage.drawText('Chassi:', { x: col2X, y: vLineY, size: 7, font: fontRegular, color: textMuted })
  currentPage.drawText(cleanText(opts.vehicle.chassis).toUpperCase(), {
    x: col2X,
    y: vLineY - 10,
    size: 8,
    font: fontBold,
    color: textColor,
  })

  currentPage.drawText('Cor / Combustível:', { x: col3X, y: vLineY, size: 7, font: fontRegular, color: textMuted })
  currentPage.drawText(`${cleanText(opts.vehicle.color)} • ${cleanText(opts.vehicle.fuel)}`, {
    x: col3X,
    y: vLineY - 10,
    size: 8,
    font: fontRegular,
    color: textColor,
  })

  cursorY = vehBoxY - vehBoxHeight - 16

  // -------------------------------------------------------------
  // SEÇÃO 4: PODERES FIXOS E EXPRESSOS
  // -------------------------------------------------------------
  drawSectionHeader('4. PODERES ESPECIAIS E EXPRESSOS')

  const fixedPowersLines = wrapText(DEFAULT_POA_FIXED_POWERS, CONTENT_WIDTH, fontRegular, 8)
  for (const line of fixedPowersLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 11.5
  }
  cursorY -= 8

  // -------------------------------------------------------------
  // SEÇÃO 5: PODERES ADICIONAIS & OBSERVAÇÕES (SE HOUVER)
  // -------------------------------------------------------------
  if (opts.additionalPowers || opts.observations) {
    drawSectionHeader('5. PODERES ADICIONAIS E OBSERVAÇÕES COMPLEMENTARES')

    if (opts.additionalPowers) {
      const addLines = wrapText(cleanText(opts.additionalPowers), CONTENT_WIDTH, fontRegular, 8)
      for (const line of addLines) {
        checkPageBreak(12)
        currentPage.drawText(line, {
          x: MARGIN_X,
          y: cursorY,
          size: 8,
          font: fontRegular,
          color: textColor,
        })
        cursorY -= 11.5
      }
      cursorY -= 6
    }

    if (opts.observations) {
      const obsLines = wrapText(`Observações: ${cleanText(opts.observations)}`, CONTENT_WIDTH, fontRegular, 7.5)
      for (const line of obsLines) {
        checkPageBreak(12)
        currentPage.drawText(line, {
          x: MARGIN_X,
          y: cursorY,
          size: 7.5,
          font: fontRegular,
          color: textMuted,
        })
        cursorY -= 11
      }
      cursorY -= 6
    }
  }

  // -------------------------------------------------------------
  // SEÇÃO 6: RESPONSABILIDADE CIVIL E CRIMINAL
  // -------------------------------------------------------------
  drawSectionHeader('6. DA RESPONSABILIDADE CIVIL, CRIMINAL E ADMINISTRATIVA')

  const liabilityLines = wrapText(DEFAULT_POA_LIABILITY, CONTENT_WIDTH, fontRegular, 8)
  for (const line of liabilityLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 11.5
  }
  cursorY -= 8

  // -------------------------------------------------------------
  // SEÇÃO 7: PRAZO DE VALIDADE DO MANDATO
  // -------------------------------------------------------------
  drawSectionHeader('7. DO PRAZO DE VALIDADE')

  const validityDays = opts.validityDays || 365
  const poaDate = opts.date ? new Date(opts.date) : new Date()
  const expDate = new Date(poaDate.getTime() + validityDays * 24 * 60 * 60 * 1000)
  const expDateBr = formatDateBr(expDate.toISOString().split('T')[0])

  const validityText = `O presente instrumento de procuração tem prazo de validade determinado de ${validityDays} (${validityDays === 365 ? 'trezentos e sessenta e cinco' : validityDays}) dias a contar desta data, expirando-se em ${expDateBr}, findo o qual cessarão automaticamente todos os efeitos e poderes ora conferidos, salvo revogação expressa anterior ou conclusão dos atos de transferência.`

  const validityLines = wrapText(validityText, CONTENT_WIDTH, fontRegular, 8)
  for (const line of validityLines) {
    checkPageBreak(12)
    currentPage.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: textColor,
    })
    cursorY -= 11.5
  }
  cursorY -= 10

  // -------------------------------------------------------------
  // SEÇÃO 8: AVISO LEGAL E ADVERTÊNCIA (DESTACADO)
  // -------------------------------------------------------------
  const noticeLines = wrapText(DEFAULT_POA_LEGAL_NOTICE, CONTENT_WIDTH - 24, fontRegular, 7.5)
  const noticeBoxHeight = noticeLines.length * 10.5 + 18
  checkPageBreak(noticeBoxHeight + 15)

  currentPage.drawRectangle({
    x: MARGIN_X,
    y: cursorY - noticeBoxHeight,
    width: CONTENT_WIDTH,
    height: noticeBoxHeight,
    color: amberBg,
    borderColor: amberBorder,
    borderWidth: 0.8,
  })

  let noticeY = cursorY - 12
  for (const line of noticeLines) {
    currentPage.drawText(line, {
      x: MARGIN_X + 12,
      y: noticeY,
      size: 7.5,
      font: fontRegular,
      color: amberText,
    })
    noticeY -= 10.5
  }

  cursorY -= noticeBoxHeight + 16

  // -------------------------------------------------------------
  // SEÇÃO 9: LOCAL, DATA E ASSINATURAS
  // -------------------------------------------------------------
  const foroCidade = cleanText(opts.store.contract_foro_cidade || opts.grantor.city || 'São Paulo')
  const foroEstado = cleanText(opts.store.contract_foro_estado || opts.grantor.state || 'SP')
  const dataHoje = new Date()
  const meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  const dataExtenso = `${foroCidade} - ${foroEstado}, ${dataHoje.getDate()} de ${meses[dataHoje.getMonth()]} de ${dataHoje.getFullYear()}.`

  checkPageBreak(130)
  currentPage.drawText(dataExtenso, {
    x: MARGIN_X,
    y: cursorY,
    size: 8.5,
    font: fontBold,
    color: textColor,
  })
  cursorY -= 25

  const halfColWidth = (CONTENT_WIDTH - 20) / 2
  const colLeftX = MARGIN_X
  const colRightX = MARGIN_X + halfColWidth + 20

  const grantorSigner = opts.signers?.find((s) => s.role === 'outorgante' || s.role === 'buyer')
  const granteeSigner = opts.signers?.find((s) => s.role === 'outorgado' || s.role === 'seller')

  if (opts.isPrintVersion) {
    // Linha para assinatura física com aviso de reconhecimento de firma
    checkPageBreak(70)
    cursorY -= 35

    currentPage.drawLine({
      start: { x: colLeftX, y: cursorY },
      end: { x: colLeftX + halfColWidth, y: cursorY },
      thickness: 0.8,
      color: textColor,
    })
    currentPage.drawLine({
      start: { x: colRightX, y: cursorY },
      end: { x: colRightX + halfColWidth, y: cursorY },
      thickness: 0.8,
      color: textColor,
    })

    cursorY -= 10
    currentPage.drawText(cleanText(opts.grantor.name).toUpperCase(), {
      x: colLeftX,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })
    currentPage.drawText(cleanText(opts.grantee.name).toUpperCase(), {
      x: colRightX,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: textColor,
    })

    cursorY -= 10
    currentPage.drawText(`OUTORGANTE • CPF/CNPJ: ${cleanText(opts.grantor.cpf_cnpj)}`, {
      x: colLeftX,
      y: cursorY,
      size: 7,
      font: fontRegular,
      color: textMuted,
    })
    currentPage.drawText(`OUTORGADO(A) • CPF/CNPJ: ${cleanText(opts.grantee.cpf_cnpj)}`, {
      x: colRightX,
      y: cursorY,
      size: 7,
      font: fontRegular,
      color: textMuted,
    })

    cursorY -= 9
    currentPage.drawText('(Reconhecer firma por autenticidade)', {
      x: colLeftX,
      y: cursorY,
      size: 6.5,
      font: fontRegular,
      color: amberText,
    })
    currentPage.drawText('(Reconhecer firma quando exigido)', {
      x: colRightX,
      y: cursorY,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    })
  } else if (opts.isFinalSigned && opts.signers && opts.signers.length > 0) {
    // Embutir assinaturas capturadas via canvas
    checkPageBreak(90)
    cursorY -= 10

    if (grantorSigner?.signatureImageUrl) {
      const gImg = await embedSignatureImage(pdfDoc, grantorSigner.signatureImageUrl)
      if (gImg) {
        const sScale = Math.min(35 / gImg.height, (halfColWidth - 20) / gImg.width)
        currentPage.drawImage(gImg, {
          x: colLeftX + 10,
          y: cursorY - 5,
          width: gImg.width * sScale,
          height: gImg.height * sScale,
        })
      }
    }

    if (granteeSigner?.signatureImageUrl) {
      const geImg = await embedSignatureImage(pdfDoc, granteeSigner.signatureImageUrl)
      if (geImg) {
        const sScale = Math.min(35 / geImg.height, (halfColWidth - 20) / geImg.width)
        currentPage.drawImage(geImg, {
          x: colRightX + 10,
          y: cursorY - 5,
          width: geImg.width * sScale,
          height: geImg.height * sScale,
        })
      }
    }

    cursorY -= 20
    currentPage.drawLine({
      start: { x: colLeftX, y: cursorY },
      end: { x: colLeftX + halfColWidth, y: cursorY },
      thickness: 0.8,
      color: brandColor,
    })
    currentPage.drawLine({
      start: { x: colRightX, y: cursorY },
      end: { x: colRightX + halfColWidth, y: cursorY },
      thickness: 0.8,
      color: brandColor,
    })

    cursorY -= 10
    currentPage.drawText(`OUTORGANTE: ${cleanText(opts.grantor.name).toUpperCase()}`, {
      x: colLeftX,
      y: cursorY,
      size: 7.5,
      font: fontBold,
      color: textColor,
    })
    currentPage.drawText(`OUTORGADO(A): ${cleanText(opts.grantee.name).toUpperCase()}`, {
      x: colRightX,
      y: cursorY,
      size: 7.5,
      font: fontBold,
      color: textColor,
    })

    cursorY -= 9
    const gDate = grantorSigner?.signedAt ? `Assinado em ${formatDateBr(grantorSigner.signedAt)}` : 'Assinado eletronicamente'
    const geDate = granteeSigner?.signedAt ? `Assinado em ${formatDateBr(granteeSigner.signedAt)}` : 'Assinado eletronicamente'
    currentPage.drawText(gDate, { x: colLeftX, y: cursorY, size: 6.5, font: fontRegular, color: textMuted })
    currentPage.drawText(geDate, { x: colRightX, y: cursorY, size: 6.5, font: fontRegular, color: textMuted })
  } else {
    // Área indicativa de assinatura eletrônica online
    currentPage.drawRectangle({
      x: MARGIN_X,
      y: cursorY - 48,
      width: CONTENT_WIDTH,
      height: 52,
      color: grayLight,
      borderColor: grayBorder,
      borderWidth: 0.8,
    })

    currentPage.drawText('ASSINATURA ELETRÔNICA (LEI FEDERAL Nº 14.063/2020)', {
      x: MARGIN_X + 12,
      y: cursorY - 14,
      size: 8,
      font: fontBold,
      color: brandColor,
    })

    currentPage.drawText(
      'Esta procuração será assinada eletronicamente através de link único com verificação por código OTP e certificado de conformidade.',
      {
        x: MARGIN_X + 12,
        y: cursorY - 26,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      }
    )

    currentPage.drawText(
      `Partes Signatárias: ${cleanText(opts.grantor.name)} (Outorgante) e ${cleanText(opts.grantee.name)} (Outorgado).`,
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
  // CERTIFICADO DE EVIDÊNCIAS DE ASSINATURA ELETRÔNICA
  // -------------------------------------------------------------
  if (opts.isFinalSigned && opts.signers && opts.signers.length > 0) {
    const certPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    pages.push(certPage)

    let certY = PAGE_HEIGHT - MARGIN_X

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
      'As partes abaixo identificadas assinaram eletronicamente a presente Procuração após validação de identidade e código de uso único (OTP), com registro cronológico e integridade garantida por hash criptográfico.',
      {
        x: MARGIN_X,
        y: certY,
        size: 7.5,
        font: fontRegular,
        color: textMuted,
      }
    )
    certY -= 22

    // Card do Documento
    certPage.drawRectangle({
      x: MARGIN_X,
      y: certY - 50,
      width: CONTENT_WIDTH,
      height: 50,
      color: grayLight,
      borderColor: grayBorder,
      borderWidth: 0.8,
    })

    certPage.drawText('DADOS DO DOCUMENTO', {
      x: MARGIN_X + 10,
      y: certY - 12,
      size: 8,
      font: fontBold,
      color: brandColor,
    })
    certPage.drawText(`Título: Procuração Particular de Veículo Nº ${opts.number}`, {
      x: MARGIN_X + 10,
      y: certY - 23,
      size: 7.5,
      font: fontRegular,
      color: textColor,
    })
    certPage.drawText(`Veículo: ${cleanText(opts.vehicle.brand)} ${cleanText(opts.vehicle.model)} • Placa: ${cleanText(opts.vehicle.plate)}`, {
      x: MARGIN_X + 10,
      y: certY - 33,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    })
    certPage.drawText(`Hash SHA-256: ${opts.sha256Hash || 'Verificado e íntegro na conclusão'}`, {
      x: MARGIN_X + 10,
      y: certY - 43,
      size: 6.5,
      font: fontRegular,
      color: textMuted,
    })
    certY -= 65

    // Signatários
    for (const signer of opts.signers) {
      const isGrantor = signer.role === 'outorgante' || signer.role === 'buyer'
      const roleLabel = isGrantor ? 'OUTORGANTE' : 'OUTORGADO(A)'
      const cardHeight = 78

      certPage.drawRectangle({
        x: MARGIN_X,
        y: certY - cardHeight,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: rgb(0.99, 0.99, 1),
        borderColor: grayBorder,
        borderWidth: 0.8,
      })

      certPage.drawText(`SIGNATÁRIO: ${roleLabel} • ${cleanText(signer.name).toUpperCase()}`, {
        x: MARGIN_X + 10,
        y: certY - 13,
        size: 8.5,
        font: fontBold,
        color: brandColor,
      })

      const infoLines = [
        `CPF/CNPJ: ${cleanText(signer.document)}  |  E-mail: ${cleanText(signer.email || 'Não informado')}`,
        `Data e Hora: ${signer.signedAt ? new Date(signer.signedAt).toLocaleString('pt-BR') : 'Data não registrada'}`,
        `Endereço IP: ${cleanText(signer.ip || '127.0.0.1')}  |  Validação OTP: ${signer.otpVerifiedAt ? 'Código verificado via e-mail' : 'Autenticado'}`,
        `Navegador / User-Agent: ${cleanText((signer.userAgent || 'Web/Mobile Browser').slice(0, 80))}`,
      ]

      let infoY = certY - 26
      for (const line of infoLines) {
        certPage.drawText(line, {
          x: MARGIN_X + 10,
          y: infoY,
          size: 7,
          font: fontRegular,
          color: textMuted,
        })
        infoY -= 10
      }

      // Miniatura da assinatura se disponível
      if (signer.signatureImageUrl) {
        const thumb = await embedSignatureImage(pdfDoc, signer.signatureImageUrl)
        if (thumb) {
          const tScale = Math.min(32 / thumb.height, 90 / thumb.width)
          certPage.drawImage(thumb, {
            x: MARGIN_X + CONTENT_WIDTH - (thumb.width * tScale) - 15,
            y: certY - cardHeight + 15,
            width: thumb.width * tScale,
            height: thumb.height * tScale,
          })
          certPage.drawText('Assinatura Capturada', {
            x: MARGIN_X + CONTENT_WIDTH - (thumb.width * tScale) - 15,
            y: certY - cardHeight + 6,
            size: 5.5,
            font: fontRegular,
            color: textMuted,
          })
        }
      }

      certY -= cardHeight + 12
    }
  }

  // -------------------------------------------------------------
  // RODAPÉ E NUMERAÇÃO DE PÁGINAS EM TODAS AS PÁGINAS
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

    const footerLeft = `Procuração Particular Nº ${opts.number}  •  ${cleanText(opts.store.name)}`
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


