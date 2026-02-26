import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'
import { TicketPriorityBadge } from '@/components/tickets/TicketPriorityBadge'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id!
  const role = (session?.user as { role?: string })?.role || 'user'
  const isStaff = role !== 'user'

  const where = isStaff ? {} : { createdById: userId }

  const [openCount, inProgressCount, resolvedCount, closedCount, recentTickets] = await Promise.all([
    prisma.ticket.count({ where: { ...where, status: 'open' } }),
    prisma.ticket.count({ where: { ...where, status: 'in_progress' } }),
    prisma.ticket.count({ where: { ...where, status: 'resolved' } }),
    prisma.ticket.count({ where: { ...where, status: 'closed' } }),
    prisma.ticket.findMany({
      where,
      include: { creator: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } })

  const stats = [
    { label: 'Open', value: openCount, color: 'text-blue-600' },
    { label: 'In Progress', value: inProgressCount, color: 'text-amber-600' },
    { label: 'Resolved', value: resolvedCount, color: 'text-green-600' },
    { label: 'Closed', value: closedCount, color: 'text-slate-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back, {user?.fullName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStaff ? "Here's an overview of all support tickets." : 'Track your support requests below.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/tickets/new"><Plus className="mr-1.5 h-4 w-4" />New Ticket</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{isStaff ? 'Recent Tickets' : 'My Recent Tickets'}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tickets" className="text-blue-600 hover:text-blue-700">View all →</Link>
          </Button>
        </div>
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No tickets yet.</p>
              <Button asChild className="mt-3" variant="outline" size="sm">
                <Link href="/tickets/new">Submit your first ticket</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentTickets.map(ticket => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                      {isStaff && ticket.creator && (
                        <> · {ticket.creator.fullName || ticket.creator.email}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TicketPriorityBadge priority={ticket.priority as 'low' | 'medium' | 'high' | 'critical'} />
                    <TicketStatusBadge status={ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed'} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
