"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Calendar, MessageSquare, Tag, User } from "lucide-react";
import { createBooking } from "../lib/actions/booking.actions";
import { FormField } from "./FormField";
import { ReusableForm } from "./ReusableForm";
import { BookingFormSection } from "./BookingFormSection";

type BookingFormClientProps = {
  channels: Array<{ id: number; channel_name: string }>;
  datesUnavailable: Array<{
    check_in: string | Date;
    check_out: string | Date;
  }>;
};

export function CreateBookingFormClient({
  channels,
  datesUnavailable,
}: BookingFormClientProps) {
  const router = useRouter();

  const [currency, setCurrency] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);

  const handleSuccess = () => {
    setSelectedChannel(0);
    setCurrency(null);
    router.refresh();
    router.push("/");
  };

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
      datesUnavailable.map((r) => {
        const start = parseLocalDate(r.check_in);
        const end = parseLocalDate(r.check_out);
        end.setDate(end.getDate() - 1);
        return { start, end };
      }),
    [datesUnavailable],
  );

  const checkOutDisabledRanges = useMemo(
    () =>
      datesUnavailable.map((r) => {
        const start = parseLocalDate(r.check_in);
        const end = parseLocalDate(r.check_out);
        start.setDate(start.getDate() + 1);
        return { start, end };
      }),
    [datesUnavailable],
  );

  return (
    <ReusableForm
      action={createBooking}
      title="Nueva Reserva"
      submitText="Crear Reserva"
      submitinText="Creando..."
      sections
      centered
      onSuccess={handleSuccess}
    >
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
          required
        />
        <FormField
          type="phone"
          name="guest_phone"
          label="Teléfono"
          placeholder="3329305210"
          defaultCountry="AR"
        />
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
          disablePastDates
          required
          disabledRanges={checkInDisabledRanges}
        />
        <FormField
          type="date"
          name="check_out"
          label="Check out"
          disablePastDates
          required
          disabledRanges={checkOutDisabledRanges}
        />
        <FormField type="checkbox" name="noon" label="Medio día" />
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

        <div
          key={`price-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          {currency === 1 ? (
            <FormField
              type="text"
              name="booking_total_price_ars"
              label="Precio total ARS"
              required
            />
          ) : (
            <FormField
              type="text"
              name="booking_total_price_usd"
              label="Precio total USD"
              required
            />
          )}
        </div>

        <div
          key={`prepay-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          {currency === 1 ? (
            <FormField
              type="text"
              name="prepayment_ars"
              label="Anticipo ARS"
            />
          ) : (
            <FormField
              type="text"
              name="prepayment_usd"
              label="Anticipo USD"
            />
          )}
        </div>

        {selectedChannel === 1 && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
            <FormField
              type="text"
              name="comission"
              label="Comisión USD"
              placeholder="0.00"
            />
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
          options={[
            { value: "", label: "Seleccionar" },
            ...(channels?.map((ch) => ({ value: ch.id, label: ch.channel_name })) ?? []),
          ]}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedChannel(Number(e.target.value))
          }
        />
        <FormField
          type="select"
          name="tenant_quantity"
          label="Cantidad de personas"
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
          placeholder="Notas internas sobre la reserva, preferencias del huésped, etc."
          rows={3}
          maxLength={500}
        />
      </BookingFormSection>
    </ReusableForm>
  );
}
