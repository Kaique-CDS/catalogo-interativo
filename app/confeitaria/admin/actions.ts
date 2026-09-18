'use server'

import { cookies } from 'next/headers'

export async function confeitariaLoginAction(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = ((formData.get('username') as string) || '').trim().toLowerCase()
  const password = ((formData.get('password') as string) || '').trim()

  const validUser = (process.env.CONFEITARIA_ADMIN_USER || 'julia').toLowerCase()
  const validPass = process.env.CONFEITARIA_ADMIN_PASS || 'milhati'

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies()
    cookieStore.set('confeitaria_admin_auth', 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
    return { error: '' }
  }

  return { error: 'Usuário ou senha incorretos.' }
}

export async function confeitariaLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.set('confeitaria_admin_auth', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  })
}