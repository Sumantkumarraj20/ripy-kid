// middleware.ts - Updated version
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for Supabase auth cookies
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  
  // Consider user authenticated if they have either token
  const isAuthenticated = !!(accessToken || refreshToken)

  // Public paths that don't require authentication
  const publicPaths = ['/auth', '/api/auth', '/']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // If trying to access protected route without session, redirect to auth
  if (!isPublicPath && !isAuthenticated) {
    const redirectUrl = new URL('/auth', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If already authenticated and trying to access auth page, redirect to home/dashboard
  if (isAuthenticated && request.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/dashboard/:path*',
    '/learn/:path*', 
    '/progress/:path*',
    '/classroom/:path*',
    '/track/:path*',
    '/safety/:path*',
    '/alerts/:path*',
    '/students/:path*',
    '/classes/:path*',
    '/reports/:path*',
    '/schedule/:path*',
    '/health/:path*',
    '/medications/:path*',
    '/messages/:path*',
    '/courses/:path*',
    '/assignments/:path*',
    '/auth/:path*'
  ]
}