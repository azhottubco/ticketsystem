import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if ((session.user as { role?: string }).role !== 'admin') redirect('/dashboard')
  return <>{children}</>
}
