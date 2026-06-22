import { pgTable, uuid, text, numeric, boolean, integer, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { products, rawMaterials } from "./stock"
import { unitsOfMeasure } from "./catalogs"

export const recipes = pgTable("recipes", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId:     uuid("product_id").notNull().references(() => products.id),
  name:          text("name").notNull(),
  yieldQuantity: numeric("yield_quantity", { precision: 12, scale: 3 }).notNull().default("1"),
  yieldUnitId:   uuid("yield_unit_id").notNull().references(() => unitsOfMeasure.id),
  notes:         text("notes"),
  version:       integer("version").notNull().default(1),
  isActive:      boolean("is_active").notNull().default(true),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const recipeItems = pgTable("recipe_items", {
  id:            uuid("id").primaryKey().defaultRandom(),
  tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  recipeId:      uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  rawMaterialId: uuid("raw_material_id").notNull().references(() => rawMaterials.id),
  quantity:      numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  unitId:        uuid("unit_id").notNull().references(() => unitsOfMeasure.id),
  notes:         text("notes"),
})

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  tenant:    one(tenants, { fields: [recipes.tenantId], references: [tenants.id] }),
  product:   one(products, { fields: [recipes.productId], references: [products.id] }),
  yieldUnit: one(unitsOfMeasure, { fields: [recipes.yieldUnitId], references: [unitsOfMeasure.id] }),
  items:     many(recipeItems),
}))

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  recipe:      one(recipes, { fields: [recipeItems.recipeId], references: [recipes.id] }),
  rawMaterial: one(rawMaterials, { fields: [recipeItems.rawMaterialId], references: [rawMaterials.id] }),
  unit:        one(unitsOfMeasure, { fields: [recipeItems.unitId], references: [unitsOfMeasure.id] }),
}))

export type Recipe = typeof recipes.$inferSelect
export type RecipeItem = typeof recipeItems.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
