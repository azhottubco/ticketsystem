import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { TicketsPageClient } from '@/components/tickets/TicketsPageClient'

export default async function TicketsPage() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role || 'user'
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })

  return (
    <TicketsPageClient
      userRole={role as 'admin' | 'agent' | 'user'}
      categories={categories}
    />
  )
}
