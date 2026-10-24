/**
 * Utilitários puros de URL para Cloudinary, 100% seguros para execução no Browser e no Servidor.
 * Não importa a SDK Node do 'cloudinary' para evitar dependências de 'fs' ou módulos nativos no bundle client-side.
 */

/**
 * Normaliza e otimiza a URL da foto de cliente via Cloudinary.
 * Proporção uniforme (w: 800, h: 1000 - 4:5), corte inteligente focado nas pessoas/carros (c_fill, g_auto),
 * formato moderno automático (f_auto) e compressão otimizada (q_auto).
 */
export function normalizeCustomerPhotoUrl(
  url: string,
  width = 800,
  height = 1000
): string {
  if (!url) return ''
  if (!url.includes('cloudinary.com') || !url.includes('/image/upload/')) {
    return url
  }
  // Se já possui transformação c_fill, não duplicar
  if (url.includes('/c_fill')) {
    return url
  }
  return url.replace(
    '/image/upload/',
    `/image/upload/c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/`
  )
}

/**
 * Gera URL de poster JPG automático para um vídeo hospedado no Cloudinary
 */
export function generateVideoPosterUrl(videoUrl: string): string {
  if (!videoUrl) return ''
  if (videoUrl.match(/\.(jpg|jpeg|png|webp)$/i)) return videoUrl
  if (videoUrl.includes('/video/upload/')) {
    return videoUrl
      .replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto/')
      .replace(/\.(mp4|webm|mov|mkv)$/i, '.jpg')
  }
  return videoUrl.replace(/\.(mp4|webm|mov|mkv)$/i, '.jpg')
}
