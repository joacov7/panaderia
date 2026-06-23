import { requireRole } from "@/lib/auth/server"
import { SupplierForm } from "@/components/suppliers/supplier-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewSupplierPage() {
  await requireRole(["admin", "owner", "supervisor"])
  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nuevo Proveedor</h2>
      </div>
      <SupplierForm mode="create" />
    </div>
  )
}
