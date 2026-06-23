import { requireRole, getTenantId } from "@/lib/auth/server"
import { getSuppliers } from "@/lib/queries/suppliers"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"
import { Plus, Truck } from "lucide-react"

export default async function SuppliersPage() {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const suppliersList = await getSuppliers(tenantId)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Proveedores</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{suppliersList.length} proveedores activos</p>
        </div>
        <Link
          href="/suppliers/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </Link>
      </div>

      {suppliersList.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <Truck className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay proveedores registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Contacto</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Teléfono</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-500">Saldo deuda</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {suppliersList.map(s => (
                <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-800">
                    {s.name}
                    {s.taxId && <span className="text-xs text-zinc-400 block">{s.taxId}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">{s.contactName ?? "—"}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{s.phone ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={Number(s.currentBalance) > 0 ? "text-red-600 font-semibold" : "text-zinc-400"}>
                      {formatCurrency(s.currentBalance)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/suppliers/${s.id}`}
                      className="text-zinc-500 hover:text-zinc-900 font-medium text-xs">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
