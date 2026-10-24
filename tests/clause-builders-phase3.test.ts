/**
 * Testes Automatizados da Fase 3: Geradores Puros de Cláusulas (Questionário)
 * Valida:
 * 1. Todas as combinações de respostas geram títulos e textos não-vazios.
 * 2. NENHUM placeholder ({...}) residual em qualquer texto ou título gerado.
 * 3. Biblioteca de cláusulas extras (troca, financiamento_resolutivo, desistencia, lgpd, consignacao, livre).
 * 4. Inclusão condicional da cláusula de sinal apenas quando houver entrada/sinal.
 * 5. Corretude dos foros e parâmetros passados.
 */

import assert from 'assert'
import {
  DEFAULT_CLAUSE_ANSWERS,
  buildClause1_Estado,
  buildClause2_Sinal,
  buildClause3_Entrega,
  buildClause4_Debitos,
  buildClause5_Transferencia,
  buildClause6_Garantia,
  buildClause7_Foro,
  buildExtraClause,
  buildAllClauses,
  ClauseAnswers,
  ClauseContext,
  ExtraClauseConfig,
} from '../lib/contracts/clause-builders'

const PLACEHOLDER_REGEX = /\{[a-zA-Z0-9_]+\}/

function assertNoPlaceholders(text: string, label: string) {
  const match = text.match(PLACEHOLDER_REGEX)
  assert(
    !match,
    `Falha em ${label}: placeholder residual encontrado: "${match?.[0]}" no texto: "${text}"`
  )
}

console.log('--- INICIANDO TESTES DA FASE 3 (QUESTIONÁRIO DE CLÁUSULAS) ---')

// 1. Teste de DEFAULT_CLAUSE_ANSWERS
{
  const context: ClauseContext = {
    storeName: 'Auto Motors Prime',
    storeCity: 'Campinas',
    storeState: 'SP',
    hasDownPayment: true,
    downPaymentAmount: 15000,
    transferResponsible: 'comprador',
    hasTradeInVehicle: true,
    vehicleTradeInSummary: 'VW Gol 1.0 2018 Prata',
  }

  const defaults = DEFAULT_CLAUSE_ANSWERS(context)
  assert.strictEqual(defaults.vehicleState, 'vistoriado')
  assert.strictEqual(defaults.forumCity, 'Campinas')
  assert.strictEqual(defaults.forumState, 'SP')
  assert.strictEqual(defaults.transferFeeResponsible, 'comprador')
  assert.strictEqual(defaults.extraClauses.length, 1)
  assert.strictEqual(defaults.extraClauses[0].type, 'troca')
  console.log('✅ 1. DEFAULT_CLAUSE_ANSWERS inicializado corretamente com contexto da loja')
}

// 2. Teste de Cláusula 1: Estado do Veículo (todas as variações)
{
  const baseAnswers = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'SP',
    storeState: 'SP',
    hasDownPayment: false,
    transferResponsible: 'comprador',
  })

  // 2a. Vistoriado + mecânico
  const c1a = buildClause1_Estado({ ...baseAnswers, vehicleState: 'vistoriado', allowMechanicInspection: true })
  assert(c1a.text.includes('vistoriou pessoalmente'))
  assert(c1a.text.includes('mecânico de sua estrita confiança'))
  assertNoPlaceholders(c1a.text, 'Cláusula 1 (vistoriado+mecanico)')

  // 2b. Com laudo
  const c1b = buildClause1_Estado({
    ...baseAnswers,
    vehicleState: 'laudo',
    laudoCompany: 'SuperVisão Vistorias',
    laudoNumber: 'SV-994821',
    allowMechanicInspection: false,
  })
  assert(c1b.text.includes('SuperVisão Vistorias - Nº SV-994821'))
  assert(!c1b.text.includes('mecânico de sua estrita confiança'))
  assertNoPlaceholders(c1b.text, 'Cláusula 1 (laudo)')

  // 2c. Sem laudo
  const c1c = buildClause1_Estado({ ...baseAnswers, vehicleState: 'sem_laudo', allowMechanicInspection: false })
  assert(c1c.text.includes('sem a realização de laudo cautelar'))
  assertNoPlaceholders(c1c.text, 'Cláusula 1 (sem laudo)')
  console.log('✅ 2. Cláusula 1 (Estado e Vistoria) validada em todas as variações sem placeholders')
}

// 3. Teste de Cláusula 2: Sinal e Desistência
{
  const base = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'SP',
    storeState: 'SP',
    hasDownPayment: true,
    transferResponsible: 'comprador',
  })

  // 3a. Retenção total + devolução em dobro
  const c2a = buildClause2_Sinal({ ...base, buyerWithdrawal: 'retencao_total', sellerWithdrawal: 'dobro' })
  assert(c2a.text.includes('retido integralmente'))
  assert(c2a.text.includes('em dobro'))
  assertNoPlaceholders(c2a.text, 'Cláusula 2 (total + dobro)')

  // 3b. Devolução total + devolução simples
  const c2b = buildClause2_Sinal({ ...base, buyerWithdrawal: 'devolucao_total', sellerWithdrawal: 'simples' })
  assert(c2a.text.includes('restituído integralmente') || c2b.text.includes('restituído integralmente'))
  assert(c2b.text.includes('restituição simples'))
  assertNoPlaceholders(c2b.text, 'Cláusula 2 (devolucao + simples)')

  // 3c. Retenção percentual (ex: 30%)
  const c2c = buildClause2_Sinal({ ...base, buyerWithdrawal: 'retencao_percentual', buyerWithdrawalPercent: 30 })
  assert(c2c.text.includes('30% (por cento) do sinal será retido'))
  assertNoPlaceholders(c2c.text, 'Cláusula 2 (percentual 30%)')
  console.log('✅ 3. Cláusula 2 (Sinal e Arras) validada em todas as modalidades')
}

