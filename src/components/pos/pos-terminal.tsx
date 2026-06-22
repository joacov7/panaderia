"use client"

import { useState, useCallback } from "react"
import { ProductGrid } from "./product-grid"
import { CartPanel, type CartItem } from "./cart-panel"
import { PaymentModal } from "./payment-modal"
import { registerSale } from "@/lib/actions/pos"
import type { Product, Client, CashSession } from "@/db/schema"
import { Search, X } from "lucide-react"
import { toast } from "sonner"

interface Props {
  products:   (Product & { category?: { name: string } | null })[]
  clients:    Client[]
  session:    CashSession & { register: { name: string } }
}

export function PosTerminal({ products, clients, session }: Props) {
  const [cart, setCart]             = useState<CartItem[]>([])
  const [discount, setDiscount]     = useState(0)
  const [search, setSearch]         = useState("")
  const [showPayment, setShowPayment] = useState(false)

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === item.productId)
      if (existing) {
        return prev.map(c => c.productId === item.productId
          ? { ...c, quantity: c.quantity + 1 }
          : c
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.productId === productId ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    )
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(c => c.productId !== productId))
  }, [])

  async function handleConfirmPayment(method: "cash" | "card" | "transfer" | "account", clientId?: string) {
    try {
      await registerSale({
        sessionId:     session.id,
        clientId,
        paymentMethod: method,
        discount,
        items: cart.map(c => ({
          productId: c.productId,
          quantity:  c.quantity,
          unitPrice: c.unitPrice,
        })),
      })
      setCart([])
      setDiscount(0)
      setShowPayment(false)
      toast.success("Venta registrada correctamente")
    } catch (e) {
      toast.error("Error al registrar la venta")
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Panel izquierdo: productos */}
      <div className="flex-1 flex flex-col bg-zinc-50 overflow-hidden">
        {/* Barra de búsqueda */}
        <div className="p-3 border-b border-zinc-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-zinc-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        </div>

        {/* Grilla de productos */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid products={filtered} onAddToCart={addToCart} cart={cart} />
        </div>

        {/* Info de caja */}
        <div className="px-4 py-2 bg-white border-t border-zinc-100 text-xs text-zinc-400">
          Caja: {session.register?.name} · Sesión abierta
        </div>
      </div>

      {/* Panel derecho: carrito */}
      <div className="w-72 lg:w-80 shrink-0">
        <CartPanel
          cart={cart}
          discount={discount}
          onUpdate={updateQuantity}
          onRemove={removeFromCart}
          onDiscount={setDiscount}
          onCheckout={() => setShowPayment(true)}
          disabled={cart.length === 0}
        />
      </div>

      {/* Modal de pago */}
      {showPayment && (
        <PaymentModal
          total={Math.max(0, cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0) - discount)}
          clients={clients}
          onConfirm={handleConfirmPayment}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
