import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { createSetupToken } from '@/lib/user-setup'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'

const userSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'agent', 'user']),
})

const bulkSchema = z.object({
  users: z.array(userSchema).min(1).max(200),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const created: object[] = []
  const failed: { email: string; reason: string }[] = []

  for (const u of parsed.data.users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      failed.push({ email: u.email, reason: 'Email already in use' })
      continue
    }

    const placeholder = await bcrypt.hash(crypto.randomUUID(), 12)

    const user = await prisma.user.create({
      data: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        password: placeholder,
        mustChangePassword: true,
      },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
    })

    const setupUrl = await createSetupToken(u.email)
    await sendWelcomeEmail(u.email, u.fullName, setupUrl)
    created.push(user)
  }

  return NextResponse.json({ created, failed }, { status: 207 })
}
