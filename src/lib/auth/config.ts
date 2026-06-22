import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/db"
import * as schema from "@/db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         schema.users,
      session:      schema.sessions,
      account:      schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // activar en producción
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutos de cache en cookie
    },
  },

  user: {
    additionalFields: {
      tenantId: {
        type: "string",
        required: true,
        fieldName: "tenant_id",
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "seller",
        fieldName: "role",
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        fieldName: "is_active",
      },
      phone: {
        type: "string",
        required: false,
        fieldName: "phone",
      },
    },
  },

  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session
