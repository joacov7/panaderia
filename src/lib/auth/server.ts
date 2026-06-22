import { auth } from "./config"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { UserRole } from "@/types/roles"

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) redirect("/login")
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  const role = session.user.role as UserRole
  if (!allowedRoles.includes(role)) redirect("/dashboard")
  return session
}

export async function getTenantId(): Promise<string> {
  const session = await requireAuth()
  return session.user.tenantId
}
