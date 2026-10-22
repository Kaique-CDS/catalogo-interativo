"use strict";
/**
 * Módulo de Normalização e Sanitização Centralizada (Catálogo Interativo)
 * Regras obrigatórias de integridade de dados (Fase 0.2):
 * - CPF, CNPJ, telefone, CEP e Renavam gravados apenas com dígitos
 * - Placas em letras maiúsculas
 * - E-mails em minúsculas e sem espaços
 * - Dinheiro tratado com precisão de centavos (nunca truncado por parseFloat ingênuo)
 * - Datas no fuso America/Sao_Paulo (sem virar o dia por UTC)
 * - Texto preservando acentos UTF-8 e sanitizado contra XSS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDigits = normalizeDigits;
exports.normalizePlate = normalizePlate;
exports.normalizeEmail = normalizeEmail;
exports.normalizeText = normalizeText;
exports.parseBrlCurrency = parseBrlCurrency;
exports.currencyToCents = currencyToCents;
exports.centsToCurrency = centsToCurrency;
exports.normalizeDateToSaoPaulo = normalizeDateToSaoPaulo;
exports.formatDateBr = formatDateBr;
/**
 * Remove qualquer caractere que não seja dígito numérico (0-9).
 * Ideal para CPF, CNPJ, telefones, CEP e Renavam.
 */
function normalizeDigits(val) {
    if (val === undefined || val === null)
        return '';
    return String(val).replace(/\D/g, '').trim();
}
/**
 * Normaliza placa veicular para formato maiúsculo sem hífens ou espaços.
 * Suporta padrão tradicional (ABC1234) e Mercosul (ABC1D23).
 */
function normalizePlate(val) {
    if (!val)
        return '';
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}
/**
 * Normaliza e-mail para minúsculas e sem espaços laterais.
 */
function normalizeEmail(val) {
    if (!val)
        return '';
    return val.trim().toLowerCase();
}
/**
 * Normaliza texto livre preservando caracteres UTF-8 (acentos, cedilhas, aspas)
 * e sanitiza tags HTML perigosas para evitar XSS.
 */
function normalizeText(val) {
    if (!val)
        return '';
    const trimmed = val.trim();
    // Sanitiza scripts e tags perigosas
    return trimmed
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '');
}
/**
 * Converte qualquer representação monetária brasileira (pt-BR) ou numérica para número float seguro
 * com precisão em centavos (2 casas decimais).
 *
 * Ex:
 *  "139.900,00" => 139900
 *  "139900,00"  => 139900
 *  "139.900"    => 139900
 *  "139900"     => 139900
 *  "R$ 1.250,50" => 1250.5
 *  139900       => 139900
 */
function parseBrlCurrency(value) {
    if (value === undefined || value === null || value === '')
        return 0;
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : Math.round(value * 100) / 100;
    }
    const clean = String(value)
        .trim()
        .replace(/^R\$\s*/i, '')
        .replace(/\s+/g, '');
    if (!clean)
        return 0;
    // Caso 1: Tem ponto e vírgula (ex: 139.900,50 ou 1,234.56)
    if (clean.includes('.') && clean.includes(',')) {
        const lastDot = clean.lastIndexOf('.');
        const lastComma = clean.lastIndexOf(',');
        if (lastComma > lastDot) {
            // Padrão pt-BR: 139.900,50
            const normalized = clean.replace(/\./g, '').replace(',', '.');
            const num = parseFloat(normalized);
            return isNaN(num) ? 0 : Math.round(num * 100) / 100;
        }
        else {
            // Padrão US: 139,900.50
            const normalized = clean.replace(/,/g, '');
            const num = parseFloat(normalized);
            return isNaN(num) ? 0 : Math.round(num * 100) / 100;
        }
    }
    // Caso 2: Apenas vírgula (ex: 139900,50 ou 139,50)
    if (clean.includes(',')) {
        const num = parseFloat(clean.replace(',', '.'));
        return isNaN(num) ? 0 : Math.round(num * 100) / 100;
    }
    // Caso 3: Apenas ponto
    if (clean.includes('.')) {
        // Se for formato de milhar pt-BR puro (ex: 139.900 ou 1.500)
        if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
            const num = parseFloat(clean.replace(/\./g, ''));
            return isNaN(num) ? 0 : num;
        }
        // Caso padrão decimal: 139900.50
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : Math.round(num * 100) / 100;
    }
    // Caso 4: Inteiro puro
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}
/**
 * Converte valor em reais para centavos inteiros (para armazenamento seguro sem ponto flutuante).
 */
function currencyToCents(value) {
    const num = parseBrlCurrency(value);
    return Math.round(num * 100);
}
/**
 * Converte centavos inteiros para valor em reais.
 */
function centsToCurrency(cents) {
    return Math.round(cents) / 100;
}
/**
 * Normaliza e formata data no fuso de São Paulo (America/Sao_Paulo),
 * evitando o deslocamento para o dia anterior causado pelo UTC.
 * Retorna no formato YYYY-MM-DD.
 */
function normalizeDateToSaoPaulo(val) {
    if (!val)
        return null;
    try {
        // Se já estiver no formato YYYY-MM-DD, preserva diretamente
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
            return val.trim();
        }
        // Se estiver no formato brasileiro DD/MM/AAAA
        if (typeof val === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(val.trim())) {
            const [d, m, y] = val.trim().split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        const date = typeof val === 'string' ? new Date(val) : val;
        if (isNaN(date.getTime()))
            return null;
        // Converte para dia/mês/ano no fuso horário oficial de Brasília
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(date); // Retorna YYYY-MM-DD
    }
    catch {
        return null;
    }
}
/**
 * Formata data ISO/YYYY-MM-DD para exibição amigável brasileira (DD/MM/AAAA).
 */
function formatDateBr(val) {
    const ymd = normalizeDateToSaoPaulo(val);
    if (!ymd)
        return '';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
}
