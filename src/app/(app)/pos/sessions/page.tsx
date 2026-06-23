import { requireRole, getTenantId } from "@/lib/auth/server"
import { getCashSessions } from "@/lib/queries/pos"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft, Store } from "lucide-react"

const STATUS_LABELS = {
  open:   { label: "Abierta",   color: "bg-green-100 text-green-700" },
  closed: { label: "Cerrada",   color: "bg-zinc-100 text-zinc-500" },
}

export default async function CashSessionsPage() {
  await requireRole(["admin", "owner", "supervisor", "cashier"])
  const tenantId = await getTenantId()
  const sessions = await getCashSessions(tenantId)

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/pos" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Sesiones de Caja</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Historial de aperturas y cierres</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-16 text-center">
          <Store className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">Sin sesiones registradas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Apertura</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Caja</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Cajero</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-500">Apertura</th>
                <th className="text-right px-5 py-3 font-medium text-zinc-500">Declarado</th>
                <th className="text-left px-5 py-3 font-medium text-zinc-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sessions.map(s => {
                const st = STATUS_LABELS[s.status]
                const diff = s.closingAmountDeclared && s.closingAmountSystem
                  ? Number(s.closingAmountDeclared) - Number(s.closingAmountSystem)
                  : null
                return (
                  <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">
                      {format(new Date(s.openedAt), "dd/MM/yy HH:mm", { locale: es })}
                      {s.closedAt && (
                        <span className="block text-zinc-400">
                          → {format(new Date(s.closedAt), "HH:mm")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-800">
                      {s.register?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {s.openedBy?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-600">
                      {formatCurrency(s.openingAmount)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {s.closingAmountDeclared ? (
                        <span className={diff !== null && Math.abs(diff) > 0.5 ? "text-red-600 font-semibold" : "text-zinc-700"}>
                          {formatCurrency(s.closingAmountDeclared)}
                          {diff !== null && Math.abs(diff) > 0.5 && (
                            <span className="block text-xs">
                              {diff > 0 ? "+" : ""}{formatCurrency(diff)} vs sistema
                            </span>
                          )}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
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
