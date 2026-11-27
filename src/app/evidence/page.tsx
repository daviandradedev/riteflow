import { HomeClient } from "@/components/home-client";
import { getCurrentUser } from "@/lib/api/auth";

export default async function EvidencePage() {
  const user = await getCurrentUser();
  return <HomeClient signedIn={Boolean(user)} />;
}
