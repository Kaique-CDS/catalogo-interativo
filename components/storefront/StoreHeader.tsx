import Image from 'next/image'
import Link from 'next/link'
import { MapPin, MessageCircle, LayoutDashboard, Sparkles, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Store } from '@/lib/supabase/types'

interface Props { store: Store }

export default function StoreHeader({ store }: Props) {
  const brandColor = store.primary_color || '#18181B'

  return (
    <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800 sticky top-0 z-40 shadow-2xs">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-3 max-w-7xl">
        <div className="flex items-center gap-3 min-w-0">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
              alt={store.name}
              width={48}
              height={48}
              className="rounded-xl object-contain border bg-zinc-50 p-1 flex-shrink-0"
            />
          ) : (
            <div
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-black text-base sm:text-xl text-zinc-900 dark:text-white truncate leading-tight">
              {store.name}
            </h1>
            {store.slogan ? (
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">{store.slogan}</span>
              </p>
            ) : store.address ? (
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0 text-zinc-400 dark:text-zinc-500" />
                <span className="truncate">{store.address}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl w-9 h-9 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <Home className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </Link>
          <Link href={`/${store.slug}/admin`}>
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-9 font-semibold text-zinc-700 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-800">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Painel</span> Admin
            </Button>
          </Link>
          <a
            href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent('Olá! Estava navegando no catálogo e gostaria de tirar uma dúvida.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  )
}