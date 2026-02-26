'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UserProps {
  email: string
  fullName: string | null
  role: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  agent: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-slate-100 text-slate-600 border-slate-200',
}

export function Topbar({ user, onMenuClick }: { user: UserProps; onMenuClick: () => void }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 hidden sm:block">
          {user.fullName || user.email}
        </span>
        <Badge variant="outline" className={ROLE_COLORS[user.role] || ROLE_COLORS.user}>
          {user.role}
        </Badge>
      </div>
    </header>
  )
}
