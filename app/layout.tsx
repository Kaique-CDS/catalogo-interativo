import type { Metadata } from 'next'
import { Montserrat, Anton } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import CookieBanner from '@/components/storefront/CookieBanner'
import { ThemeProvider } from '@/components/ThemeProvider'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Catalogo Interativo',
  description: 'Catalogos digitais para lojas de veiculos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={`${montserrat.variable} ${anton.variable} font-sans antialiased`}
            style={{ fontFamily: 'var(--font-body, Montserrat, sans-serif)' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <CookieBanner />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
