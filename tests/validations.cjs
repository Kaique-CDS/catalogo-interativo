/**
 * Módulo CJS de Validações Estritas de Documentos (Fase 3)
 */

function onlyDigits(value) {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\D/g, '')
}

function validateCpf(cpf) {
  const clean = onlyDigits(cpf)
  if (!clean) return { valid: false, message: 'CPF é obrigatório.' }
  if (clean.length !== 11) {
    return { valid: false, message: 'CPF deve conter exatamente 11 dígitos numéricos.' }
  }

  if (/^(\d)\1{10}$/.test(clean)) {
    return { valid: false, message: 'CPF inválido (dígitos repetidos não permitidos).' }
  }

  let sum1 = 0
  for (let i = 0; i < 9; i++) {
    sum1 += Number(clean[i]) * (10 - i)
  }
  let rest1 = sum1 % 11
  let dv1 = rest1 < 2 ? 0 : 11 - rest1
  if (dv1 !== Number(clean[9])) {
    return { valid: false, message: 'CPF inválido (primeiro dígito verificador incorreto).' }
  }

  let sum2 = 0
  for (let i = 0; i < 10; i++) {
    sum2 += Number(clean[i]) * (11 - i)
  }
  let rest2 = sum2 % 11
  let dv2 = rest2 < 2 ? 0 : 11 - rest2
  if (dv2 !== Number(clean[10])) {
    return { valid: false, message: 'CPF inválido (segundo dígito verificador incorreto).' }
  }

  const formatted = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return { valid: true, formatted }
}

function validateCnpj(cnpj) {
  const clean = onlyDigits(cnpj)
  if (!clean) return { valid: false, message: 'CNPJ é obrigatório.' }
  if (clean.length !== 14) {
    return { valid: false, message: 'CNPJ deve conter exatamente 14 dígitos numéricos.' }
  }

  if (/^(\d)\1{13}$/.test(clean)) {
    return { valid: false, message: 'CNPJ inválido (dígitos repetidos não permitidos).' }
  }

  const multipliers1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    sum1 += Number(clean[i]) * multipliers1[i]
  }
  let rest1 = sum1 % 11
  let dv1 = rest1 < 2 ? 0 : 11 - rest1
  if (dv1 !== Number(clean[12])) {
    return { valid: false, message: 'CNPJ inválido (primeiro dígito verificador incorreto).' }
  }

  const multipliers2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum2 = 0
  for (let i = 0; i < 13; i++) {
    sum2 += Number(clean[i]) * multipliers2[i]
  }
  let rest2 = sum2 % 11
  let dv2 = rest2 < 2 ? 0 : 11 - rest2
  if (dv2 !== Number(clean[13])) {
    return { valid: false, message: 'CNPJ inválido (segundo dígito verificador incorreto).' }
  }

  const formatted = clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return { valid: true, formatted }
}

function validateCnh(cnh) {
  const clean = onlyDigits(cnh)
  if (!clean) return { valid: false, message: 'CNH é obrigatória.' }
  if (clean.length !== 11) {
    return { valid: false, message: 'CNH deve conter exatamente 11 dígitos numéricos.' }
  }
  if (/^(\d)\1{10}$/.test(clean)) {
    return { valid: false, message: 'CNH inválida (sequência repetida).' }
  }

  let v = 0
  for (let i = 0; i < 9; i++) {
    v += Number(clean[i]) * (9 - i)
  }
  let d1 = v % 11
  let dsc = 0
  if (d1 >= 10) {
    d1 = 0
    dsc = 2
  }

  v = 0
  for (let i = 0; i < 9; i++) {
    v += Number(clean[i]) * (1 + i)
  }
  let x = v % 11
  let d2 = x >= 10 ? 0 : x - dsc
  if (d2 < 0) d2 += 11
  if (d2 >= 10) d2 = 0

  if (d1 !== Number(clean[9]) || d2 !== Number(clean[10])) {
    return { valid: false, message: 'Número de CNH inválido (dígitos verificadores não conferem).' }
  }

  return { valid: true, formatted: clean }
}

function validateRenavam(renavam) {
  let clean = onlyDigits(renavam)
  if (!clean) return { valid: false, message: 'Renavam é obrigatório.' }
  if (clean.length < 8 || clean.length > 11) {
    return { valid: false, message: 'Renavam deve ter entre 9 e 11 dígitos numéricos.' }
  }

  clean = clean.padStart(11, '0')

  if (/^(\d)\1{10}$/.test(clean)) {
    return { valid: false, message: 'Renavam inválido (sequência repetida).' }
  }

  const multipliers = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number(clean[i]) * multipliers[i]
  }

  const rest = (sum * 10) % 11
  const expectedDigit = rest === 10 || rest === 11 ? 0 : rest

  if (expectedDigit !== Number(clean[10])) {
    return { valid: false, message: 'Renavam inválido (dígito verificador incorreto).' }
  }

  return { valid: true, formatted: clean }
}