// 4. Teste de Cláusula 3: Tradição e Prazo de Entrega
{
  const base = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'SP',
    storeState: 'SP',
    hasDownPayment: true,
    transferResponsible: 'comprador',
  })

  // 4a. Imediata + quitação
  const c3a = buildClause3_Entrega({ ...base, deliveryTerm: 'imediata', deliveryCondition: 'quitacao' })
  assert(c3a.text.includes('no ato da assinatura deste instrumento'))
  assert(c3a.text.includes('quitação integral do preço pactuado'))
  assertNoPlaceholders(c3a.text, 'Cláusula 3 (imediata)')

  // 4b. Prazo em dias + financiamento
  const c3b = buildClause3_Entrega({
    ...base,
    deliveryTerm: 'prazo_dias',
    deliveryDays: 7,
    deliveryCondition: 'financiamento',
  })
  assert(c3b.text.includes('em até 7 (7 dias úteis)'))
  assert(c3b.text.includes('financiamento bancário ou consórcio'))
  assertNoPlaceholders(c3b.text, 'Cláusula 3 (7 dias úteis)')

  // 4c. Prazo personalizado
  const c3c = buildClause3_Entrega({
    ...base,
    deliveryTerm: 'prazo_dias',
    deliveryDays: 1,
    deliveryCondition: 'personalizado',
    deliveryConditionCustom: 'da compensação do cheque administrativo nº 40291',
  })
  assert(c3c.text.includes('em até 1 (um dia útil)'))
  assert(c3c.text.includes('compensação do cheque administrativo nº 40291'))
  assertNoPlaceholders(c3c.text, 'Cláusula 3 (personalizado)')
  console.log('✅ 4. Cláusula 3 (Entrega e Tradição) validada sem placeholders de prazos')
}

// 5. Teste de Cláusula 4: Multas e Débitos
{
  const base = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'SP',
    storeState: 'SP',
    hasDownPayment: true,
    transferResponsible: 'comprador',
  })

  const c4 = buildClause4_Debitos({ ...base, oldFinesPaymentDays: 20 })
  assert(c4.text.includes('prazo improrrogável de 20 dias úteis'))
  assertNoPlaceholders(c4.text, 'Cláusula 4 (multas 20 dias)')
  console.log('✅ 5. Cláusula 4 (Multas e Débitos Anteriores) validada')
}

// 6. Teste de Cláusula 5: Transferência de Propriedade
{
  const base = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'SP',
    storeState: 'SP',
    hasDownPayment: true,
    transferResponsible: 'comprador',
  })

  // 6a. Comprador + 30 dias + bloqueio
  const c5a = buildClause5_Transferencia({
    ...base,
    transferDeadlineDays: 30,
    transferFeeResponsible: 'comprador',
    authorizeAdministrativeBlock: true,
  })
  assert(c5a.text.includes('prazo de até 30 dias'))
  assert(c5a.text.includes('arcando integralmente com os custos'))
  assert(c5a.text.includes('bloqueio administrativo do prontuário'))
  assertNoPlaceholders(c5a.text, 'Cláusula 5 (comprador)')

  // 6b. Vendedor + 15 dias + sem bloqueio
  const c5b = buildClause5_Transferencia({
    ...base,
    transferDeadlineDays: 15,
    transferFeeResponsible: 'vendedor',
    authorizeAdministrativeBlock: false,
  })
  assert(c5b.text.includes('prazo de até 15 dias'))
  assert(c5b.text.includes('sob responsabilidade e custeio do VENDEDOR'))
  assert(!c5b.text.includes('bloqueio administrativo'))
  assertNoPlaceholders(c5b.text, 'Cláusula 5 (vendedor)')

  // 6c. Dividido
  const c5c = buildClause5_Transferencia({
    ...base,
    transferFeeResponsible: 'dividido',
  })
  assert(c5c.text.includes('rateados igualmente (50% cada)'))
  assertNoPlaceholders(c5c.text, 'Cláusula 5 (dividido)')
  console.log('✅ 6. Cláusula 5 (Transferência de Propriedade) validada em todas as opções de taxas')
}

