import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protege todas las rutas incluidas /api/* (excepto públicas)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - login (login page)
     * - error-login (error page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * NOTE: API routes ARE included in protection (see line below)
     */
    "/((?!login|error-login|_next/static|_next/image|favicon.ico).*)",
    // Explicitly protect all API routes with NextAuth authentication
    "/api/:path*",
  ],
};
