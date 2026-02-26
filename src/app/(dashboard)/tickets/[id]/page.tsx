import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Ticket, User } from '@/types'
import { TicketDetailClient } from '@/components/tickets/TicketDetailClient'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id!
  const role = (session?.user as { role?: string })?.role || 'user'

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      category: true,
      creator: { select: { id: true, fullName: true, email: true, role: true } },
      assignee: { select: { id: true, fullName: true, email: true, role: true } },
      history: {
        include: { changer: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!ticket) notFound()
  if (role === 'user' && ticket.createdById !== userId) notFound()

  let agents: { id: string; fullName: string | null; email: string }[] = []
  if (role === 'admin') {
    agents = await prisma.user.findMany({
      where: { role: { in: ['admin', 'agent'] } },
      select: { id: true, fullName: true, email: true },
    })
  }

  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
  })

  if (!currentUser) notFound()

  const serializedTicket: Ticket = JSON.parse(JSON.stringify(ticket))
  const serializedUser: User = JSON.parse(JSON.stringify(currentUser))

  return (
    <TicketDetailClient
      initialTicket={serializedTicket}
      currentUser={serializedUser}
      agents={agents}
      categories={categories}
    />
  )
}
