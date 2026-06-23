import { db } from "@/db"
import { users, tenants } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getTenantUsers(tenantId: string) {
  return db
    .select({
      id:       users.id,
      name:     users.name,
      email:    users.email,
      role:     users.role,
      isActive: users.isActive,
      phone:    users.phone,
    })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(users.name)
}

export async function getTenant(tenantId: string) {
  return db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })
}
