import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import AdminSidebar from '@/components/admin/AdminSidebar'
import LoginPage from './login/page'
import { createClient } from '@/lib/supabase/server'
import type { Store } from '@/lib/supabase/types'

async function getStoreBySlug(slug: string): Promise<Store> {
  const demoStore: Store = {
    id: 'demo-store-id',
    name: 'Milhaticar',
    slug,
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
    created_at: new Date().toISOString(),
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient()
      const { data: dbStore } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
      if (dbStore) {
        return {
          ...demoStore,
          ...dbStore,
          logo_url: dbStore.logo_url || demoStore.logo_url,
          name: dbStore.name || demoStore.name,
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  return demoStore
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const store = await getStoreBySlug(slug)
  const iconUrl = store.logo_url || '/logo-milhaticar.png'

  return {
    title: `${store.name} - Painel Administrativo`,
    description: `Gerenciamento de estoque e catálogo da ${store.name}`,
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
  }
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const normalizedSlug = slug.toLowerCase()

  // Verificação estrita de isolamento de sessão por tenant:
  let isAuthForThisSlug = false

  if (normalizedSlug === 'll-multimarcas') {
    isAuthForThisSlug = cookieStore.get('admin_auth_ll-multimarcas')?.value === 'true'
  } else if (normalizedSlug === 'milhaticar' || normalizedSlug === 'loja-exemplo') {
    isAuthForThisSlug =
      cookieStore.get('admin_auth_milhaticar')?.value === 'true' ||
      cookieStore.get('admin_auth_loja-exemplo')?.value === 'true' ||
      (cookieStore.get('admin_auth')?.value === 'true' && !cookieStore.get('admin_auth_ll-multimarcas')?.value)
  } else {
    isAuthForThisSlug = cookieStore.get(`admin_auth_${normalizedSlug}`)?.value === 'true'
  }

  const storeToUse = await getStoreBySlug(slug)

  // Se não estiver autenticado especificamente para este tenant, exibe a tela de login da loja
  if (!isAuthForThisSlug) {
    return <LoginPage store={storeToUse} />
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-surface-0 font-sans text-foreground overflow-x-hidden">
      <AdminSidebar store={storeToUse} slug={slug} />
      <main className="flex-1 overflow-y-auto pt-[68px] pb-28 md:pt-0 md:pb-8 w-full min-w-0">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto w-full">{children}</div>
      </main>
    </div>
  )
}