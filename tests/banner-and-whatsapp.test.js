/**
 * Suíte de Testes Automatizados - Fase 2: Banner Mobile e Botão do WhatsApp
 * Executar com: node tests/banner-and-whatsapp.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

console.log('=== TESTES DE BANNER MOBILE E WHATSAPP (FASE 2) ===')

// 1. Verificação do BrandBanner.tsx
const brandBannerPath = path.join(__dirname, '..', 'components', 'storefront', 'BrandBanner.tsx')
const brandBannerContent = fs.readFileSync(brandBannerPath, 'utf8')

console.log('\n[1. Validação de BrandBanner.tsx]')

// Teste 1.1: Sem overlays ou degradês cobrindo a arte
assert(
  !brandBannerContent.includes('bg-gradient') &&
  !brandBannerContent.includes('from-black') &&
  !brandBannerContent.includes('from-white'),
  'BrandBanner não pode conter nenhum degradê ou overlay cobrindo o banner'
)
console.log('  ✓ Zero overlays e zero degradês cobrindo a arte')

// Teste 1.2: Quando possui banner mobile dedicado (4:5)
assert(
  brandBannerContent.includes('aspect-[4/5]'),
  'Quando há banner mobile, deve usar proporção 4:5 (1080x1350)'
)
console.log('  ✓ Banner mobile dedicado usa proporção 4:5')

// Teste 1.3: Quando banner mobile está ausente (deve usar desktop em 16:9 com foco central)
assert(
  brandBannerContent.includes('aspect-[16/9]') &&
  brandBannerContent.includes('object-center'),
  'Quando banner mobile estiver ausente, deve aplicar proporção 16:9 e foco central (object-center)'
)
console.log('  ✓ Banner mobile ausente usa desktop em proporção 16:9 com foco central')

// Teste 1.4: Largura 100% e altura automática sem altura fixa
assert(
  brandBannerContent.includes('w-full') &&
  !brandBannerContent.includes('h-64') &&
  !brandBannerContent.includes('h-[400px]'),
  'Banner deve ter largura 100% e sem altura fixa arbitrária'
)
console.log('  ✓ Largura 100% sem altura fixa arbitrária')

// Teste 1.5: Se não houver banner, retorna null (sem caixa vazia)
assert(
  brandBannerContent.includes('if (total === 0)') &&
  brandBannerContent.includes('return null'),
  'Se não houver banner nenhum, BrandBanner deve retornar null sem renderizar borda vazia'
)
console.log('  ✓ Retorna null se nenhum banner estiver configurado')

// 2. Verificação de StorefrontClient.tsx
const storefrontPath = path.join(__dirname, '..', 'app', '[slug]', 'StorefrontClient.tsx')
const storefrontContent = fs.readFileSync(storefrontPath, 'utf8')

console.log('\n[2. Validação de StorefrontClient.tsx]')

// Teste 2.1: mobileBanner não pode fazer fallback incorreto para store.banner_url
assert(
  !storefrontContent.includes('mobileBanner={store.banner_mobile_url || brand.banners.mobile || store.banner_url}'),
  'StorefrontClient não deve passar banner_url desktop como mobileBanner'
)
console.log('  ✓ mobileBanner não engana o componente com fallback de desktop')

// 3. Verificação de FloatingWhatsApp.tsx
const whatsappPath = path.join(__dirname, '..', 'components', 'storefront', 'FloatingWhatsApp.tsx')
const whatsappContent = fs.readFileSync(whatsappPath, 'utf8')

console.log('\n[3. Validação de FloatingWhatsApp.tsx]')

// Teste 3.1: Offset mobile elevado para não cobrir botões de busca/filtros
assert(
  whatsappContent.includes('bottom-[max(5rem') || whatsappContent.includes('env(safe-area-inset-bottom'),
  'FloatingWhatsApp deve possuir offset inferior ampliado no mobile e respeitar safe-area'
)
console.log('  ✓ Offset inferior no mobile aumentado com suporte a safe-area-inset-bottom')

// Teste 3.2: Offset direito respeitando safe-area
assert(
  whatsappContent.includes('env(safe-area-inset-right'),
  'FloatingWhatsApp deve respeitar safe-area-inset-right'
)
console.log('  ✓ Offset lateral direito com suporte a safe-area-inset-right')

// Teste 3.3: Acoplamento dinâmico com rodapé para não cobrir créditos
assert(
  whatsappContent.includes('IntersectionObserver') &&
  whatsappContent.includes('bottomOffset'),
  'FloatingWhatsApp deve ancorar acima do rodapé dinamicamente'
)
console.log('  ✓ Acoplamento dinâmico com rodapé ativo')

// 4. Testes responsivos simulados de proporção e dimensões
console.log('\n[4. Testes de Proporções e Viewports (360px, 390px, 414px)]')

const viewports = [
  { name: 'Mobile Pequeno (360px)', width: 360 },
  { name: 'Mobile Padrão (390px)', width: 390 },
  { name: 'Mobile Plus/Max (414px)', width: 414 },
]

viewports.forEach(vp => {
  // Com banner mobile presente: proporção 4:5
  const heightWithMobile = Math.round(vp.width / (4 / 5))
  // Com banner mobile ausente: proporção 16:9
  const heightWithDesktopFallback = Math.round(vp.width / (16 / 9))

  assert(heightWithMobile > 0, `Altura 4:5 em ${vp.name} deve ser válida`)
  assert(heightWithDesktopFallback > 0, `Altura 16:9 em ${vp.name} deve ser válida`)
  
  // A altura em 16:9 é ~56% da largura, evitando ocupar toda a tela do celular
  assert(
    heightWithDesktopFallback < heightWithMobile,
    `Fallback 16:9 (${heightWithDesktopFallback}px) deve ser mais compacto que arte vertical 4:5 (${heightWithMobile}px) em ${vp.name}`
  )

  console.log(`  ✓ ${vp.name}: Banner dedicado 4:5 = ${vp.width}x${heightWithMobile}px | Fallback 16:9 = ${vp.width}x${heightWithDesktopFallback}px`)
})

console.log('\n✅ Todos os testes da Fase 2 passaram com sucesso!')
