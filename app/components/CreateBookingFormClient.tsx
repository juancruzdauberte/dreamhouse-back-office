"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "../lib/actions/booking.actions";
import { FormField } from "./FormField";
import { ReusableForm } from "./ReusableForm";
import { useBookingStore } from "../store/bookings.store";

type BookingFormClientProps = {
  channels: Array<{ id: number; channel_name: string }>;
  datesUnavailable: Array<{ check_in: string; check_out: string }>;
};

export function CreateBookingFormClient({
  channels,
  datesUnavailable,
}: BookingFormClientProps) {
  const router = useRouter();
  const {
    setChannels,
    setDatesUnavailable,
    setSelectedChannel,
    selectedChannel,
  } = useBookingStore();

  const [currency, setCurrency] = useState<number | null>(null);

  useEffect(() => {
    setChannels(channels);
    setDatesUnavailable(datesUnavailable);
  }, [channels, datesUnavailable, setChannels, setDatesUnavailable]);

  const handleSuccess = () => {
    setSelectedChannel(0);
    router.push("/");
  };

  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <ReusableForm
      action={createBooking}
      title="Crear Rerserva"
      submitText="Crear"
      submitinText="Creando"
      gridCols={2}
      centered
      onSuccess={handleSuccess}
    >
      <FormField
        type="text"
        name="tenant_name"
        label="Nombre"
        placeholder="Juan"
        required
      />

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

      <FormField
        type="date"
        name="check_in"
        label="Check in"
        disablePastDates={true}
        required
        disabledRanges={datesUnavailable.map((d) => {
          const start = parseLocalDate(d.check_in);
          const end = parseLocalDate(d.check_out);
          end.setDate(end.getDate() - 1);
          return {
            start: start,
            end: end,
          };
        })}
      />

      <FormField
        type="date"
        name="check_out"
        label="Check out"
        disablePastDates={true}
        required
        disabledRanges={datesUnavailable.map((d) => {
          const start = parseLocalDate(d.check_in);
          const end = parseLocalDate(d.check_out);
          end.setDate(end.getDate() - 1);
          return {
            start: start,
            end: end,
          };
        })}
      />

      <FormField
        type="select"
        name="channel_id"
        label="Canal"
        options={[
          { value: "", label: "Seleccionar" },
          ...(channels?.map((ch) => ({
            value: ch.id,
            label: ch.channel_name,
          })) || []),
        ]}
        required
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setSelectedChannel(Number(e.target.value))
        }
      />

      {selectedChannel === 1 && (
        <FormField
          type="text"
          name="comission"
          label="Comisión USD"
          placeholder="0.00"
        />
      )}

      <FormField
        type="select"
        name="tenant_quantity"
        label="Cantidad personas"
        options={[
          { value: "", label: "Seleccionar" },
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
          { value: "5", label: "5" },
          { value: "6", label: "6" },
          { value: "7", label: "7" },
          { value: "8", label: "8" },
          { value: "9", label: "9" },
        ]}
        required
      />
      <FormField
        type="select"
        name="booking_adv"
        label="Publicidad"
        options={[
          { value: "", label: "Seleccionar" },
          { value: "true", label: "Si" },
          { value: "false", label: "No" },
        ]}
        required
      />

      <FormField
        type="phone"
        name="guest_phone"
        label="Telefono"
        placeholder="3329305210"
        defaultCountry="AR"
      />

      <FormField type="checkbox" name="noon" label="Medio Día" />
    </ReusableForm>
  );
}
