"use client"

import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/production": "Producción",
  "/recipes":    "Recetas",
  "/stock":      "Stock",
  "/orders":     "Pedidos",
  "/delivery":   "Reparto",
  "/pos":        "Caja / POS",
  "/purchases":  "Compras",
  "/clients":    "Clientes",
  "/reports":    "Reportes",
  "/settings":   "Configuración",
}

export function Header() {
  const pathname = usePathname()
  const segment = "/" + pathname.split("/")[1]
  const title = PAGE_TITLES[segment] ?? "Panel"

  return (
    <header className="h-14 border-b border-zinc-200 bg-white flex items-center px-6 sticky top-0 z-10">
      <h1 className="text-base font-semibold text-zinc-800">{title}</h1>
    </header>
  )
}
