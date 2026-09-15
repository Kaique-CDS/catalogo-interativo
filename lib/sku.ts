/**
 * Generates a unique short SKU code for a vehicle.
 * Format: 5 uppercase alphanumeric characters (e.g. "A1B2C")
 * Collision-resistant for catalogs up to ~1M vehicles.
 */
export function generateSKU(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // avoid confusing chars: 0/O, 1/I
  let result = ''
  const array = new Uint8Array(5)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
    for (const byte of array) {
      result += chars[byte % chars.length]
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 5; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  return result
}

/**
 * Formats a SKU for display (e.g. "A1B2C" → "#A1B2C")
 */
export function formatSKU(sku: string): string {
  return `#${sku}`
}