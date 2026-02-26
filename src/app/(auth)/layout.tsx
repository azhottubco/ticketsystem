import { ShieldCheck } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-semibold text-slate-900">Engrain AI Support</span>
        </div>
        {children}
      </div>
    </div>
  )
}
