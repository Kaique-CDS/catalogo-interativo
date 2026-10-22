import type { Store } from '@/lib/supabase/types'
import { getTenantBrand } from '@/lib/tenants'

export interface PhoneInfo {
  tel: string
  display: string
  label: string
}

export interface InstagramInfo {
  handle: string
  url: string
}

export interface WhatsAppInfo {
  number: string
  display: string
}

/** Formata qualquer string de telefone brasileiro para tel: e display legível */
export function formatPhone(raw?: string | null, fallbackLabel = 'Televendas'): PhoneInfo {
  if (!raw) {
    return { tel: '', display: '', label: fallbackLabel }
  }

  const digits = raw.replace(/\D/g, '')

  // 10 dígitos: fixo com DDD (ex: 1123760448 -> (11) 2376-0448)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2)
    const part1 = digits.slice(2, 6)
    const part2 = digits.slice(6)
    return {
      tel: `+55${digits}`,
      display: `(${ddd}) ${part1}-${part2}`,
      label: fallbackLabel,
    }
  }

  // 11 dígitos: celular com DDD (ex: 11994942661 -> (11) 99494-2661)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2)
    const part1 = digits.slice(2, 7)
    const part2 = digits.slice(7)
    return {
      tel: `+55${digits}`,
      display: `(${ddd}) ${part1}-${part2}`,
      label: fallbackLabel,
    }
  }

  // 12 ou 13 dígitos começando com DDI 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const local = digits.slice(2)
    const ddd = local.slice(0, 2)
    const rest = local.slice(2)
    const isNine = rest.length === 9
    const part1 = isNine ? rest.slice(0, 5) : rest.slice(0, 4)
    const part2 = isNine ? rest.slice(5) : rest.slice(4)
    return {
      tel: `+${digits}`,
      display: `(${ddd}) ${part1}-${part2}`,
      label: fallbackLabel,
    }
  }

  // Formato livre se não corresponder
  return {
    tel: digits ? `+${digits}` : raw,
    display: raw,
    label: fallbackLabel,
  }
}

/** Resolve telefone oficial para ligações/televendas da loja (com fallback no tenant) */
export function getStorePhone(store?: Store | null): PhoneInfo {
  const brand = getTenantBrand(store?.slug)
  if (store?.phone && store.phone.trim().length > 0) {
    const formatted = formatPhone(store.phone, 'Televendas')
    if (formatted.tel) return formatted
  }
  return brand.phone
}

/** Resolve perfil do Instagram da loja (com fallback no tenant) */
export function getStoreInstagram(store?: Store | null): InstagramInfo {
  const brand = getTenantBrand(store?.slug)
  const raw = store?.instagram?.trim()
  if (raw && raw.length > 0) {
    // Se for URL completa
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const cleanUrl = raw.endsWith('/') ? raw : `${raw}/`
      const handleFromUrl = raw
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
        .replace(/\/.*$/, '')
        .replace('@', '')
      return {
        url: cleanUrl,
        handle: handleFromUrl ? `@${handleFromUrl}` : `@${brand.instagram.handle}`,
      }
    }

    // Se for @handle ou apenas handle
    const handle = raw.replace('@', '').replace(/\/.*$/, '')
    return {
      url: `https://www.instagram.com/${handle}/`,
      handle: `@${handle}`,
    }
  }

  return {
    url: brand.instagram.url,
    handle: brand.instagram.handle.startsWith('@') ? brand.instagram.handle : `@${brand.instagram.handle}`,
  }
}

/** Resolve WhatsApp de atendimento/vendas */
export function getStoreWhatsApp(store?: Store | null): WhatsAppInfo {
  const brand = getTenantBrand(store?.slug)
  const raw = store?.whatsapp?.trim() || brand.whatsapp.number
  const digits = raw.replace(/\D/g, '')
  const fullNumber = digits.startsWith('55')
    ? digits
    : digits.length === 10 || digits.length === 11
    ? `55${digits}`
    : digits
  const formatted = formatPhone(fullNumber)
  return {
    number: fullNumber || brand.whatsapp.number,
    display: formatted.display || brand.whatsapp.display,
  }
}

/** Resolve endereço oficial da loja (com fallback unificado no cadastro da marca) */
export function getStoreAddress(store?: Store | null): string {
  const brand = getTenantBrand(store?.slug)
  return store?.address?.trim() || brand.address || brand.demoStore.address || ''
}

/** Resolve horário oficial de funcionamento da loja (com fallback no tenant) */
export function getStoreOpeningHours(store?: Store | null): string {
  const brand = getTenantBrand(store?.slug)
  return store?.opening_hours?.trim() || brand.demoStore.opening_hours || 'Seg a Sex 09h às 18h | Sáb 09h às 13h'
}
