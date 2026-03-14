import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'
import { createSetupToken } from '@/lib/user-setup'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { z } from 'zod'

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['admin', 'agent', 'user']),
})

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const { searchParams } = new URL(request.url)
  const rolesParam = searchParams.get('roles')

  let whereRole: string[] | undefined
  if (role === 'admin') {
    whereRole = rolesParam ? rolesParam.split(',') : undefined
  } else if (role === 'agent') {
    whereRole = ['admin', 'agent']
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: whereRole ? { role: { in: whereRole as ('admin' | 'agent' | 'user')[] } } : undefined,
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const email = parsed.data.email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

  const placeholder = await bcrypt.hash(crypto.randomUUID(), 12)

  const user = await prisma.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      password: placeholder,
      mustChangePassword: true,
    },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
  })

  const setupUrl = await createSetupToken(email)
  await sendWelcomeEmail(email, parsed.data.fullName, setupUrl)

  return NextResponse.json(user, { status: 201 })
}
