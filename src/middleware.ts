import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "better-auth/next-js"
import { auth } from "@/lib/auth/config"
import type { UserRole } from "@/types/roles"

const PUBLIC_ROUTES = ["/login", "/register", "/invite"]
const DELIVERY_ONLY_ROUTES = ["/driver"]
const DELIVERY_ROLE = "delivery" satisfies UserRole

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))
  const isApi = pathname.startsWith("/api")
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/icons")

  if (isStatic || isApi) return NextResponse.next()

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session) {
    const role = session.user.role as UserRole

    // Repartidores solo acceden a su sección PWA
    if (role === DELIVERY_ROLE && !DELIVERY_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/driver", request.url))
    }

    // No-repartidores no acceden a la PWA de reparto
    if (role !== DELIVERY_ROLE && DELIVERY_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Redirigir a dashboard si ya está autenticado y va al login
    if (isPublic) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)"],
}
