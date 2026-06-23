import { requireRole, getTenantId } from "@/lib/auth/server"
import { getRecipeById, calculateRecipeCost } from "@/lib/queries/recipes"
import { getRawMaterials, getProducts, getUnits } from "@/lib/queries/stock"
import { notFound } from "next/navigation"
import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import Link from "next/link"
import { ArrowLeft, TrendingUp } from "lucide-react"
import { RecipeForm } from "@/components/recipes/recipe-form"

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const { id } = await params

  const [recipe, costs, rawMaterialsList, productsList, units] = await Promise.all([
    getRecipeById(id, tenantId),
    calculateRecipeCost(id, tenantId),
    getRawMaterials(tenantId),
    getProducts(tenantId),
    getUnits(tenantId),
  ])

  if (!recipe) notFound()

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/recipes" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{recipe.name}</h2>
          <p className="text-sm text-zinc-500">Para: {recipe.product?.name} · v{recipe.version}</p>
        </div>
      </div>

      {/* Panel de costos */}
      {costs && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-800 text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            Análisis de costo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Costo total batch</p>
              <p className="text-xl font-bold text-zinc-800 mt-0.5">{formatCurrency(costs.ingredientCost)}</p>
              <p className="text-xs text-zinc-400">para {formatNumber(costs.yieldQty, 0)} unidades</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Costo por unidad</p>
              <p className="text-xl font-bold text-zinc-800 mt-0.5">{formatCurrency(costs.costPerUnit)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Precio de venta</p>
              <p className="text-xl font-bold text-blue-600 mt-0.5">{formatCurrency(costs.salePrice)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-medium">Margen</p>
              <p className={`text-xl font-bold mt-0.5 ${costs.margin > 40 ? "text-green-600" : costs.margin > 20 ? "text-amber-500" : "text-red-600"}`}>
                {formatNumber(costs.margin, 1)}%
              </p>
              <p className="text-xs text-zinc-400">{costs.margin > 40 ? "Excelente" : costs.margin > 20 ? "Aceptable" : "Bajo"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ingredientes (solo lectura) */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-medium text-zinc-700 text-sm">
            Ingredientes — rinde {formatNumber(recipe.yieldQuantity, 0)} {recipe.yieldUnit?.abbreviation}
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Materia prima</th>
              <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Cantidad</th>
              <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {recipe.items.map(item => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-zinc-800">{item.rawMaterial?.name}</td>
                <td className="px-5 py-3 text-right text-zinc-600">
                  {formatNumber(item.quantity, 4)} {item.unit?.abbreviation}
                </td>
                <td className="px-5 py-3 text-right text-zinc-500">
                  {formatCurrency(Number(item.quantity) * Number(item.rawMaterial?.costPerUnit ?? 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario de edición */}
      <RecipeForm
        mode="edit"
        recipeId={recipe.id}
        defaultValues={{
          productId:     recipe.productId,
          name:          recipe.name,
          yieldQuantity: Number(recipe.yieldQuantity),
          yieldUnitId:   recipe.yieldUnitId,
          notes:         recipe.notes ?? "",
          items: recipe.items.map(i => ({
            rawMaterialId: i.rawMaterialId,
            quantity:      Number(i.quantity),
            unitId:        i.unitId,
            notes:         i.notes ?? "",
          })),
        }}
        rawMaterials={rawMaterialsList}
        products={productsList}
        units={units}
      />
    </div>
  )
}
