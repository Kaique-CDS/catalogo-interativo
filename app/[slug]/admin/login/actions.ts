'use server'

import { cookies } from 'next/headers'

export async function carAdminLoginAction(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = ((formData.get('username') as string) || '').trim().toLowerCase()
  const password = ((formData.get('password') as string) || '').trim()

  const validUser = (process.env.CAR_ADMIN_USER || 'julia').trim().toLowerCase()
  const validPass = (process.env.CAR_ADMIN_PASS || 'milhati').trim()

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'true', {
      path: '/',
      sameSite: 'lax',
    })
    return { error: '' }
  }

  return { error: 'Usuário ou senha incorretos. Verifique os dados digitados.' }
}

export async function carAdminLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.set('admin_auth', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  })
}