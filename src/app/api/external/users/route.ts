import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { createSetupToken } from '@/lib/user-setup'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.PROVISIONING_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const placeholder = await bcrypt.hash(crypto.randomUUID(), 12)

  const user = await prisma.user.create({
    data: {
      email,
      fullName: name,
      role: 'user',
      password: placeholder,
      mustChangePassword: true,
    },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  })

  const setupUrl = await createSetupToken(email)
  await sendWelcomeEmail(email, name, setupUrl)

  return NextResponse.json(user, { status: 201 })
}
