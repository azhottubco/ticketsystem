'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 2147483647,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        width: '76px',
        height: '40px',
        padding: '0 10px',
        borderRadius: '9999px',
        border: '1px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--foreground)',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.18)',
        cursor: 'pointer',
      }}
    >
      <Sun
        aria-hidden="true"
        size={18}
        strokeWidth={2.4}
        style={{ opacity: isDark ? 0.45 : 1 }}
      />
      <Moon
        aria-hidden="true"
        size={18}
        strokeWidth={2.4}
        style={{ opacity: isDark ? 1 : 0.45 }}
      />
    </button>
  )
}
