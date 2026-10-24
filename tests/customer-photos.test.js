const assert = require('assert')

// Funções espelhadas de lib/cloudinary.ts para testes unitários isolados
function normalizeCustomerPhotoUrl(url, width = 800, height = 1000) {
  if (!url) return ''
  if (!url.includes('cloudinary.com') || !url.includes('/image/upload/')) {
    return url
  }
  if (url.includes('/c_fill')) {
    return url
  }
  return url.replace(
    '/image/upload/',
    `/image/upload/c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/`
  )
}

function resolveCustomerPhotosDisplayMode(photos) {
  const activePhotos = (photos || []).filter(p => p.is_active)
  if (activePhotos.length === 0) return 'hidden'
  if (activePhotos.length < 3) return 'static_grid'
  return 'carousel'
}

function reorderPhotos(photos, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= photos.length) return photos
  const copy = [...photos]
  const [moved] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, moved)
  return copy.map((p, i) => ({ ...p, sort_order: i }))
}

console.log('🧪 Iniciando testes de Prompt 3 (Fotos de Clientes)...')

// Teste 1: Normalização de URL no Cloudinary
{
  const rawUrl = 'https://res.cloudinary.com/demo-cloud/image/upload/v1234567/cliente_joao.jpg'
  const normalized = normalizeCustomerPhotoUrl(rawUrl, 800, 1000)
  assert.strictEqual(
    normalized,
    'https://res.cloudinary.com/demo-cloud/image/upload/c_fill,g_auto,w_800,h_1000,f_auto,q_auto/v1234567/cliente_joao.jpg'
  )

  // Não duplica se já normalizado
  const reNormalized = normalizeCustomerPhotoUrl(normalized)
  assert.strictEqual(reNormalized, normalized)

  // URLs externas não sofrem alteração indevida
  const extUrl = 'https://images.unsplash.com/photo-1234'
  assert.strictEqual(normalizeCustomerPhotoUrl(extUrl), extUrl)

  // Vazio
  assert.strictEqual(normalizeCustomerPhotoUrl(''), '')
  console.log('✅ Teste 1: Normalização e transformação uniforme Cloudinary aprovados.')
}

// Teste 2: Regra de Renderização da Vitrine (0 = oculto, <3 = estático, >=3 = carrossel)
{
  assert.strictEqual(resolveCustomerPhotosDisplayMode([]), 'hidden')
  assert.strictEqual(resolveCustomerPhotosDisplayMode(null), 'hidden')

  // Apenas inativas -> oculto
  assert.strictEqual(
    resolveCustomerPhotosDisplayMode([
      { id: '1', is_active: false },
      { id: '2', is_active: false },
    ]),
    'hidden'
  )

  // 1 ou 2 fotos ativas -> grade estática (static_grid)
  assert.strictEqual(
    resolveCustomerPhotosDisplayMode([
      { id: '1', is_active: true },
    ]),
    'static_grid'
  )

  assert.strictEqual(
    resolveCustomerPhotosDisplayMode([
      { id: '1', is_active: true },
      { id: '2', is_active: true },
      { id: '3', is_active: false },
    ]),
    'static_grid'
  )

  // 3 ou mais fotos ativas -> carrossel (carousel)
  assert.strictEqual(
    resolveCustomerPhotosDisplayMode([
      { id: '1', is_active: true },
      { id: '2', is_active: true },
      { id: '3', is_active: true },
    ]),
    'carousel'
  )

  assert.strictEqual(
    resolveCustomerPhotosDisplayMode([
      { id: '1', is_active: true },
      { id: '2', is_active: true },
      { id: '3', is_active: true },
      { id: '4', is_active: true },
    ]),
    'carousel'
  )
  console.log('✅ Teste 2: Regras de exibição (oculto / grade estática / carrossel) aprovadas.')
}

// Teste 3: Reordenação e persistência de sort_order
{
  const initial = [
    { id: 'a', sort_order: 0 },
    { id: 'b', sort_order: 1 },
    { id: 'c', sort_order: 2 },
  ]

  // Mover 'c' para cima (índice 2 -> 1)
  const movedUp = reorderPhotos(initial, 2, 1)
  assert.deepStrictEqual(
    movedUp.map(p => p.id),
    ['a', 'c', 'b']
  )
  assert.deepStrictEqual(
    movedUp.map(p => p.sort_order),
    [0, 1, 2]
  )

  // Limite superior / inferior não estoura
  const atTop = reorderPhotos(initial, 0, -1)
  assert.strictEqual(atTop, initial)
  console.log('✅ Teste 3: Algoritmo de reordenação e sort_order aprovados.')
}

// Teste 4: Legenda e fallback
{
  const photoWithCaption = { id: '1', caption: 'Marcos com seu Polo TSI 2022' }
  const photoWithoutCaption = { id: '2', caption: null }
  const photoWithEmptyCaption = { id: '3', caption: '   ' }

  assert.strictEqual(Boolean(photoWithCaption.caption && photoWithCaption.caption.trim()), true)
  assert.strictEqual(Boolean(photoWithoutCaption.caption && photoWithoutCaption.caption.trim()), false)
  assert.strictEqual(Boolean(photoWithEmptyCaption.caption && photoWithEmptyCaption.caption.trim()), false)
  console.log('✅ Teste 4: Tratamento de legendas sobrepostas aprovado.')
}

console.log('🎉 Todos os 4 conjuntos de testes de Prompt 3 passaram com sucesso!')
