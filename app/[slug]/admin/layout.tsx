import { cookies } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import LoginPage from './login/page'
import { createClient } from '@/lib/supabase/server'
import type { Store } from '@/lib/supabase/types'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const isAuthCookie = cookieStore.get('admin_auth')?.value === 'true'

  // Se não estiver logado, exibe a tela de login diretamente sem loops de redirect
  if (!isAuthCookie) {
    return <LoginPage />
  }

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
    slogan: 'Certeza de bons negócios',
    owner_id: 'demo-owner',
    created_at: new Date().toISOString(),
  }

  let storeToUse = demoStore

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    try {
      const supabase = await createClient()
      const { data: dbStore } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
      if (dbStore) storeToUse = dbStore
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-surface-0 font-sans text-white">
      <AdminSidebar store={storeToUse} slug={slug} />
      <main className="flex-1 overflow-y-auto pt-16 pb-24 md:pt-0 md:pb-8">
        <div className="p-4 sm:p-6 md:p-8 max-w-[1100px] mx-auto">{children}</div>
      </main>
    </div>
  )
}