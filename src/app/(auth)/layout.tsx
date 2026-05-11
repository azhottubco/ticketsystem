import { ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-semibold text-foreground">Engrain AI Support</span>
        </div>
        {children}
      </div>
    </div>
  )
}
