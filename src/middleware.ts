import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // Retrieve NextAuth session tokens directly from HTTP-only request cookies
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("next-auth.session-token")?.value ||
    req.cookies.get("__Secure-next-auth.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isApiSeedRoute = nextUrl.pathname.startsWith("/api/seed");
  const isLoginRoute = nextUrl.pathname === "/login";
  const isPublicRoute = nextUrl.pathname === "/";

  // 1. Let auth and database seeding run freely
  if (isApiAuthRoute || isApiSeedRoute) {
    return NextResponse.next();
  }

  // 2. Redirect to dashboard if logged-in user visits the login portal
  if (isLoginRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 3. Block secure paths and redirect to login if unauthenticated
  if (!isLoggedIn && !isPublicRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
}

// Intercept all routes except assets, images, icons, and non-guarded routes
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/seed|api/auth).*)",
  ],
};
