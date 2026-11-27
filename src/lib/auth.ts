import { betterAuth } from "better-auth";
import { bearer, oneTimeToken } from "better-auth/plugins";
import type { Pool } from "pg";
import { appBaseUrlForHost, authHubUrlForHost } from "@/lib/auth-public";
import { getPool } from "@/lib/db";

function parseOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createAuth(pool: Pool) {
  const cookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN?.trim();
  const appUrl = appBaseUrlForHost();
  const authHubUrl = authHubUrlForHost();
  return betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: appUrl,
    trustedOrigins: [authHubUrl, appUrl, ...parseOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS)],
    advanced: cookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
        }
      : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    plugins: [bearer(), oneTimeToken()],
  });
}

const globalForAuth = globalThis as typeof globalThis & {
  __sprintReportAuth?: ReturnType<typeof createAuth>;
};

export function getAuth() {
  if (!process.env.BETTER_AUTH_SECRET?.trim() || !process.env.AUTH_DATABASE_URL?.trim()) {
    return null;
  }
  if (globalForAuth.__sprintReportAuth) return globalForAuth.__sprintReportAuth;
  const pool = getPool();
  if (!pool) return null;
  const auth = createAuth(pool);
  globalForAuth.__sprintReportAuth = auth;
  return auth;
}
