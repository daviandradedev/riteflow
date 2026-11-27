import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { authHubUrlForHost } from "@/lib/auth-public";
import { hubAccountHandoffUrl } from "@/lib/profile-handoff";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const hub = authHubUrlForHost(request.nextUrl.hostname).replace(/\/$/, "");
  const auth = getAuth();
  if (!auth) return NextResponse.redirect(hub);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.redirect(hub);

  let token: string | undefined;
  try {
    const issued = await auth.api.generateOneTimeToken({ headers: request.headers });
    token = issued?.token;
  } catch {
    token = undefined;
  }

  if (!token) return NextResponse.redirect(`${hub}/account`);
  return NextResponse.redirect(hubAccountHandoffUrl(hub, token));
}
