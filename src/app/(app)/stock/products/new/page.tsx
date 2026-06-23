import { requireRole, getTenantId } from "@/lib/auth/server"
import { getCategories, getUnits } from "@/lib/queries/stock"
import { NewProductForm } from "@/components/stock/new-product-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewProductPage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()

  const [categories, units] = await Promise.all([
    getCategories(tenantId),
    getUnits(tenantId),
  ])

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/stock?tab=pt" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nuevo Producto</h2>
      </div>
      <NewProductForm categories={categories} units={units} />
    </div>
  )
}
