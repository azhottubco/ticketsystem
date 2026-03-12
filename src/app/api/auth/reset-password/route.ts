import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { token, password } = parsed.data

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } })
    return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({ where: { email: { equals: record.email, mode: 'insensitive' } } })
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, mustChangePassword: false },
  })

  await prisma.passwordResetToken.delete({ where: { token } })

  return NextResponse.json({ ok: true })
}
