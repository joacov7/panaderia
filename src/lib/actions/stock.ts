"use server"

import { db } from "@/db"
import { rawMaterials, products, stockMovements, categories, unitsOfMeasure } from "@/db/schema"
import { requireRole } from "@/lib/auth/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const rawMaterialSchema = z.object({
  name:        z.string().min(1),
  sku:         z.string().optional(),
  categoryId:  z.string().uuid().optional(),
  unitId:      z.string().uuid(),
  stockCurrent: z.number().min(0).default(0),
  stockMin:    z.number().min(0).default(0),
  costPerUnit: z.number().min(0).default(0),
})

export async function createRawMaterial(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const data = rawMaterialSchema.parse(input)

  const [item] = await db
    .insert(rawMaterials)
    .values({
      tenantId:    session.user.tenantId,
      ...data,
      stockCurrent: String(data.stockCurrent),
      stockMin:    String(data.stockMin),
      costPerUnit: String(data.costPerUnit),
    })
    .returning()

  if (data.stockCurrent > 0) {
    await db.insert(stockMovements).values({
      tenantId:      session.user.tenantId,
      entityType:    "raw_material",
      entityId:      item.id,
      movementType:  "initial",
      quantity:      String(data.stockCurrent),
      stockAfter:    String(data.stockCurrent),
      unitCost:      String(data.costPerUnit),
      createdBy:     session.user.id,
    })
  }

  revalidatePath("/stock")
  return item
}

const productSchema = z.object({
  name:           z.string().min(1),
  sku:            z.string().optional(),
  description:    z.string().optional(),
  categoryId:     z.string().uuid().optional(),
  unitId:         z.string().uuid(),
  salePrice:      z.number().min(0),
  wholesalePrice: z.number().min(0).optional(),
  stockCurrent:   z.number().min(0).default(0),
  stockMin:       z.number().min(0).default(0),
})

export async function createProduct(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const data = productSchema.parse(input)

  const [item] = await db
    .insert(products)
    .values({
      tenantId: session.user.tenantId,
      ...data,
      salePrice:      String(data.salePrice),
      wholesalePrice: data.wholesalePrice ? String(data.wholesalePrice) : null,
      stockCurrent:   String(data.stockCurrent),
      stockMin:       String(data.stockMin),
    })
    .returning()

  revalidatePath("/stock")
  return item
}

const adjustmentSchema = z.object({
  entityType: z.enum(["raw_material", "finished_product"]),
  entityId:   z.string().uuid(),
  quantity:   z.number(),           // positivo=entrada, negativo=salida
  notes:      z.string().min(1),
})

export async function adjustStock(input: unknown) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const tenantId = session.user.tenantId
  const data = adjustmentSchema.parse(input)

  let newStock: number
  let entityName: string

  if (data.entityType === "raw_material") {
    const [item] = await db
      .select({ stockCurrent: rawMaterials.stockCurrent })
      .from(rawMaterials)
      .where(and(eq(rawMaterials.id, data.entityId), eq(rawMaterials.tenantId, tenantId)))

    newStock = Math.max(0, Number(item.stockCurrent) + data.quantity)
    await db
      .update(rawMaterials)
      .set({ stockCurrent: String(newStock) })
      .where(eq(rawMaterials.id, data.entityId))
  } else {
    const [item] = await db
      .select({ stockCurrent: products.stockCurrent })
      .from(products)
      .where(and(eq(products.id, data.entityId), eq(products.tenantId, tenantId)))

    newStock = Math.max(0, Number(item.stockCurrent) + data.quantity)
    await db
      .update(products)
      .set({ stockCurrent: String(newStock) })
      .where(eq(products.id, data.entityId))
  }

  await db.insert(stockMovements).values({
    tenantId,
    entityType:    data.entityType,
    entityId:      data.entityId,
    movementType:  "adjustment",
    quantity:      String(data.quantity),
    stockAfter:    String(newStock),
    notes:         data.notes,
    createdBy:     session.user.id,
  })

  revalidatePath("/stock")
  return { newStock }
}

export async function createCategory(name: string, type: "raw_material" | "finished_product") {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const [cat] = await db
    .insert(categories)
    .values({ tenantId: session.user.tenantId, name, type })
    .returning()
  revalidatePath("/stock")
  return cat
}

export async function createUnit(name: string, abbreviation: string) {
  const session = await requireRole(["admin", "owner", "supervisor"])
  const [unit] = await db
    .insert(unitsOfMeasure)
    .values({ tenantId: session.user.tenantId, name, abbreviation })
    .returning()
  revalidatePath("/stock")
  return unit
}
