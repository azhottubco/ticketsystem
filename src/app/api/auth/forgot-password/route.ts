import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const EXPIRES_MINUTES = 15

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Always return success to prevent email enumeration
  const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })
  if (user) {
    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: user.email } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000)

    await prisma.passwordResetToken.create({ data: { token, email: user.email, expiresAt } })

    const resetUrl = `${APP_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, resetUrl)
  }

  return NextResponse.json({ ok: true })
}
