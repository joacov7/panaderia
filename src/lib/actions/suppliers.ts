"use server"

import { db } from "@/db"
import { suppliers } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const supplierSchema = z.object({
  name:         z.string().min(1),
  taxId:        z.string().optional(),
  contactName:  z.string().optional(),
  phone:        z.string().optional(),
  email:        z.string().email().optional().or(z.literal("")),
  address:      z.string().optional(),
  paymentTerms: z.number().min(0).default(30),
  notes:        z.string().optional(),
})

export async function createSupplier(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const data = supplierSchema.parse(input)
  const [supplier] = await db
    .insert(suppliers)
    .values({
      tenantId:     session.user.tenantId,
      ...data,
      paymentTerms: String(data.paymentTerms),
      email:        data.email || null,
    })
    .returning()
  revalidatePath("/suppliers")
  return supplier
}

export async function updateSupplier(id: string, input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const data = supplierSchema.parse(input)
  await db
    .update(suppliers)
    .set({ ...data, paymentTerms: String(data.paymentTerms), email: data.email || null })
    .where(and(eq(suppliers.id, id), eq(suppliers.tenantId, session.user.tenantId)))
  revalidatePath("/suppliers")
}
