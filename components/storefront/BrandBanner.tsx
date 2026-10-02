export default function BrandBanner({ altText = "Bem-vindo à Milhaticar" }: { altText?: string }) {
  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-surface bg-surface-1">
      <picture>
        <source media="(min-width: 768px)" srcSet="/banner-desktop.png" />
        <img 
          src="/banner-mobile.png" 
          alt={altText}
          width={1080}
          height={1350}
          className="w-full h-auto object-cover md:object-contain lg:object-cover aspect-[4/5] md:aspect-[21/9]"
          loading="eager"
        />
      </picture>
    </div>
  )
}
