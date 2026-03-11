import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user.id!

  const attachment = await prisma.ticketAttachment.findUnique({
    where: { id: attachmentId },
    select: { ticketId: true, uploadedById: true, url: true },
  })

  if (!attachment || attachment.ticketId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Only the uploader or an admin can delete
  if (role !== 'admin' && attachment.uploadedById !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await del(attachment.url)
  await prisma.ticketAttachment.delete({ where: { id: attachmentId } })

  return new NextResponse(null, { status: 204 })
}
