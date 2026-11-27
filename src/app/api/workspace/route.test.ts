import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/session-user";
import { MAX_WORKSPACE_BYTES } from "@/lib/workspace/merge";
import type { WorkspacePayload } from "@/lib/workspace/types";

const mockRequireUserId = vi.fn();
const mockGetAppPool = vi.fn();
const mockReadCloudWorkspace = vi.fn();
const mockWriteCloudWorkspace = vi.fn();

vi.mock("@/lib/session-user", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session-user")>();
  return {
    ...actual,
    requireUserId: () => mockRequireUserId(),
  };
});

vi.mock("@/lib/db", () => ({
  getAppPool: () => mockGetAppPool(),
}));

vi.mock("@/lib/workspace/db", () => ({
  readCloudWorkspace: (userId: string) => mockReadCloudWorkspace(userId),
  writeCloudWorkspace: (userId: string, payload: WorkspacePayload) =>
    mockWriteCloudWorkspace(userId, payload),
}));

import { GET, PUT } from "@/app/api/workspace/route";

const validPayload: WorkspacePayload = {
  version: 1,
  updatedAt: "2026-04-01T00:00:00.000Z",
  snapshots: [],
  hypotheses: [],
};

describe("/api/workspace route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockRequireUserId.mockRejectedValue(new UnauthorizedError());
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("returns 503 when database pool is unavailable", async () => {
    mockRequireUserId.mockResolvedValue("davi@example.com");
    mockGetAppPool.mockReturnValue(null);
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "workspace_unavailable" });
  });

  it("reads cloud workspace for the authenticated email key", async () => {
    mockRequireUserId.mockResolvedValue("davi@example.com");
    mockGetAppPool.mockReturnValue({});
    mockReadCloudWorkspace.mockResolvedValue(validPayload);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(mockReadCloudWorkspace).toHaveBeenCalledWith("davi@example.com");
    expect(await res.json()).toEqual({ workspace: validPayload });
  });

  it("masks unexpected internal errors on GET", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockRequireUserId.mockResolvedValue("davi@example.com");
    mockGetAppPool.mockReturnValue({});
    mockReadCloudWorkspace.mockRejectedValue(new Error("password authentication failed for user pg"));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "workspace_read_failed" });
    spy.mockRestore();
  });

  it("returns 413 when PUT body exceeds MAX_WORKSPACE_BYTES", async () => {
    mockRequireUserId.mockResolvedValue("davi@example.com");
    const huge = "x".repeat(MAX_WORKSPACE_BYTES + 10);
    const req = new Request("http://localhost:3300/api/workspace", {
      method: "PUT",
      body: huge,
    });
    const res = await PUT(req);
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "payload_too_large" });
  });

  it("returns 400 on invalid JSON or invalid workspace shape", async () => {
    mockRequireUserId.mockResolvedValue("davi@example.com");

    const badJsonRes = await PUT(
      new Request("http://localhost:3300/api/workspace", {
        method: "PUT",
        body: "{bad",
      }),
    );
    expect(badJsonRes.status).toBe(400);
    expect(await badJsonRes.json()).toEqual({ error: "invalid_json" });

    const badPayloadRes = await PUT(
      new Request("http://localhost:3300/api/workspace", {
        method: "PUT",
        body: JSON.stringify({ workspace: { version: 2 } }),
      }),
    );
    expect(badPayloadRes.status).toBe(400);
    expect(await badPayloadRes.json()).toEqual({ error: "invalid_workspace" });
  });

  it("writes valid workspace payload to DB", async () => {
    mockRequireUserId.mockResolvedValue("davi@example.com");
    mockGetAppPool.mockReturnValue({});
    mockWriteCloudWorkspace.mockResolvedValue(undefined);

    const res = await PUT(
      new Request("http://localhost:3300/api/workspace", {
        method: "PUT",
        body: JSON.stringify({ workspace: validPayload }),
      }),
    );
    expect(res.status).toBe(200);
    expect(mockWriteCloudWorkspace).toHaveBeenCalledWith("davi@example.com", validPayload);
    expect(await res.json()).toEqual({ ok: true });
  });
});
