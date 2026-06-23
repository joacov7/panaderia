"use client"

import { formatCurrency, formatNumber } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import type { Product } from "@/db/schema"

interface CartItem {
  productId: string
  name:      string
  quantity:  number
  unitPrice: number
}

interface Props {
  products:    (Product & { category?: { name: string } | null })[]
  onAddToCart: (item: Omit<CartItem, "quantity">) => void
  cart:        CartItem[]
}

export function ProductGrid({ products, onAddToCart, cart }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
      {products.map(product => {
        const inCart = cart.find(c => c.productId === product.id)
        const outOfStock = Number(product.stockCurrent) <= 0

        return (
          <button
            key={product.id}
            onClick={() => !outOfStock && onAddToCart({
              productId: product.id,
              name:      product.name,
              unitPrice: Number(product.salePrice),
            })}
            disabled={outOfStock}
            className={cn(
              "relative flex flex-col items-start p-3 rounded-xl border text-left",
              "transition-all active:scale-95 select-none",
              outOfStock
                ? "bg-zinc-50 border-zinc-200 opacity-50 cursor-not-allowed"
                : "bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-sm cursor-pointer",
              inCart && "border-zinc-900 bg-zinc-50"
            )}
          >
            {inCart && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-zinc-900 text-white
                               text-xs rounded-full flex items-center justify-center font-bold">
                {inCart.quantity}
              </span>
            )}
            <span className="text-xs text-zinc-400 font-medium mb-1">
              {product.category?.name ?? "General"}
            </span>
            <span className="font-semibold text-zinc-800 text-sm leading-tight mb-2">
              {product.name}
            </span>
            <span className="text-base font-bold text-zinc-900">
              {formatCurrency(product.salePrice)}
            </span>
            <span className="text-xs text-zinc-400 mt-0.5">
              Stock: {formatNumber(product.stockCurrent, 0)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
