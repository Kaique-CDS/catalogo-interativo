/**
 * Gerador Puro de Cláusulas Contratuais Baseado em Questionário (Fase 3)
 * Converte respostas estruturadas de formulário em cláusulas jurídicas precisas,
 * sem nenhum placeholder residual ({...}).
 */

import { ContractClause, formatClauseFullTitle } from './utils'

export interface ClauseContext {
  storeName: string
  storeCity: string
  storeState: string
  hasDownPayment: boolean
  downPaymentAmount?: number
  transferResponsible: 'comprador' | 'vendedor' | 'dividido'
  hasTradeInVehicle?: boolean
  vehicleTradeInSummary?: string
}

export interface ClauseAnswers {
  // 1. Estado do Veículo
  vehicleState: 'vistoriado' | 'laudo' | 'sem_laudo'
  laudoCompany?: string
  laudoNumber?: string
  allowMechanicInspection: boolean

  // 2. Sinal e Desistência
  buyerWithdrawal: 'retencao_total' | 'devolucao_total' | 'retencao_percentual'
  buyerWithdrawalPercent?: number
  sellerWithdrawal: 'dobro' | 'simples'

  // 3. Entrega do Veículo
  deliveryTerm: 'imediata' | 'prazo_dias'
  deliveryDays?: number
  deliveryCondition: 'quitacao' | 'financiamento' | 'personalizado'
  deliveryConditionCustom?: string

  // 4. Multas e Débitos Anteriores
  priorDebtsResponsible: 'vendedor'
  oldFinesPaymentDays: number

  // 5. Transferência de Propriedade
  transferDeadlineDays: number
  transferFeeResponsible: 'comprador' | 'vendedor' | 'dividido'
  authorizeAdministrativeBlock: boolean

  // 6. Garantia
  warrantyType: 'legal_90' | 'estendida_1ano' | 'sem_adicional' | 'repasse'
  warrantyPartner?: string

  // 7. Foro
  forumCity: string
  forumState: string

  // Biblioteca de Extras Ativas
  extraClauses: ExtraClauseConfig[]
}

export interface ExtraClauseConfig {
  id: string
  type: 'troca' | 'financiamento_resolutivo' | 'desistencia_pos_entrega' | 'lgpd' | 'consignacao' | 'livre'
  title: string
  text?: string
  params?: Record<string, any>
}

export const DEFAULT_CLAUSE_ANSWERS: (context: ClauseContext) => ClauseAnswers = (context) => ({
  vehicleState: 'vistoriado',
  allowMechanicInspection: true,
  buyerWithdrawal: 'retencao_total',
  buyerWithdrawalPercent: 20,
  sellerWithdrawal: 'dobro',
  deliveryTerm: 'imediata',
  deliveryDays: 5,
  deliveryCondition: 'quitacao',
  priorDebtsResponsible: 'vendedor',
  oldFinesPaymentDays: 15,
  transferDeadlineDays: 30,
  transferFeeResponsible: context.transferResponsible || 'comprador',
  authorizeAdministrativeBlock: true,
  warrantyType: 'legal_90',
  forumCity: context.storeCity || 'São Paulo',
  forumState: context.storeState || 'SP',
  extraClauses: context.hasTradeInVehicle
    ? [
        {
          id: 'extra-troca',
          type: 'troca',
          title: 'DO VEÍCULO DADO COMO PARTE DE PAGAMENTO (TROCA)',
          params: { summary: context.vehicleTradeInSummary || 'Veículo seminovo' },
        },
      ]
    : [],
})

// -----------------------------------------------------------------------------
// GERADORES INDIVIDUAIS DE CLÁUSULAS (Funções Puras)
// -----------------------------------------------------------------------------

export function buildClause1_Estado(answers: ClauseAnswers): { title: string; text: string } {
  const parts: string[] = []

  if (answers.vehicleState === 'laudo') {
    const laudoInfo = [answers.laudoCompany, answers.laudoNumber].filter(Boolean).join(' - Nº ')
    parts.push(
      `O COMPRADOR declara que teve prévio acesso e vistoriou o laudo de perícia cautelar veicular${
        laudoInfo ? ` (${laudoInfo})` : ''
      }, atestando a integridade estrutural, numeração identificadora de motor/chassi e histórico do bem, aceitando o veículo nas condições expressamente constatadas.`
    )
  } else if (answers.vehicleState === 'sem_laudo') {
    parts.push(
      'O veículo é transacionado sem a realização de laudo cautelar por opção das partes, cabendo ao COMPRADOR a verificação prévia do estado do bem.'
    )
  } else {
    // 'vistoriado' (padrão)
    parts.push(
      'O COMPRADOR declara que vistoriou pessoalmente o veículo objeto deste contrato, testando seu funcionamento, verificando seu estado geral de conservação, pintura, tapeçaria, mecânica, elétrica e acessórios, aceitando-o no estado em que se encontra, nada tendo a reclamar quanto a avarias aparentes ou desgaste natural decorrente do tempo de uso.'
    )
  }

  if (answers.allowMechanicInspection) {
    parts.push(
      'Restou franqueado ao COMPRADOR o direito de submeter o veículo à avaliação prévia por profissional mecânico de sua estrita confiança antes da assinatura deste instrumento.'
    )
  }

  return {
    title: 'DO ESTADO E VISTORIA DO VEÍCULO',
    text: parts.join(' '),
  }
}

