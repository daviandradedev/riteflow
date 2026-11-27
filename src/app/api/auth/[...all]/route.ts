import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}

export async function GET(request: NextRequest) {
  const auth = getAuth();
  if (!auth) return unavailable();
  return toNextJsHandler(auth).GET(request);
}

export async function POST(request: NextRequest) {
  const auth = getAuth();
  if (!auth) return unavailable();
  return toNextJsHandler(auth).POST(request);
}
