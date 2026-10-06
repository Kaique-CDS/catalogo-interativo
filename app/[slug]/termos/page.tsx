import type { Metadata } from 'next'
import InstitutionalLayout from '@/components/storefront/InstitutionalLayout'

export const metadata: Metadata = { title: 'Termos e Condições - Milhaticar' }

export default async function TermosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <InstitutionalLayout slug={slug} title="Termos e Condições">
      <p className="font-bold text-white">TERMOS E CONDIÇÕES DE USO</p>
      <p>
        Bem-vindo à nossa plataforma. Este documento estabelece os Termos e Condições de Uso aplicáveis ao acesso e
        utilização do nosso sistema de catálogo interativo e classificados de veículos. Ao acessar ou utilizar nosso
        site, você concorda expressamente com as disposições aqui descritas.
      </p>

      <h2>1. Natureza do Serviço</h2>
      <p>
        A plataforma atua como um provedor de espaço em ambiente virtual, oferecendo um catálogo digital interativo
        para a exibição, busca e comparação de veículos automotores. Nosso serviço consiste em aproximar usuários
        interessados na aquisição de veículos e lojistas/concessionárias anunciantes.
      </p>
      <p>
        <strong>Importante:</strong> A plataforma não é proprietária dos veículos exibidos, não guarda posse, não
        realiza as vendas diretas, não atua como intermediária em financiamentos e não garante a veracidade dos dados
        fornecidos pelos lojistas anunciantes.
      </p>

      <h2>2. Cadastro e Responsabilidades do Usuário (Comprador)</h2>
      <p>Ao navegar pela plataforma ou entrar em contato com os lojistas, o usuário compromete-se a:</p>
      <ul>
        <li>Fornecer informações verdadeiras e exatas caso preencha formulários de interesse ou propostas.</li>
        <li>Conduzir as negociações diretamente com a concessionária ou vendedor responsável pelo anúncio.</li>
        <li>
          Tomar todas as precauções necessárias antes de realizar qualquer pagamento ou assinar contratos de compra e
          venda, incluindo a vistoria física do veículo e a verificação de laudos cautelares e histórico de multas
          (Detran/Senatran).
        </li>
      </ul>

      <h2>3. Responsabilidades das Concessionárias e Anunciantes</h2>
      <p>
        Os lojistas que utilizam a infraestrutura do catálogo para expor seus estoques são os únicos e exclusivos
        responsáveis por:
      </p>
      <ul>
        <li>
          Garantir que as informações do veículo (marca, modelo, quilometragem, ano, valor, opcionais e estado de
          conservação) sejam rigorosamente precisas e atualizadas.
        </li>
        <li>Assegurar a procedência lícita dos veículos anunciados.</li>
        <li>Remover ou atualizar imediatamente o anúncio no catálogo assim que o veículo for vendido ou reservado.</li>
        <li>
          Cumprir com todas as normativas do Código de Defesa do Consumidor (Lei nº 8.078/1990) na relação direta com
          o comprador final.
        </li>
      </ul>

      <h2>4. Isenção e Limitação de Responsabilidade</h2>
      <p>Inspirada nos padrões das maiores plataformas automotivas globais, nossa plataforma não se responsabiliza por:</p>
      <ul>
        <li>
          Qualquer transação comercial, pagamento, financiamento ou promessa de negócio firmada entre o usuário e a
          concessionária.
        </li>
        <li>
          Danos diretos, indiretos ou lucros cessantes decorrentes de fraudes de terceiros, falhas na negociação ou
          vícios ocultos nos veículos anunciados.
        </li>
        <li>
          Indisponibilidade temporária do sistema decorrente de manutenção técnica, falhas de provedores de internet
          ou eventos de força maior.
        </li>
      </ul>

      <h2>5. Propriedade Intelectual</h2>
      <p>
        Toda a estrutura da plataforma, incluindo código-fonte (front-end e back-end), bancos de dados, design de
        interface, logotipos, textos e algoritmos de busca, é de propriedade exclusiva da plataforma e protegida pelas
        leis de direitos autorais e propriedade industrial (Lei nº 9.279/1996 e Lei nº 9.610/1998). É terminantemente
        proibido o web scraping (extração de dados automatizada), cópia ou engenharia reversa do nosso sistema.
      </p>

      <h2>6. Privacidade e Proteção de Dados (LGPD)</h2>
      <p>
        A coleta, armazenamento e tratamento de dados pessoais (como nome, telefone e e-mail informados nos
        formulários de lead para as concessionárias) são realizados em estrita conformidade com a Lei Geral de
        Proteção de Dados (Lei nº 13.709/2018). Detalhes sobre como seus dados são protegidos e compartilhados com os
        lojistas estão descritos em nossa{' '}
        <a href={`/${slug}/privacidade`} className="text-brand hover:underline">Política de Privacidade</a>.
      </p>

      <h2>7. Modificações nos Termos de Uso</h2>
      <p>
        Reservamo-nos o direito de alterar, modificar ou atualizar estes Termos e Condições a qualquer momento, para
        refletir melhorias no sistema de catálogo ou adequações legais. O uso contínuo da plataforma após as
        alterações constitui aceitação dos novos termos.
      </p>

      <h2>8. Foro e Legislação Aplicável</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São
        Paulo, Estado de São Paulo, para dirimir quaisquer controvérsias decorrentes da utilização da plataforma,
        renunciando as partes a qualquer outro, por mais privilegiado que seja.
      </p>
    </InstitutionalLayout>
  )
}
