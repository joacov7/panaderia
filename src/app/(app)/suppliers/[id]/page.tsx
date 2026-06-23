import { requireRole, getTenantId } from "@/lib/auth/server"
import { getSupplierById } from "@/lib/queries/suppliers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import { SupplierForm } from "@/components/suppliers/supplier-form"

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor"])
  const tenantId = await getTenantId()
  const { id } = await params
  const supplier = await getSupplierById(id, tenantId)
  if (!supplier) notFound()

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-zinc-900">{supplier.name}</h2>
          {supplier.taxId && <p className="text-sm text-zinc-500">{supplier.taxId}</p>}
        </div>
        <Link href="/purchases/new"
          className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-2 rounded-lg
                     text-sm font-medium hover:bg-zinc-700 transition-colors">
          <ShoppingCart className="w-4 h-4" />
          Nueva OC
        </Link>
      </div>

      {Number(supplier.currentBalance) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs font-medium text-zinc-500">Deuda pendiente</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(supplier.currentBalance)}</p>
        </div>
      )}

      <SupplierForm
        mode="edit"
        supplierId={id}
        defaultValues={{
          name:         supplier.name,
          taxId:        supplier.taxId ?? "",
          contactName:  supplier.contactName ?? "",
          phone:        supplier.phone ?? "",
          email:        supplier.email ?? "",
          address:      supplier.address ?? "",
          paymentTerms: Number(supplier.paymentTerms ?? 30),
          notes:        supplier.notes ?? "",
        }}
      />
    </div>
  )
}
