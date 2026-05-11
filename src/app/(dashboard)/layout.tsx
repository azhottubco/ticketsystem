import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { User } from '@/types'
import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const rawUser = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
  })

  if (!rawUser) redirect('/login')
  const user: User = JSON.parse(JSON.stringify(rawUser))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} className="hidden lg:flex w-60 shrink-0 flex-col" />
      <DashboardShell user={user}>
        {children}
      </DashboardShell>
    </div>
  )
}
