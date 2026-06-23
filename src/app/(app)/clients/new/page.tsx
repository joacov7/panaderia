import { requireRole } from "@/lib/auth/server"
import { ClientForm } from "@/components/clients/client-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewClientPage() {
  await requireRole(["admin", "owner", "supervisor", "seller", "cashier"])

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-zinc-900">Nuevo Cliente</h2>
      </div>
      <ClientForm mode="create" />
    </div>
  )
}
