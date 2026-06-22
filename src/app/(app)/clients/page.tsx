import { requireRole, getTenantId } from "@/lib/auth/server"
import { getClients, getAccountSummary } from "@/lib/queries/clients"
import Link from "next/link"
import { Plus, Users, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

const TYPE_LABELS = { retail: "Minorista", wholesale: "Mayorista" }

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "cashier", "seller"])
  const tenantId = await getTenantId()
  const { q } = await searchParams

  const [clientsList, summary] = await Promise.all([
    getClients(tenantId, q),
    getAccountSummary(tenantId),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Clientes</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{clientsList.length} clientes activos</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Link>
      </div>

      {/* Resumen cuenta corriente */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Total deudas activas</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDebt)}</p>
          <p className="text-xs text-zinc-400 mt-1">{Number(summary.withDebt)} clientes con deuda</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <p className="text-xs font-medium text-zinc-500 mb-1">Con saldo a favor</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(Math.abs(Number(summary.totalCredit)))}</p>
          <p className="text-xs text-zinc-400 mt-1">Créditos disponibles</p>
        </div>
      </div>

      {/* Buscador */}
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono, CUIT..."
          className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <button
          type="submit"
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-700"
        >
          Buscar
        </button>
      </form>

      {/* Lista */}
      {clientsList.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No se encontraron clientes</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Cliente</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Teléfono</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-500">Saldo</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-500">Límite</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clientsList.map(client => {
                const balance = Number(client.currentBalance)
                return (
                  <tr key={client.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-zinc-800">{client.name}</p>
                        {client.taxId && <p className="text-xs text-zinc-400">{client.taxId}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {TYPE_LABELS[client.type]}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {client.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={balance > 0 ? "text-red-600 font-semibold" : balance < 0 ? "text-green-600 font-semibold" : "text-zinc-500"}>
                        {formatCurrency(balance)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-500">
                      {formatCurrency(client.creditLimit)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {balance > Number(client.creditLimit) * 0.8 && balance > 0 && (
                          <AlertCircle className="w-4 h-4 text-amber-500" title="Cerca del límite de crédito" />
                        )}
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-zinc-500 hover:text-zinc-900 font-medium text-xs"
                        >
                          Ver →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
