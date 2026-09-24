'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Car, Cake, MessageCircle, Zap, Sparkles, CheckCircle2, ChevronRight, BarChart3, Users, LayoutDashboard, Shirt, Smile, Utensils, Brush, MonitorSmartphone, Gift, ArrowUpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoForm, setDemoForm] = useState({ name: '', phone: '', email: '' })
  
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert(`Obrigado ${demoForm.name}! Entraremos em contato pelo WhatsApp em breve.`)
    setShowDemoModal(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300 relative">
      
      {/* Botão flutuante Voltar ao Topo */}
      <button 
        onClick={scrollToTop} 
        className="fixed bottom-6 right-6 z-50 p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-lg hover:scale-110 transition-transform"
        aria-label="Voltar ao topo"
      >
        <ArrowUpCircle className="h-6 w-6" />
      </button>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter cursor-pointer" onClick={scrollToTop}>
            <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Venda<span className="text-indigo-600 dark:text-indigo-400">Zap</span>
          </div>
          <nav className="hidden md:flex gap-6 font-medium text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#proposta" className="hover:text-zinc-900 dark:hover:text-white transition">Por que nós?</a>
            <a href="#planos" className="hover:text-zinc-900 dark:hover:text-white transition">Planos</a>
            <a href="#segmentos" className="hover:text-zinc-900 dark:hover:text-white transition">Segmentos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/loja-exemplo">
              <Button variant="ghost" size="sm" className="hidden sm:flex">Home / Demo</Button>
            </Link>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs" onClick={() => setShowDemoModal(true)}>
              Assinar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-32 sm:pb-40 container mx-auto px-4 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        <span className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 px-4 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-6 uppercase tracking-wider">
          O Futuro das Vendas Online
        </span>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl mx-auto leading-[1.1]">
          Catálogos Incríveis que <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-rose-500">vendem direto no WhatsApp</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Sem taxas, sem aplicativos difíceis. Seu cliente acessa seu link, monta o carrinho e a venda cai direto no seu WhatsApp, pronta para ser fechada.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="w-full sm:w-auto gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white rounded-2xl h-14 px-8 text-base font-bold shadow-xl shadow-zinc-900/20" onClick={() => setShowDemoModal(true)}>
            Agendar Demo Grátis <ChevronRight className="h-5 w-5" />
          </Button>
          <Link href="/loja-exemplo">
            <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 rounded-2xl h-14 px-8 text-base font-bold border-2 border-zinc-200 dark:border-zinc-800">
              <Car className="h-5 w-5" /> Ver Simulação de Loja
            </Button>
          </Link>
        </div>
      </section>

      {/* PROPOSTA DE VALOR */}
      <section id="proposta" className="py-20 bg-white dark:bg-zinc-900 border-y border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Por que comprar com a gente?</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Nossa plataforma foi desenhada para acabar com a fricção. Esqueça sistemas lentos e cadastros que fazem o cliente desistir.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ultra Rápido & Mobile First</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                95% das vendas começam pelo Instagram ou TikTok no celular. Nosso catálogo carrega instantaneamente, mantendo a atenção do seu cliente.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fechamento Imediato</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                O pedido chega no seu WhatsApp organizado com todos os dados, opções escolhidas e valor final calculado. É só enviar a chave PIX.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestão Descomplicada</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Painel administrativo intuitivo. Adicione produtos, controle o estoque, oculte itens esgotados e acompanhe suas estatísticas de cliques.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL & CLIENTES */}
      <section className="py-24 container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-16">Números que comprovam nossa eficácia</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          <div>
            <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400 mb-2">+400</p>
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Lojas Ativas</p>
          </div>
          <div>
            <p className="text-5xl font-black text-rose-600 dark:text-rose-400 mb-2">35%</p>
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Aumento em Conversão</p>
          </div>
          <div>
            <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">1M+</p>
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Acessos em Catálogos</p>
          </div>
          <div>
            <p className="text-5xl font-black text-amber-500 mb-2">0%</p>
            <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Taxa por Venda</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto bg-indigo-600 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden text-left flex flex-col md:flex-row items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="md:w-2/3 z-10 mb-8 md:mb-0">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">Veja Nossos Clientes Em Ação</h3>
            <p className="text-indigo-100 mb-6">Confira os templates disponíveis e veja como sua loja pode ficar online em minutos com a mesma qualidade de grandes marcas.</p>
            <div className="flex gap-4">
              <Link href="/loja-exemplo">
                <Button className="bg-white text-indigo-600 hover:bg-zinc-100 rounded-xl font-bold">Ver Catálogo de Carros</Button>
              </Link>
              <Link href="/confeitaria">
                <Button variant="outline" className="text-zinc-600 border-white hover:bg-white/10 rounded-xl font-bold">Ver Catálogo de Bolos</Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/3 flex justify-center z-10">
            <div className="relative w-48 h-96 bg-zinc-900 border-[6px] border-zinc-800 rounded-[2.5rem] shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 flex justify-center items-end pb-1 rounded-t-xl z-20">
                <div className="w-16 h-4 bg-zinc-900 rounded-b-xl"></div>
              </div>
              <div className="text-center px-4">
                <Sparkles className="h-10 w-10 text-indigo-400 mx-auto mb-2" />
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Seu Catálogo Perfeito no Mobile</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEGMENTOS ATENDIDOS */}
      <section id="segmentos" className="py-20 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Feito para o seu negócio</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Adaptamos a vitrine para exibir o que é mais importante no seu nicho.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Shirt, label: 'Moda & Vestuário', color: 'text-pink-500' },
              { icon: Smile, label: 'Produtos de Beleza', color: 'text-rose-400' },
              { icon: Utensils, label: 'Alimentos e Bebidas', color: 'text-orange-500' },
              { icon: Brush, label: 'Arte e Artesanato', color: 'text-amber-500' },
              { icon: MonitorSmartphone, label: 'Eletrônicos', color: 'text-blue-500' },
              { icon: Gift, label: 'Sexshop', color: 'text-purple-500' },
            ].map((seg, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 text-center shadow-xs hover:shadow-md transition-shadow">
                <seg.icon className={`h-8 w-8 mx-auto mb-3 ${seg.color}`} />
                <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{seg.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JORNADA DO CLIENTE */}
      <section className="py-24 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Como funciona?</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Uma jornada desenhada para colocar seu negócio online hoje mesmo.</p>
          </div>
          
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 -translate-y-1/2 hidden md:block" />
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { step: '1', title: 'Agende uma Demo', desc: 'Preencha o formulário e nossa equipe entenderá sua necessidade.' },
                { step: '2', title: 'Configuração Rápida', desc: 'Criamos seu ambiente e configuramos sua identidade visual.' },
                { step: '3', title: 'Cadastre o Estoque', desc: 'Use nosso ERP simples para cadastrar fotos, descrições e valores.' },
                { step: '4', title: 'Venda no WhatsApp', desc: 'Compartilhe seu link no Instagram e receba pedidos organizados.' },
              ].map((j, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4 ring-4 ring-white dark:ring-zinc-900 shadow-lg">
                    {j.step}
                  </div>
                  <h4 className="font-bold mb-2">{j.title}</h4>
                  <p className="text-xs text-zinc-500">{j.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS / PRICING */}
      <section id="planos" className="py-24 bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Planos Transparentes</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Sem taxas sobre as vendas. Você paga apenas a mensalidade do sistema.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Básico */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-xs flex flex-col">
              <h3 className="text-xl font-bold mb-2">Básico</h3>
              <p className="text-zinc-500 text-sm mb-6">Para quem está começando</p>
              <div className="mb-6">
                <span className="text-4xl font-black">R$ 49</span><span className="text-zinc-500">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Até 50 Produtos', 'Link personalizado', 'Botão de WhatsApp', 'Layout Padrão'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold">Assinar Básico</Button>
            </div>
            
            {/* Médio */}
            <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-600 rounded-3xl p-8 shadow-xl relative flex flex-col scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full">
                Mais Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Médio</h3>
              <p className="text-zinc-500 text-sm mb-6">Para pequenos negócios estabelecidos</p>
              <div className="mb-6">
                <span className="text-4xl font-black">R$ 99</span><span className="text-zinc-500">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Até 500 Produtos', 'Cores e Logo customizados', 'Estatísticas Básicas ERP', 'Categorias Ilimitadas'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">Assinar Médio</Button>
            </div>
            
            {/* Premium */}
            <div className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-xs flex flex-col text-white">
              <h3 className="text-xl font-bold mb-2 text-indigo-400">Premium (Foda)</h3>
              <p className="text-zinc-400 text-sm mb-6">A experiência definitiva em catálogos</p>
              <div className="mb-6">
                <span className="text-4xl font-black">R$ 199</span><span className="text-zinc-400">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Produtos Ilimitados', 'IA Geradora de Legendas', 'Multi-atendentes WhatsApp', 'Suporte Prioritário VIP', 'Integração Pixel/Analytics'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-white hover:bg-zinc-200 text-zinc-900 rounded-xl font-bold">Assinar Premium</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER & FEEDBACK */}
      <footer className="bg-zinc-950 text-zinc-400 py-12 border-t border-zinc-900">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-white mb-6">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              VendaZap
            </div>
            <p className="text-sm max-w-sm mb-6">
              A plataforma definitiva para criar catálogos que focam no que importa: fechar a venda de forma humana e rápida no WhatsApp.
            </p>
            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} VendaZap. Todos os direitos reservados.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Sugestões ou Dúvidas?</h4>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); alert('Sugestão enviada!') }}>
              <input type="text" placeholder="Seu nome" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-indigo-500" required />
              <textarea placeholder="Como podemos melhorar? Sugira uma funcionalidade..." rows={3} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-indigo-500 resize-none" required />
              <Button size="sm" className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg">Enviar Feedback</Button>
            </form>
          </div>
        </div>
      </footer>

      {/* MODAL DE DEMO/SIMULAÇÃO */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowDemoModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-2">Agendar Demonstração</h3>
            <p className="text-zinc-500 text-sm mb-6">Deixe seus dados e entraremos em contato para montar o catálogo da sua loja gratuitamente por 7 dias.</p>
            
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">Nome da Empresa / Lojista</label>
                <input required type="text" value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" placeholder="Ex: Boutique da Moda" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">WhatsApp</label>
                <input required type="tel" value={demoForm.phone} onChange={e => setDemoForm({...demoForm, phone: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">E-mail</label>
                <input required type="email" value={demoForm.email} onChange={e => setDemoForm({...demoForm, email: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" placeholder="seu@email.com" />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold mt-2">
                Solicitar Contato
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}