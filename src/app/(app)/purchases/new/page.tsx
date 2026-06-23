import { requireRole, getTenantId } from "@/lib/auth/server"
import { getSuppliers } from "@/lib/queries/suppliers"
import { getRawMaterials } from "@/lib/queries/stock"
import { NewPurchaseForm } from "@/components/purchases/new-purchase-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewPurchasePage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()

  const [suppliersList, rawMaterialsList] = await Promise.all([
    getSuppliers(tenantId),
    getRawMaterials(tenantId),
  ])

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/purchases" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nueva Orden de Compra</h2>
      </div>

      <NewPurchaseForm suppliers={suppliersList} rawMaterials={rawMaterialsList} />
    </div>
  )
}