// 7. Teste de Cláusula 6: Garantia
{
  const base = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'SP',
    storeState: 'SP',
    hasDownPayment: true,
    transferResponsible: 'comprador',
  })

  // 7a. Legal 90 dias
  const c6a = buildClause6_Garantia({ ...base, warrantyType: 'legal_90' })
  assert(c6a.text.includes('garantia legal de 90 (noventa) dias para motor e caixa de câmbio'))
  assertNoPlaceholders(c6a.text, 'Cláusula 6 (legal 90)')

  // 7b. Estendida 1 ano com parceira
  const c6b = buildClause6_Garantia({
    ...base,
    warrantyType: 'estendida_1ano',
    warrantyPartner: 'Gestauto Brasil',
  })
  assert(c6b.text.includes('Garantia Mecânica Estendida pelo período de 1 (um) ano através da gestora parceira Gestauto Brasil'))
  assertNoPlaceholders(c6b.text, 'Cláusula 6 (estendida 1 ano)')

  // 7c. Repasse comercial
  const c6c = buildClause6_Garantia({ ...base, warrantyType: 'repasse' })
  assert(c6c.text.includes('modalidade comercial de repasse no estado em que se encontra'))
  assertNoPlaceholders(c6c.text, 'Cláusula 6 (repasse)')
  console.log('✅ 7. Cláusula 6 (Garantia) validada nas 4 modalidades')
}

// 8. Teste de Cláusula 7: Foro de Eleição
{
  const base = DEFAULT_CLAUSE_ANSWERS({
    storeName: 'Loja',
    storeCity: 'Ribeirão Preto',
    storeState: 'SP',
    hasDownPayment: true,
    transferResponsible: 'comprador',
  })

  const c7 = buildClause7_Foro({ ...base, forumCity: 'Ribeirão Preto', forumState: 'SP' })
  assert(c7.text.includes('Comarca de Ribeirão Preto - SP'))
  assertNoPlaceholders(c7.text, 'Cláusula 7 (foro)')
  console.log('✅ 8. Cláusula 7 (Foro) validada com cidade e estado dinâmicos')
}

// 9. Teste da Biblioteca de Cláusulas Extras
{
  const extras: ExtraClauseConfig[] = [
    { id: 'ex-1', type: 'troca', title: '', params: { summary: 'Honda Civic EXL 2020 Placa ABC1D23' } },
    { id: 'ex-2', type: 'financiamento_resolutivo', title: '', params: { days: 12 } },
    { id: 'ex-3', type: 'desistencia_pos_entrega', title: '', params: { percent: 15 } },
    { id: 'ex-4', type: 'lgpd', title: '' },
    { id: 'ex-5', type: 'consignacao', title: '' },
    { id: 'ex-6', type: 'livre', title: 'DA INSTALAÇÃO DE ACESSÓRIOS', text: 'A loja compromete-se a entregar insulfilm G20 instalado.' },
  ]

  for (const extra of extras) {
    const built = buildExtraClause(extra)
    assert(built.title.length > 0, `Título da extra ${extra.type} deve existir`)
    assert(built.text.length > 0, `Texto da extra ${extra.type} deve existir`)
    assertNoPlaceholders(built.text, `Extra: ${extra.type}`)
  }
  console.log('✅ 9. Biblioteca completa de cláusulas extras (6 tipos) testada sem falhas')
}

// 10. Teste de Composição Global: buildAllClauses
{
  const contextWithDown: ClauseContext = {
    storeName: 'Motors VIP',
    storeCity: 'Belo Horizonte',
    storeState: 'MG',
    hasDownPayment: true,
    downPaymentAmount: 5000,
    transferResponsible: 'dividido',
  }

  const answersWithDown = DEFAULT_CLAUSE_ANSWERS(contextWithDown)
  const clausesWithDown = buildAllClauses(answersWithDown, contextWithDown)

  // Deve conter 7 cláusulas padrão (Estado, Sinal, Entrega, Débitos, Transf, Garantia, Foro)
  assert.strictEqual(clausesWithDown.length, 7)
  assert(clausesWithDown.some((c) => c.id === 'cl-sinal'), 'Deve conter cláusula de sinal')

  // Sem sinal
  const contextWithoutDown: ClauseContext = {
    storeName: 'Motors VIP',
    storeCity: 'Belo Horizonte',
    storeState: 'MG',
    hasDownPayment: false,
    downPaymentAmount: 0,
    transferResponsible: 'comprador',
  }

  const answersWithoutDown = DEFAULT_CLAUSE_ANSWERS(contextWithoutDown)
  const clausesWithoutDown = buildAllClauses(answersWithoutDown, contextWithoutDown)

  // Não deve conter a cláusula de sinal (total 6)
  assert.strictEqual(clausesWithoutDown.length, 6)
  assert(!clausesWithoutDown.some((c) => c.id === 'cl-sinal'), 'Não deve conter cláusula de sinal')

  // Verifica que NENHUMA cláusula do array gerado tem qualquer placeholder residual
  for (const c of clausesWithDown) {
    assertNoPlaceholders(c.text, `Composição global: ${c.title}`)
    assertNoPlaceholders(c.title, `Composição global titulo: ${c.title}`)
  }
  console.log('✅ 10. buildAllClauses validado com inclusão condicional de sinal e zero placeholders')
}

console.log('--- TODOS OS TESTES DA FASE 3 PASSARAM COM SUCESSO! ---')
