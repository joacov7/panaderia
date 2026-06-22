"use client"

import { formatCurrency } from "@/lib/utils/currency"
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"

export interface CartItem {
  productId: string
  name:      string
  quantity:  number
  unitPrice: number
}

interface Props {
  cart:         CartItem[]
  discount:     number
  onUpdate:     (productId: string, delta: number) => void
  onRemove:     (productId: string) => void
  onDiscount:   (value: number) => void
  onCheckout:   () => void
  disabled:     boolean
}

export function CartPanel({ cart, discount, onUpdate, onRemove, onDiscount, onCheckout, disabled }: Props) {
  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const total    = Math.max(0, subtotal - discount)

  return (
    <div className="flex flex-col h-full bg-white border-l border-zinc-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-zinc-500" />
        <span className="font-semibold text-zinc-800">Carrito</span>
        {cart.length > 0 && (
          <span className="ml-auto text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full">
            {cart.length}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
            <p>Seleccioná productos</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-50">
            {cart.map(item => (
              <li key={item.productId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-zinc-800 leading-tight">{item.name}</span>
                  <button
                    onClick={() => onRemove(item.productId)}
                    className="text-zinc-300 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdate(item.productId, -1)}
                      className="w-7 h-7 rounded-full border border-zinc-200 flex items-center
                                 justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-zinc-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdate(item.productId, 1)}
                      className="w-7 h-7 rounded-full border border-zinc-200 flex items-center
                                 justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-zinc-700">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Totals + Checkout */}
      {cart.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-4 space-y-3">
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-zinc-500">Descuento</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400">$</span>
              <input
                type="number"
                min="0"
                value={discount || ""}
                onChange={e => onDiscount(Number(e.target.value))}
                placeholder="0"
                className="w-20 text-right border border-zinc-200 rounded-lg px-2 py-1
                           text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <div className="flex justify-between font-bold text-zinc-900 text-base pt-1 border-t border-zinc-100">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <button
            onClick={onCheckout}
            disabled={disabled}
            className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold
                       hover:bg-zinc-700 disabled:opacity-50 transition-colors text-sm"
          >
            Cobrar {formatCurrency(total)}
          </button>
        </div>
      )}
    </div>
  )
}
