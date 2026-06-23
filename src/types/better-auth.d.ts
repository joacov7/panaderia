import type { UserRole } from "./roles"

declare module "better-auth" {
  interface Session {
    user: {
      id:         string
      name:       string
      email:      string
      image?:     string | null
      tenantId:   string
      role:       UserRole
      isActive:   boolean
      phone?:     string | null
    }
  }
}
