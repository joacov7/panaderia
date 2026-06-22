import { db } from "@/db"
import { rawMaterials, products, stockMovements, categories, unitsOfMeasure } from "@/db/schema"
import { eq, and, desc, sql, lt, lte } from "drizzle-orm"

export async function getRawMaterials(tenantId: string) {
  return db.query.rawMaterials.findMany({
    where: and(eq(rawMaterials.tenantId, tenantId), eq(rawMaterials.isActive, true)),
    with: { category: true, unit: true },
    orderBy: rawMaterials.name,
  })
}

export async function getProducts(tenantId: string) {
  return db.query.products.findMany({
    where: and(eq(products.tenantId, tenantId), eq(products.isActive, true)),
    with: { category: true, unit: true },
    orderBy: products.name,
  })
}

export async function getStockAlerts(tenantId: string) {
  const [mp, pt] = await Promise.all([
    db.query.rawMaterials.findMany({
      where: and(
        eq(rawMaterials.tenantId, tenantId),
        eq(rawMaterials.isActive, true),
        sql`${rawMaterials.stockCurrent} <= ${rawMaterials.stockMin}`
      ),
      with: { unit: true },
    }),
    db.query.products.findMany({
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.isActive, true),
        sql`${products.stockCurrent} <= ${products.stockMin}`
      ),
      with: { unit: true },
    }),
  ])

  return {
    rawMaterials: mp.map(m => ({
      id: m.id, name: m.name, type: "raw_material" as const,
      stockCurrent: Number(m.stockCurrent), stockMin: Number(m.stockMin),
      unit: m.unit?.abbreviation ?? "",
      deficit: Number(m.stockMin) - Number(m.stockCurrent),
    })),
    products: pt.map(p => ({
      id: p.id, name: p.name, type: "finished_product" as const,
      stockCurrent: Number(p.stockCurrent), stockMin: Number(p.stockMin),
      unit: p.unit?.abbreviation ?? "",
      deficit: Number(p.stockMin) - Number(p.stockCurrent),
    })),
  }
}

export async function getStockMovements(tenantId: string, limit = 50) {
  return db.query.stockMovements.findMany({
    where: eq(stockMovements.tenantId, tenantId),
    orderBy: desc(stockMovements.createdAt),
    limit,
    with: { createdBy: { columns: { name: true } } },
  })
}

export async function getRawMaterialById(id: string, tenantId: string) {
  return db.query.rawMaterials.findFirst({
    where: and(eq(rawMaterials.id, id), eq(rawMaterials.tenantId, tenantId)),
    with: { category: true, unit: true },
  })
}

export async function getProductById(id: string, tenantId: string) {
  return db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    with: { category: true, unit: true },
  })
}

export async function getCategories(tenantId: string) {
  return db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
    orderBy: categories.name,
  })
}

export async function getUnits(tenantId: string) {
  return db.query.unitsOfMeasure.findMany({
    where: eq(unitsOfMeasure.tenantId, tenantId),
    orderBy: unitsOfMeasure.name,
  })
}
