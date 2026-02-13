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
      <div className="max-w-7xl mx-auto">
        <div className="max-w-full flex justify-between">
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

          <div className="flex gap-4 mb-8">
            <div className="bg-white w-[220px] max-h-[120px] rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Reservas
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {stats.totalBookings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl w-[220px] max-h-[120px] p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Confirmadas
                  </p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {stats.confirmedBookings}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
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
        </div>

        {/* Calendar Component */}
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
