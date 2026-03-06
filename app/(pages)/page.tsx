import { CalendarPlus2, Eye } from "lucide-react";
import { DIContainer } from "../core/DiContainer";
import Link from "next/link";
import CalendarComponent from "../components/CalendarComponent";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingRepository = DIContainer.getBookingRepository();

  // Default dates: Today and Today + 1 Month
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDate =
    (resolvedSearchParams.startDate as string) || formatDateToLocal(today);
  const endDate =
    (resolvedSearchParams.endDate as string) || formatDateToLocal(nextMonth);

  const [sy, sm] = startDate.split("-").map(Number);
  const calendarStartDate = `${sy}-${String(sm).padStart(2, "0")}-01`;

  const [calendarBookings, closestBooking] = await Promise.all([
    bookingRepository.getBookingsForCalendar(calendarStartDate, endDate, 200),
    bookingRepository.getClosestUpcomingBooking(),
  ]);

  const hasClosestBooking = Boolean(closestBooking?.id);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[radial-gradient(circle_at_top_left,oklch(0.98_0.02_70),transparent_55%),radial-gradient(circle_at_top_right,oklch(0.97_0.02_240),transparent_45%),oklch(0.995_0.003_80)]">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-10">
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Reservas
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Gestiona próximas estadías y revisa disponibilidad del mes.
            </p>

            <div className="flex gap-5 mt-4">
              <Link
                href="/bookings/create"
                className="inline-flex items-center self-start gap-2 px-4 py-2 bg-[#2C2C2C] text-white text-base hover:bg-[#2C2C2C]/90 active:bg-[#1f1f1f] rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                <CalendarPlus2 className="h-5 w-5" aria-hidden="true" />
                Crear Reserva
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl w-full lg:w-[320px] max-h-[170px] p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  Próxima Reserva
                </p>
                <p className="text-2xl md:text-3xl font-bold text-primary mt-1 truncate">
                  {hasClosestBooking
                    ? closestBooking?.guest_name.toUpperCase().split(" ")[0]
                    : "Sin reservas"}
                </p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {hasClosestBooking && closestBooking?.check_in
                    ? new Date(closestBooking.check_in).toLocaleDateString(
                        "es-AR",
                      )
                    : "-"}{" "}
                  -{" "}
                  {hasClosestBooking && closestBooking?.check_out
                    ? new Date(closestBooking.check_out).toLocaleDateString(
                        "es-AR",
                      )
                    : "-"}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 ">
                <Link
                  href={
                    hasClosestBooking ? `/bookings/${closestBooking?.id}` : "/"
                  }
                  aria-label="Ver detalle de la próxima reserva"
                  className="inline-flex items-center justify-center text-primary rounded-lg hover:bg-primary/20 active:bg-primary/30 transition-colors w-12 h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <Eye className="w-6 h-6" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <CalendarComponent
            bookings={calendarBookings}
            initialDate={startDate}
          />
        </div>
      </div>
    </div>
  );
}
