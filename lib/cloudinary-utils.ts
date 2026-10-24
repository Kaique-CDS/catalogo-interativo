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

export interface PlayableVideoOptions {
  width?: number
}

/**
 * Converte URLs de vídeo do Cloudinary para entrega universal em MP4 (codec H.264 e áudio AAC).
 * Resolve problemas de vídeos gravados em iPhone (.mov / HEVC) que não tocam em navegadores desktop/Android.
 * Transforma /video/upload/ para /video/upload/f_mp4,vc_h264,ac_aac,q_auto[,w_{width}]/ e troca a extensão final para .mp4.
 */
export function playableVideoUrl(
  url?: string | null,
  options?: PlayableVideoOptions
): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Se não for do Cloudinary ou não for vídeo do Cloudinary, retorna a URL original
  if (!trimmed.includes('cloudinary.com') || !trimmed.includes('/video/upload')) {
    return trimmed
  }

  const widthParam = options?.width ? `,w_${options.width}` : ''
  const transform = `f_mp4,vc_h264,ac_aac,q_auto${widthParam}`

  // 1. Troca a extensão de arquivo (.mov, .webm, .mkv, etc.) para .mp4
  let result = trimmed.replace(/\.(mov|webm|mkv|mp4|avi|m4v)(\?.*)?$/i, '.mp4$2')

  // 2. Injeta ou atualiza a cadeia de transformação após /video/upload/
  const marker = '/video/upload/'
  const uploadIndex = result.indexOf(marker)

  if (uploadIndex !== -1) {
    const prefix = result.slice(0, uploadIndex + marker.length)
    const suffix = result.slice(uploadIndex + marker.length)

    // Segmentos após /video/upload/
    const segments = suffix.split('/')

    // Se o primeiro segmento contiver transformações (ex: q_auto, f_auto, etc.)
    // identificamos por não ser versão ('v' + dígitos) e conter parâmetros típicos
    if (
      segments.length > 1 &&
      !/^v\d+$/i.test(segments[0]) &&
      /^([a-z0-9_-]+:[a-z0-9_-]+|[a-z]_[a-z0-9_-]+,?)+$/i.test(segments[0])
    ) {
      // Substitui o segmento de transformação existente
      segments[0] = transform
      result = prefix + segments.join('/')
    } else {
      // Não há transformações prévias, adiciona a transformação antes do próximo segmento
      result = prefix + `${transform}/` + suffix
    }
  }

  return result
}
