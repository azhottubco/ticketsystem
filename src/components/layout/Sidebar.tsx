'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Ticket,
  Plus,
  Users,
  Settings,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All Tickets', href: '/tickets', icon: Ticket, roles: ['admin', 'agent'] },
  { label: 'My Tickets', href: '/tickets', icon: Ticket, roles: ['user'] },
  { label: 'Submit Ticket', href: '/tickets/new', icon: Plus },
  { label: 'Manage Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  user: { id: string; email: string; fullName: string | null; role: string }
  className?: string
}

export function Sidebar({ user, className }: SidebarProps) {
  const pathname = usePathname()
  const visibleNav = NAV.filter(item => !item.roles || item.roles.includes(user.role))

  return (
    <aside className={cn('flex h-full flex-col bg-[#0f172a] text-slate-400', className)}>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
        <ShieldCheck className="h-6 w-6 text-blue-500" />
        <span className="text-sm font-semibold text-white">Engrain AI Support</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-700 px-3 py-3 space-y-0.5">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            pathname === '/profile'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
        >
          <User className="h-4 w-4 shrink-0" />
          {user.fullName || user.email}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
