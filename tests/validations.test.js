/**
 * Suíte de Testes Automatizados - Fase 3: Validações Estritas de Documentos
 * Executar com: node tests/validations.test.js
 */
const assert = require('assert')
const {
  validateCpf,
  validateCnpj,
  validateCnh,
  validateRenavam,
  validatePlaca,
  validateChassi,
  validateCep,
  validateEmail,
  validatePhoneBr,
  validateRg,
  validateDate,
  maskCpf,
  maskCnpj,
  maskPhoneBr,
  maskDateBr,
} = require('./validations.cjs')

console.log('=== TESTES DE VALIDAÇÃO DE DOCUMENTOS (FASE 3) ===')

// 1. CPF
console.log('\n[1. CPF]')
// CPF válido conhecido (teste padrão Receita)
const validCpf = '52998224725'
const cpfRes = validateCpf(validCpf)
assert(cpfRes.valid === true, 'CPF válido deve ser aceito')
assert(cpfRes.formatted === '529.982.247-25', 'Formatação de CPF deve estar correta')
console.log('  ✓ CPF válido aceito e formatado')

// CPF repetido
assert(validateCpf('11111111111').valid === false, 'CPF com dígitos repetidos deve ser rejeitado')
assert(validateCpf('00000000000').valid === false, 'CPF com todos zeros deve ser rejeitado')
console.log('  ✓ Sequências repetidas rejeitadas')

// CPF com dígito inválido
assert(validateCpf('52998224726').valid === false, 'CPF com dígito verificador errado deve ser rejeitado')
console.log('  ✓ Dígitos verificadores validados com rigor')

// 2. CNPJ
console.log('\n[2. CNPJ]')
// CNPJ válido conhecido (Petrobras ou similar de teste)
const validCnpj = '33000167000101'
const cnpjRes = validateCnpj(validCnpj)
assert(cnpjRes.valid === true, 'CNPJ válido deve ser aceito')
assert(cnpjRes.formatted === '33.000.167/0001-01', 'Formatação de CNPJ deve estar correta')
console.log('  ✓ CNPJ válido aceito e formatado')

// CNPJ repetido
assert(validateCnpj('11111111111111').valid === false, 'CNPJ com dígitos repetidos deve ser rejeitado')
console.log('  ✓ Sequências repetidas de CNPJ rejeitadas')

// CNPJ com dígito inválido
assert(validateCnpj('33000167000109').valid === false, 'CNPJ com dígito verificador errado deve ser rejeitado')
console.log('  ✓ Dígitos verificadores de CNPJ validados com rigor')

// 3. CNH
console.log('\n[3. CNH]')
// CNH válida padrão de teste Denatran
// Exemplo real de CNH válida para testes
const testCnh = '24778393507'
const cnhRes = validateCnh(testCnh)
assert(cnhRes.valid === true, 'CNH de teste válida deve ser aceita')
console.log('  ✓ CNH válida aceita')

assert(validateCnh('11111111111').valid === false, 'CNH com dígitos repetidos deve ser rejeitada')
assert(validateCnh('24778393520').valid === false, 'CNH com dígito verificador incorreto deve ser rejeitada')
console.log('  ✓ CNH inválida e repetida rejeitadas')

// 4. Renavam
console.log('\n[4. Renavam]')
// Renavam de teste válido: 00639884962 (ou 639884962 com 11 dígitos)
const validRenavam = '00639884962'
const renRes = validateRenavam(validRenavam)
assert(renRes.valid === true, 'Renavam válido deve ser aceito')
console.log('  ✓ Renavam válido aceito')

assert(validateRenavam('00639884969').valid === false, 'Renavam com dígito incorreto deve ser rejeitado')
assert(validateRenavam('11111111111').valid === false, 'Renavam repetido deve ser rejeitado')
console.log('  ✓ Renavam inválido rejeitado')

// 5. Placa
console.log('\n[5. Placa de Veículo]')
// Placa Antiga
const placaAntiga = validatePlaca('ABC-1234')
assert(placaAntiga.valid === true && placaAntiga.pattern === 'antigo', 'Placa antiga deve ser aceita')
assert(placaAntiga.formatted === 'ABC-1234', 'Placa antiga formatada')
console.log('  ✓ Placa antiga (ABC-1234) aceita')

// Placa Mercosul Carro
const placaMercosul = validatePlaca('BRA2E19')
assert(placaMercosul.valid === true && placaMercosul.pattern === 'mercosul', 'Placa Mercosul de carro deve ser aceita')
console.log('  ✓ Placa Mercosul Carro (BRA2E19) aceita')

// Placa Mercosul Moto
const placaMoto = validatePlaca('BRA20E9')
assert(placaMoto.valid === true && placaMoto.pattern === 'mercosul', 'Placa Mercosul de moto deve ser aceita')
console.log('  ✓ Placa Mercosul Moto (BRA20E9) aceita')

// Placa Inválida
assert(validatePlaca('A1B2C34').valid === false, 'Placa em formato fora do padrão deve ser rejeitada')
console.log('  ✓ Placa inválida rejeitada')

// 6. Chassi
console.log('\n[6. Chassi]')
const validChassi = '9BWCA05Z4BP000001'
const chassiRes = validateChassi(validChassi)
assert(chassiRes.valid === true, 'Chassi de 17 caracteres alfanuméricos sem I/O/Q deve ser aceito')
console.log('  ✓ Chassi válido aceito')

