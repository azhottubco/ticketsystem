'use client'

import Link from 'next/link'
import { Ticket } from '@/types'
import { TicketStatusBadge } from './TicketStatusBadge'
import { TicketPriorityBadge } from './TicketPriorityBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

interface TicketTableProps {
  tickets: Ticket[]
  showAssignee?: boolean
}

export function TicketTable({ tickets, showAssignee }: TicketTableProps) {
  if (tickets.length === 0) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          {showAssignee && <TableHead>Assignee</TableHead>}
          <TableHead>Submitted by</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id} className="cursor-pointer hover:bg-slate-50">
            <TableCell>
              <Link href={`/tickets/${ticket.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                {ticket.title}
              </Link>
              {ticket.category && (
                <span className="ml-2 text-xs text-slate-400">{ticket.category.name}</span>
              )}
            </TableCell>
            <TableCell>
              <TicketStatusBadge status={ticket.status} />
            </TableCell>
            <TableCell>
              <TicketPriorityBadge priority={ticket.priority} />
            </TableCell>
            {showAssignee && (
              <TableCell className="text-sm text-slate-600">
                {ticket.assignee ? (ticket.assignee.fullName || ticket.assignee.email) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </TableCell>
            )}
            <TableCell className="text-sm text-slate-600">
              {ticket.creator?.fullName || ticket.creator?.email || '—'}
            </TableCell>
            <TableCell className="text-sm text-slate-500 whitespace-nowrap">
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
