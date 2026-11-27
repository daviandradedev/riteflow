import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __riteflowAuthPool?: Pool;
  __riteflowAppPool?: Pool;
};

export function getAuthPool() {
  const connectionString = process.env.AUTH_DATABASE_URL?.trim();
  if (!connectionString) return null;
  if (!globalForDb.__riteflowAuthPool) {
    globalForDb.__riteflowAuthPool = new Pool({ connectionString, max: 5 });
  }
  return globalForDb.__riteflowAuthPool;
}

export function getAppPool() {
  const appUrl = process.env.DATABASE_URL?.trim();
  const authUrl = process.env.AUTH_DATABASE_URL?.trim();
  if (!appUrl) return getAuthPool();
  if (authUrl && appUrl === authUrl) return getAuthPool();
  if (!globalForDb.__riteflowAppPool) {
    globalForDb.__riteflowAppPool = new Pool({ connectionString: appUrl, max: 5 });
  }
  return globalForDb.__riteflowAppPool;
}

export function getPool() {
  return getAuthPool();
}
