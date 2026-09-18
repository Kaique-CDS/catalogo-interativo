'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function confeitariaLoginAction(
  prevState: { error: string } | null,
  formData: FormData
) {
  const username = ((formData.get('username') as string) || '').trim().toLowerCase()
  const password = ((formData.get('password') as string) || '').trim()

  const validUser = (process.env.CONFEITARIA_ADMIN_USER || 'admin').toLowerCase()
  const validPass = process.env.CONFEITARIA_ADMIN_PASS || 'doceencanto123'

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies()
    cookieStore.set('confeitaria_admin_auth', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: 'lax',
    })
    redirect('/confeitaria/admin')
  }

  return { error: 'Usuario ou senha incorretos.' }
}

export async function confeitariaLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.set('confeitaria_admin_auth', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  })
  redirect('/confeitaria/admin/login')
}