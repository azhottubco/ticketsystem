import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { sendAttachmentEmail } from '@/lib/email'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { createdById: true } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (role === 'user' && ticket.createdById !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const attachments = await prisma.ticketAttachment.findMany({
    where: { ticketId: id },
    include: { uploadedBy: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(attachments)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      createdById: true,
      title: true,
      creator: { select: { id: true, email: true } },
      assignee: { select: { id: true, email: true } },
    },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (role === 'user' && ticket.createdById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const blob = await put(`tickets/${id}/${Date.now()}-${file.name}`, file, { access: 'public' })

  const attachment = await prisma.ticketAttachment.create({
    data: {
      ticketId: id,
      uploadedById: userId,
      filename: file.name,
      url: blob.url,
      size: file.size,
      mimeType: file.type,
    },
    include: { uploadedBy: { select: { id: true, fullName: true, email: true } } },
  })

  // Notify the other party (skip during initial ticket creation)
  const skipNotify = new URL(request.url).searchParams.get('skipNotify') === '1'
  if (!skipNotify) {
    const isStaff = role === 'admin' || role === 'agent'
    const recipients = new Set<string>()
    if (isStaff) {
      if (ticket.creator.email && ticket.creator.id !== userId) recipients.add(ticket.creator.email)
    } else {
      if (ticket.assignee?.email && ticket.assignee.id !== userId) {
        recipients.add(ticket.assignee.email)
      } else {
        const staff = await prisma.user.findMany({
          where: { role: { in: ['admin', 'agent'] } },
          select: { email: true },
        })
        staff.forEach(s => recipients.add(s.email))
      }
    }
    if (recipients.size > 0) {
      await sendAttachmentEmail(
        Array.from(recipients),
        { id, title: ticket.title },
        attachment.uploadedBy.fullName || attachment.uploadedBy.email,
        file.name
      )
    }
  }

  return NextResponse.json(attachment, { status: 201 })
}
