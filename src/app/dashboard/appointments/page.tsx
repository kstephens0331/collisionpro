import AppointmentCalendar from "@/components/scheduling/AppointmentCalendar";

export const dynamic = "force-dynamic";

export default function AppointmentsPage() {
  return (
    <div className="p-6">
      <AppointmentCalendar />
    </div>
  );
}
