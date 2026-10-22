import { notFound } from 'next/navigation'
import { isContractsEnabled } from '@/lib/contracts/module-guard'

export const dynamic = 'force-dynamic'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

/**
 * Server-side guard estrito para o Módulo de Contratos.
 * Se o módulo não estiver ativado para a loja especificada pelo tenant,
 * retorna 404 (notFound) imediatamente no nível do servidor.
 */
export default async function ContratosLayout({ children, params }: Props) {
  const { slug } = await params
  const enabled = await isContractsEnabled(slug)

  if (!enabled) {
    notFound()
  }

  return <>{children}</>
}
