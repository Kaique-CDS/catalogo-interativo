import { v2 as cloudinary } from 'cloudinary'

/**
 * Obtém a instância configurada do Cloudinary a partir exclusivamente
 * das variáveis de ambiente do servidor, sem fallbacks hardcoded.
 */
export function getCloudinary(): typeof cloudinary | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return cloudinary
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim()
  )
}

/**
 * Remove com segurança um asset do Cloudinary por public_id
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<boolean> {
  const c = getCloudinary()
  if (!c || !publicId) return false
  try {
    const res = await c.uploader.destroy(publicId, { resource_type: resourceType })
    return res.result === 'ok' || res.result === 'not found'
  } catch (err) {
    console.warn(`Erro ao excluir ${resourceType} do Cloudinary (${publicId}):`, err)
    return false
  }
}

// Re-exporta utilitários client-safe
export { normalizeCustomerPhotoUrl, generateVideoPosterUrl } from './cloudinary-utils'


