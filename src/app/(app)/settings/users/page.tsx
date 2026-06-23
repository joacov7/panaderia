import { requireRole, getTenantId } from "@/lib/auth/server"
import { getTenantUsers } from "@/lib/queries/settings"
import { UsersList } from "@/components/settings/users-list"
import { InviteUserForm } from "@/components/settings/invite-user-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function UsersSettingsPage() {
  await requireRole(["admin", "owner"])
  const tenantId = await getTenantId()
  const usersList = await getTenantUsers(tenantId)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Usuarios</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{usersList.length} usuarios en tu panadería</p>
        </div>
      </div>

      <InviteUserForm />

      <UsersList users={usersList} />
    </div>
  )
}
