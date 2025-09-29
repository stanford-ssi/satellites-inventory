import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow checkout page without authentication
  const publicDashboardPaths = ['/dashboard/checkout'];
  const isPublicPath = publicDashboardPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if not authenticated and trying to access protected routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard') && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};