export function buildClause2_Sinal(answers: ClauseAnswers): { title: string; text: string } {
  const parts: string[] = []

  parts.push(
    'A quantia paga a título de sinal e princípio de pagamento (arras) tem caráter confirmatório nos termos dos artigos 417 a 420 do Código Civil Brasileiro.'
  )

  if (answers.buyerWithdrawal === 'devolucao_total') {
    parts.push(
      'Em caso de desistência imotivada manifestada pelo COMPRADOR antes da entrega física, o valor do sinal será restituído integralmente sem juros ou correção.'
    )
  } else if (answers.buyerWithdrawal === 'retencao_percentual') {
    const pct = answers.buyerWithdrawalPercent || 20
    parts.push(
      `Em caso de desistência imotivada por parte do COMPRADOR, o percentual de ${pct}% (por cento) do sinal será retido pelo VENDEDOR como compensação pelas despesas de intermediação e reserva, restituindo-se o saldo remanescente.`
    )
  } else {
    // 'retencao_total' (padrão)
    parts.push(
      'Em caso de desistência imotivada por parte do COMPRADOR, o valor do sinal será retido integralmente pelo VENDEDOR como compensação pelas despesas administrativas, guarda e reserva do bem.'
    )
  }

  if (answers.sellerWithdrawal === 'dobro') {
    parts.push(
      'Se a desistência ou impossibilidade decorrer de culpa exclusiva do VENDEDOR, o sinal será devolvido com a atualização legal e o equivalente em dobro, nos termos do art. 418 do Código Civil.'
    )
  } else {
    parts.push(
      'Se a desistência decorrer de impossibilidade fortuita do VENDEDOR, haverá a restituição simples e imediata do sinal recebido.'
    )
  }

  return {
    title: 'DO SINAL E RESCISÃO CONTRATUAL',
    text: parts.join(' '),
  }
}

export function buildClause3_Entrega(answers: ClauseAnswers): { title: string; text: string } {
  let prazoTexto = 'no ato da assinatura deste instrumento e conferência dos pagamentos'
  if (answers.deliveryTerm === 'prazo_dias') {
    const dias = answers.deliveryDays || 5
    prazoTexto = `em até ${dias} (${dias === 1 ? 'um dia útil' : `${dias} dias úteis`})`
  }

  let condicaoTexto = 'da quitação integral do preço pactuado'
  if (answers.deliveryCondition === 'financiamento') {
    condicaoTexto =
      'da efetiva comprovação de aprovação e crédito dos valores de financiamento bancário ou consórcio'
  } else if (answers.deliveryCondition === 'personalizado' && answers.deliveryConditionCustom) {
    condicaoTexto = answers.deliveryConditionCustom.trim()
  }

  return {
    title: 'DA TRADIÇÃO E PRAZO DE ENTREGA',
    text: `A entrega física do veículo dar-se-á ${prazoTexto}, condicionada à confirmação expressa ${condicaoTexto}, momento em que o COMPRADOR assumirá a posse direta sobre o automotor.`,
  }
}

export function buildClause4_Debitos(answers: ClauseAnswers): { title: string; text: string } {
  const dias = answers.oldFinesPaymentDays || 15
  return {
    title: 'DOS DÉBITOS, MULTAS E ENCARGOS ANTERIORES',
    text: `O VENDEDOR declara sob as penas da lei que o veículo encontra-se livre de quaisquer ônus, gravames fiscais, multas, impostos ou taxas constituídos até a data e hora da efetiva entrega. Caso venham a ser lançadas infrações de trânsito ou débitos cujo fato gerador tenha ocorrido antes da entrega, o VENDEDOR obriga-se a quitá-los ou proceder com a indicação do condutor/recurso no prazo improrrogável de ${dias} dias úteis contados da notificação. Todas as infrações e encargos posteriores à posse física são de exclusiva responsabilidade do COMPRADOR.`,
  }
}

