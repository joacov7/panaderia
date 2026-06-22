export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0)
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num)
}
