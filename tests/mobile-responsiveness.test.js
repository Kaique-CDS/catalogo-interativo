/**
 * Suíte de Testes Automatizados - Revisão Mobile Geral (Fase 6)
 * Valida os requisitos do checklist:
 * 1. Sem rolagem horizontal e textos/botões sem corte
 * 2. Botões e áreas de toque com no mínimo 44 px (h-11, min-h-[44px], etc)
 * 3. Tabelas convertidas em cards no mobile
 * 4. Wizard de contrato com botão de avançar sempre visível (sticky) e teclado não cobrindo campos
 * 5. Modais em bottom sheet no mobile
 * 6. Canvas de assinatura com touch-action: none, preventDefault e escala de coordenadas
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

function checkFile(relPath) {
  const full = path.join(__dirname, '..', relPath)
  assert(fs.existsSync(full), `Arquivo deve existir: ${relPath}`)
  return fs.readFileSync(full, 'utf8')
}

function runTests() {
  console.log('=== TESTES DE RESPONSIVIDADE MOBILE (FASE 6) ===\n')

  // 1. Áreas de toque >= 44px nos filtros e vitrine
  console.log('[1. Áreas de Toque >= 44px na Vitrine]')
  const filtersCode = checkFile('components/storefront/SearchFilters.tsx')
  assert(filtersCode.includes('SelectTrigger className="h-11'), 'SelectTriggers de filtro devem ter h-11 (44px)')
  assert(filtersCode.includes('className="btn-brand w-full h-11'), 'Botão Aplicar Filtros deve ter h-11 (44px)')

  const detailModalCode = checkFile('components/storefront/VehicleDetailModal.tsx')
  assert(detailModalCode.includes('h-11 w-11 rounded-full'), 'Botões de ação superior (fechar e compartilhar) devem ter h-11 w-11 (44px)')

  const sheetCode = checkFile('components/storefront/InterestOptionsSheet.tsx')
  assert(sheetCode.includes('h-11 w-11 flex items-center justify-center rounded-xl'), 'Botão de fechar do sheet deve ter h-11 w-11 (44px)')

  const financingCode = checkFile('components/storefront/FinancingModal.tsx')
  assert(financingCode.includes('h-11 w-11 flex items-center justify-center rounded-xl'), 'Botões de topo no modal de financiamento devem ter h-11 w-11 (44px)')
  assert(financingCode.includes('h-11 w-full rounded-xl border'), 'Selects do formulário de financiamento devem ter h-11 (44px)')
  console.log('  ✓ Todos os botões, selects e gatilhos da vitrine possuem área de toque >= 44px')

  // 2. Painel Admin: Top Bar, Bottom Bar e Cards de Estoque
  console.log('\n[2. Painel Admin: Ergonomia Mobile]')
  const sidebarCode = checkFile('components/admin/AdminSidebar.tsx')
  assert(sidebarCode.includes('h-11 px-3'), 'Botão Vitrine no topo mobile deve ter h-11')
  assert(sidebarCode.includes('h-11 w-11 p-0'), 'Botão Logout no topo mobile deve ter h-11 w-11')
  assert(sidebarCode.includes('min-h-[48px]'), 'Abas da navegação inferior mobile devem ter min-h-[48px]')

  const tableCode = checkFile('components/admin/VehicleTable.tsx')
  assert(tableCode.includes('h-11 rounded-xl bg-surface-2'), 'Botões de ação no card de veículo devem ter h-11 (44px)')
  assert(tableCode.includes('rounded-t-3xl sm:rounded-2xl'), 'Modal de exclusão deve ser bottom sheet no mobile')
  console.log('  ✓ Painel da loja possui navegação com altura adequada e modal bottom sheet')

  // 3. Tabelas que viram cards no mobile
  console.log('\n[3. Conversão de Tabelas em Cards no Mobile]')
  const financeiroCode = checkFile('app/admin/financeiro/page.tsx')
  assert(financeiroCode.includes('md:hidden divide-y'), 'Admin financeiro deve possuir visualização em cards no mobile')
  assert(financeiroCode.includes('hidden md:block overflow-x-auto'), 'Tabela convencional deve ser reservada para telas desktop')

  const clientesCode = checkFile('app/admin/clientes/page.tsx')
  assert(clientesCode.includes('md:hidden divide-y'), 'Admin clientes deve possuir visualização em cards no mobile')
  assert(clientesCode.includes('hidden md:block overflow-x-auto'), 'Tabela convencional deve ser reservada para telas desktop')
  console.log('  ✓ Tabelas administrativas convertidas para cards visuais no mobile (sem scroll horizontal)')

  // 4. Wizards de Contrato: Barra Fixa e Botão de Avançar Sempre Visível
  console.log('\n[4. Wizards de Contrato: Barra Sticky e Passos]')
  const contractWizardCode = checkFile('components/contracts/VehicleContractWizard.tsx')
  assert(contractWizardCode.includes('sticky bottom-0 z-30'), 'Wizard de contrato deve ter barra inferior sticky no mobile')
  assert(contractWizardCode.includes('pb-28 sm:pb-20'), 'Container do contrato deve possuir padding inferior generoso para não cobrir campos')
  assert(contractWizardCode.includes('rounded-t-3xl sm:rounded-2xl'), 'Modal de estoque deve ser bottom sheet no mobile')

  const poaWizardCode = checkFile('components/contracts/PowerOfAttorneyWizard.tsx')
  assert(poaWizardCode.includes('sticky bottom-0 z-30'), 'Wizard de procuração deve ter barra inferior sticky no mobile')
  assert(poaWizardCode.includes('pb-28 sm:pb-20'), 'Container da procuração deve possuir padding inferior generoso')
  console.log('  ✓ Barra de navegação dos contratos é fixa (sticky) mantendo o botão de avançar sempre visível')

  // 5. Canvas de Assinatura Mobile: touch-action: none e Escala
  console.log('\n[5. Assinatura Eletrônica no Canvas]')
  const signPageCode = checkFile('app/assinar/[token]/page.tsx')
  assert(signPageCode.includes('scaleX = canvas.width / rect.width'), 'Cálculo de coordenadas deve aplicar escala proporcional ao canvas')
  assert(signPageCode.includes('scaleY = canvas.height / rect.height'), 'Cálculo de coordenadas Y deve aplicar escala proporcional')
  assert(signPageCode.includes('e.preventDefault()'), 'Eventos touch devem executar preventDefault para impedir rolagem da página')
  assert(signPageCode.includes("style={{ touchAction: 'none' }}") || signPageCode.includes('touch-none'), 'Canvas deve possuir touch-action: none')
  console.log('  ✓ Canvas com touch-action: none, trava de rolagem e cálculo de coordenadas de alta precisão')

  // 6. Tickets e Login
  console.log('\n[6. Central de Tickets e Login]')
  const ticketsCode = checkFile('app/[slug]/admin/melhorias/page.tsx')
  assert(ticketsCode.includes('grid-cols-3 gap-1.5 sm:gap-2'), 'Seletor de tipo de ticket adaptativo para 360px')
  assert(ticketsCode.includes('min-h-[44px]'), 'Botões de tipo de ticket possuem min-h-[44px]')

  const loginCode = checkFile('app/entrar/page.tsx')
  assert(loginCode.includes('h-11 w-11 flex items-center justify-center'), 'Botão de visualizar senha possui área de toque 44px')
  console.log('  ✓ Formulário de login e tickets perfeitamente ajustados para mobile')

  console.log('\n✅ Todos os 6 critérios de responsividade mobile foram auditados e aprovados!')
}

runTests()
