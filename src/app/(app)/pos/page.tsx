import { requireRole, getTenantId } from "@/lib/auth/server"
import { getServerSession } from "@/lib/auth/server"
import { getOpenSession, getActiveProducts, getRegisters } from "@/lib/queries/pos"
import { db } from "@/db"
import { clients } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { PosTerminal } from "@/components/pos/pos-terminal"
import { OpenSessionForm } from "@/components/pos/open-session-form"

export default async function PosPage() {
  const session = await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = session.user.tenantId

  const [cashSession, products, registers, clientsList] = await Promise.all([
    getOpenSession(tenantId, session.user.id),
    getActiveProducts(tenantId),
    getRegisters(tenantId),
    db.query.clients.findMany({
      where: and(eq(clients.tenantId, tenantId), eq(clients.isActive, true)),
      columns: { id: true, name: true, creditLimit: true, currentBalance: true },
    }),
  ])

  if (!cashSession) {
    return <OpenSessionForm registers={registers} />
  }

  return (
    <PosTerminal
      products={products}
      clients={clientsList as Parameters<typeof PosTerminal>[0]["clients"]}
      session={cashSession as Parameters<typeof PosTerminal>[0]["session"]}
    />
  )
}
