import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET;

  // Skip public/static files explicitly
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|avif|bmp|mp4|webm)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret,
  });

  const isAuthenticated = !!token;
  const userRole = token?.role;
  const allowedRoles = [10, 40, 50];

  const isAuthPage = pathname === "/auth/signin";

  if (isAuthenticated) {
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    return NextResponse.next();
  }

  if (!isAuthPage) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
