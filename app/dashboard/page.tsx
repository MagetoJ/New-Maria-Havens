import { DashboardOverview } from "@/components/dashboard-overview"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}
