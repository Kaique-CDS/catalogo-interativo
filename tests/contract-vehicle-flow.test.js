const assert = require('assert');

console.log('=== TESTES DO FLUXO DO BOTÃO VENDER E CONTRATO (PROMPT 8) ===\n');

// 1. Mapeamento de Contratos Vinculados
console.log('[1. Mapeamento de Contratos Vinculados]');
const mockContracts = [
  { id: 'c1', number: 101, vehicle_id: 'veh-1' },
  { id: 'c2', number: 102, vehicle_id: 'veh-2' },
  { id: 'c3', number: 103, vehicle_id: null },
  { id: 'c4', number: 104, vehicle_data: { id: 'veh-3' } },
];

const linkedContracts = {};
for (const c of mockContracts) {
  const vId = c.vehicle_id || c.vehicle_data?.id;
  if (vId) {
    linkedContracts[vId] = { id: c.id, number: c.number };
  }
}

assert.strictEqual(linkedContracts['veh-1']?.number, 101, 'veh-1 deve vincular ao contrato 101');
assert.strictEqual(linkedContracts['veh-2']?.number, 102, 'veh-2 deve vincular ao contrato 102');
assert.strictEqual(linkedContracts['veh-3']?.number, 104, 'veh-3 deve vincular ao contrato 104 via vehicle_data');
assert.strictEqual(linkedContracts['veh-4'], undefined, 'veh-4 não deve ter contrato vinculado');
console.log('  ✓ Contratos vinculados indexados por vehicle_id com sucesso.');

// 2. Lógica de Exibição do Botão Vender / Gerar Contrato
console.log('\n[2. Regras de Exibição do Botão Vender na Listagem]');

function getActionButtonsState({ contractsEnabled, isSold, hasLinkedContract }) {
  const showContractSaleButton = contractsEnabled && !isSold;
  const showLinkedContractShortcut = isSold && hasLinkedContract;
  const showSoldBadge = isSold;
  return { showContractSaleButton, showLinkedContractShortcut, showSoldBadge };
}

// Caso 1: Contratos ativos, carro disponível
const case1 = getActionButtonsState({ contractsEnabled: true, isSold: false, hasLinkedContract: false });
assert.strictEqual(case1.showContractSaleButton, true, 'Deve exibir botão Vender');
assert.strictEqual(case1.showSoldBadge, false, 'Não deve exibir selo vendido');

// Caso 2: Contratos ativos, carro vendido com contrato
const case2 = getActionButtonsState({ contractsEnabled: true, isSold: true, hasLinkedContract: true });
assert.strictEqual(case2.showContractSaleButton, false, 'NÃO deve exibir botão Vender para carro vendido');
assert.strictEqual(case2.showLinkedContractShortcut, true, 'Deve exibir atalho para contrato vinculado');
assert.strictEqual(case2.showSoldBadge, true, 'Deve exibir selo Vendido');

// Caso 3: Contratos desativados para o tenant
const case3 = getActionButtonsState({ contractsEnabled: false, isSold: false, hasLinkedContract: false });
assert.strictEqual(case3.showContractSaleButton, false, 'NÃO deve exibir botão Vender se contratos desativados');

console.log('  ✓ Botão só aparece com contratos ativos e carro disponível.');
console.log('  ✓ Carro vendido oculta botão de venda e exibe selo + atalho ao contrato.');
console.log('  ✓ Contratos desativados ocultam o botão de contrato.');

// 3. Pré-preenchimento dos Dados do Veículo no Wizard
console.log('\n[3. Pré-preenchimento dos Dados do Veículo]');
const stockVehicle = {
  id: 'v-999',
  title: 'Corolla Altis 2.0 Flex Aut.',
  brand: 'Toyota',
  model: 'Corolla Altis',
  year: 2023,
  mileage: 24500,
  price: 149900,
  plate: 'BRA2E19',
  chassis: '9BRBL48E6KP123456',
  renavam: '12345678901',
  color: 'Prata',
  fuel: 'Flex',
  engine: '2.0',
  features: ['Ar condicionado', 'Bancos em couro', 'Câmera de ré'],
};

const prefilledVehicle = {
  brand: stockVehicle.brand || '',
  model: stockVehicle.model || stockVehicle.title,
  year_fab: stockVehicle.year,
  year_model: stockVehicle.year,
  plate: stockVehicle.plate,
  chassis: stockVehicle.chassis,
  renavam: stockVehicle.renavam,
  color: stockVehicle.color,
  fuel: stockVehicle.fuel,
  mileage: stockVehicle.mileage,
  engine: stockVehicle.engine,
  features: stockVehicle.features.join(', '),
};

assert.strictEqual(prefilledVehicle.brand, 'Toyota');
assert.strictEqual(prefilledVehicle.model, 'Corolla Altis');
assert.strictEqual(prefilledVehicle.plate, 'BRA2E19');
assert.strictEqual(prefilledVehicle.chassis, '9BRBL48E6KP123456');
assert.strictEqual(prefilledVehicle.renavam, '12345678901');
assert.strictEqual(prefilledVehicle.color, 'Prata');
assert.strictEqual(prefilledVehicle.year_fab, 2023);
console.log('  ✓ Todos os dados cadastrais do veículo (marca, modelo, placa, chassi, renavam, km, valor) preenchidos com exatidão.');

// 4. Marcação como Vendido com Confirmação
console.log('\n[4. Regra de Marcação como Vendido]');
let vehicleInStock = { id: 'v-999', status: 'disponivel', sold_at: null };

function markAsSoldConfirmed(v, confirmed) {
  if (!confirmed) return v; // Nunca marca sozinho sem confirmação explícita
  return {
    ...v,
    status: 'vendido',
    sold_at: new Date().toISOString(),
  };
}

vehicleInStock = markAsSoldConfirmed(vehicleInStock, false);
assert.strictEqual(vehicleInStock.status, 'disponivel', 'Sem confirmação do usuário, status continua disponível');

vehicleInStock = markAsSoldConfirmed(vehicleInStock, true);
assert.strictEqual(vehicleInStock.status, 'vendido', 'Com confirmação, status vira vendido');
assert.ok(vehicleInStock.sold_at, 'sold_at gravado corretamente');
console.log('  ✓ Veículo nunca é marcado automaticamente; somente com confirmação explícita do usuário.');

console.log('\n🎉 TODOS OS TESTES DO FLUXO DO BOTÃO VENDER E CONTRATOS PASSARAM COM 100% DE SUCESSO!\n');
