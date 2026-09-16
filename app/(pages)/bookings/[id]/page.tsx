import { DIContainer } from "../../../core/DiContainer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Banknote, MessageSquare, Tag, User } from "lucide-react";
import DeleteBookingButton from "../../../components/widget/DeleteBookingButton";
import WhatsAppDropdownButton from "../../../components/widget/WhatsAppDropdownButton";
import ViewPDFBookingButton from "../../../components/widget/ViewPDFBookingButton";
import EditBookingButton from "../../../components/widget/EditBookingButton";
import { toTitleCase } from "../../../utils/utils";
import AnimatedHero from "../../../components/booking-detail/AnimatedHero";
import AnimatedSectionCard from "../../../components/booking-detail/AnimatedSectionCard";
import MobileActionBar from "../../../components/booking-detail/MobileActionBar";
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
    : parseFloat(booking.deposit_amount_ars ?? "0");
  const balanceAmt = isUSD
    ? parseFloat(booking.balance_amount_usd)
    : parseFloat(booking.balance_amount_ars ?? "0");
  const pricePerNight = isUSD
    ? Math.round(parseFloat(booking.price_per_night_usd))
    : Math.round(totalAmt / booking.nights_stay);
  const commission = parseFloat(booking.channel_commission_usd);

  const fmt = (n: number) => `$${n.toLocaleString("es-AR")} ${currency}`;

  // Calcular equivalencia en USD si hay tipos de cambio
  const depositTC = parseFloat(booking.deposit_exchange_rate || "0");
  const balanceTC = parseFloat(booking.balance_exchange_rate || "0");
  const hasExchangeRates = depositTC > 0 || balanceTC > 0;
  const avgTC =
    depositTC && balanceTC
      ? (depositTC + balanceTC) / 2
      : depositTC || balanceTC;
  const equivalentUSD =
    hasExchangeRates && !isUSD && avgTC > 0
      ? parseFloat((totalAmt / avgTC).toFixed(2))
      : null;

  const bookingDateFormatted = new Date(
    booking.booking_date,
  ).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const checkInFormatted = new Date(booking.check_in).toLocaleDateString(
    "es-AR",
    { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" },
  );
  const checkOutFormatted = new Date(booking.check_out).toLocaleDateString(
    "es-AR",
    { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" },
  );

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 md:pb-0 bg-[radial-gradient(circle_at_top_left,oklch(0.98_0.02_70),transparent_55%),radial-gradient(circle_at_top_right,oklch(0.97_0.02_240),transparent_45%),oklch(0.995_0.003_80)]">
      <div className="max-w-5xl mx-auto" id="booking-details-content">
        {/* Back */}
        <Link
          href="/"
          className="items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 no-print hidden md:inline-flex"
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

              {/* Tipos de cambio e información referencial en USD */}
              {hasExchangeRates && (
                <div className="mt-4 pt-3 border-t border-border/60">
                  <p className="text-xs font-medium text-muted-foreground mb-2.5">
                    Referencia de cambio
                  </p>
                  {depositTC > 0 && (
                    <div className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-muted-foreground">
                        USD tipo de cambio anticipo:
                      </span>
                      <span className="font-medium text-foreground">
                        {depositTC.toLocaleString("es-AR", {
                          maximumFractionDigits: 3,
                        })}
                      </span>
                    </div>
                  )}
                  {balanceTC > 0 && (
                    <div className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-muted-foreground">
                        USD tipo de cambio saldo:
                      </span>
                      <span className="font-medium text-foreground">
                        {balanceTC.toLocaleString("es-AR", {
                          maximumFractionDigits: 3,
                        })}
                      </span>
                    </div>
                  )}
                  {equivalentUSD && (
                    <div className="flex items-center justify-between py-2 mt-2 px-3 rounded-lg bg-blue-50 border border-blue-100">
                      <span className="text-xs font-medium text-blue-700">
                        ≈ en USD:
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        USD {equivalentUSD.toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    ℹ️ Valor informativo basado en TC promedio
                  </p>
                </div>
              )}
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
                  <WhatsAppDropdownButton
                    phone={booking.guest_phone}
                    bookingId={booking.id}
                  />
                )}
                <DeleteBookingButton bookingId={booking.id} />
              </div>
            </AnimatedSectionCard>
          </div>
        </div>
      </div>
      <MobileActionBar
        bookingId={booking.id}
        guestPhone={booking.guest_phone}
      />
    </div>
  );
}
