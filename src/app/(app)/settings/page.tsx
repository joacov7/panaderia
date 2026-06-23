import { requireRole, getTenantId } from "@/lib/auth/server"
import { getTenant } from "@/lib/queries/settings"
import { UpdateTenantForm } from "@/components/settings/update-tenant-form"
import Link from "next/link"
import { Users } from "lucide-react"

export default async function SettingsPage() {
  await requireRole(["admin", "owner"])
  const tenantId = await getTenantId()
  const tenant = await getTenant(tenantId)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Configuración</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Administrá tu panadería</p>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/settings/users"
          className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl p-4 hover:border-zinc-400 transition-colors"
        >
          <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-zinc-600" />
          </div>
          <div>
            <p className="font-medium text-zinc-800 text-sm">Usuarios</p>
            <p className="text-xs text-zinc-400">Invitar y gestionar roles</p>
          </div>
        </Link>
      </div>

      {/* Tenant info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <h3 className="font-semibold text-zinc-800 text-sm">Información de la panadería</h3>
        <UpdateTenantForm name={tenant?.name ?? ""} />
      </div>
    </div>
  )
}
