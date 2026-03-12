import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((request) => {
  const { nextUrl } = request
  const { pathname } = nextUrl
  const session = request.auth
  const isLoggedIn = !!session

  // Skip API and static paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Public auth pages — allow unauthenticated access
  const publicPaths = ['/login', '/forgot-password', '/reset-password']
  if (!isLoggedIn && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Redirect authenticated users away from auth pages / root
  if (isLoggedIn && (publicPaths.includes(pathname) || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Admin-only routes
  if (isLoggedIn && pathname.startsWith('/admin')) {
    const role = (session?.user as { role?: string })?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
  }

  // Force password change for new users
  if (isLoggedIn && (session?.user as { mustChangePassword?: boolean })?.mustChangePassword && !pathname.startsWith('/profile')) {
    return NextResponse.redirect(new URL('/profile', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
