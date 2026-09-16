"use client";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { Banknote, Calendar, MessageSquare, Tag, User } from "lucide-react";
import { FormField } from "./FormField";
import { PriceInput } from "./PriceInput";
import { ReusableForm } from "./ReusableForm";
import { BookingFormSection } from "./BookingFormSection";
import { updateBooking } from "../lib/actions/booking.actions";
import { BookingDTO } from "../lib/repository/booking/booking.dto";
import { CHANNELS } from "../lib/constants/channels";

type BookingFormClientProps = {
  datesUnavailable: Array<{ check_in: string; check_out: string }>;
  booking: BookingDTO;
};

export default function UpdateBookingFormClient({
  datesUnavailable,
  booking,
}: BookingFormClientProps) {
  const router = useRouter();

  const [currency, setCurrency] = useState<number>(
    parseFloat(booking.total_price_usd || "0") > 0 ? 2 : 1,
  );

  const [totalPrice, setTotalPrice] = useState<number>(
    currency === 2
      ? parseFloat(booking.total_price_usd || "0")
      : parseFloat(booking.total_price_ars || "0"),
  );

  const bookingChannelId = () =>
    CHANNELS.find((ch) => ch.channel_name === booking.channel_name)?.id ?? 0;

  const [selectedChannel, setSelectedChannel] =
    useState<number>(bookingChannelId);

  // Exchange rate (informative only)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Anticipo editado en UPDATE
  const [editedDeposit, setEditedDeposit] = useState<number | null>(null);

  const handleCustomDepositChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const digits = e.target.value.replace(/\D/g, "");
    const value = parseFloat(digits || "0");
    setEditedDeposit(value);
  };

  const handleSuccess = () => {
    router.refresh();
    router.push(`/bookings/${booking.id}`);
  };

  const formatDateForInput = (dateString: string | Date) => {
    if (!dateString) return "";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filteredDatesUnavailable = useMemo(
    () =>
      datesUnavailable.filter((d) => {
        const dIn =
          typeof d.check_in === "string"
            ? d.check_in.split("T")[0]
            : new Date(d.check_in).toISOString().split("T")[0];
        const dOut =
          typeof d.check_out === "string"
            ? d.check_out.split("T")[0]
            : new Date(d.check_out).toISOString().split("T")[0];
        const bIn = formatDateForInput(booking.check_in);
        const bOut = formatDateForInput(booking.check_out);
        return !(dIn === bIn && dOut === bOut);
      }),
    [booking.check_in, booking.check_out, datesUnavailable],
  );

  const parseLocalDate = (dateVal: string | Date) => {
    const dateStr =
      dateVal instanceof Date
        ? dateVal.toISOString().split("T")[0]
        : String(dateVal).split("T")[0];
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const checkInDisabledRanges = useMemo(
    () =>
      filteredDatesUnavailable.map((r) => {
        const start = parseLocalDate(r.check_in);
        const end = parseLocalDate(r.check_out);
        end.setDate(end.getDate() - 1);
        return { start, end };
      }),
    [filteredDatesUnavailable],
  );

  const checkOutDisabledRanges = useMemo(
    () =>
      filteredDatesUnavailable.map((r) => {
        const start = parseLocalDate(r.check_in);
        const end = parseLocalDate(r.check_out);
        start.setDate(start.getDate() + 1);
        return { start, end };
      }),
    [filteredDatesUnavailable],
  );

  // Calculate deposit and balance for LIVE PREVIEW
  const currentDeposit =
    currency === 2
      ? parseFloat(booking.deposit_amount_usd || "0")
      : parseFloat(booking.deposit_amount_ars || "0");
  const finalDeposit = editedDeposit ?? currentDeposit;
  const finalBalance = totalPrice - finalDeposit;

  // Calculate informative USD equivalent when ARS
  const equivalentUSD =
    exchangeRate && currency === 1 ? totalPrice / exchangeRate : null;

  const handlePriceChange = (newPrice: number) => {
    setTotalPrice(newPrice);
  };

  const handleExchangeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const value = parseFloat(digits || "0");
    setExchangeRate(value || null);
  };

  return (
    <ReusableForm
      action={updateBooking}
      title={`Editar Reserva #${booking.id}`}
      submitText="Guardar cambios"
      submitinText="Guardando..."
      sections
      centered
      onSuccess={handleSuccess}
    >
      <input type="hidden" name="id" value={booking.id} />

      {/* ── Huésped ── */}
      <BookingFormSection
        icon={<User className="h-4 w-4" />}
        title="Huésped"
        cols={2}
        animationDelay={0}
      >
        <FormField
          type="text"
          name="tenant_name"
          label="Nombre completo"
          placeholder="Ej. Juan García"
          defaultValue={booking.guest_name}
          required
        />
        {booking.guest_phone && (
          <FormField
            type="phone"
            name="guest_phone"
            label="Teléfono"
            defaultValue={booking.guest_phone}
            defaultCountry="AR"
          />
        )}
      </BookingFormSection>

      {/* ── Estadía ── */}
      <BookingFormSection
        icon={<Calendar className="h-4 w-4" />}
        title="Estadía"
        cols={3}
        animationDelay={80}
      >
        <FormField
          type="date"
          name="check_in"
          label="Check in"
          defaultValue={formatDateForInput(booking.check_in)}
          disablePastDates={false}
          required
          disabledRanges={checkInDisabledRanges}
        />
        <FormField
          type="date"
          name="check_out"
          label="Check out"
          defaultValue={formatDateForInput(booking.check_out)}
          disablePastDates={false}
          required
          disabledRanges={checkOutDisabledRanges}
        />
        <FormField
          type="checkbox"
          name="noon"
          label="Medio día"
          defaultChecked={Boolean(booking.noon)}
        />
      </BookingFormSection>

      {/* ── Financiero ── */}
      <BookingFormSection
        icon={<Banknote className="h-4 w-4" />}
        title="Financiero"
        cols={3}
        animationDelay={160}
      >
        <FormField
          type="select"
          name="currency"
          label="Moneda"
          defaultValue={currency}
          options={[
            { value: "", label: "Seleccionar" },
            { value: 1, label: "ARS" },
            { value: 2, label: "USD" },
          ]}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setCurrency(Number(e.target.value))
          }
        />

        {/* Precio Total */}
        <div
          key={`price-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          {currency === 1 ? (
            <PriceInput
              name="booking_total_price_ars"
              label="Precio total ARS"
              currency="ARS"
              defaultValue={booking.total_price_ars}
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digits = e.target.value.replace(/\D/g, "");
                handlePriceChange(parseFloat(digits || "0"));
              }}
            />
          ) : (
            <PriceInput
              name="booking_total_price_usd"
              label="Precio total USD"
              currency="USD"
              defaultValue={booking.total_price_usd}
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digits = e.target.value.replace(/\D/g, "");
                handlePriceChange(parseFloat(digits || "0"));
              }}
            />
          )}
        </div>

        {/* Anticipo (personalizado o 30% por defecto) */}
        <div
          key={`deposit-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          {currency === 1 ? (
            <PriceInput
              name="deposit_amount_ars"
              label="Anticipo ARS"
              currency="ARS"
              defaultValue={booking.deposit_amount_ars}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digits = e.target.value.replace(/\D/g, "");
                handleCustomDepositChange(e);
              }}
            />
          ) : (
            <PriceInput
              name="deposit_amount_usd"
              label="Anticipo USD"
              currency="USD"
              defaultValue={booking.deposit_amount_usd}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digits = e.target.value.replace(/\D/g, "");
                handleCustomDepositChange(e);
              }}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Dejar vacío para usar 30% del total automáticamente
          </p>
        </div>

        {/* Saldo: Solo lectura, calculado automáticamente */}
        <div
          key={`balance-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          <div className="flex flex-col">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Saldo {currency === 1 ? "ARS" : "USD"}
            </label>
            <div className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground flex items-center opacity-60 cursor-not-allowed">
              {currency === 1
                ? `$${finalBalance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                : `USD ${finalBalance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Se calcula como: Total - Anticipo
            </p>
          </div>
        </div>

        {/* Tipo de Cambio: Solo informativo para ARS */}
        {currency === 1 && (
          <div
            key={`exchange-rate-${currency}`}
            className="animate-in fade-in-0 duration-200"
          >
            <PriceInput
              name="tipo_cambio_input"
              label="Tipo de cambio (informativo)"
              currency="TC"
              placeholder="Ej. 45.50"
              value={exchangeRate || ""}
              onChange={handleExchangeRateChange}
            />
            <input
              type="hidden"
              name="tipo_cambio"
              value={exchangeRate || ""}
            />
          </div>
        )}

        {/* USD Equivalence Display (informativo para ARS) */}
        {currency === 1 && equivalentUSD && (
          <div
            key={`usd-equiv-${currency}`}
            className="animate-in fade-in-0 duration-200 col-span-1"
          >
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Equivalencia USD
              </label>
              <div className="w-full h-10 rounded-lg border border-border bg-blue-50 px-3 py-2 text-sm text-foreground flex items-center">
                USD{" "}
                {equivalentUSD.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Referencia: Total ARS ÷ Tipo de cambio
              </p>
            </div>
          </div>
        )}
      </BookingFormSection>

      {/* ── Reserva ── */}
      <BookingFormSection
        icon={<Tag className="h-4 w-4" />}
        title="Reserva"
        cols={3}
        animationDelay={240}
      >
        <FormField
          type="select"
          name="channel_id"
          label="Canal"
          defaultValue={selectedChannel}
          options={[
            { value: "", label: "Seleccionar" },
            ...(CHANNELS.map((ch) => ({
              value: ch.id,
              label: ch.channel_name,
            })) ?? []),
          ]}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedChannel(Number(e.target.value))
          }
        />
        <FormField
          type="select"
          name="booking_state"
          label="Estado"
          defaultValue={booking.status}
          options={[
            { value: "", label: "Seleccionar" },
            { value: "Confirmada", label: "Confirmada" },
            { value: "Pendiente", label: "Pendiente" },
            { value: "Cancelada", label: "Cancelada" },
          ]}
          required
        />
        <FormField
          type="select"
          name="tenant_quantity"
          label="Personas"
          defaultValue={booking.guest_count.toString()}
          options={[
            { value: "", label: "Seleccionar" },
            ...Array.from({ length: 9 }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1),
            })),
          ]}
          required
        />
        <FormField
          type="select"
          name="booking_adv"
          label="Publicidad"
          defaultValue={booking.advertising_booking ? "true" : "false"}
          options={[
            { value: "", label: "Seleccionar" },
            { value: "true", label: "Sí" },
            { value: "false", label: "No" },
          ]}
          required
        />
      </BookingFormSection>

      {/* ── Notas ── */}
      <BookingFormSection
        icon={<MessageSquare className="h-4 w-4" />}
        title="Notas"
        cols={1}
        animationDelay={320}
      >
        <FormField
          type="textarea"
          name="observations"
          label="Observaciones"
          placeholder="Notas internas sobre la reserva..."
          defaultValue={booking.observations ?? ""}
          rows={3}
          maxLength={500}
        />
      </BookingFormSection>
    </ReusableForm>
  );
}

