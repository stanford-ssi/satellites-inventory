import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public paths that don't require authentication
  // Note: With basePath '/inventory', these paths are accessed as /inventory/auth/login, etc.
  // but Next.js middleware sees them without the basePath prefix
  const publicPaths = ['/auth', '/checkout', '/qrcode'];
  const isPublicPath = publicPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if not authenticated and trying to access protected routes
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Redirect to home if authenticated and trying to access auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};