import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const SETUP_EXPIRY_HOURS = 72

/**
 * Creates a password-setup token for a user and returns the full setup URL.
 * Any existing tokens for that email are invalidated first.
 */
export async function createSetupToken(email: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { email } })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SETUP_EXPIRY_HOURS * 60 * 60 * 1000)

  await prisma.passwordResetToken.create({ data: { token, email, expiresAt } })

  return `${APP_URL}/reset-password?token=${token}`
}
