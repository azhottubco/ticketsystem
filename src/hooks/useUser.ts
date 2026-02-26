'use client'

import { useSession } from 'next-auth/react'

export function useUser() {
  const { data: session, status } = useSession()
  const user = session?.user ?? null
  return { user, loading: status === 'loading' }
}
