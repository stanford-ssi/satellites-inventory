import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createMiddlewareClient({ req, res });

  // Refresh session - this automatically updates cookies in res
  await supabase.auth.getSession();

  // Get session again after potential refresh
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Public paths that don't require authentication
  const publicPaths = ['/auth', '/checkout', '/qrcode'];
  const isPublicPath = publicPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if not authenticated and trying to access protected routes
  if (!session && !isPublicPath) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to home if authenticated and trying to access auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};