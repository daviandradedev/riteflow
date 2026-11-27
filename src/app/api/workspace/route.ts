import { NextResponse } from "next/server";
import { getAppPool } from "@/lib/db";
import { jsonError, requireUserId } from "@/lib/session-user";
import { isWorkspacePayload, MAX_WORKSPACE_BYTES } from "@/lib/workspace/merge";
import { readCloudWorkspace, writeCloudWorkspace } from "@/lib/workspace/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!getAppPool()) {
      return NextResponse.json({ error: "workspace_unavailable" }, { status: 503 });
    }
    const payload = await readCloudWorkspace(userId);
    return NextResponse.json({ workspace: payload });
  } catch (err) {
    return jsonError(err, "workspace_read_failed");
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_WORKSPACE_BYTES) {
      return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
    }

    let body: { workspace?: unknown };
    try {
      body = JSON.parse(raw) as { workspace?: unknown };
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!isWorkspacePayload(body.workspace)) {
      return NextResponse.json({ error: "invalid_workspace" }, { status: 400 });
    }
    if (!getAppPool()) {
      return NextResponse.json({ error: "workspace_unavailable" }, { status: 503 });
    }
    await writeCloudWorkspace(userId, body.workspace);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err, "workspace_write_failed");
  }
}
