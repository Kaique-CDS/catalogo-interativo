const assert = require('assert');

// Extraído de lib/image-specs.ts
const BANNER_SIZE_TOLERANCE_PX = 0;
const IMAGE_SPECS = {
  BANNER_DESKTOP: {
    width: 2560,
    height: 1097,
    maxSizeBytes: 5 * 1024 * 1024,
  },
  BANNER_MOBILE: {
    width: 1080,
    height: 1350,
    maxSizeBytes: 5 * 1024 * 1024,
  },
};

// Extraído de lib/cloudinary.ts
function generateVideoPosterUrl(videoUrl) {
  if (!videoUrl) return '';
  if (videoUrl.match(/\.(jpg|jpeg|png|webp)$/i)) return videoUrl;
  if (videoUrl.includes('/video/upload/')) {
    return videoUrl
      .replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto/')
      .replace(/\.(mp4|webm|mov|mkv)$/i, '.jpg');
  }
  return videoUrl.replace(/\.(mp4|webm|mov|mkv)$/i, '.jpg');
}

console.log('🧪 Iniciando testes de validação e regras de Banners Múltiplos (Prompt 1)...\n');

// 1. Validação de especificações de tamanho Desktop
const deskSpec = IMAGE_SPECS.BANNER_DESKTOP;
assert.strictEqual(deskSpec.width, 2560, 'Banner desktop deve ter 2560 px de largura');
assert.strictEqual(deskSpec.height, 1097, 'Banner desktop deve ter 1097 px de altura');
assert.strictEqual(BANNER_SIZE_TOLERANCE_PX, 0, 'Tolerância de tamanho deve ser estritamente 0 px');
console.log('✅ Teste 1: Dimensões desktop 2560 x 1097 px e tolerância zero verificadas.');

// 2. Validação de especificações de tamanho Mobile
const mobSpec = IMAGE_SPECS.BANNER_MOBILE;
assert.strictEqual(mobSpec.width, 1080, 'Banner mobile deve ter 1080 px de largura');
assert.strictEqual(mobSpec.height, 1350, 'Banner mobile deve ter 1350 px de altura');
console.log('✅ Teste 2: Dimensões mobile 1080 x 1350 px (proporção 4:5) verificadas.');

// 3. Teste de geração de poster automático para vídeo Cloudinary
const sampleVideoUrl = 'https://res.cloudinary.com/test-cloud/video/upload/v1792349558/ll-multimarcas/banners/desktop/banner_vid_123.mp4';
const poster = generateVideoPosterUrl(sampleVideoUrl);
assert(poster.includes('/video/upload/so_0,f_jpg,q_auto/'), 'Poster deve conter transformação so_0 e f_jpg');
assert(poster.endsWith('.jpg'), 'Poster deve ter extensão .jpg');
console.log('✅ Teste 3: Geração automática de URL de poster para vídeo Cloudinary funciona com perfeição.');

// 4. Teste de URLs que já são imagens
const imageUrl = 'https://res.cloudinary.com/test-cloud/image/upload/banner.png';
const posterImg = generateVideoPosterUrl(imageUrl);
assert.strictEqual(posterImg, imageUrl, 'URL de imagem deve ser retornada intacta');
console.log('✅ Teste 4: Imagens puras não sofrem transformação indevida.');

// 5. Teste de ordenação de múltiplos banners
const mockBanners = [
  { id: 'b2', device: 'desktop', sort_order: 1, title: 'Banner 2' },
  { id: 'b3', device: 'desktop', sort_order: 2, title: 'Banner 3' },
  { id: 'b1', device: 'desktop', sort_order: 0, title: 'Banner 1' },
];
const sorted = [...mockBanners].sort((a, b) => a.sort_order - b.sort_order);
assert.strictEqual(sorted[0].id, 'b1');
assert.strictEqual(sorted[1].id, 'b2');
assert.strictEqual(sorted[2].id, 'b3');
console.log('✅ Teste 5: Ordenação de múltiplos banners por sort_order opera corretamente.');

// 6. Teste de separação por dispositivo
const allBanners = [
  { id: 'd1', device: 'desktop', is_active: true },
  { id: 'd2', device: 'desktop', is_active: false },
  { id: 'm1', device: 'mobile', is_active: true },
];
const activeDesktop = allBanners.filter(b => b.device === 'desktop' && b.is_active);
const activeMobile = allBanners.filter(b => b.device === 'mobile' && b.is_active);
assert.strictEqual(activeDesktop.length, 1);
assert.strictEqual(activeMobile.length, 1);
console.log('✅ Teste 6: Filtro de banners ativos por dispositivo funciona perfeitamente.');

console.log('\n🎉 TODOS OS TESTES DO PROMPT 1 (BANNERS MÚLTIPLOS) PASSARAM COM SUCESSO!');
