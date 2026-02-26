'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const nameSchema = z.object({ fullName: z.string().min(1, 'Name is required') })
const passwordSchema = z.object({
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  agent: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [savingName, setSavingName] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const user = session?.user
  const role = (user as { role?: string })?.role || 'user'

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    values: { fullName: user?.name || '' },
  })
  const pwForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })

  if (status === 'loading') return <LoadingSpinner />

  async function updateName(data: z.infer<typeof nameSchema>) {
    setSavingName(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: data.fullName }),
    })
    if (res.ok) toast.success('Name updated')
    else toast.error('Failed to update name')
    setSavingName(false)
  }

  async function updatePassword(data: z.infer<typeof passwordSchema>) {
    setSavingPw(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: data.password }),
    })
    if (res.ok) { toast.success('Password updated'); pwForm.reset() }
    else toast.error('Failed to update password')
    setSavingPw(false)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Account Info</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-800">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Role</span>
            <Badge variant="outline" className={ROLE_COLORS[role]}>{role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Display Name</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={nameForm.handleSubmit(updateName)} className="flex gap-2">
            <Input {...nameForm.register('fullName')} placeholder="Your name" />
            <Button type="submit" disabled={savingName}>{savingName ? 'Saving…' : 'Save'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={pwForm.handleSubmit(updatePassword)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" {...pwForm.register('password')} placeholder="••••••••" />
              {pwForm.formState.errors.password && (
                <p className="text-xs text-red-500">{pwForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" {...pwForm.register('confirm')} placeholder="••••••••" />
              {pwForm.formState.errors.confirm && (
                <p className="text-xs text-red-500">{pwForm.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={savingPw}>{savingPw ? 'Updating…' : 'Update Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
