import { requireRole, getTenantId } from "@/lib/auth/server"
import { getProductionOrderById } from "@/lib/queries/production"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProductionItemCard } from "@/components/production/production-item-card"

const STATUS_LABELS = {
  draft:       { label: "Borrador",   color: "bg-zinc-100 text-zinc-600" },
  in_progress: { label: "En proceso", color: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled:   { label: "Cancelada",  color: "bg-red-100 text-red-600" },
}

const SHIFT_LABELS = { night: "Nocturno", morning: "Mañana", afternoon: "Tarde" }

export default async function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "owner", "supervisor", "production"])
  const tenantId = await getTenantId()
  const { id } = await params
  const order = await getProductionOrderById(id, tenantId)
  if (!order) notFound()

  const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.draft

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/production" className="text-zinc-400 hover:text-zinc-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-zinc-900">
              Producción — {SHIFT_LABELS[order.shift]}
            </h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
              {st.label}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {format(new Date(order.date), "EEEE dd 'de' MMMM yyyy", { locale: es })}
            {order.createdBy && ` · Creada por ${order.createdBy.name}`}
          </p>
        </div>
      </div>

      {order.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {order.notes}
        </div>
      )}

      <div className="space-y-3">
        {order.items.map(item => (
          <ProductionItemCard
            key={item.id}
            item={{
              id:              item.id,
              status:          item.status,
              quantityPlanned: Number(item.quantityPlanned),
              quantityProduced: item.quantityProduced ? Number(item.quantityProduced) : null,
              wasteQuantity:   item.wasteQuantity ? Number(item.wasteQuantity) : null,
              productName:     item.product?.name ?? "",
              recipeName:      item.recipe?.name ?? "",
              ingredients:     item.recipe?.items?.map(ri => ({
                name:     ri.rawMaterial?.name ?? "",
                quantity: Number(ri.quantity),
                unit:     ri.unit?.abbreviation ?? "",
              })) ?? [],
            }}
          />
        ))}
      </div>
    </div>
  )
}
