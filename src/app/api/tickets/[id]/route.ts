import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendStatusChangeEmail, sendPriorityChangeEmail, sendAssignmentEmail } from '@/lib/email'
import { del } from '@vercel/blob'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedToId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!

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

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Users can only see their own tickets
  if (role === 'user' && ticket.createdById !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(ticket)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updates = parsed.data

  if (updates.priority && role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can change priority' }, { status: 403 })
  }
  if (updates.assignedToId !== undefined && role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can assign tickets' }, { status: 403 })
  }
  if (updates.status && role === 'user') {
    return NextResponse.json({ error: 'Users cannot change status' }, { status: 403 })
  }

  const current = await prisma.ticket.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (role === 'user' && current.createdById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Auto-set resolved/closed timestamps
  const extra: { resolvedAt?: Date; closedAt?: Date } = {}
  if (updates.status === 'resolved' && current.status !== 'resolved') extra.resolvedAt = new Date()
  if (updates.status === 'closed' && current.status !== 'closed') extra.closedAt = new Date()

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { ...updates, ...extra },
    include: {
      category: true,
      creator: { select: { id: true, fullName: true, email: true } },
      assignee: { select: { id: true, fullName: true, email: true } },
    },
  })

  // Write history
  const historyEntries = []
  for (const [field, newValue] of Object.entries(updates)) {
    const oldValue = current[field as keyof typeof current]
    if (oldValue !== newValue) {
      historyEntries.push({
        ticketId: id,
        changedById: userId,
        field,
        oldValue: oldValue != null ? String(oldValue) : null,
        newValue: newValue != null ? String(newValue) : null,
      })
    }
  }
  if (historyEntries.length > 0) {
    await prisma.ticketHistory.createMany({ data: historyEntries })
  }

  // Notify creator on status change
  if (updates.status && updates.status !== current.status) {
    await sendStatusChangeEmail(ticket.creator.email, { id: ticket.id, title: ticket.title, status: ticket.status })
  }

  // Notify creator on priority change
  if (updates.priority && updates.priority !== current.priority) {
    await sendPriorityChangeEmail(ticket.creator.email, { id: ticket.id, title: ticket.title, priority: ticket.priority })
  }

  // Notify newly assigned agent/admin
  if (updates.assignedToId && updates.assignedToId !== current.assignedToId && ticket.assignee) {
    await sendAssignmentEmail(ticket.assignee.email, {
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      creatorName: ticket.creator.fullName,
      creatorEmail: ticket.creator.email,
    })
  }

  // Clean up attachments when ticket is resolved or closed
  const isBeingFinalized = (updates.status === 'resolved' || updates.status === 'closed')
    && current.status !== updates.status
  if (isBeingFinalized) {
    const attachments = await prisma.ticketAttachment.findMany({
      where: { ticketId: id },
      select: { id: true, url: true },
    })
    if (attachments.length > 0) {
      await Promise.all(attachments.map(a => del(a.url)))
      await prisma.ticketAttachment.deleteMany({ where: { ticketId: id } })
    }
  }

  return NextResponse.json(ticket)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.ticket.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
