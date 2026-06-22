import { requireRole, getTenantId } from "@/lib/auth/server"
import { getRawMaterials, getProducts, getUnits } from "@/lib/queries/stock"
import { RecipeForm } from "@/components/recipes/recipe-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewRecipePage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()

  const [rawMaterialsList, productsList, units] = await Promise.all([
    getRawMaterials(tenantId),
    getProducts(tenantId),
    getUnits(tenantId),
  ])

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/recipes" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nueva Receta</h2>
      </div>

      <RecipeForm
        mode="create"
        rawMaterials={rawMaterialsList}
        products={productsList}
        units={units}
      />
    </div>
  )
}