function validatePlaca(placa) {
  if (!placa) return { valid: false, message: 'Placa é obrigatória.' }
  const clean = placa.replace(/[\s-]/g, '').toUpperCase()

  const regexAntiga = /^[A-Z]{3}[0-9]{4}$/
  const regexMercosulCarro = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  const regexMercosulMoto = /^[A-Z]{3}[0-9]{2}[A-Z][0-9]$/

  if (regexAntiga.test(clean)) {
    const formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`
    return { valid: true, pattern: 'antigo', formatted }
  }

  if (regexMercosulCarro.test(clean) || regexMercosulMoto.test(clean)) {
    return { valid: true, pattern: 'mercosul', formatted: clean }
  }

  return {
    valid: false,
    message: 'Placa inválida. Utilize o padrão antigo (ABC-1234) ou Mercosul (ABC1D23).',
  }
}

function validateChassi(chassi) {
  if (!chassi) return { valid: false, message: 'Chassi é obrigatório.' }
  const clean = chassi.replace(/[\s-]/g, '').toUpperCase()

  if (clean.length !== 17) {
    return { valid: false, message: `Chassi deve conter exatamente 17 caracteres (encontrados: ${clean.length}).` }
  }

  if (/[IOQ]/.test(clean)) {
    return {
      valid: false,
      message: 'Chassi inválido: letras "I", "O" e "Q" não são permitidas pelo padrão internacional.',
    }
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(clean)) {
    return { valid: false, message: 'Chassi contém caracteres especiais inválidos.' }
  }

  return { valid: true, formatted: clean }
}

function validateCep(cep) {
  const clean = onlyDigits(cep)
  if (!clean) return { valid: false, message: 'CEP é obrigatório.' }
  if (clean.length !== 8) {
    return { valid: false, message: 'CEP deve conter 8 dígitos numéricos.' }
  }
  const formatted = clean.replace(/(\d{5})(\d{3})/, '$1-$2')
  return { valid: true, formatted }
}

function validateEmail(email) {
  if (!email) return { valid: false, message: 'E-mail é obrigatório.' }
  const clean = email.trim().toLowerCase()
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!regex.test(clean) || clean.length > 254) {
    return { valid: false, message: 'Formato de e-mail inválido (ex: nome@dominio.com).' }
  }
  return { valid: true, formatted: clean }
}

function validatePhoneBr(phone) {
  let clean = onlyDigits(phone)
  if (!clean) return { valid: false, message: 'Telefone é obrigatório.' }

  if (clean.startsWith('55') && (clean.length === 12 || clean.length === 13)) {
    clean = clean.slice(2)
  }

  if (clean.length < 10 || clean.length > 11) {
    return { valid: false, message: 'Telefone deve conter DDD + 8 ou 9 dígitos (ex: 11 96729-6936).' }
  }

  const ddd = Number(clean.slice(0, 2))
  if (ddd < 11 || ddd > 99) {
    return { valid: false, message: 'DDD de telefone inválido.' }
  }

  if (clean.length === 11) {
    if (clean[2] !== '9') {
      return { valid: false, message: 'Celulares de 11 dígitos devem iniciar com o dígito 9 após o DDD.' }
    }
    const formatted = clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    return { valid: true, type: 'celular', formatted }
  } else {
    const formatted = clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    return { valid: true, type: 'fixo', formatted }
  }
}

function validateRg(rg) {
  if (!rg) return { valid: true }
  const clean = rg.replace(/[\s.-]/g, '').toUpperCase()

  if (clean.length < 5 || clean.length > 14) {
    return {
      valid: true,
      warning: 'RG parece fora do padrão usual (costuma ter entre 5 e 14 dígitos/letras).',
      formatted: clean,
    }
  }

  return { valid: true, formatted: clean }
}

function validateDate(dateValue, options) {
  if (!dateValue) return { valid: false, message: 'Data é obrigatória.' }

  const clean = dateValue.trim()
  let day, month, year

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const parts = clean.split('/')
    day = Number(parts[0])
    month = Number(parts[1])
    year = Number(parts[2])
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const parts = clean.split('-')
    year = Number(parts[0])
    month = Number(parts[1])
    day = Number(parts[2])
  } else if (/^\d{8}$/.test(clean)) {
    day = Number(clean.slice(0, 2))
    month = Number(clean.slice(2, 4))
    year = Number(clean.slice(4, 8))
  } else {
    return { valid: false, message: 'Data inválida. Use o formato DD/MM/AAAA.' }
  }

  const minYear = options?.minYear || 1900
  const currentYear = new Date().getFullYear()

  if (year < minYear || year > currentYear + 10) {
    return { valid: false, message: `Ano inválido (deve estar entre ${minYear} e ${currentYear + 10}).` }
  }

  if (month < 1 || month > 12) {
    return { valid: false, message: 'Mês inválido (deve estar entre 1 e 12).' }
  }

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  if (day < 1 || day > daysInMonth[month]) {
    return {
      valid: false,
      message: `Dia inválido para o mês ${String(month).padStart(2, '0')}/${year} (máximo ${daysInMonth[month]} dias).`,
    }
  }

  const parsedDate = new Date(year, month - 1, day, 12, 0, 0)
  const now = new Date()

  if (options?.isBirthDate && parsedDate.getTime() > now.getTime()) {
    return { valid: false, message: 'Data de nascimento não pode estar no futuro.' }
  }

  const pad = (n) => String(n).padStart(2, '0')
  const isoDate = `${year}-${pad(month)}-${pad(day)}`
  const brDate = `${pad(day)}/${pad(month)}/${year}`

  return { valid: true, isoDate, brDate, formatted: brDate }
}

function maskCpf(value) {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

function maskCnpj(value) {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`
}

function maskPhoneBr(value) {
  let d = onlyDigits(value)
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    d = d.slice(2)
  }
  d = d.slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

function maskDateBr(value) {
  const d = onlyDigits(value).slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`
}

module.exports = {
  onlyDigits,
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
}
