import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Car } from 'lucide-react'

export default function NotFound() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
      <header className="p-6 border-b border-surface">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white">
            <Car className="h-4 w-4" />
          </div>
          <span className="font-heading font-bold text-lg uppercase tracking-wide">VendaZap Catálogos</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl font-black text-brand mb-2">404</span>
        <h1 className="text-2xl font-bold font-heading mb-2">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          O link que você tentou acessar não existe, foi alterado ou a loja não está disponível no momento.
        </p>
        <Link href="/">
          <Button className="btn-brand">Voltar ao Início</Button>
        </Link>
      </main>

      <footer className="border-t border-surface py-5 px-4 text-center">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground font-medium">
            © A PARTIR DE 2022 - {currentYear} VendaZap. Todos os direitos reservados.
          </p>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Desenvolvido por{' '}
            <a
              href="https://vendazap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline transition-colors"
            >
              VendaZap
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