export function buildClause5_Transferencia(answers: ClauseAnswers): { title: string; text: string } {
  const prazo = answers.transferDeadlineDays || 30
  let custasTexto = 'arcando integralmente com os custos de vistoria, taxas do Detran e emissão do novo CRLV-e'
  if (answers.transferFeeResponsible === 'vendedor') {
    custasTexto = 'ficando as taxas do Detran e vistoria sob responsabilidade e custeio do VENDEDOR'
  } else if (answers.transferFeeResponsible === 'dividido') {
    custasTexto = 'sendo os custos e taxas de transferência rateados igualmente (50% cada) entre as partes'
  }

  const partes = [
    `O COMPRADOR compromete-se a efetivar a transferência de propriedade perante o órgão de trânsito competente (Detran) no prazo de até ${prazo} dias a contar da assinatura da ATPV-e, ${custasTexto}.`,
  ]

  if (answers.authorizeAdministrativeBlock) {
    partes.push(
      'Descumprido o prazo acima estipulado, fica o VENDEDOR expressamente autorizado a proceder com a comunicação de venda junto ao Detran ou requerer o bloqueio administrativo do prontuário por falta de transferência.'
    )
  }

  return {
    title: 'DO PRAZO E RESPONSABILIDADE DA TRANSFERÊNCIA',
    text: partes.join(' '),
  }
}

export function buildClause6_Garantia(answers: ClauseAnswers): { title: string; text: string } {
  if (answers.warrantyType === 'estendida_1ano') {
    const gestora = answers.warrantyPartner ? ` através da gestora parceira ${answers.warrantyPartner}` : ''
    return {
      title: 'DA GARANTIA ESTENDIDA',
      text: `O veículo conta com Garantia Mecânica Estendida pelo período de 1 (um) ano${gestora}, conforme certificado e manual de garantia entregue ao COMPRADOR, cobrindo os componentes mecânicos e elétricos especificados na respectiva apólice, mantida a garantia legal de 90 dias prevista no Código de Defesa do Consumidor.`,
    }
  }

  if (answers.warrantyType === 'repasse') {
    return {
      title: 'DO REPASSE COMERCIAL E AUSÊNCIA DE GARANTIA MECÂNICA',
      text: 'O veículo é adquirido sob a modalidade comercial de repasse no estado em que se encontra, com abatimento expressivo sobre o valor médio de mercado, assumindo o COMPRADOR integral responsabilidade por quaisquer reparos mecânicos, elétricos ou de funilaria que venham a ser necessários, ciente de que não haverá garantia adicional da loja fora das hipóteses irrenunciáveis de ordem pública.',
    }
  }

  if (answers.warrantyType === 'sem_adicional') {
    return {
      title: 'DA GARANTIA LEGAL DE 90 DIAS',
      text: 'O veículo conta exclusivamente com a garantia legal de 90 (noventa) dias para motor e caixa de câmbio (itens internos lubrificados), nos termos do Artigo 26, inciso II do Código de Defesa do Consumidor, não cobrindo desgaste de pneus, freios, suspensão e itens de manutenção preventiva.',
    }
  }

  // 'legal_90' (padrão)
  return {
    title: 'DA GARANTIA LEGAL DO VEÍCULO',
    text: 'O veículo seminovo ora transacionado conta com a garantia legal de 90 (noventa) dias para motor e caixa de câmbio (itens internos lubrificados), nos termos do Artigo 26, inciso II do Código de Defesa do Consumidor, não cobrindo itens de desgaste natural (pneus, pastilhas, lâmpadas, filtros, fluidos, suspensão) nem avarias provocadas por mau uso, sinistros ou ausência de manutenção periódica indicada pelo fabricante.',
  }
}

export function buildClause7_Foro(answers: ClauseAnswers): { title: string; text: string } {
  const cidade = answers.forumCity?.trim() || 'São Paulo'
  const estado = answers.forumState?.trim() || 'SP'

  return {
    title: 'DO FORO DE ELEIÇÃO',
    text: `As partes elegem, de comum acordo, o Foro da Comarca de ${cidade} - ${estado}, com renúncia expressa a qualquer outro por mais privilegiado que seja, para dirimir quaisquer dúvidas, controvérsias ou litígios decorrentes do presente contrato.`,
  }
}

// -----------------------------------------------------------------------------
// BIBLIOTECA DE CLÁUSULAS EXTRAS
// -----------------------------------------------------------------------------