// Chassi com letra proibida I
assert(validateChassi('9BWCA05Z4IP000001').valid === false, 'Chassi com letra I deve ser rejeitado')
// Chassi com letra proibida O
assert(validateChassi('9BWCA05Z4OP000001').valid === false, 'Chassi com letra O deve ser rejeitado')
// Chassi com letra proibida Q
assert(validateChassi('9BWCA05Z4QP000001').valid === false, 'Chassi com letra Q deve ser rejeitado')
// Chassi com comprimento != 17
assert(validateChassi('9BWCA05Z4BP00001').valid === false, 'Chassi com 16 caracteres deve ser rejeitado')
console.log('  ✓ Regra ISO 3779 (proibição de I, O, Q e 17 caracteres) validada com rigor')

// 7. CEP
console.log('\n[7. CEP]')
const cepRes = validateCep('08160-505')
assert(cepRes.valid === true && cepRes.formatted === '08160-505', 'CEP válido deve ser aceito')
assert(validateCep('081605').valid === false, 'CEP incompleto deve ser rejeitado')
console.log('  ✓ CEP validado com sucesso')

// 8. E-mail
console.log('\n[8. E-mail]')
assert(validateEmail('contato@llmultimarcas.com.br').valid === true, 'E-mail corporativo válido deve ser aceito')
assert(validateEmail('invalido@').valid === false, 'E-mail sem domínio deve ser rejeitado')
assert(validateEmail('invalido.com').valid === false, 'E-mail sem @ deve ser rejeitado')
console.log('  ✓ E-mail validado com sucesso')

// 9. Telefone Brasileiro
console.log('\n[9. Telefone BR]')
// Celular SP com 9
const celRes = validatePhoneBr('11967296936')
assert(celRes.valid === true && celRes.type === 'celular', 'Celular com 9 deve ser aceito')
assert(celRes.formatted === '(11) 96729-6936', 'Celular formatado com máscara pt-BR')
console.log('  ✓ Celular com 9 validado')

// Fixo SP
const fixoRes = validatePhoneBr('1124769444')
assert(fixoRes.valid === true && fixoRes.type === 'fixo', 'Telefone fixo com 10 dígitos deve ser aceito')
assert(fixoRes.formatted === '(11) 2476-9444', 'Telefone fixo formatado com máscara pt-BR')
console.log('  ✓ Fixo validado')

// DDD inválido
assert(validatePhoneBr('01967296936').valid === false, 'Telefone com DDD 01 deve ser rejeitado')
console.log('  ✓ DDDs inválidos rejeitados')

// 10. RG
console.log('\n[10. RG]')
const rgNormal = validateRg('44.555.666-X')
assert(rgNormal.valid === true, 'RG dentro de 5 a 14 caracteres deve ser aceito')
assert(!rgNormal.warning, 'RG normal não deve emitir aviso')

const rgEstranho = validateRg('123')
assert(rgEstranho.valid === true, 'RG curto não deve ser bloqueado')
assert(Boolean(rgEstranho.warning), 'RG muito curto deve gerar aviso sutil')
console.log('  ✓ RG não é bloqueado e gera aviso sutil se fora do padrão usual')

// 11. Data e Calendário Real
console.log('\n[11. Validação de Data]')
// Data real válida
const dateRes = validateDate('15/08/1995')
assert(dateRes.valid === true && dateRes.isoDate === '1995-08-15', 'Data válida em DD/MM/AAAA convertida para ISO')
console.log('  ✓ Data real válida aceita')

// Ano bissexto: 29/02/2024 é bissexto, 29/02/2023 não é
assert(validateDate('29/02/2024').valid === true, '29/02 em ano bissexto (2024) deve ser aceito')
assert(validateDate('29/02/2023').valid === false, '29/02 em ano não bissexto (2023) deve ser rejeitado')
console.log('  ✓ Anos bissextos validados corretamente (29 de Fevereiro)')

// Dia inválido para o mês (ex: 31 de Abril - Abril tem 30 dias)
assert(validateDate('31/04/2024').valid === false, '31 de Abril deve ser rejeitado (mês tem 30 dias)')
console.log('  ✓ Limite de dias por mês validado')

// Data de nascimento no futuro
const futureDate = `01/01/${new Date().getFullYear() + 2}`
assert(
  validateDate(futureDate, { isBirthDate: true }).valid === false,
  'Data de nascimento no futuro deve ser bloqueada'
)
console.log('  ✓ Data futura bloqueada para nascimento')

// 12. Máscaras
console.log('\n[12. Máscaras em tempo real]')
assert(maskCpf('52998224725') === '529.982.247-25', 'Máscara de CPF')
assert(maskCnpj('33000167000101') === '33.000.167/0001-01', 'Máscara de CNPJ')
assert(maskPhoneBr('11967296936') === '(11) 96729-6936', 'Máscara de celular')
assert(maskPhoneBr('1124769444') === '(11) 2476-9444', 'Máscara de fixo')
assert(maskDateBr('15081995') === '15/08/1995', 'Máscara de data DD/MM/AAAA')
console.log('  ✓ Todas as máscaras funcionando')

console.log('\n✅ Todos os testes de validação passaram com 100% de sucesso!')
