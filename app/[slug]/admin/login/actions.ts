'use server'

import { cookies } from 'next/headers'

export async function carAdminLoginAction(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = ((formData.get('username') as string) || '').trim().toLowerCase()
  const password = ((formData.get('password') as string) || '').trim()

  const validUser = (process.env.CAR_ADMIN_USER || 'julia').toLowerCase()
  const validPass = process.env.CAR_ADMIN_PASS || 'milhati'

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
    return { error: '' }
  }

  return { error: 'Usuario ou senha incorretos.' }
}

export async function carAdminLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.set('admin_auth', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  })
}