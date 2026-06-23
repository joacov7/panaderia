import { requireRole, getTenantId } from "@/lib/auth/server"
import { getClientById, getClientAccountMovements } from "@/lib/queries/clients"
import { notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils/currency"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RegisterPaymentForm } from "@/components/clients/register-payment-form"

const TX_LABELS = {
  invoice:     { label: "Cargo",        color: "text-red-600" },
  payment:     { label: "Pago",         color: "text-green-600" },
  credit_note: { label: "Nota crédito", color: "text-green-600" },
  debit_note:  { label: "Nota débito",  color: "text-red-600" },
}

export default async function ClientAccountPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "cashier"])
  const tenantId = await getTenantId()
  const { id } = await params

  const [client, movements] = await Promise.all([
    getClientById(id, tenantId),
    getClientAccountMovements(id, tenantId),
  ])

  if (!client) notFound()

  const balance = Number(client.currentBalance)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/clients/${id}`} className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Cuenta corriente</h2>
          <p className="text-sm text-zinc-500">{client.name}</p>
        </div>
      </div>

      {/* Saldo actual */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Saldo actual</p>
            <p className={`text-3xl font-bold mt-1 ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-zinc-900"}`}>
              {formatCurrency(Math.abs(balance))}
              <span className="text-base font-normal text-zinc-400 ml-2">
                {balance > 0 ? "debe" : balance < 0 ? "a favor" : "al día"}
              </span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Límite de crédito: {formatCurrency(client.creditLimit)}
            </p>
          </div>
          {balance > 0 && (
            <RegisterPaymentForm clientId={client.id} currentBalance={balance} />
          )}
        </div>
      </div>

      {/* Movimientos */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
          <h3 className="font-medium text-zinc-700 text-sm">Historial de movimientos</h3>
        </div>
        {movements.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-10">Sin movimientos registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Fecha</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Tipo</th>
                <th className="text-left px-5 py-2.5 font-medium text-zinc-500">Descripción</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Importe</th>
                <th className="text-right px-5 py-2.5 font-medium text-zinc-500">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {movements.map(tx => {
                const cfg = TX_LABELS[tx.transactionType]
                return (
                  <tr key={tx.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-600">
                      {format(new Date(tx.createdAt), "dd/MM/yy HH:mm", { locale: es })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{tx.description ?? "—"}</td>
                    <td className={`px-5 py-3 text-right font-medium ${cfg.color}`}>
                      {Number(tx.amount) > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-700 font-semibold">
                      {formatCurrency(tx.balanceAfter)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
