import { NextRequest, NextResponse } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/orders', '/checkout', '/account'];

// Define public routes that don't require authentication
const publicRoutes = ['/', '/products', '/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for API routes, static files, and other Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Get auth cookie (backend sets it as 'jwt')
  const authCookie = request.cookies.get('jwt');
  const hasAuth = !!authCookie;

  // If trying to access protected route without auth
  if (isProtectedRoute && !hasAuth) {
    // Redirect to login with return URL
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth pages while logged in
  if ((pathname.startsWith('/auth/') && hasAuth)) {
    // Redirect to home or orders page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
