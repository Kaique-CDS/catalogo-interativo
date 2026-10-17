import React from 'react'

interface BrandBannerProps {
  altText?: string
  desktopBanner?: string | null
  mobileBanner?: string | null
}

export default function BrandBanner({
  altText = 'Bem-vindo ao catálogo',
  desktopBanner,
  mobileBanner,
}: BrandBannerProps) {
  const desktop = desktopBanner?.trim() || null
  const mobile = mobileBanner?.trim() || desktop

  // Se a loja não tiver banner configurado, não quebra nem exibe borda vazia
  if (!desktop && !mobile) {
    return null
  }

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-surface bg-surface-1 shadow-xs">
      <picture>
        {mobile && <source media="(max-width: 768px)" srcSet={mobile} />}
        {desktop && <source media="(min-width: 769px)" srcSet={desktop} />}
        <img
          src={desktop || mobile || ''}
          alt={altText}
          width={2560}
          height={1097}
          className="w-full h-auto object-cover aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]"
          loading="eager"
        />
      </picture>
    </div>
  )
}
