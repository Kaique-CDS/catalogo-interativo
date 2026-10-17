/**
 * Especificações rígidas de imagens para Logo e Banners de Lojas.
 */

export const BANNER_SIZE_TOLERANCE_PX = 0

export const IMAGE_SPECS = {
  BANNER_DESKTOP: {
    label: 'Banner de Capa — Desktop',
    width: 2560,
    height: 1097,
    aspectRatio: '2560 / 1097',
    aspectLabel: '~21:9',
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    folderSuffix: 'banners/desktop',
  },
  BANNER_MOBILE: {
    label: 'Banner de Capa — Mobile',
    width: 1080,
    height: 1350,
    aspectRatio: '4 / 5',
    aspectLabel: '4:5',
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    folderSuffix: 'banners/mobile',
  },
  LOGO: {
    label: 'Logo da Loja',
    minWidth: 400,
    maxWidth: 2000,
    minHeight: 400,
    maxHeight: 2000,
    maxSizeBytes: 2 * 1024 * 1024, // 2 MB
    maxSizeMB: 2,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
    folderSuffix: 'logo',
  },
} as const

export type AssetType = 'logo' | 'banner_desktop' | 'banner_mobile'

export interface ImageDimensions {
  width: number
  height: number
  sizeBytes: number
  mimeType?: string
  name?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Valida se um arquivo de imagem atende às especificações rígidas.
 */
export function validateStoreAsset(
  type: AssetType,
  image: ImageDimensions
): ValidationResult {
  if (type === 'banner_desktop') {
    const spec = IMAGE_SPECS.BANNER_DESKTOP

    if (image.sizeBytes > spec.maxSizeBytes) {
      const actualMB = (image.sizeBytes / (1024 * 1024)).toFixed(1)
      return {
        valid: false,
        error: `O banner desktop excede o peso máximo de ${spec.maxSizeMB} MB (arquivo enviado tem ${actualMB} MB).`,
      }
    }

    if (
      Math.abs(image.width - spec.width) > BANNER_SIZE_TOLERANCE_PX ||
      Math.abs(image.height - spec.height) > BANNER_SIZE_TOLERANCE_PX
    ) {
      return {
        valid: false,
        error: `O banner desktop precisa ter exatamente ${spec.width} x ${spec.height} px. A imagem enviada tem ${image.width} x ${image.height} px.`,
      }
    }

    return { valid: true }
  }

  if (type === 'banner_mobile') {
    const spec = IMAGE_SPECS.BANNER_MOBILE

    if (image.sizeBytes > spec.maxSizeBytes) {
      const actualMB = (image.sizeBytes / (1024 * 1024)).toFixed(1)
      return {
        valid: false,
        error: `O banner mobile excede o peso máximo de ${spec.maxSizeMB} MB (arquivo enviado tem ${actualMB} MB).`,
      }
    }

    if (
      Math.abs(image.width - spec.width) > BANNER_SIZE_TOLERANCE_PX ||
      Math.abs(image.height - spec.height) > BANNER_SIZE_TOLERANCE_PX
    ) {
      return {
        valid: false,
        error: `O banner mobile precisa ter exatamente ${spec.width} x ${spec.height} px. A imagem enviada tem ${image.width} x ${image.height} px.`,
      }
    }

    return { valid: true }
  }

  if (type === 'logo') {
    const spec = IMAGE_SPECS.LOGO

    if (image.sizeBytes > spec.maxSizeBytes) {
      const actualMB = (image.sizeBytes / (1024 * 1024)).toFixed(1)
      return {
        valid: false,
        error: `A logo excede o peso máximo de ${spec.maxSizeMB} MB (arquivo enviado tem ${actualMB} MB).`,
      }
    }

    // Para SVG puro sem dimensões rastreadas, libera se peso estiver OK
    if (image.mimeType === 'image/svg+xml' || image.name?.toLowerCase().endsWith('.svg')) {
      return { valid: true }
    }

    if (image.width < spec.minWidth || image.height < spec.minHeight) {
      return {
        valid: false,
        error: `A resolução da logo é muito baixa (${image.width} x ${image.height} px). O recomendado é altura mínima de ${spec.minHeight} px.`,
      }
    }

    if (image.width > spec.maxWidth || image.height > spec.maxHeight) {
      return {
        valid: false,
        error: `A dimensão da logo ultrapassa o limite máximo permitido (${spec.maxWidth} x ${spec.maxHeight} px).`,
      }
    }

    return { valid: true }
  }

  return { valid: false, error: 'Tipo de asset desconhecido.' }
}

/**
 * Lê no navegador as dimensões reais de um arquivo File antes do upload.
 */
export function getBrowserImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    // Para SVGs
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      resolve({
        width: 800,
        height: 800,
        sizeBytes: file.size,
        mimeType: file.type,
        name: file.name,
      })
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        sizeBytes: file.size,
        mimeType: file.type,
        name: file.name,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler as dimensões da imagem enviada.'))
    }

    img.src = url
  })
}

/**
 * Extrai o public_id do Cloudinary a partir de uma URL segura.
 */
export function extractCloudinaryPublicId(url?: string | null): string | null {
  if (!url || !url.includes('res.cloudinary.com')) return null
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  } catch {
    return null
  }
  return null
}
