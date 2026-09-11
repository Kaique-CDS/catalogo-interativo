import Link from 'next/link'
import { Car, Cake, MessageCircle, LayoutDashboard, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AutoCatálogo SaaS
          </div>
          <div className="flex items-center gap-3">
            <Link href="/confeitaria">
              <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 text-xs">
                🍰 Demo Confeitaria
              </Button>
            </Link>
            <Link href="/loja-exemplo">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                🚗 Demo Veículos
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <span className="inline-block rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-6">
          🚀 Plataforma SaaS Multi-Nicho com Pedido via WhatsApp
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 max-w-3xl mx-auto leading-tight">
          Catálogos interativos que <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">convertem direto no WhatsApp</span>
        </h1>
        <p className="text-lg text-zinc-600 mb-10 max-w-xl mx-auto leading-relaxed">
          Sem cadastros cansativos ou taxas abusivas de marketplaces. Seu cliente escolhe o produto e cai direto no seu WhatsApp pronto para fechar!
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/confeitaria">
            <Button size="lg" className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-200">
              <Cake className="h-5 w-5" />
              Ver Vitrine Confeitaria & Bolos
            </Button>
          </Link>
          <Link href="/loja-exemplo">
            <Button size="lg" variant="outline" className="gap-2 rounded-xl">
              <Car className="h-5 w-5" />
              Ver Vitrine Concessionária / Carros
            </Button>
          </Link>
          <Link href="/loja-exemplo/admin">
            <Button size="lg" variant="secondary" className="gap-2 rounded-xl">
              <LayoutDashboard className="h-5 w-5" />
              Acessar Painel Lojista
            </Button>
          </Link>
        </div>
      </section>

      <section className="border-t bg-zinc-50 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
            <Zap className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-900 mb-1">Ultra Rápido & Mobile</h3>
            <p className="text-xs text-zinc-500">Projetado com foco extremo na navegação por smartphone (90% do tráfego das redes sociais).</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
            <MessageCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-900 mb-1">Lead Qualificado</h3>
            <p className="text-xs text-zinc-500">A mensagem do WhatsApp já chega com foto, nome, especificações e valor do produto escolhido.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs">
            <Sparkles className="h-8 w-8 text-indigo-500 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-900 mb-1">Arquitetura Multi-Tenant</h3>
            <p className="text-xs text-zinc-500">Uma única infraestrutura escalando para centenas ou milhares de lojas parceiras.</p>
          </div>
        </div>
      </section>
    </div>
  )
}