import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware will run on all routes
export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = ["/itineraries"];

  // Check if the current route needs authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route
  );

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callback", pathname);

    return NextResponse.redirect(url);
  }

  // For login/register pages, redirect to home if already logged in
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run the middleware on
export const config = {
  matcher: [
    // Apply to all routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
