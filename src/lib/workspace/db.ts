import { getAppPool } from "@/lib/db";
import type { WorkspacePayload } from "@/lib/workspace/types";
import { isWorkspacePayload } from "@/lib/workspace/merge";

let ensured = false;

export async function ensureWorkspaceTable() {
  const pool = getAppPool();
  if (!pool) return false;
  if (ensured) return true;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS riteflow_workspace (
      user_id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  ensured = true;
  return true;
}

export async function readCloudWorkspace(userId: string): Promise<WorkspacePayload | null> {
  const ok = await ensureWorkspaceTable();
  if (!ok) return null;
  const pool = getAppPool();
  if (!pool) return null;
  const result = await pool.query<{ payload: unknown }>(
    `SELECT payload FROM riteflow_workspace WHERE user_id = $1`,
    [userId],
  );
  const payload = result.rows[0]?.payload;
  return isWorkspacePayload(payload) ? payload : null;
}

export async function writeCloudWorkspace(userId: string, payload: WorkspacePayload) {
  const ok = await ensureWorkspaceTable();
  if (!ok) throw new Error("workspace_unavailable");
  const pool = getAppPool();
  if (!pool) throw new Error("workspace_unavailable");
  await pool.query(
    `
      INSERT INTO riteflow_workspace (user_id, payload, updated_at)
      VALUES ($1, $2::jsonb, $3::timestamptz)
      ON CONFLICT (user_id) DO UPDATE
      SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at
    `,
    [userId, JSON.stringify(payload), payload.updatedAt],
  );
}
