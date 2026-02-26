'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { TicketTable } from './TicketTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Ticket, Category, UserRole } from '@/types'
import { Plus, Ticket as TicketIcon } from 'lucide-react'

interface Props {
  userRole: UserRole
  categories: Pick<Category, 'id' | 'name'>[]
}

export function TicketsPageClient({ userRole, categories }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const isStaff = userRole !== 'user'

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (priority !== 'all') params.set('priority', priority)

    const res = await fetch(`/api/tickets?${params}`)
    const json = await res.json()
    setTickets(json.data || [])
    setTotal(json.count || 0)
    setLoading(false)
  }, [page, search, status, priority])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isStaff ? 'All Tickets' : 'My Tickets'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} ticket{total !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild>
          <Link href="/tickets/new"><Plus className="mr-1.5 h-4 w-4" />New Ticket</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search tickets…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="sm:w-64"
            />
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={v => { setPriority(v); setPage(1) }}>
              <SelectTrigger className="sm:w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner className="h-48" />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={TicketIcon}
              title="No tickets found"
              description={search || status !== 'all' || priority !== 'all' ? 'Try adjusting your filters.' : 'No tickets yet.'}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/tickets/new">Submit a ticket</Link>
                </Button>
              }
            />
          ) : (
            <TicketTable tickets={tickets} showAssignee={isStaff} />
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Showing {Math.min((page - 1) * 25 + 1, total)}–{Math.min(page * 25, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 25 >= total}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
