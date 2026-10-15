import type { Metadata } from 'next'
import InstitutionalLayout from '@/components/storefront/InstitutionalLayout'
import { getTenantBrand } from '@/lib/tenants'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = getTenantBrand(slug)
  return { title: `Quem Somos - ${brand.name}` }
}

export default async function QuemSomosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = getTenantBrand(slug)

  if (brand.slugs.includes('ll-multimarcas')) {
    return (
      <InstitutionalLayout slug={slug} title="Quem Somos">
        <p>
          <strong>L&L MULTIMARCAS</strong> é a sua loja especializada em veículos seminovos selecionados, com
          parceria em todos os bancos e as melhores condições de aprovação do mercado, inclusive para autônomos.
        </p>
        <p>Veículos revisados, de total procedência e com qualidade garantida para você realizar seu sonho com tranquilidade.</p>
        <p>Nossa missão é propiciar aos nossos clientes uma experiência transparente, ágil e segura na aquisição do seu novo carro.</p>
        <p className="font-heading text-heading text-xl uppercase tracking-wide pt-4">
          L&L MULTIMARCAS — CONFIANÇA E PARCERIA PARA O SEU PRÓXIMO VEÍCULO!
        </p>
      </InstitutionalLayout>
    )
  }

  return (
    <InstitutionalLayout slug={slug} title="Quem Somos">
      <p>
        <strong>MILHATICAR</strong> é a nova loja de veículos Novos e Seminovos localizada na{' '}
        <strong>AV. GOV. ADHEMAR DE BARROS, 2618 - BRAZ CUBAS - MOGI DAS CRUZES - SP</strong>.
      </p>
      <p>Veículos de procedência, com qualidade garantida.</p>
      <p>Nossa missão é propiciar aos nossos clientes uma ótima experiência na aquisição de um novo carro.</p>
      <p className="font-heading text-heading text-xl uppercase tracking-wide pt-4">
        MILHATICAR, VEÍCULOS NOVOS E SEMINOVOS, NACIONAIS E IMPORTADOS!
      </p>
    </InstitutionalLayout>
  )
}
