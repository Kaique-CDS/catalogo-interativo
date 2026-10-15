import React from 'react'
import type { Metadata, Viewport } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getTenantBrand } from '@/lib/tenants'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateViewport({ params }: { params: Promise<{ slug: string }> }): Promise<Viewport> {
  const { slug } = await params
  const brand = getTenantBrand(slug)
  return {
    themeColor: brand.themeColor,
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = getTenantBrand(slug)
  let storeName = brand.name
  let iconUrl = brand.logo.favicon
  let appleIconUrl = brand.logo.appleIcon
  let slogan = brand.metaDescription
  let ogImage = brand.logo.og

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
      appleIconUrl = store.logo_url || appleIconUrl
      slogan = store.slogan || slogan
    }
  } catch {
    // fallback to tenant brand metadata
  }

  const title = `${storeName} - Catálogo de Veículos`

  return {
    title,
    description: slogan,
    icons: {
      icon: [
        { url: iconUrl, sizes: 'any' },
        { url: iconUrl, type: 'image/png' },
      ],
      shortcut: iconUrl,
      apple: appleIconUrl,
    },
    openGraph: {
      title,
      description: slogan,
      siteName: storeName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: storeName,
        },
      ],
      type: 'website',
    },
  }
}

export default async function StoreSlugLayout({ children, params }: Props) {
  const { slug } = await params
  const brand = getTenantBrand(slug)
  const isLightTenant = brand.themeClass === 'tenant-ll-multimarcas'

  return (
    <div
      data-tenant={brand.slugs[0]}
      className={cn(
        'min-h-screen',
        isLightTenant
          ? 'light bg-surface-0 text-foreground'
          : 'dark store-fixed-dark bg-surface-0 text-white',
        brand.themeClass
      )}
    >
      {children}
    </div>
  )
}
