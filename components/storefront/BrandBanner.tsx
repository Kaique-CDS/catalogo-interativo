import React from 'react'

interface BrandBannerProps {
  altText?: string
  desktopBanner?: string | null
  mobileBanner?: string | null
}

/**
 * Banner de Capa Institucional da Loja.
 * 
 * Regras de renderização (Fase 2):
 * - Se houver banner mobile cadastrado (1080 x 1350 px no admin):
 *   renderiza a arte mobile no breakpoint mobile com proporção 4:5 e a arte desktop no desktop.
 * - Se NÃO houver banner mobile cadastrado:
 *   usa a arte desktop no mobile com proporção 16:9 e foco central (object-center),
 *   evitando corte de texto e caixas espremidas.
 * - Largura 100%, altura automática sem altura fixa e sem corte.
 * - Zero degradês/overlays sobre a arte.
 */
export default function BrandBanner({
  altText = 'Bem-vindo ao catálogo',
  desktopBanner,
  mobileBanner,
}: BrandBannerProps) {
  const desktop = desktopBanner?.trim() || null
  const mobile = mobileBanner?.trim() || null

  // Se a loja não tiver nenhum banner configurado, não exibe caixa vazia
  if (!desktop && !mobile) {
    return null
  }

  const hasDedicatedMobile = Boolean(mobile)

  // Caso 1: Possui banner mobile dedicado
  if (hasDedicatedMobile && mobile) {
    return (
      <div className="w-full relative rounded-2xl overflow-hidden border border-surface bg-surface-1 shadow-xs">
        <picture className="w-full block">
          <source media="(max-width: 767px)" srcSet={mobile} />
          {desktop && <source media="(min-width: 768px)" srcSet={desktop} />}
          <img
            src={desktop || mobile}
            alt={altText}
            width={desktop ? 2560 : 1080}
            height={desktop ? 1097 : 1350}
            className="w-full h-auto object-cover object-center aspect-[4/5] md:aspect-[21/9]"
            loading="eager"
          />
        </picture>
      </div>
    )
  }

  // Caso 2: Não possui banner mobile cadastrado (usa desktop em 16:9 no mobile com foco central)
  const bannerSrc = desktop!
  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-surface bg-surface-1 shadow-xs">
      <picture className="w-full block">
        <img
          src={bannerSrc}
          alt={altText}
          width={2560}
          height={1097}
          className="w-full h-auto object-contain sm:object-cover object-center aspect-[16/9] md:aspect-[21/9]"
          loading="eager"
        />
      </picture>
    </div>
  )
}
