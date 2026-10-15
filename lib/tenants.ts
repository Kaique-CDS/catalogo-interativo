import type { Store } from '@/lib/supabase/types'

/**
 * Identidade visual / textual por tenant.
 *
 * O roteamento continua por slug (/[slug]) e os dados (nome, logo, WhatsApp, veículos)
 * continuam vindo da tabela `stores` do Supabase. Este registro guarda apenas o que
 * antes estava fixo no código (Instagram, telefone, banners, rodapé, textos de marca,
 * tema) para que cada tenant tenha sua própria identidade.
 *
 * A Milhaticar é o tenant PADRÃO: qualquer slug não cadastrado aqui continua
 * recebendo exatamente a identidade que já existia (comportamento inalterado).
 */
export interface TenantBrand {
  /** Slugs que resolvem para este tenant */
  slugs: string[]
  /** true apenas para o tenant padrão (Milhaticar) */
  isDefault: boolean
  name: string
  /** Classe CSS que sobrescreve os tokens de cor (null = tokens padrão) */
  themeClass: string | null
  /** Cor da barra do navegador mobile (meta theme-color) */
  themeColor: string
  metaDescription: string
  instagram: { handle: string; url: string }
  phone: { tel: string; display: string; label: string }
  whatsapp: { number: string; display: string }
  /** Endereço exibido no rodapé (null = linha oculta) */
  address: string | null
  logo: {
    header: string
    footer: string
    favicon: string
    appleIcon: string
    og: string
  }
  banners: { desktop: string; mobile: string }
  copyright: (year: number) => string
  /** Usa os veículos demo do localStorage quando não há banco (somente o tenant padrão) */
  allowLocalDemoVehicles: boolean
  /** Loja usada quando o Supabase não responde */
  demoStore: Omit<Store, 'slug'>
}

const MILHATICAR: TenantBrand = {
  slugs: ['loja-exemplo', 'milhaticar'],
  isDefault: true,
  name: 'Milhaticar',
  themeClass: null,
  themeColor: '#000000',
  metaDescription: 'Catálogo de Veículos',
  instagram: { handle: 'milhaticarsp', url: 'https://instagram.com/milhaticarsp' },
  phone: { tel: '+551147294937', display: '(11) 4729-4937', label: 'Televendas' },
  whatsapp: { number: '5511994942661', display: '(11) 99494-2661' },
  address: 'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
  logo: {
    header: '/logo-milhaticar.png',
    footer: '/logo-milhaticar.png',
    favicon: '/logo-milhaticar.png',
    appleIcon: '/logo-milhaticar.png',
    og: '/logo-milhaticar.png',
  },
  banners: { desktop: '/banner-desktop.png', mobile: '/banner-mobile.png' },
  copyright: (year) => `© DESDE 2019 - ${year} MILHATICAR. Todos os direitos reservados.`,
  allowLocalDemoVehicles: true,
  demoStore: {
    id: 'demo-store-id',
    name: 'Milhaticar',
    logo_url: '/logo-milhaticar.png',
    banner_url: null,
    address: 'Av. Gov. Adhemar de Barros, 2618 – Braz Cubas – Mogi das Cruzes/SP',
    whatsapp: '5511994942661',
    whatsapp_financeiro: '5511994942661',
    opening_hours: 'Seg a Sex: 09h às 18h | Sáb: 09h às 13h',
    primary_color: '#18181B',
    font_family: 'Inter',
    slogan: 'VEÍCULOS NOVOS E SEMINOVOS, NACIONAIS E IMPORTADOS!',
    owner_id: 'demo-owner',
    created_at: new Date(0).toISOString(),
  },
}

const LL_ASSETS = '/tenants/ll-multimarcas'

const LL_MULTIMARCAS: TenantBrand = {
  slugs: ['ll-multimarcas'],
  isDefault: false,
  name: 'L&L Multimarcas',
  themeClass: 'tenant-ll-multimarcas',
  themeColor: '#0A0A0A',
  metaDescription:
    'L&L Multimarcas: seminovos multimarcas com parceria em todos os bancos e facilidades para autônomos. Confira o estoque e fale com a gente.',
  instagram: { handle: 'lloficial.multimarcas', url: 'https://instagram.com/lloficial.multimarcas' },
  phone: { tel: '+551123760448', display: '(11) 2376-0448', label: 'Televendas' },
  whatsapp: { number: '551123760448', display: '(11) 2376-0448' },
  address: null,
  logo: {
    header: `${LL_ASSETS}/logo-header.png`,
    footer: `${LL_ASSETS}/logo-footer.png`,
    favicon: `${LL_ASSETS}/favicon-48.png`,
    appleIcon: `${LL_ASSETS}/apple-touch-icon.png`,
    og: `${LL_ASSETS}/og-image.jpg`,
  },
  banners: { desktop: `${LL_ASSETS}/banner-desktop.jpg`, mobile: `${LL_ASSETS}/banner-mobile.jpg` },
  copyright: (year) => `© ${year} L&L MULTIMARCAS. Todos os direitos reservados.`,
  allowLocalDemoVehicles: false,
  demoStore: {
    id: 'demo-ll-multimarcas',
    name: 'L&L Multimarcas',
    logo_url: `${LL_ASSETS}/logo-header.png`,
    banner_url: null,
    address: null,
    whatsapp: '551123760448',
    whatsapp_financeiro: null,
    opening_hours: null,
    primary_color: '#4B1F8F',
    font_family: 'Inter',
    slogan: 'Seminovos com parceria em todos os bancos',
    owner_id: 'demo-owner',
    created_at: new Date(0).toISOString(),
  },
}

const TENANTS: TenantBrand[] = [MILHATICAR, LL_MULTIMARCAS]

export const DEFAULT_TENANT = MILHATICAR

/** Resolve a identidade do tenant a partir do slug da URL. Slugs desconhecidos usam a Milhaticar. */
export function getTenantBrand(slug?: string | null): TenantBrand {
  const key = (slug || '').toLowerCase()
  return TENANTS.find((t) => t.slugs.includes(key)) ?? DEFAULT_TENANT
}

/** Loja de fallback (sem banco) com o slug atual. */
export function getTenantDemoStore(slug: string): Store {
  return { ...getTenantBrand(slug).demoStore, slug }
}
