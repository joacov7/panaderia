import { requireRole } from "@/lib/auth/server"

export default async function PwaLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["delivery", "admin", "owner"])

  return (
    <div className="min-h-screen bg-zinc-50 max-w-md mx-auto">
      <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-base">🥖 Reparto</span>
        <span className="text-xs text-zinc-400" id="sync-status">Online</span>
      </div>
      <main>{children}</main>
    </div>
  )
}
