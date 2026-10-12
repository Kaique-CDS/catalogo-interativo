import { NextRequest, NextResponse } from 'next/server'
import { SUPER_ADMIN_COOKIE, verifySuperAdminToken } from '@/lib/admin-auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protege apenas rotas /admin e /admin/*
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
  matcher: ['/admin', '/admin/:path*'],
}
