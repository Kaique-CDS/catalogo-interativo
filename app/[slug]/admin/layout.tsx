import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
    const demoStore = { id: 'demo-store-id', name: 'AutoCenter Premium (Modo Demo)', slug }
    return (
      <div className="flex flex-col md:flex-row h-screen bg-zinc-50 overflow-hidden font-sans">
        <AdminSidebar store={demoStore} slug={slug} />
        <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs py-2 px-4 sm:px-6">
            ℹ️ Painel em Modo Demonstração (banco Supabase ainda não conectado no .env.local).
          </div>
          <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    )
  }

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) redirect(`/${slug}/admin/login`)

    const { data: store } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('slug', slug)
      .eq('owner_id', session.user.id)
      .single()

    if (!store) redirect(`/${slug}/admin/login`)

    return (
      <div className="flex flex-col md:flex-row h-screen bg-zinc-50 overflow-hidden font-sans">
        <AdminSidebar store={store} slug={slug} />
        <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
          <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    )
  } catch (err) {
    redirect(`/${slug}/admin/login`)
  }
}