import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const nameSchema = z.object({ fullName: z.string().min(1) })
const passwordSchema = z.object({ password: z.string().min(8) })

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  if (body.fullName !== undefined) {
    const parsed = nameSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const user = await prisma.user.update({
      where: { id: session.user.id! },
      data: { fullName: parsed.data.fullName },
      select: { id: true, email: true, fullName: true, role: true },
    })
    return NextResponse.json(user)
  }

  if (body.password !== undefined) {
    const parsed = passwordSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const hashed = await bcrypt.hash(parsed.data.password, 12)
    await prisma.user.update({ where: { id: session.user.id! }, data: { password: hashed } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}
