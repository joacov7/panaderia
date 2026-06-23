import { requireRole, getTenantId } from "@/lib/auth/server"
import { getClientById } from "@/lib/queries/clients"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { ClientForm } from "@/components/clients/client-form"

const TYPE_LABELS = { retail: "Minorista", wholesale: "Mayorista" }

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "seller", "cashier"])
  const tenantId = await getTenantId()
  const { id } = await params
  const client = await getClientById(id, tenantId)
  if (!client) notFound()

  const balance = Number(client.currentBalance)

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">{client.name}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{TYPE_LABELS[client.type]}</p>
        </div>
        <Link
          href={`/clients/${id}/account`}
          className="flex items-center gap-2 border border-zinc-300 text-zinc-700 px-3 py-2
                     rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Cuenta corriente
        </Link>
      </div>

      {/* Saldo rápido */}
      <div className={`rounded-xl border p-4 flex items-center justify-between
        ${balance > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
        <div>
          <p className="text-xs font-medium text-zinc-500">Saldo actual</p>
          <p className={`text-xl font-bold mt-0.5 ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(Math.abs(balance))}
            <span className="text-sm font-normal ml-2 text-zinc-400">
              {balance > 0 ? "debe" : balance < 0 ? "a favor" : "al día"}
            </span>
          </p>
        </div>
        <p className="text-xs text-zinc-400">Crédito: {formatCurrency(client.creditLimit)}</p>
      </div>

      {/* Datos + edición */}
      <ClientForm
        mode="edit"
        clientId={id}
        defaultValues={{
          name:        client.name,
          taxId:       client.taxId ?? "",
          address:     client.address ?? "",
          phone:       client.phone ?? "",
          email:       client.email ?? "",
          type:        client.type,
          creditLimit: Number(client.creditLimit),
          notes:       client.notes ?? "",
        }}
      />
    </div>
  )
}
