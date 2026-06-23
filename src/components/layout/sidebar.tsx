"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "@/lib/auth/client"
import { ROLE_LABELS, type UserRole } from "@/types/roles"
import {
  LayoutDashboard, ChefHat, BookOpen, Package, ShoppingCart,
  Truck, Store, Users, FileText, BarChart3, Settings, LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard, roles: ["admin","owner","supervisor","cashier","seller","production"] },
  { href: "/production", label: "Producción",   icon: ChefHat,          roles: ["admin","owner","supervisor","production"] },
  { href: "/recipes",    label: "Recetas",       icon: BookOpen,         roles: ["admin","owner","supervisor","production"] },
  { href: "/stock",      label: "Stock",         icon: Package,          roles: ["admin","owner","supervisor","production"] },
  { href: "/orders",     label: "Pedidos",       icon: FileText,         roles: ["admin","owner","supervisor","cashier","seller"] },
  { href: "/delivery",   label: "Reparto",       icon: Truck,            roles: ["admin","owner","supervisor"] },
  { href: "/pos",        label: "Caja / POS",    icon: Store,            roles: ["admin","owner","supervisor","cashier","seller"] },
  { href: "/purchases",  label: "Compras",       icon: ShoppingCart,     roles: ["admin","owner","supervisor"] },
  { href: "/clients",    label: "Clientes",      icon: Users,            roles: ["admin","owner","supervisor","cashier","seller"] },
  { href: "/reports",    label: "Reportes",      icon: BarChart3,        roles: ["admin","owner","supervisor"] },
  { href: "/settings",   label: "Configuración", icon: Settings,         roles: ["admin","owner"] },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user.role as UserRole | undefined

  const visibleItems = NAV_ITEMS.filter(item =>
    role ? (item.roles as readonly string[]).includes(role) : false
  )

  return (
    <aside className="w-64 bg-zinc-900 text-white flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-zinc-800">
        <p className="text-lg font-bold">🥖 Panadería ERP</p>
        {session && (
          <div className="mt-2">
            <p className="text-sm font-medium text-zinc-100">{session.user.name}</p>
            <p className="text-xs text-zinc-400">{role ? ROLE_LABELS[role] : ""}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm
                     text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
