import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Carrega e transpila lib/traffic-classifier.ts usando o TypeScript já instalado
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tsPath = path.join(__dirname, 'traffic-classifier.ts')
const tsCode = fs.readFileSync(tsPath, 'utf-8')
const jsCode = ts.transpileModule(tsCode, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText

const moduleUri = 'data:text/javascript;base64,' + Buffer.from(jsCode).toString('base64')
const { classifyTrafficSource } = await import(moduleUri)

test('1. Instagram via bio (param ref=instagram)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?ref=instagram',
  })
  assert.equal(result.source, 'Instagram')
  assert.equal(result.isBot, false)
})

test('2. Instagram via story com utm (utm_source=instagram & utm_medium=stories)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?utm_source=instagram&utm_medium=stories&utm_campaign=feirao',
  })
  assert.equal(result.source, 'Instagram')
  assert.equal(result.utmMedium, 'stories')
  assert.equal(result.utmCampaign, 'feirao')
})

test('3. Anúncio com fbclid sem referer (ambíguo -> Meta (Facebook/Instagram))', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?fbclid=IwAR3ABC123XYZ',
  })
  assert.equal(result.source, 'Meta (Facebook/Instagram)')
  assert.equal(result.sourceDetail, 'fbclid')
})

test('4. Anúncio com fbclid com UA do Instagram -> Instagram Ads', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?fbclid=IwAR3ABC123XYZ',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 270.0.0.17.99',
  })
  assert.equal(result.source, 'Instagram Ads')
})

test('5. Anúncio com fbclid com UA do Facebook -> Facebook Ads', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?fbclid=IwAR3ABC123XYZ',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) FBAN/FBIOS;FBAV/400.0.0.0',
  })
  assert.equal(result.source, 'Facebook Ads')
})

test('6. Anúncio Google com gclid -> Google Ads', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?gclid=Cj0KCQiA3eG5BhDTARIsAMr3v7u4xyz',
  })
  assert.equal(result.source, 'Google Ads')
  assert.equal(result.sourceDetail, 'gclid')
})

test('7. Busca orgânica Google Brasil (referrer google.com.br)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    referrer: 'https://www.google.com.br/',
  })
  assert.equal(result.source, 'Google (orgânico)')
  assert.equal(result.referrerHost, 'google.com.br')
})

test('8. WhatsApp via web referrer', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    referrer: 'https://web.whatsapp.com/',
  })
  assert.equal(result.source, 'WhatsApp')
})

test('9. WhatsApp via parâmetro de link (?src=wa)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?src=wa',
  })
  assert.equal(result.source, 'WhatsApp')
})

test('10. OLX via referrer e via parâmetro', () => {
  const byReferrer = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    referrer: 'https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios',
  })
  assert.equal(byReferrer.source, 'OLX')

  const byParam = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?source=olx',
  })
  assert.equal(byParam.source, 'OLX')
})

test('11. Webmotors via parâmetro', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?source=webmotors',
  })
  assert.equal(result.source, 'Webmotors')
})

test('12. iCarros via parâmetro', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas?src=icarros',
  })
  assert.equal(result.source, 'iCarros')
})

test('13. Link direto (sem params nem referrer)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    referrer: null,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
  })
  assert.equal(result.source, 'Direto / não identificado')
  assert.equal(result.isInternal, false)
})

test('14. Navegação interna que não deve sobrescrever (mesmo host)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas/quem-somos',
    referrer: 'https://vendazap.com/ll-multimarcas',
    ownHost: 'vendazap.com',
  })
  assert.equal(result.isInternal, true)
  assert.equal(result.source, 'Direto / não identificado')
})

test('15. Bot do Google (Googlebot no UA)', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  })
  assert.equal(result.isBot, true)
})

test('16. UA com In-App browser do Instagram sem params', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 250.0.0.21.109',
  })
  assert.equal(result.source, 'Instagram (app)')
})

test('17. UA com In-App browser do TikTok', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    userAgent: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Mobile BytedanceWebview/1.0 musical_ly/25.0.0',
  })
  assert.equal(result.source, 'TikTok (app)')
})

test('18. Referrer externo desconhecido -> Outros sites com host preservado', () => {
  const result = classifyTrafficSource({
    url: 'https://vendazap.com/ll-multimarcas',
    referrer: 'https://autoesporte.globo.com/carros-usados-sp',
    ownHost: 'vendazap.com',
  })
  assert.equal(result.source, 'Outros sites')
  assert.equal(result.referrerHost, 'autoesporte.globo.com')
})
