import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  body: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!
  const isStaff = role === 'admin' || role === 'agent'

  const where: Record<string, unknown> = { ticketId: id }
  if (!isStaff) where.isInternal = false

  // Users can only see comments on their own tickets
  if (!isStaff) {
    const ticket = await prisma.ticket.findUnique({ where: { id }, select: { createdById: true } })
    if (!ticket || ticket.createdById !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const comments = await prisma.comment.findMany({
    where,
    include: {
      author: { select: { id: true, fullName: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!
  const isStaff = role === 'admin' || role === 'agent'

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.isInternal && !isStaff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify ticket access
  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { createdById: true } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isStaff && ticket.createdById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const comment = await prisma.comment.create({
    data: {
      body: parsed.data.body,
      isInternal: parsed.data.isInternal,
      ticketId: id,
      authorId: userId,
    },
    include: {
      author: { select: { id: true, fullName: true, email: true, role: true } },
    },
  })

  return NextResponse.json(comment, { status: 201 })
}
