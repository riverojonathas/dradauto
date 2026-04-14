import { getCurrentClinic } from "@/lib/clinic"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const clinic = await getCurrentClinic()

  return <DashboardContent clinic={clinic} />
}
