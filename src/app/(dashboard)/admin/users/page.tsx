import { prisma } from '@/lib/prisma'
import { User } from '@/types'
import { UsersPageClient } from '@/components/admin/UsersPageClient'

export default async function UsersPage() {
  const raw = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  })
  const users: User[] = JSON.parse(JSON.stringify(raw))
  return <UsersPageClient initialUsers={users} />
}
