import { requireRole, getTenantId } from "@/lib/auth/server"
import { getClients } from "@/lib/queries/clients"
import { getProducts } from "@/lib/queries/stock"
import { NewOrderForm } from "@/components/orders/new-order-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewOrderPage() {
  await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = await getTenantId()

  const [clientsList, productsList] = await Promise.all([
    getClients(tenantId),
    getProducts(tenantId),
  ])

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/orders" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nuevo Pedido</h2>
      </div>

      <NewOrderForm clients={clientsList} products={productsList} />
    </div>
  )
}
