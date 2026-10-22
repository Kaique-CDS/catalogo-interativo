/**
 * Testes Automatizados de Integridade e Ida e Volta (Round-Trip)
 * Fase 0.2 - Catálogo Interativo
 */

const {
  normalizeDigits,
  normalizePlate,
  normalizeEmail,
  normalizeText,
  parseBrlCurrency,
  normalizeDateToSaoPaulo,
  formatDateBr
} = require('./normalization.cjs');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FALHA: ${message}`);
  }
}

console.log('=== TESTES DE NORMALIZAÇÃO DE DADOS (FASE 0.2) ===');

// 1. Dígitos (CPF, CNPJ, Telefone, CEP, Renavam)
assert(normalizeDigits('(11) 96729-6936') === '11967296936', 'Telefone com máscara vira apenas dígitos');
assert(normalizeDigits('12.345.678/0001-90') === '12345678000190', 'CNPJ com pontuação vira apenas dígitos');
assert(normalizeDigits('123.456.789-00') === '12345678900', 'CPF com pontuação vira apenas dígitos');
assert(normalizeDigits('08160-505') === '08160505', 'CEP com hífen vira apenas dígitos');
assert(normalizeDigits(' 00123456789 ') === '00123456789', 'Renavam preserva zeros à esquerda');
assert(normalizeDigits(null) === '', 'Null vira string vazia');

// 2. Placas
assert(normalizePlate('abc-1234') === 'ABC1234', 'Placa antiga normalizada para maiúsculo sem hífen');
assert(normalizePlate('abc1d23') === 'ABC1D23', 'Placa Mercosul normalizada para maiúsculo');
assert(normalizePlate('  bra-2e19  ') === 'BRA2E19', 'Placa com espaços aparada');

// 3. E-mail
assert(normalizeEmail(' CONTATO@LOJA.COM.BR ') === 'contato@loja.com.br', 'E-mail em minúsculas e aparado');

// 4. Texto livre e XSS
const xssPayload = '<script>alert("hack")</script>Veículo Impecável!';
assert(normalizeText(xssPayload) === 'Veículo Impecável!', 'Script malicioso removido de texto livre');
const accents = 'Avenida Marechal Tito, São Paulo - SP, Direção Hidráulica';
assert(normalizeText(accents) === accents, 'Acentos UTF-8 e cedilhas preservados com rigor');

// 5. Dinheiro (Moeda pt-BR)
assert(parseBrlCurrency('139.900,00') === 139900, 'Preço com milhar e centavos pt-BR (139.900,00 => 139900)');
assert(parseBrlCurrency('139900,00') === 139900, 'Preço com vírgula sem milhar (139900,00 => 139900)');
assert(parseBrlCurrency('139.900') === 139900, 'Preço milhar pt-BR sem vírgula (139.900 => 139900)');
assert(parseBrlCurrency('R$ 139.900,50') === 139900.5, 'Preço com R$ e centavos (R$ 139.900,50 => 139900.5)');
assert(parseBrlCurrency(154900) === 154900, 'Número puro permanece inalterado');
assert(parseBrlCurrency('0') === 0, 'Zero permanece zero');

// 6. Datas no fuso America/Sao_Paulo (sem virar dia anterior por UTC)
assert(normalizeDateToSaoPaulo('1990-05-15') === '1990-05-15', 'Data ISO YYYY-MM-DD preservada');
assert(normalizeDateToSaoPaulo('15/05/1990') === '1990-05-15', 'Data brasileira DD/MM/AAAA convertida para YYYY-MM-DD');
assert(formatDateBr('1990-05-15') === '15/05/1990', 'Data exibida no padrão brasileiro DD/MM/AAAA');

// 7. Simulação de Round-Trip (Digitar -> Normalizar -> Salvar -> Conferir)
console.log('\n=== TESTES DE CICLO COMPLETO DE FORMULÁRIO (ROUND-TRIP) ===');

// Cenário A: Dados da Loja
const inputStoreForm = {
  name: '  L&L Multimarcas  ',
  whatsapp: '(11) 96729-6936',
  email: ' Contato@LLMULTIMARCAS.com.br ',
  contract_cnpj: '00.000.000/0001-00',
  address: 'Avenida Marechal Tito, 3921 - Jardim Miragaia, São Paulo - SP'
};

const savedStoreData = {
  name: normalizeText(inputStoreForm.name),
  whatsapp: normalizeDigits(inputStoreForm.whatsapp),
  email: normalizeEmail(inputStoreForm.email),
  contract_cnpj: normalizeDigits(inputStoreForm.contract_cnpj),
  address: normalizeText(inputStoreForm.address)
};

assert(savedStoreData.name === 'L&L Multimarcas', 'Loja: Nome aparado');
assert(savedStoreData.whatsapp === '11967296936', 'Loja: WhatsApp gravado apenas dígitos');
assert(savedStoreData.email === 'contato@llmultimarcas.com.br', 'Loja: Email minúsculo');
assert(savedStoreData.contract_cnpj === '00000000000100', 'Loja: CNPJ gravado apenas dígitos');

// Cenário B: Cadastro de Veículo
const inputVehicleForm = {
  title: ' Honda Civic 2.0 EXL ',
  price: '139.900,00',
  plate_end: 'abc-1d23',
  year: '2023',
  mileage: '25.000'
};

const savedVehicleData = {
  title: normalizeText(inputVehicleForm.title),
  price: parseBrlCurrency(inputVehicleForm.price),
  plate_end: normalizePlate(inputVehicleForm.plate_end),
  year: parseInt(inputVehicleForm.year, 10),
  mileage: parseInt(normalizeDigits(inputVehicleForm.mileage), 10)
};

assert(savedVehicleData.title === 'Honda Civic 2.0 EXL', 'Veículo: Título aparado');
assert(savedVehicleData.price === 139900, 'Veículo: Preço não truncado por parseFloat (139900)');
assert(savedVehicleData.plate_end === 'ABC1D23', 'Veículo: Placa maiúscula sem pontuação');
assert(savedVehicleData.mileage === 25000, 'Veículo: KM normalizado sem pontos');

console.log(`\nResultado dos testes: ${passed} passaram, ${failed} falharam.`);
if (failed > 0) process.exit(1);
