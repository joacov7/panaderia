"use server"

import { db } from "@/db"
import { recipes, recipeItems } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const recipeSchema = z.object({
  productId:     z.string().uuid(),
  name:          z.string().min(1),
  yieldQuantity: z.number().positive(),
  yieldUnitId:   z.string().uuid(),
  notes:         z.string().optional(),
  items: z.array(z.object({
    rawMaterialId: z.string().uuid(),
    quantity:      z.number().positive(),
    unitId:        z.string().uuid(),
    notes:         z.string().optional(),
  })).min(1, "La receta debe tener al menos un ingrediente"),
})

export async function createRecipe(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const tenantId = session.user.tenantId
  const data = recipeSchema.parse(input)

  const [recipe] = await db
    .insert(recipes)
    .values({
      tenantId,
      productId:     data.productId,
      name:          data.name,
      yieldQuantity: String(data.yieldQuantity),
      yieldUnitId:   data.yieldUnitId,
      notes:         data.notes,
    })
    .returning()

  await db.insert(recipeItems).values(
    data.items.map(item => ({
      tenantId,
      recipeId:      recipe.id,
      rawMaterialId: item.rawMaterialId,
      quantity:      String(item.quantity),
      unitId:        item.unitId,
      notes:         item.notes,
    }))
  )

  revalidatePath("/recipes")
  return recipe
}

export async function updateRecipe(id: string, input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const tenantId = session.user.tenantId
  const data = recipeSchema.parse(input)

  const [recipe] = await db
    .update(recipes)
    .set({
      productId:     data.productId,
      name:          data.name,
      yieldQuantity: String(data.yieldQuantity),
      yieldUnitId:   data.yieldUnitId,
      notes:         data.notes,
      version:       db.$count(recipeItems, eq(recipeItems.recipeId, id)) as unknown as number,
    })
    .where(and(eq(recipes.id, id), eq(recipes.tenantId, tenantId)))
    .returning()

  // Reemplazar ítems
  await db.delete(recipeItems).where(eq(recipeItems.recipeId, id))
  await db.insert(recipeItems).values(
    data.items.map(item => ({
      tenantId,
      recipeId:      id,
      rawMaterialId: item.rawMaterialId,
      quantity:      String(item.quantity),
      unitId:        item.unitId,
      notes:         item.notes,
    }))
  )

  revalidatePath("/recipes")
  return recipe
}

export async function deleteRecipe(id: string) {
  const session = await requireRole(["admin", "owner"])
  await db
    .update(recipes)
    .set({ isActive: false })
    .where(and(eq(recipes.id, id), eq(recipes.tenantId, session.user.tenantId)))
  revalidatePath("/recipes")
}
