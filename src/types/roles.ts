export type UserRole =
  | "admin"
  | "owner"
  | "supervisor"
  | "production"
  | "delivery"
  | "cashier"
  | "seller"

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:      "Administrador",
  owner:      "Dueño",
  supervisor: "Supervisor",
  production: "Producción",
  delivery:   "Repartidor",
  cashier:    "Cajero",
  seller:     "Vendedor",
}

// Roles que pueden acceder al panel de administración
export const MANAGEMENT_ROLES: UserRole[] = ["admin", "owner", "supervisor"]

// Roles con acceso a módulo de producción
export const PRODUCTION_ROLES: UserRole[] = ["admin", "owner", "supervisor", "production"]

// Roles con acceso a POS
export const POS_ROLES: UserRole[] = ["admin", "owner", "supervisor", "cashier", "seller"]

export function canAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}
