/**
 * Utilitários para o Módulo de Contratos:
 * - Conversor de valores numéricos para extenso (R$)
 * - Formatadores e máscaras (CPF, CNPJ, CEP, Telefone, Placa, Renavam)
 * - Cláusulas padrão para Compra e Venda de Veículos
 */

// -------------------------------------------------------------
// 1. CONVERSOR DE MOEDA PARA EXTENSO EM PORTUGUÊS (R$)
// -------------------------------------------------------------

const UNIDADES = [
  '',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
]

const DEZENAS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
]

const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
]

function converterCentena(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'

  const c = Math.floor(n / 100)
  const resto = n % 100
  const d = Math.floor(resto / 10)
  const u = resto % 10

  const partes: string[] = []

  if (c > 0) partes.push(CENTENAS[c])

  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto])
    } else {
      partes.push(DEZENAS[d])
      if (u > 0) partes.push(UNIDADES[u])
    }
  }

  return partes.join(' e ')
}

export function valorPorExtenso(valor: number): string {
  if (isNaN(valor) || valor <= 0) return 'zero reais'

  const valorFix = Math.round(valor * 100) / 100
  const inteira = Math.floor(valorFix)
  const centavos = Math.round((valorFix - inteira) * 100)

  const milhoes = Math.floor(inteira / 1000000)
  const milhares = Math.floor((inteira % 1000000) / 1000)
  const unidades = inteira % 1000

  const partes: string[] = []

  if (milhoes > 0) {
    partes.push(
      milhoes === 1
        ? 'um milhão'
        : `${converterCentena(milhoes)} milhões`
    )
  }

  if (milhares > 0) {
    partes.push(
      milhares === 1
        ? 'um mil'
        : `${converterCentena(milhares)} mil`
    )
  }

  if (unidades > 0) {
    partes.push(converterCentena(unidades))
  }

  let textoReais = ''
  if (inteira > 0) {
    const textoPartes = partes.join(' e ')
    textoReais = inteira === 1 ? `${textoPartes} real` : `${textoPartes} reais`
  }

  let textoCentavos = ''
  if (centavos > 0) {
    const centavosExt = converterCentena(centavos)
    textoCentavos = centavos === 1 ? `${centavosExt} centavo` : `${centavosExt} centavos`
  }

  if (textoReais && textoCentavos) {
    return `${textoReais} e ${textoCentavos}`
  }

  return textoReais || textoCentavos || 'zero reais'
}

// -------------------------------------------------------------
// 2. FORMATAÇÃO E MÁSCARAS
// -------------------------------------------------------------

export function formatCurrency(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val
  if (isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function maskCpfCnpj(v: string): string {
  const clean = v.replace(/\D/g, '')
  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14)
  }
  // CNPJ: 00.000.000/0001-00
  return clean
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    .slice(0, 18)
}

export function maskPhone(v: string): string {
  const clean = v.replace(/\D/g, '')
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
      .slice(0, 14)
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    .slice(0, 15)
}

export function maskCep(v: string): string {
  const clean = v.replace(/\D/g, '')
  return clean.replace(/(\d{5})(\d{1,3})$/, '$1-$2').slice(0, 9)
}

export function maskPlaca(v: string): string {
  return v
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7)
}

export function maskRenavam(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
}

// -------------------------------------------------------------
// 3. CLÁUSULAS PADRÃO PARA COMPRA E VENDA DE VEÍCULOS
// -------------------------------------------------------------

export interface ContractClause {
  id: string
  title: string
  text: string
}

export const DEFAULT_SALE_CLAUSES: ContractClause[] = [
  {
    id: 'cl-1',
    title: 'CLÁUSULA PRIMEIRA – DO ESTADO E VISTORIA DO VEÍCULO',
    text: 'O COMPRADOR declara que vistoriou pessoalmente o veículo objeto deste contrato, testando seu funcionamento, verificando seu estado geral de conservação, pintura, tapeçaria, mecânica, elétrica e acessórios, aceitando-o no estado em que se encontra, nada tendo a reclamar quanto a avarias aparentes ou desgaste natural decorrente do tempo de uso.',
  },
  {
    id: 'cl-2',
    title: 'CLÁUSULA SEGUNDA – DO SINAL E RESCISÃO',
    text: 'A quantia paga a título de sinal e princípio de pagamento (arras) tem caráter confirmatório nos termos dos artigos 417 a 420 do Código Civil Brasileiro. Em caso de desistência imotivada por parte do COMPRADOR, o valor do sinal será retido integralmente pelo VENDEDOR como compensação pelas despesas administrativas e reserva do bem.',
  },
  {
    id: 'cl-3',
    title: 'CLÁUSULA TERCEIRA – DA TRADIÇÃO E PRAZO DE ENTREGA',
    text: 'A entrega física do veículo dar-se-á em até {prazo_entrega_dias} dias úteis contados a partir da quitação integral do preço pactuado ou da confirmação da liberação dos recursos de financiamento/consórcio pelas respectivas instituições financeiras.',
  },
  {
    id: 'cl-4',
    title: 'CLÁUSULA QUARTA – DOS DÉBITOS, MULTAS E TRANSFERÊNCIA',
    text: 'O VENDEDOR declara sob as penas da lei que o veículo encontra-se livre e desembaraçado de quaisquer ônus, multas, impostos ou gravames financeiros constituídos até a data da entrega. Todas as infrações de trânsito, multas, taxas, IPVA e demais encargos ocorridos a partir da data e hora da efetiva entrega física do veículo serão de exclusiva responsabilidade do COMPRADOR.',
  },
  {
    id: 'cl-5',
    title: 'CLÁUSULA QUINTA – DO PRAZO DE TRANSFERÊNCIA DE PROPRIEDADE',
    text: 'O COMPRADOR compromete-se a efetivar a transferência de propriedade do veículo junto ao órgão de trânsito competente (Detran) no prazo improrrogável de 30 (trinta) dias a contar do preenchimento e assinatura da Autorização para Transferência de Propriedade do Veículo (ATPV-e), arcando com os custos e taxas aplicáveis.',
  },
  {
    id: 'cl-6',
    title: 'CLÁUSULA SEXTA – DA GARANTIA LEGAL',
    text: 'O veículo seminovo ora transacionado conta com a garantia legal de 90 (noventa) dias para motor e caixa de câmbio (itens internos lubrificados), nos termos do Artigo 26, inciso II do Código de Defesa do Consumidor, não cobrindo itens de desgaste natural (pneus, pastilhas, lâmpadas, filtros, fluidos, suspensão) nem danos causados por mau uso, sinistros ou manutenção inadequada.',
  },
  {
    id: 'cl-7',
    title: 'CLÁUSULA SÉTIMA – DO FORO DE ELEIÇÃO',
    text: 'As partes elegem, de comum acordo, o Foro da Comarca de {cidade_foro} - {estado_foro}, com renúncia expressa a qualquer outro por mais privilegiado que seja, para dirimir quaisquer dúvidas ou litígios decorrentes do presente instrumento.',
  },
]
