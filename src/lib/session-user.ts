import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export function normalizeUserKey(email: string): string {
  return email.trim().toLowerCase();
}

export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user?.email) throw new UnauthorizedError();
  return normalizeUserKey(user.email);
}

export function jsonError(err: unknown, fallback: string) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  console.error(fallback, err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
