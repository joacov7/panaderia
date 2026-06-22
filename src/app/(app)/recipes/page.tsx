import { requireRole, getTenantId } from "@/lib/auth/server"
import { getRecipes } from "@/lib/queries/recipes"
import { formatNumber } from "@/lib/utils/currency"
import Link from "next/link"
import { Plus, BookOpen } from "lucide-react"

export default async function RecipesPage() {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const recipesList = await getRecipes(tenantId)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Recetas / Fórmulas</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{recipesList.length} recetas activas</p>
        </div>
        <Link
          href="/recipes/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva receta
        </Link>
      </div>

      {recipesList.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay recetas registradas</p>
          <p className="text-zinc-400 text-sm mt-1">Creá la primera fórmula de producción</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recipesList.map(recipe => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-400
                         hover:shadow-sm transition-all block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-zinc-800">{recipe.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Para: {recipe.product?.name}
                  </p>
                </div>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-medium">
                  v{recipe.version}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  Rinde: <strong className="text-zinc-800">
                    {formatNumber(recipe.yieldQuantity, 0)} {recipe.yieldUnit?.abbreviation}
                  </strong>
                </span>
                <span className="text-zinc-400">
                  {recipe.items.length} ingrediente{recipe.items.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
