import { requireRole, getTenantId } from "@/lib/auth/server"
import { getRecipes } from "@/lib/queries/recipes"
import { NewProductionForm } from "@/components/production/new-production-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewProductionPage() {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const recipesList = await getRecipes(tenantId)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/production" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nueva Orden de Producción</h2>
      </div>

      <NewProductionForm recipes={recipesList} />
    </div>
  )
}
