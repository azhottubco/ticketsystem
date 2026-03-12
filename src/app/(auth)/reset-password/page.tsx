'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: data.password }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const json = await res.json()
      setError(json.error || 'Something went wrong. Please try again.')
    }
  }

  if (!token) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This password reset link is missing or invalid.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>Your password has been reset successfully.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full">Sign in with your new password</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirm')} />
            {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
          </div>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Reset password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
