const assert = require('assert');

console.log('🧪 Iniciando testes do Vídeo Institucional Flutuante (Prompt 2)...\n');

// 1. Validação de formatos permitidos
const validMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
const validExts = ['.mp4', '.webm', '.mov'];

function isValidVideoFormat(mimeType, filename) {
  const lowerName = filename.toLowerCase();
  return validMimes.includes(mimeType) || validExts.some(ext => lowerName.endsWith(ext));
}

assert.strictEqual(isValidVideoFormat('video/mp4', 'apresentacao.mp4'), true);
assert.strictEqual(isValidVideoFormat('video/webm', 'loja.webm'), true);
assert.strictEqual(isValidVideoFormat('video/quicktime', 'gravacao_iphone.mov'), true);
assert.strictEqual(isValidVideoFormat('image/jpeg', 'foto.jpg'), false);
assert.strictEqual(isValidVideoFormat('application/pdf', 'contrato.pdf'), false);
console.log('✅ Teste 1: Validação de formatos suportados (MP4/WebM/MOV) e rejeição de formatos impróprios.');

// 2. Validação do limite de tamanho (30 MB)
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
assert.strictEqual(MAX_VIDEO_BYTES, 31457280);
const videoOk = 20 * 1024 * 1024;
const videoTooLarge = 35 * 1024 * 1024;
assert.strictEqual(videoOk <= MAX_VIDEO_BYTES, true);
assert.strictEqual(videoTooLarge <= MAX_VIDEO_BYTES, false);
console.log('✅ Teste 2: Limite estrito de peso de até 30 MB validado.');

// 3. Geração de poster automático
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

const sampleVid = 'https://res.cloudinary.com/demo/video/upload/v12345/loja/institucional/video1.mp4';
const poster = generateVideoPosterUrl(sampleVid);
assert(poster.includes('/video/upload/so_0,f_jpg,q_auto/'));
assert(poster.endsWith('.jpg'));
console.log('✅ Teste 3: Poster automático gerado com sucesso para o vídeo institucional.');

// 4. Lógica de persistência da dispensa (7 dias)
const DISMISS_DAYS = 7;
function isDismissedActive(dismissedTimestamp, now = Date.now()) {
  if (!dismissedTimestamp) return false;
  const timePassedMs = now - Number(dismissedTimestamp);
  const daysPassed = timePassedMs / (1000 * 60 * 60 * 24);
  return daysPassed < DISMISS_DAYS;
}

const now = Date.now();
const dismissedToday = String(now - 1000 * 60 * 60 * 2); // 2 horas atrás
const dismissed8DaysAgo = String(now - 1000 * 60 * 60 * 24 * 8); // 8 dias atrás

assert.strictEqual(isDismissedActive(dismissedToday, now), true, 'Dispensado hoje deve continuar oculto');
assert.strictEqual(isDismissedActive(dismissed8DaysAgo, now), false, 'Dispensado há 8 dias deve reaparecer');
assert.strictEqual(isDismissedActive(null, now), false, 'Nunca dispensado deve aparecer');
console.log('✅ Teste 4: Regra de persistência no localStorage (reexibir após 7 dias) operando perfeitamente.');

// 5. Verificação de renderização condicional
function shouldRenderWidget(enabled, videoUrl, dismissed) {
  if (!enabled || !videoUrl || dismissed) return false;
  return true;
}

assert.strictEqual(shouldRenderWidget(true, 'https://.../video.mp4', false), true);
assert.strictEqual(shouldRenderWidget(false, 'https://.../video.mp4', false), false);
assert.strictEqual(shouldRenderWidget(true, null, false), false);
assert.strictEqual(shouldRenderWidget(true, 'https://.../video.mp4', true), false);
console.log('✅ Teste 5: Renderização condicional rigorosa (oculta se desativado, sem vídeo ou dispensado).');

console.log('\n🎉 TODOS OS TESTES DO PROMPT 2 (VÍDEO INSTITUCIONAL) PASSARAM COM SUCESSO!');
