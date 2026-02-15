import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth', '/offline'];
const PUBLIC_PREFIXES = ['/icons/', '/_next/', '/sw.js', '/manifest.json', '/favicon'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Password protection temporarily disabled for testing
  return NextResponse.next();

  /* Original password protection - re-enable after testing
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('mc_auth')?.value;

  if (authCookie === sitePassword) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') {
    loginUrl.searchParams.set('from', pathname);
  }
  return NextResponse.redirect(loginUrl);
  */
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
