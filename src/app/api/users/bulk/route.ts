import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const userSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'agent', 'user']),
})

const bulkSchema = z.object({
  users: z.array(userSchema).min(1).max(200),
})

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

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

    const tempPassword = generateTempPassword()
    const hashed = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        password: hashed,
        mustChangePassword: true,
      },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
    })

    await sendWelcomeEmail(u.email, u.fullName, tempPassword)
    created.push(user)
  }

  return NextResponse.json({ created, failed }, { status: 207 })
}
