const assert = require('assert');
const { getDaysToSell, calculateSalesMetrics, formatDateBR } = require('./date-utils.cjs');

console.log('🧪 Iniciando testes de métricas de vendas e tempo até a venda...\n');

// 1. Teste de cálculo de dias entre cadastro e venda
const days1 = getDaysToSell('2026-10-01T10:00:00Z', '2026-10-15T15:00:00Z');
assert.strictEqual(days1, 14, `Esperado 14 dias, obteve ${days1}`);
console.log('✅ Teste 1: getDaysToSell calcula diferença em dias corretamente (14 dias).');

// 2. Teste de mesmo dia
const daysSame = getDaysToSell('2026-10-20T08:00:00Z', '2026-10-20T18:00:00Z');
assert.strictEqual(daysSame, 0, `Esperado 0 dias para venda no mesmo dia, obteve ${daysSame}`);
console.log('✅ Teste 2: Venda no mesmo dia retorna 0 dias.');

// 3. Teste de métricas com múltiplos veículos
const mockVehicles = [
  {
    id: 'v1',
    title: 'Honda Civic 2023',
    brand: 'Honda',
    model: 'Civic',
    price: 150000,
    status: 'vendido',
    created_at: '2026-09-01T12:00:00Z',
    sold_at: '2026-09-11T12:00:00Z', // 10 dias
  },
  {
    id: 'v2',
    title: 'Toyota Corolla 2023',
    brand: 'Toyota',
    model: 'Corolla',
    price: 140000,
    status: 'vendido',
    created_at: '2026-09-01T12:00:00Z',
    sold_at: '2026-09-21T12:00:00Z', // 20 dias
  },
  {
    id: 'v3',
    title: 'Jeep Compass 2022',
    brand: 'Jeep',
    model: 'Compass',
    price: 135000,
    status: 'vendido',
    created_at: '2026-08-01T12:00:00Z',
    sold_at: '2026-09-30T12:00:00Z', // 60 dias
  },
  {
    id: 'v4_legacy',
    title: 'Fusca Antigo Vendido Sem Data',
    brand: 'Volkswagen',
    model: 'Fusca',
    price: 35000,
    status: 'vendido',
    created_at: '2025-01-01T12:00:00Z',
    sold_at: null, // Sem data de venda registrada (legado)
  },
  {
    id: 'v5_available',
    title: 'Carro Disponível em Estoque',
    brand: 'Fiat',
    model: 'Pulse',
    price: 98000,
    status: 'disponivel',
    created_at: '2026-10-01T12:00:00Z',
  },
];

const metrics = calculateSalesMetrics(mockVehicles, 'all', 'all');

assert.strictEqual(metrics.totalSold, 4, `Total de vendidos deve ser 4, obteve ${metrics.totalSold}`);
assert.strictEqual(metrics.soldWithDatesCount, 3, `Vendidos com data deve ser 3, obteve ${metrics.soldWithDatesCount}`);
assert.strictEqual(metrics.salesWithoutDateCount, 1, `Legados sem data deve ser 1, obteve ${metrics.salesWithoutDateCount}`);
// Média: (10 + 20 + 60) / 3 = 90 / 3 = 30 dias
assert.strictEqual(metrics.avgDays, 30, `Média esperada de 30 dias, obteve ${metrics.avgDays}`);
console.log('✅ Teste 3: Média de dias e contagem de vendas com/sem data calculadas com precisão.');

// 4. Teste de mais rápido e mais demorado
assert.strictEqual(metrics.fastest.id, 'v1', `Mais rápido deve ser v1 (10 dias)`);
assert.strictEqual(metrics.fastest.daysToSell, 10);
assert.strictEqual(metrics.slowest.id, 'v3', `Mais demorado deve ser v3 (60 dias)`);
assert.strictEqual(metrics.slowest.daysToSell, 60);
console.log('✅ Teste 4: Identificação do carro mais rápido (10 dias) e mais lento (60 dias).');

// 5. Teste de filtro por marca
const hondaOnly = calculateSalesMetrics(mockVehicles, 'all', 'Honda');
assert.strictEqual(hondaOnly.totalSold, 1);
assert.strictEqual(hondaOnly.avgDays, 10);
console.log('✅ Teste 5: Filtro por marca restringe métricas perfeitamente.');

// 6. Teste com 0 vendas
const emptyMetrics = calculateSalesMetrics([], 'all', 'all');
assert.strictEqual(emptyMetrics.totalSold, 0);
assert.strictEqual(emptyMetrics.avgDays, 0);
assert.strictEqual(emptyMetrics.fastest, null);
assert.strictEqual(emptyMetrics.slowest, null);
console.log('✅ Teste 6: Conjunto vazio de veículos tratado com segurança sem divisão por zero.');

// 7. Teste de ver somente um carro em específico
const singleCarMetrics = calculateSalesMetrics(mockVehicles, 'all', 'all', 'v2');
assert.strictEqual(singleCarMetrics.totalSold, 1, 'Deve retornar apenas 1 carro');
assert.strictEqual(singleCarMetrics.avgDays, 20, 'Tempo até venda do v2 deve ser 20 dias');
assert.strictEqual(singleCarMetrics.soldList[0].id, 'v2');
assert.strictEqual(singleCarMetrics.soldList[0].title, 'Toyota Corolla 2023');
console.log('✅ Teste 7: Visualização isolada de um carro específico opera com perfeição.');

console.log('\n🎉 TODOS OS TESTES DE MÉTRICAS DE VENDAS PASSARAM COM SUCESSO!');
