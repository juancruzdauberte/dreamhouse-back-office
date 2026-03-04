import { CalendarPlus2, Eye } from "lucide-react";
import ViewPDFBookingButton from "../components/widget/ViewPDFBookingButton";
import { DIContainer } from "../core/DiContainer";
import Link from "next/link";
import EditBookingButton from "../components/widget/EditBookingButton";
import CalendarComponent from "../components/CalendarComponent";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 10;

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

  const { bookings, total } =
    await DIContainer.getBookingRepository().getAllBookings(
      page,
      limit,
      startDate,
      endDate,
    );

  const calendarStartObj = new Date(startDate);
  calendarStartObj.setDate(1);
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const calendarStartDate = `${sy}-${String(sm).padStart(2, "0")}-01`;

  const { bookings: calendarBookings } =
    await DIContainer.getBookingRepository().getAllBookings(
      1,
      200,
      calendarStartDate,
      endDate,
    );

  const stats = await DIContainer.getBookingRepository().getBookingStats();
  const closestBooking =
    await DIContainer.getBookingRepository().getClosestUpcomingBooking();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-full flex gap-14">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-slate-800 ">Reservas</h1>

          <div className="flex gap-5 mt-4">
            <Link
              href="/bookings/create"
              className="flex items-center self-end gap-2 px-4 py-1.5 bg-[#2C2C2C] text-white text-lg hover:bg-[#2C2C2C]/80 rounded-lg font-bold"
            >
              {" "}
              <CalendarPlus2 /> Crear reserva
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl w-[280px] max-h-[150px] p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Proxima Reserva:
              </p>
              <p className="text-3xl font-bold text-blue-700 mt-1">
                {closestBooking?.guest_name.toUpperCase().split(" ")[0]}
              </p>
              <p className="text-sm font-medium text-black mt-1">
                {closestBooking?.check_in &&
                  new Date(closestBooking?.check_in).toLocaleDateString(
                    "es-AR",
                  )}{" "}
                -{" "}
                {closestBooking?.check_out &&
                  new Date(closestBooking?.check_out).toLocaleDateString(
                    "es-AR",
                  )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link
                href={`/bookings/${closestBooking?.id}`}
                className="inline-flex items-center justify-center text-blue-600 rounded-lg hover:bg-blue-200 transition-colors w-12 h-12"
                title="Ver detalles"
              >
                <Eye className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="mb-8">
        <CalendarComponent
          bookings={calendarBookings}
          initialDate={startDate}
        />
      </div>
    </div>
  );
}
