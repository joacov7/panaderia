import { db } from "@/db"
import { recipes, recipeItems, products, rawMaterials } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function getRecipes(tenantId: string) {
  return db.query.recipes.findMany({
    where: and(eq(recipes.tenantId, tenantId), eq(recipes.isActive, true)),
    with: {
      product:   { columns: { name: true } },
      yieldUnit: { columns: { abbreviation: true } },
      items:     true,
    },
    orderBy: recipes.name,
  })
}

export async function getRecipeById(id: string, tenantId: string) {
  return db.query.recipes.findFirst({
    where: and(eq(recipes.id, id), eq(recipes.tenantId, tenantId)),
    with: {
      product:   { columns: { name: true, salePrice: true } },
      yieldUnit: true,
      items: {
        with: {
          rawMaterial: { with: { unit: true } },
          unit:        true,
        },
      },
    },
  })
}

export async function calculateRecipeCost(recipeId: string, tenantId: string) {
  const recipe = await getRecipeById(recipeId, tenantId)
  if (!recipe) return null

  const ingredientCost = recipe.items.reduce((total, item) => {
    const costPerUnit  = Number(item.rawMaterial?.costPerUnit ?? 0)
    return total + Number(item.quantity) * costPerUnit
  }, 0)

  const yieldQty    = Number(recipe.yieldQuantity)
  const costPerUnit = yieldQty > 0 ? ingredientCost / yieldQty : 0
  const salePrice   = Number(recipe.product?.salePrice ?? 0)
  const margin      = salePrice > 0 ? ((salePrice - costPerUnit) / salePrice) * 100 : 0

  return { ingredientCost, costPerUnit, salePrice, margin, yieldQty }
}
