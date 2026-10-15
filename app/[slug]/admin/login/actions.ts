'use server'

import { cookies } from 'next/headers'

export async function carAdminLoginAction(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = ((formData.get('username') as string) || '').trim().toLowerCase()
  const password = ((formData.get('password') as string) || '').trim()
  const slug = ((formData.get('slug') as string) || '').trim().toLowerCase()

  const cookieStore = await cookies()

  // 1. Tenant: L&L Multimarcas (login: admin, senha: llmultimarcas)
  if (slug === 'll-multimarcas') {
    const validUser = (process.env.LL_ADMIN_USER || 'admin').trim().toLowerCase()
    const validPass = (process.env.LL_ADMIN_PASS || 'llmultimarcas').trim()
    const validEmail = 'admin@llmultimarcas.com.br'

    if ((username === validUser || username === validEmail) && password === validPass) {
      cookieStore.set('admin_auth_ll-multimarcas', 'true', {
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
      })
      // Limpa qualquer sessão de outro tenant para garantir isolamento absoluto
      cookieStore.set('admin_auth_milhaticar', '', { path: '/', maxAge: 0 })
      cookieStore.set('admin_auth_loja-exemplo', '', { path: '/', maxAge: 0 })
      cookieStore.set('admin_auth', '', { path: '/', maxAge: 0 })
      return { error: '' }
    }
    return { error: 'Usuário ou senha incorretos para a L&L Multimarcas.' }
  }

  // 2. Tenant: Milhaticar (login: julia, senha: milhati)
  const validMilhatiUser = (process.env.CAR_ADMIN_USER || 'julia').trim().toLowerCase()
  const validMilhatiPass = (process.env.CAR_ADMIN_PASS || 'milhati').trim()
  const validMilhatiEmail = 'julia@milhaticar.com.br'

  if ((username === validMilhatiUser || username === validMilhatiEmail) && password === validMilhatiPass) {
    cookieStore.set('admin_auth_milhaticar', 'true', {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
    cookieStore.set('admin_auth_loja-exemplo', 'true', {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
    cookieStore.set('admin_auth', 'true', {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
    // Limpa sessão da L&L para evitar vazamento
    cookieStore.set('admin_auth_ll-multimarcas', '', { path: '/', maxAge: 0 })
    return { error: '' }
  }

  return { error: 'Usuário ou senha incorretos. Verifique os dados digitados.' }
}

export async function carAdminLogoutAction(slug?: string) {
  const cookieStore = await cookies()
  if (slug) {
    cookieStore.set(`admin_auth_${slug}`, '', { path: '/', maxAge: 0 })
  }
  cookieStore.set('admin_auth_ll-multimarcas', '', { path: '/', maxAge: 0 })
  cookieStore.set('admin_auth_milhaticar', '', { path: '/', maxAge: 0 })
  cookieStore.set('admin_auth_loja-exemplo', '', { path: '/', maxAge: 0 })
  cookieStore.set('admin_auth', '', { path: '/', maxAge: 0 })
}