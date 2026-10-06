import type { Metadata } from 'next'
import InstitutionalLayout from '@/components/storefront/InstitutionalLayout'

export const metadata: Metadata = { title: 'Quem Somos - Milhaticar' }

export default async function QuemSomosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <InstitutionalLayout slug={slug} title="Quem Somos">
      <p>
        <strong>MILHATICAR</strong> é a nova loja de veículos Novos e Seminovos localizada na{' '}
        <strong>AV. GOV. ADHEMAR DE BARROS, 2618 - BRAZ CUBAS - MOGI DAS CRUZES - SP</strong>.
      </p>
      <p>Veículos de procedência, com qualidade garantida.</p>
      <p>Nossa missão é propiciar aos nossos clientes uma ótima experiência na aquisição de um novo carro.</p>
      <p className="font-heading text-white text-xl uppercase tracking-wide pt-4">
        MILHATICAR, VEÍCULOS NOVOS E SEMINOVOS, NACIONAIS E IMPORTADOS!
      </p>
    </InstitutionalLayout>
  )
}
