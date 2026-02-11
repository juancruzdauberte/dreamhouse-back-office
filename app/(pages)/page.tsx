import { CalendarPlus2, Eye } from "lucide-react";
import ViewPDFBookingButton from "../components/ViewPDFBookingButton";
import { DIContainer } from "../core/DiContainer";
import Link from "next/link";
import EditBookingButton from "../components/EditBookingButton";
import DateRangeFilter from "../components/DateRangeFilter";

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
  const stats = await DIContainer.getBookingRepository().getBookingStats();

  const totalPages = Math.ceil(total / limit);

  // Find closest upcoming booking
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
              <div className="flex flex-col gap-1">
                <p className="text-sm italic">Filtrar por fecha:</p>
                <DateRangeFilter />
              </div>
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
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-indigo-600"
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
                    className="inline-flex items-center justify-center text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors w-12 h-12"
                    title="Ver detalles"
                  >
                    <Eye className="w-6 h-6" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Huésped
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Noches
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      booking.id === closestBooking?.id
                        ? "bg-slate-200/50 hover:bg-slate-200/50"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-500 font-bold rounded-full flex items-center justify-center text-white text-sm">
                          {booking.guest_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-slate-900">
                            {booking.guest_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.guest_count}{" "}
                            {booking.guest_count === 1
                              ? "huésped"
                              : "huéspedes"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {new Date(booking.check_in).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {new Date(booking.check_out).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {booking.nights_stay === 1
                          ? "1 noche"
                          : `${booking.nights_stay} noches`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {booking.channel_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {parseFloat(booking.total_price_usd)
                        ? `U$${parseFloat(
                            booking.total_price_usd,
                          ).toLocaleString("es-AR")} `
                        : `$${parseFloat(
                            booking.total_price_ars!,
                          ).toLocaleString("es-AR")}`}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.status === "Confirmada"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "Pendiente"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <EditBookingButton
                        bookingId={booking.id}
                        littleIcon={true}
                      />

                      <ViewPDFBookingButton
                        bookingId={booking.id}
                        littleIcon={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-slate-400"
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
              <h3 className="mt-2 text-sm font-medium text-slate-900">
                No hay reservas
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Comienza creando una nueva reserva
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {bookings.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center text-sm text-slate-600">
                Mostrando página{" "}
                <span className="font-medium mx-1">{page}</span> de{" "}
                <span className="font-medium mx-1">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/?page=${
                    page - 1
                  }&startDate=${startDate}&endDate=${endDate}`}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                    page <= 1
                      ? "bg-slate-100 text-slate-400 border-slate-200 pointer-events-none"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                  aria-disabled={page <= 1}
                >
                  Anterior
                </Link>
                <Link
                  href={`/?page=${
                    page + 1
                  }&startDate=${startDate}&endDate=${endDate}`}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                    page >= totalPages
                      ? "bg-slate-100 text-slate-400 border-slate-200 pointer-events-none"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                  aria-disabled={page >= totalPages}
                >
                  Siguiente
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
