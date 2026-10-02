import Image from 'next/image'

interface BrandBannerProps {
  altText?: string
}

export default function BrandBanner({ altText = "Bem-vindo à Milhaticar" }: BrandBannerProps) {
  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-surface bg-surface-1">
      {/* Desktop Banner (>= 768px) */}
      <div className="hidden md:block relative w-full h-[300px] lg:h-[400px]">
        <Image 
          src="/brand/milhaticar/banner-desktop.webp" 
          alt={altText}
          fill
          priority
          className="object-contain lg:object-cover"
        />
      </div>

      {/* Mobile Banner (< 768px) */}
      <div className="block md:hidden relative w-full h-[400px]">
        <Image 
          src="/brand/milhaticar/banner-mobile.webp" 
          alt={altText}
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  )
}
