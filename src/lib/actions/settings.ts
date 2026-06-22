"use server"

import { db } from "@/db"
import { users, tenants } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth/config"

const inviteSchema = z.object({
  name:  z.string().min(2),
  email: z.string().email(),
  role:  z.enum(["admin", "owner", "supervisor", "production", "delivery", "cashier", "seller"]),
  phone: z.string().optional(),
})

export async function inviteUser(input: unknown) {
  const session = await requireRole(["admin", "owner"])
  const tenantId = session.user.tenantId
  const data = inviteSchema.parse(input)

  const tempPassword = Math.random().toString(36).slice(2, 10) + "A1!"

  await auth.api.signUpEmail({
    body: {
      name:     data.name,
      email:    data.email,
      password: tempPassword,
      tenantId,
    },
  })

  const [created] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1)

  if (!created) throw new Error("No se pudo crear el usuario")

  await db
    .update(users)
    .set({ role: data.role, phone: data.phone ?? null })
    .where(eq(users.id, created.id))

  revalidatePath("/settings/users")
  return { tempPassword }
}

export async function updateUserRole(userId: string, role: "admin" | "owner" | "supervisor" | "production" | "delivery" | "cashier" | "seller") {
  const session = await requireRole(["admin", "owner"])
  await db
    .update(users)
    .set({ role })
    .where(and(eq(users.id, userId), eq(users.tenantId, session.user.tenantId)))
  revalidatePath("/settings/users")
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const session = await requireRole(["admin", "owner"])
  await db
    .update(users)
    .set({ isActive })
    .where(and(eq(users.id, userId), eq(users.tenantId, session.user.tenantId)))
  revalidatePath("/settings/users")
}

const tenantSchema = z.object({
  name: z.string().min(2),
})

export async function updateTenantName(input: unknown) {
  const session = await requireRole(["admin", "owner"])
  const data = tenantSchema.parse(input)
  await db
    .update(tenants)
    .set({ name: data.name })
    .where(eq(tenants.id, session.user.tenantId))
  revalidatePath("/settings")
}
