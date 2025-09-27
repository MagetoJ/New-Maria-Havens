import { ReservationManagement } from "@/components/reservation-management"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ReservationsPage() {
  return (
    <DashboardLayout>
      <ReservationManagement />
    </DashboardLayout>
  )
}
