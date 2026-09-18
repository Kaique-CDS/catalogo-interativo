import { cookies } from 'next/headers'
import ConfeitariaAdminSidebar from '@/components/confeitaria/ConfeitariaAdminSidebar'
import ConfeitariaLoginPage from './login/page'

export default async function ConfeitariaAdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isAuth = cookieStore.get('confeitaria_admin_auth')?.value === 'true'

  if (!isAuth) {
    return <ConfeitariaLoginPage />
  }

  return (
    <ConfeitariaAdminSidebar>
      {children}
    </ConfeitariaAdminSidebar>
  )
}