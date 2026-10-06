import type { Metadata } from 'next'
import InstitutionalLayout from '@/components/storefront/InstitutionalLayout'

export const metadata: Metadata = { title: 'Política de Privacidade - Milhaticar' }

export default async function PrivacidadePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <InstitutionalLayout slug={slug} title="Política de Privacidade">
      <p>
        A sua privacidade é uma prioridade para nós. Esta Política de Privacidade descreve como a nossa plataforma de
        catálogo interativo de veículos coleta, utiliza, armazena e protege os seus dados pessoais, em estrita
        conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018).
      </p>
      <p>
        Ao acessar nosso site e interagir com os anúncios das concessionárias e lojistas parceiros, você concorda com
        as práticas descritas neste documento.
      </p>

      <h2>1. Quais dados coletamos?</h2>
      <p>
        Coletamos os seguintes tipos de informações para garantir o funcionamento da plataforma e facilitar a sua
        comunicação com os vendedores:
      </p>
      <ul>
        <li>
          <strong>Dados fornecidos por você:</strong> Nome completo, endereço de e-mail, número de telefone (WhatsApp)
          e outras informações preenchidas voluntariamente ao enviar uma proposta, agendar um test drive ou solicitar
          contato de uma concessionária específica.
        </li>
        <li>
          <strong>Dados de navegação e uso (coletados automaticamente):</strong> Endereço IP, tipo de navegador,
          dispositivo utilizado, tempo de permanência no site, páginas de veículos acessadas e interações com a
          interface do catálogo.
        </li>
      </ul>

      <h2>2. Como utilizamos os seus dados?</h2>
      <p>
        Os dados coletados têm finalidades específicas e legítimas, voltadas para a prestação do nosso serviço de
        classificados multi-tenant:
      </p>
      <ul>
        <li>
          <strong>Intermediação de Contato:</strong> Encaminhar o seu interesse (lead) diretamente para a
          concessionária ou lojista responsável pelo veículo selecionado.
        </li>
        <li>
          <strong>Melhoria da Plataforma:</strong> Analisar o comportamento de busca para aprimorar o desempenho, a
          usabilidade e a estrutura do nosso sistema web.
        </li>
        <li>
          <strong>Comunicação:</strong> Enviar atualizações sobre veículos do seu interesse, caso você tenha optado
          por receber alertas de preços ou novidades do catálogo.
        </li>
        <li>
          <strong>Segurança:</strong> Prevenir fraudes, abusos e garantir a segurança do ambiente virtual para
          compradores e anunciantes.
        </li>
      </ul>

      <h2>3. Com quem compartilhamos os seus dados?</h2>
      <p>Nós não vendemos ou alugamos seus dados pessoais. O compartilhamento ocorre apenas nas seguintes situações:</p>
      <ul>
        <li>
          <strong>Concessionárias e Lojistas Parceiros:</strong> Seus dados de contato (nome, telefone, e-mail) são
          compartilhados exclusivamente com o anunciante do veículo pelo qual você demonstrou interesse, para que a
          negociação possa ocorrer.
        </li>
        <li>
          <strong>Provedores de Serviços de Tecnologia:</strong> Empresas de hospedagem em nuvem, serviços de banco de
          dados e ferramentas de analytics que suportam a infraestrutura do nosso site, todos operando sob rigorosos
          acordos de confidencialidade.
        </li>
        <li>
          <strong>Obrigação Legal:</strong> Mediante ordem judicial ou requisição de autoridades competentes.
        </li>
      </ul>

      <h2>4. Armazenamento e Segurança da Informação</h2>
      <p>
        Armazenamos seus dados em servidores seguros e adotamos medidas técnicas e administrativas modernas (como
        criptografia e controle de acesso) para proteger suas informações contra acessos não autorizados, perdas ou
        alterações. Os dados serão mantidos apenas pelo tempo necessário para cumprir as finalidades descritas nesta
        política ou para o cumprimento de obrigações legais.
      </p>

      <h2>5. Uso de Cookies</h2>
      <p>
        Utilizamos cookies e tecnologias semelhantes para reconhecer seu navegador ou dispositivo, aprender mais sobre
        seus interesses em modelos de carros específicos e oferecer recursos e serviços essenciais. Você pode
        gerenciar ou desabilitar os cookies a qualquer momento através das configurações do seu navegador, mas isso
        pode limitar algumas funcionalidades interativas do nosso catálogo.
      </p>

      <h2>6. Seus Direitos como Titular dos Dados (LGPD)</h2>
      <p>Você tem controle total sobre as suas informações. A qualquer momento, você pode solicitar:</p>
      <ul>
        <li><strong>Confirmação e Acesso:</strong> Saber quais dados seus nós possuímos.</li>
        <li><strong>Correção:</strong> Atualizar dados incompletos, inexatos ou desatualizados.</li>
        <li>
          <strong>Anonimização, Bloqueio ou Eliminação:</strong> Pedir a exclusão dos seus dados dos nossos bancos de
          dados (exceto quando a retenção for obrigatória por lei).
        </li>
        <li>
          <strong>Revogação do Consentimento:</strong> Interromper o uso dos seus dados para envios de marketing ou
          novas comunicações.
        </li>
      </ul>
      <p>
        Para exercer seus direitos, entre em contato pelo Televendas{' '}
        <a href="tel:+551147294937" className="text-brand hover:underline">(11) 4729-4937</a> ou pelo WhatsApp{' '}
        <a href="https://wa.me/5511994942661" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">(11) 99494-2661</a>.
      </p>

      <h2>7. Atualizações desta Política</h2>
      <p>
        Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nosso sistema, novas
        funcionalidades do catálogo de veículos ou alterações nas leis vigentes. Recomendamos que você revise esta
        página regularmente.
      </p>

      <h2>8. Contato e Foro</h2>
      <p>
        Fica eleito o foro da Comarca de São Paulo, SP, para dirimir eventuais litígios decorrentes desta política. Se
        você tiver qualquer dúvida sobre como seus dados são tratados, entre em contato conosco por meio dos nossos
        canais de atendimento oficiais.
      </p>
    </InstitutionalLayout>
  )
}
