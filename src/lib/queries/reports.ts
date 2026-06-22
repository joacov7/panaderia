import { db } from "@/db"
import { sales, saleItems, productionOrders, productionOrderItems, stockMovements, orders, products, rawMaterials } from "@/db/schema"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"

export async function getSalesByDay(tenantId: string, from: string, to: string) {
  return db
    .select({
      date:  sql<string>`DATE(${sales.saleDate})`,
      total: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(and(
      eq(sales.tenantId, tenantId),
      eq(sales.status, "completed"),
      gte(sales.saleDate, new Date(from)),
      lte(sales.saleDate, new Date(to + "T23:59:59"))
    ))
    .groupBy(sql`DATE(${sales.saleDate})`)
    .orderBy(sql`DATE(${sales.saleDate})`)
}

export async function getSalesByPaymentMethod(tenantId: string, from: string, to: string) {
  return db
    .select({
      method: sales.paymentMethod,
      total:  sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
      count:  sql<number>`COUNT(*)`,
    })
    .from(sales)
    .where(and(
      eq(sales.tenantId, tenantId),
      eq(sales.status, "completed"),
      gte(sales.saleDate, new Date(from)),
      lte(sales.saleDate, new Date(to + "T23:59:59"))
    ))
    .groupBy(sales.paymentMethod)
}

export async function getTopProducts(tenantId: string, from: string, to: string, limit = 10) {
  return db
    .select({
      productId: saleItems.productId,
      name:      products.name,
      quantity:  sql<number>`SUM(${saleItems.quantity})`,
      revenue:   sql<number>`SUM(${saleItems.subtotal})`,
    })
    .from(saleItems)
    .innerJoin(sales, and(eq(saleItems.saleId, sales.id), eq(sales.status, "completed")))
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(and(
      eq(saleItems.tenantId, tenantId),
      gte(sales.saleDate, new Date(from)),
      lte(sales.saleDate, new Date(to + "T23:59:59"))
    ))
    .groupBy(saleItems.productId, products.name)
    .orderBy(sql`SUM(${saleItems.subtotal}) DESC`)
    .limit(limit)
}

export async function getProductionSummary(tenantId: string, from: string, to: string) {
  return db
    .select({
      date:      productionOrders.date,
      planned:   sql<number>`COALESCE(SUM(${productionOrderItems.quantityPlanned}), 0)`,
      produced:  sql<number>`COALESCE(SUM(${productionOrderItems.quantityProduced}), 0)`,
      waste:     sql<number>`COALESCE(SUM(${productionOrderItems.wasteQuantity}), 0)`,
    })
    .from(productionOrders)
    .innerJoin(productionOrderItems, eq(productionOrderItems.productionOrderId, productionOrders.id))
    .where(and(
      eq(productionOrders.tenantId, tenantId),
      gte(productionOrders.date, from),
      lte(productionOrders.date, to)
    ))
    .groupBy(productionOrders.date)
    .orderBy(productionOrders.date)
}

export async function getKpiSummary(tenantId: string, from: string, to: string) {
  const [salesData, productionData, ordersData] = await Promise.all([
    db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${sales.totalAmount}), 0)`,
        totalSales:   sql<number>`COUNT(*)`,
        avgTicket:    sql<number>`COALESCE(AVG(${sales.totalAmount}), 0)`,
      })
      .from(sales)
      .where(and(
        eq(sales.tenantId, tenantId),
        eq(sales.status, "completed"),
        gte(sales.saleDate, new Date(from)),
        lte(sales.saleDate, new Date(to + "T23:59:59"))
      )),

    db
      .select({
        totalProduced: sql<number>`COALESCE(SUM(${productionOrderItems.quantityProduced}), 0)`,
        totalWaste:    sql<number>`COALESCE(SUM(${productionOrderItems.wasteQuantity}), 0)`,
      })
      .from(productionOrderItems)
      .innerJoin(productionOrders, eq(productionOrderItems.productionOrderId, productionOrders.id))
      .where(and(
        eq(productionOrders.tenantId, tenantId),
        gte(productionOrders.date, from),
        lte(productionOrders.date, to)
      )),

    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(and(
        eq(orders.tenantId, tenantId),
        eq(orders.status, "delivered"),
        gte(orders.deliveryDate, from),
        lte(orders.deliveryDate, to)
      )),
  ])

  return {
    totalRevenue:  Number(salesData[0]?.totalRevenue ?? 0),
    totalSales:    Number(salesData[0]?.totalSales ?? 0),
    avgTicket:     Number(salesData[0]?.avgTicket ?? 0),
    totalProduced: Number(productionData[0]?.totalProduced ?? 0),
    totalWaste:    Number(productionData[0]?.totalWaste ?? 0),
    wasteRate:     productionData[0]?.totalProduced
      ? Number(productionData[0].totalWaste) / (Number(productionData[0].totalProduced) + Number(productionData[0].totalWaste)) * 100
      : 0,
    deliveredOrders: Number(ordersData[0]?.count ?? 0),
  }
}
