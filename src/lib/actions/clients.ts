"use server"

import { db } from "@/db"
import { clients, accountTransactions } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const clientSchema = z.object({
  name:        z.string().min(1),
  taxId:       z.string().optional(),
  address:     z.string().optional(),
  phone:       z.string().optional(),
  email:       z.string().email().optional().or(z.literal("")),
  type:        z.enum(["retail", "wholesale"]).default("retail"),
  creditLimit: z.number().min(0).default(0),
  notes:       z.string().optional(),
})

export async function createClient(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "seller", "cashier"])
  const data = clientSchema.parse(input)

  const [client] = await db
    .insert(clients)
    .values({ ...data, tenantId: session.user.tenantId, creditLimit: String(data.creditLimit) })
    .returning()

  revalidatePath("/clients")
  return client
}

export async function updateClient(id: string, input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "seller", "cashier"])
  const data = clientSchema.parse(input)

  const [client] = await db
    .update(clients)
    .set({ ...data, creditLimit: String(data.creditLimit) })
    .where(and(eq(clients.id, id), eq(clients.tenantId, session.user.tenantId)))
    .returning()

  revalidatePath("/clients")
  return client
}

const paymentSchema = z.object({
  clientId:    z.string().uuid(),
  amount:      z.number().positive(),
  description: z.string().optional(),
})

export async function registerClientPayment(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier"])
  const tenantId = session.user.tenantId
  const data = paymentSchema.parse(input)

  const [client] = await db
    .select({ currentBalance: clients.currentBalance })
    .from(clients)
    .where(and(eq(clients.id, data.clientId), eq(clients.tenantId, tenantId)))

  if (!client) throw new Error("Cliente no encontrado")

  const newBalance = Number(client.currentBalance) - data.amount

  await db
    .update(clients)
    .set({ currentBalance: String(newBalance) })
    .where(eq(clients.id, data.clientId))

  await db.insert(accountTransactions).values({
    tenantId,
    entityType:      "client",
    entityId:        data.clientId,
    transactionType: "payment",
    amount:          String(-data.amount),
    balanceAfter:    String(newBalance),
    description:     data.description ?? "Pago recibido",
    createdBy:       session.user.id,
  })

  revalidatePath(`/clients/${data.clientId}/account`)
}
