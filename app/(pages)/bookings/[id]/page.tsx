import { DIContainer } from "../../../core/DiContainer";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteBookingButton from "../../../components/widget/DeleteBookingButton";
import ViewPDFBookingButton from "../../../components/widget/ViewPDFBookingButton";
import EditBookingButton from "../../../components/widget/EditBookingButton";
import { toTitleCase } from "../../../utils/utils";

type Props = {
  params: Promise<{
    id: string;
  }>;
};
export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const booking = await DIContainer.getBookingRepository().getBooking(
    Number(id),
  );

  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto" id="booking-details-content">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4 no-print"
            data-html2canvas-ignore
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a reservas
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">
                Reserva #{booking.id}
              </h1>
              <p className="text-slate-600 mt-1">
                Detalles completos de la reserva
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                booking.status === "Confirmada"
                  ? "bg-green-100 text-green-800"
                  : booking.status === "Pendiente"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Information */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Información del Huésped
              </h2>
              <div
                className={`grid grid-cols-2 gap-4 ${
                  booking.guest_phone && "grid-cols-3"
                }`}
              >
                <div>
                  <p className="text-sm text-slate-600 mb-1">Nombre</p>
                  <p className="text-base font-semibold text-slate-900">
                    {toTitleCase(booking.guest_name)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Cantidad de Huéspedes
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {booking.guest_count}{" "}
                    {booking.guest_count === 1 ? "persona" : "personas"}
                  </p>
                </div>
                {booking.guest_phone && (
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Teléfono</p>
                    <p className="text-base font-semibold text-slate-900">
                      {booking.guest_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Stay Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Detalles de la Estadía
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Check-in</p>
                  <p className="text-base font-semibold text-slate-900">
                    {new Date(booking.check_in).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Check-out</p>
                  <p className="text-base font-semibold text-slate-900">
                    {new Date(booking.check_out).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Noches</p>
                  <p className="text-base font-semibold text-blue-600">
                    {booking.nights_stay} noches
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Detalles de Precio
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-sm text-slate-600">
                    Precio por noche
                  </span>
                  <span className="text-base font-semibold text-slate-900">
                    {parseFloat(booking.total_price_usd) > 0 ? (
                      <>
                        $
                        {Math.round(
                          parseFloat(booking.price_per_night_usd),
                        ).toLocaleString("es-AR")}{" "}
                        USD
                      </>
                    ) : (
                      <>
                        $
                        {Math.round(
                          parseFloat(booking.total_price_ars || "0") /
                            booking.nights_stay,
                        ).toLocaleString("es-AR")}{" "}
                        ARS
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-sm text-slate-600">
                    {booking.nights_stay} noches
                  </span>
                  <span className="text-base font-semibold text-slate-900">
                    {parseFloat(booking.total_price_usd) > 0 ? (
                      <>
                        $
                        {parseFloat(booking.total_price_usd).toLocaleString(
                          "es-AR",
                        )}{" "}
                        USD
                      </>
                    ) : (
                      <>
                        $
                        {parseFloat(booking.total_price_ars!).toLocaleString(
                          "es-AR",
                        )}{" "}
                        ARS
                      </>
                    )}
                  </span>
                </div>
                {parseFloat(booking.channel_commission_usd) > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <span className="text-sm text-slate-600">
                      Comisión canal
                    </span>
                    <span className="text-base font-semibold text-red-600">
                      -$
                      {parseFloat(
                        booking.channel_commission_usd,
                      ).toLocaleString("es-AR")}{" "}
                      USD
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-semibold text-slate-900">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {parseFloat(booking.total_price_usd) > 0 ? (
                      <>
                        $
                        {parseFloat(booking.total_price_usd).toLocaleString(
                          "es-AR",
                        )}{" "}
                        USD
                      </>
                    ) : (
                      <>
                        $
                        {parseFloat(booking.total_price_ars!).toLocaleString(
                          "es-AR",
                        )}{" "}
                        ARS
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Pagos
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-medium mb-1">
                    Anticipo
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    {parseFloat(booking.deposit_amount_usd) > 0 ? (
                      <>
                        $
                        {parseFloat(booking.deposit_amount_usd).toLocaleString(
                          "es-AR",
                        )}{" "}
                        USD
                      </>
                    ) : (
                      <>
                        $
                        {parseFloat(
                          booking.deposit_payment_ars || "0",
                        ).toLocaleString("es-AR")}{" "}
                        ARS
                      </>
                    )}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-sm text-emerald-700 font-medium mb-1">
                    Saldo
                  </p>
                  <p className="text-xl font-bold text-emerald-900">
                    {parseFloat(booking.balance_amount_usd) > 0 ? (
                      <>
                        $
                        {parseFloat(booking.balance_amount_usd).toLocaleString(
                          "es-AR",
                        )}{" "}
                        USD
                      </>
                    ) : (
                      <>
                        $
                        {parseFloat(
                          booking.balance_payment_ars || "0",
                        ).toLocaleString("es-AR")}{" "}
                        ARS
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Channel Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Canal de Reserva
              </h3>
              <p className="text-lg font-bold text-blue-600">
                {booking.channel_name}
              </p>
            </div>

            {/* Booking Date */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Fecha de Reserva
              </h3>
              <p className="text-base font-semibold text-slate-900">
                {new Date(booking.booking_date).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="flex justify-between px-5">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                  Publicidad
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    booking.advertising_booking
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {booking.advertising_booking ? "Sí" : "No"}
                </span>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                  Medio Día
                </h3>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    booking.noon
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {booking.noon ? "Sí" : "No"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div
              className="bg-linear-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 no-print"
              data-html2canvas-ignore
            >
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                Acciones
              </h3>
              <div className="space-y-3">
                <EditBookingButton
                  bookingId={booking.id}
                  text="Editar Reserva"
                />

                <ViewPDFBookingButton
                  text="Vista Previa"
                  bookingId={booking.id}
                />

                {booking.guest_phone && (
                  <a
                    href={`https://wa.me/${
                      booking.guest_phone
                    }?text=${encodeURIComponent(
                      `Hola ${booking.guest_name}, te envío el comprobante de tu reserva: ${process.env.NEXT_PUBLIC_APP_URL}/api/booking?id=${booking.id}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Enviar Comprobante
                  </a>
                )}

                <DeleteBookingButton bookingId={booking.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