export function buildExtraClause(extra: ExtraClauseConfig): ContractClause {
  switch (extra.type) {
    case 'troca': {
      const desc = extra.params?.summary || 'veículo usado'
      return {
        id: extra.id,
        title: extra.title || 'DO VEÍCULO DADO EM TROCA',
        text: `Fica convencionado que o COMPRADOR entrega como parte de pagamento o ${desc}, declarando sob as penas da lei que o bem ingressa livre e desembaraçado de gravames, multas, restrições judiciais ou débitos tributários, respondendo pela procedência e evicção do mesmo.`,
      }
    }
    case 'financiamento_resolutivo': {
      const dias = extra.params?.days || 10
      return {
        id: extra.id,
        title: extra.title || 'DA CONDIÇÃO RESOLUTIVA DO FINANCIAMENTO',
        text: `A presente negociação fica celebrada sob condição resolutiva (art. 127 do Código Civil). Caso a instituição financeira não aprove o crédito ou não libere os recursos no prazo de ${dias} dias úteis, o negócio jurídico considerar-se-á rescindido de pleno direito, devendo as partes retornar ao status quo ante sem penalidades indenizatórias.`,
      }
    }
    case 'desistencia_pos_entrega': {
      const multaPct = extra.params?.percent || 10
      return {
        id: extra.id,
        title: extra.title || 'DA MULTA POR DESISTÊNCIA APÓS A TRADIÇÃO',
        text: `Na hipótese de desistência imotivada solicitada pelo COMPRADOR após a efetiva entrega física do veículo, incidirá multa compensatória irredutível de ${multaPct}% (dez por cento) sobre o valor total da venda, além da retenção dos custos de desvalorização e transferência documentária.`,
      }
    }
    case 'lgpd': {
      return {
        id: extra.id,
        title: extra.title || 'DA PROTEÇÃO DE DADOS (LGPD) E CONSULTA DE CRÉDITO',
        text: 'Em observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018), as partes autorizam expressamente o tratamento dos dados pessoais estritamente necessários para a emissão de notas fiscais, transferência junto aos órgãos executivos de trânsito (Detran), cadastro de garantia e consultas cadastrais aos sistemas de proteção ao crédito (SPC, Serasa e SCR/BACEN).',
      }
    }
    case 'consignacao': {
      return {
        id: extra.id,
        title: extra.title || 'DA INTERMEDIAÇÃO POR CONSIGNAÇÃO',
        text: 'O COMPRADOR declara ter plena ciência de que o estabelecimento atua neste ato como consignatário e intermediador da venda, procedendo à aproximação das partes com a autorização expressa do legítimo proprietário constante no prontuário do veículo.',
      }
    }
    case 'livre':
    default: {
      return {
        id: extra.id,
        title: extra.title || 'CLÁUSULA ADICIONAL',
        text: extra.text || 'Termos e obrigações convencionados entre as partes contratantes.',
      }
    }
  }
}

// -----------------------------------------------------------------------------
// COMPOSIÇÃO TOTAL DAS CLÁUSULAS
// -----------------------------------------------------------------------------

export function buildAllClauses(answers: ClauseAnswers, context: ClauseContext): ContractClause[] {
  const result: ContractClause[] = []

  // 1. Estado do veículo
  const c1 = buildClause1_Estado(answers)
  result.push({ id: 'cl-estado', title: c1.title, text: c1.text })

  // 2. Sinal (só inclui se houver sinal ou se o usuário mantiver ativo)
  if (context.hasDownPayment || (context.downPaymentAmount && context.downPaymentAmount > 0)) {
    const c2 = buildClause2_Sinal(answers)
    result.push({ id: 'cl-sinal', title: c2.title, text: c2.text })
  }

  // 3. Entrega
  const c3 = buildClause3_Entrega(answers)
  result.push({ id: 'cl-entrega', title: c3.title, text: c3.text })

  // 4. Débitos Anteriores
  const c4 = buildClause4_Debitos(answers)
  result.push({ id: 'cl-debitos', title: c4.title, text: c4.text })

  // 5. Transferência
  const c5 = buildClause5_Transferencia(answers)
  result.push({ id: 'cl-transf', title: c5.title, text: c5.text })

  // 6. Garantia
  const c6 = buildClause6_Garantia(answers)
  result.push({ id: 'cl-garantia', title: c6.title, text: c6.text })

  // 7. Cláusulas Extras da Biblioteca
  if (answers.extraClauses && Array.isArray(answers.extraClauses)) {
    for (const extra of answers.extraClauses) {
      result.push(buildExtraClause(extra))
    }
  }

  // 8. Foro (sempre a última das cláusulas principais)
  const c7 = buildClause7_Foro(answers)
  result.push({ id: 'cl-foro', title: c7.title, text: c7.text })

  return result
}
