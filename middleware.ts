import { NextRequest, NextResponse } from 'next/server'
import { SUPER_ADMIN_COOKIE, verifySuperAdminToken } from '@/lib/admin-auth'

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) {
    const referer = req.headers.get('referer')
    if (!referer) return true // Requisicões sem origin/referer (diretas/curl/cron com segredo)
    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === req.nextUrl.host
    } catch {
      return false
    }
  }

  try {
    const originUrl = new URL(origin)
    return originUrl.host === req.nextUrl.host
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method.toUpperCase()

  // 1. Proteção CSRF em rotas mutantes de API (/api/*)
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // Permite cron / webhooks protegidos por bearer token
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const isAuthorizedCron = cronSecret && authHeader === `Bearer ${cronSecret}`

    if (!isAuthorizedCron && !isSameOrigin(req)) {
      return new NextResponse(
        JSON.stringify({ error: 'Origem cruzada (CSRF) bloqueada por segurança.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // 2. Protege rotas /admin e /admin/*
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(SUPER_ADMIN_COOKIE)?.value
    const isValid = await verifySuperAdminToken(token)

    if (pathname === '/admin/login') {
      if (isValid) {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.next()
    }

    if (!isValid) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/:path*'],
}
