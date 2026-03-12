import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { createSetupToken } from '@/lib/user-setup'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Mark mustChangePassword so they must go through the setup flow
  await prisma.user.update({
    where: { id },
    data: { mustChangePassword: true },
  })

  const setupUrl = await createSetupToken(user.email)
  await sendWelcomeEmail(user.email, user.fullName ?? user.email, setupUrl)

  return NextResponse.json({ ok: true })
}
