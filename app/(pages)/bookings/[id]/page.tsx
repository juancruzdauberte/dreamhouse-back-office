import { DIContainer } from "../../../core/DiContainer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, MessageSquare, Tag, User } from "lucide-react";
import DeleteBookingButton from "../../../components/widget/DeleteBookingButton";
import ViewPDFBookingButton from "../../../components/widget/ViewPDFBookingButton";
import EditBookingButton from "../../../components/widget/EditBookingButton";
import { toTitleCase } from "../../../utils/utils";
import AnimatedHero from "../../../components/booking-detail/AnimatedHero";
import AnimatedSectionCard from "../../../components/booking-detail/AnimatedSectionCard";
import StayTimeline from "../../../components/booking-detail/StayTimeline";
import PaymentProgressCard from "../../../components/booking-detail/PaymentProgressCard";

type Props = { params: Promise<{ id: string }> };

/* ── helpers ─────────────────────────────────────────────────────── */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  highlight,
  className = "",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-border/40 last:border-0 ${className}`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "text-base font-bold text-emerald-600"
            : "text-sm font-semibold text-foreground"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const booking = await DIContainer.getBookingRepository().getBooking(
    Number(id),
  );
  if (!booking) notFound();

  const isUSD = parseFloat(booking.total_price_usd) > 0;
  const currency = isUSD ? "USD" : "ARS";
  const totalAmt = isUSD
    ? parseFloat(booking.total_price_usd)
    : parseFloat(booking.total_price_ars ?? "0");
  const depositAmt = isUSD
    ? parseFloat(booking.deposit_amount_usd)
    : parseFloat(booking.deposit_payment_ars ?? "0");
  const balanceAmt = isUSD
    ? parseFloat(booking.balance_amount_usd)
    : parseFloat(booking.balance_payment_ars ?? "0");
  const pricePerNight = isUSD
    ? Math.round(parseFloat(booking.price_per_night_usd))
    : Math.round(totalAmt / booking.nights_stay);
  const commission = parseFloat(booking.channel_commission_usd);

  const fmt = (n: number) => `$${n.toLocaleString("es-AR")} ${currency}`;

  const bookingDateFormatted = new Date(
    booking.booking_date,
  ).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const checkInFormatted = new Date(booking.check_in).toLocaleDateString(
    "es-AR",
    { day: "2-digit", month: "long", year: "numeric" },
  );
  const checkOutFormatted = new Date(booking.check_out).toLocaleDateString(
    "es-AR",
    { day: "2-digit", month: "long", year: "numeric" },
  );

  return (
    <div className="min-h-screen p-4 md:p-6 bg-[radial-gradient(circle_at_top_left,oklch(0.98_0.02_70),transparent_55%),radial-gradient(circle_at_top_right,oklch(0.97_0.02_240),transparent_45%),oklch(0.995_0.003_80)]">
      <div className="max-w-5xl mx-auto" id="booking-details-content">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 no-print"
          data-html2canvas-ignore
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a reservas
        </Link>

        {/* Hero header — spring entrance + status pulse */}
        <AnimatedHero
          id={booking.id}
          guestName={toTitleCase(booking.guest_name)}
          bookingDateFormatted={bookingDateFormatted}
          status={booking.status}
        />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Huésped */}
            <AnimatedSectionCard
              icon={<User className="h-4 w-4" />}
              title="Huésped"
              delay={80}
            >
              <div
                className={`grid gap-4 ${booking.guest_phone ? "grid-cols-3" : "grid-cols-2"}`}
              >
                <DetailRow
                  label="Nombre"
                  value={toTitleCase(booking.guest_name)}
                />
                <DetailRow
                  label="Personas"
                  value={`${booking.guest_count} ${booking.guest_count === 1 ? "persona" : "personas"}`}
                />
                {booking.guest_phone && (
                  <DetailRow label="Teléfono" value={booking.guest_phone} />
                )}
              </div>
            </AnimatedSectionCard>

            {/* Estadía — timeline visual + count-up noches */}
            <StayTimeline
              checkIn={checkInFormatted}
              checkOut={checkOutFormatted}
              nights={booking.nights_stay}
              noon={booking.noon}
              delay={160}
            />

            {/* Precio */}
            <AnimatedSectionCard
              icon={<Banknote className="h-4 w-4" />}
              title="Precio"
              delay={240}
            >
              <PriceRow label="Precio por noche" value={fmt(pricePerNight)} />
              <PriceRow
                label={`${booking.nights_stay} ${booking.nights_stay === 1 ? "noche" : "noches"}`}
                value={fmt(totalAmt)}
              />
              {commission > 0 && (
                <PriceRow
                  label="Comisión canal"
                  value={`-$${commission.toLocaleString("es-AR")} USD`}
                  className="text-rose-600"
                />
              )}
              <PriceRow label="Total" value={fmt(totalAmt)} highlight />
            </AnimatedSectionCard>

            {/* Pagos — progress bar + count-up */}
            <PaymentProgressCard
              depositAmt={depositAmt}
              balanceAmt={balanceAmt}
              totalAmt={totalAmt}
              currency={currency}
              delay={320}
            />

            {/* Observaciones (condicional) */}
            {booking.observations && (
              <AnimatedSectionCard
                icon={<MessageSquare className="h-4 w-4" />}
                title="Observaciones"
                delay={400}
              >
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {booking.observations}
                </p>
              </AnimatedSectionCard>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Canal & detalles */}
            <AnimatedSectionCard
              icon={<Tag className="h-4 w-4" />}
              title="Detalles"
              delay={80}
            >
              <div className="flex flex-col gap-4">
                <DetailRow
                  label="Canal"
                  value={
                    <span className="text-primary font-bold">
                      {booking.channel_name}
                    </span>
                  }
                />
                <DetailRow
                  label="Fecha de reserva"
                  value={bookingDateFormatted}
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Publicidad
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${booking.advertising_booking ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-muted text-muted-foreground"}`}
                    >
                      {booking.advertising_booking ? "Sí" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </AnimatedSectionCard>

            {/* Acciones */}
            <AnimatedSectionCard
              delay={160}
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              }
              title="Acciones"
              className="no-print"
            >
              <div className="flex flex-col gap-2" data-html2canvas-ignore>
                <EditBookingButton
                  bookingId={booking.id}
                  text="Editar reserva"
                />
                <ViewPDFBookingButton bookingId={booking.id} text="Ver PDF" />
                {booking.guest_phone && (
                  <a
                    href={`https://wa.me/${booking.guest_phone}?text=${encodeURIComponent(`Hola ${booking.guest_name}, te envío el comprobante de tu reserva: ${process.env.NEXT_PUBLIC_APP_URL}/api/booking?id=${booking.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#20ba5a] transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Enviar comprobante
                  </a>
                )}
                <DeleteBookingButton bookingId={booking.id} />
              </div>
            </AnimatedSectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
