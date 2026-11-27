import { getCurrentUser } from "@/lib/api/auth";
import { ReportClient } from "@/components/report/report-client";

export default async function ReportPage() {
  const user = await getCurrentUser();
  return <ReportClient signedIn={Boolean(user)} />;
}
