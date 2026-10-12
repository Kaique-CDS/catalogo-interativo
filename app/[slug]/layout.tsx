import React from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let storeName = 'Milhaticar'
  let iconUrl = '/logo-milhaticar.png'
  let slogan = 'Catálogo de Veículos'

  try {
    const supabase = await createClient()
    const { data: store } = await supabase
      .from('stores')
      .select('name, slogan, logo_url')
      .eq('slug', slug)
      .maybeSingle()

    if (store) {
      storeName = store.name || storeName
      iconUrl = store.logo_url || iconUrl
      slogan = store.slogan || slogan
    }
  } catch {
    // fallback to default store metadata
  }

  return {
    title: `${storeName} - Catálogo de Veículos`,
    description: slogan,
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
  }
}

export default function StoreSlugLayout({ children }: Props) {
  return (
    <div className="dark store-fixed-dark min-h-screen bg-surface-0 text-white">
      {children}
    </div>
  )
}
