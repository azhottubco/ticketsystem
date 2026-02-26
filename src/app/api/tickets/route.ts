import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendNewTicketEmail } from '@/lib/email'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  categoryId: z.string().nullable().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id!
  const role = (session.user as { role?: string }).role
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (role === 'user') where.createdById = userId
  if (status) where.status = status
  if (priority) where.priority = priority
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [data, count] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        category: true,
        creator: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ])

  return NextResponse.json({ data, count, page, limit })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const ticket = await prisma.ticket.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      categoryId: parsed.data.categoryId ?? null,
      createdById: session.user.id!,
    },
    include: {
      category: true,
      creator: { select: { id: true, fullName: true, email: true } },
    },
  })

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true },
  })
  sendNewTicketEmail(
    admins.map(a => a.email),
    {
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      creatorName: ticket.creator.fullName,
      creatorEmail: ticket.creator.email,
    }
  )

  return NextResponse.json(ticket, { status: 201 })
}
