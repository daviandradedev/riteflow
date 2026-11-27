import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export const getSession = cache(async () => {
  const auth = getAuth();
  if (!auth) return null;
  return auth.api.getSession({
    headers: await headers(),
    query: { disableRefresh: true },
  });
});

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
