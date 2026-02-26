'use client'

import { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'

interface UserProps {
  id: string
  email: string
  fullName: string | null
  role: string
}

export function DashboardShell({
  user,
  children,
}: {
  user: UserProps
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
      <Topbar user={user} onMenuClick={() => setMobileOpen(true)} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <Sidebar user={user} className="flex flex-col h-full" />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
