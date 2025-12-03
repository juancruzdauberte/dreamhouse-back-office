"use client";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../store/bookings.store";
import { useEffect, useState } from "react";
import { FormField } from "./FormField";
import { ReusableForm } from "./ReusableForm";
import { updateBooking } from "../lib/actions/booking.actions";
import { BookingDTO } from "../lib/repository/booking/booking.dto";

type BookingFormClientProps = {
  channels: Array<{ id: number; channel_name: string }>;
  datesUnavailable: Array<{ check_in: string; check_out: string }>;
  booking: BookingDTO;
};

export default function UpdateBookingFormClient({
  channels,
  datesUnavailable,
  booking,
}: BookingFormClientProps) {
  const router = useRouter();
  const {
    setChannels,
    setDatesUnavailable,
    setSelectedChannel,
    selectedChannel,
  } = useBookingStore();

  const [currency, setCurrency] = useState<number>(
    booking.total_price_usd ? 2 : 1
  );

  // Get channel ID from channel_name
  const bookingChannelId =
    channels.find((ch) => ch.channel_name === booking.channel_name)?.id || 0;

  useEffect(() => {
    setChannels(channels);
    setDatesUnavailable(datesUnavailable);
    setSelectedChannel(bookingChannelId);
  }, [
    channels,
    datesUnavailable,
    bookingChannelId,
    setChannels,
    setDatesUnavailable,
    setSelectedChannel,
  ]);

  const handleSuccess = () => {
    setSelectedChannel(0);
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

  const filteredDatesUnavailable = datesUnavailable.filter((d) => {
    const dCheckIn =
      typeof d.check_in === "string"
        ? d.check_in.split("T")[0]
        : new Date(d.check_in).toISOString().split("T")[0];
    const dCheckOut =
      typeof d.check_out === "string"
        ? d.check_out.split("T")[0]
        : new Date(d.check_out).toISOString().split("T")[0];
    const bookingCheckIn = formatDateForInput(booking.check_in);
    const bookingCheckOut = formatDateForInput(booking.check_out);

    return !(dCheckIn === bookingCheckIn && dCheckOut === bookingCheckOut);
  });

  return (
    <ReusableForm
      action={updateBooking}
      title={`Actualizar Reserva #${booking.id}`}
      submitText="Actualizar"
      submitinText="Actualizando"
      gridCols={2}
      centered
      onSuccess={handleSuccess}
    >
      {/* Hidden field for booking ID */}
      <input type="hidden" name="id" value={booking.id} />

      <FormField
        type="text"
        name="tenant_name"
        label="Nombre"
        placeholder="Juan"
        defaultValue={booking.guest_name}
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
        defaultValue={currency}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          setCurrency(Number(e.target.value))
        }
      />

      {currency === 1 ? (
        <FormField
          type="text"
          name="booking_total_price_ars"
          label="Precio total ARS"
          defaultValue={booking.total_price_ars || ""}
          required
        />
      ) : (
        <FormField
          type="text"
          name="booking_total_price_usd"
          label="Precio total USD"
          defaultValue={booking.total_price_usd || ""}
          required
        />
      )}

      <FormField
        type="date"
        name="check_in"
        label="Check in"
        defaultValue={formatDateForInput(booking.check_in)}
        disablePastDates={false}
        required
        disabledRanges={filteredDatesUnavailable.map((d) => {
          const end = new Date(d.check_out);
          end.setDate(end.getDate());
          return {
            start: d.check_in,
            end: end,
          };
        })}
      />

      <FormField
        type="date"
        name="check_out"
        label="Check out"
        defaultValue={formatDateForInput(booking.check_out)}
        disablePastDates={false}
        required
        disabledRanges={filteredDatesUnavailable.map((d) => {
          const end = new Date(d.check_out);
          end.setDate(end.getDate());
          return {
            start: d.check_in,
            end: end,
          };
        })}
      />

      <FormField
        type="select"
        name="channel_id"
        label="Canal"
        defaultValue={bookingChannelId}
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
          defaultValue={booking.channel_commission_usd}
        />
      )}

      <FormField
        type="select"
        name="tenant_quantity"
        label="Cantidad personas"
        defaultValue={booking.guest_count.toString()}
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
        defaultValue={booking.advertising_booking ? "true" : "false"}
        options={[
          { value: "", label: "Seleccionar" },
          { value: "true", label: "Si" },
          { value: "false", label: "No" },
        ]}
        required
      />

      <FormField
        type="select"
        name="booking_state"
        label="Estado de la Reserva"
        defaultValue={booking.status}
        options={[
          { value: "", label: "Seleccionar" },
          { value: "Confirmada", label: "Confirmada" },
          { value: "Pendiente", label: "Pendiente" },
          { value: "Cancelada", label: "Cancelada" },
        ]}
        required
      />

      {currency === 1 ? (
        <>
          <FormField
            type="text"
            name="prepayment_ars"
            label="Pago anticipado ARS"
            placeholder="0.00"
            defaultValue={booking.deposit_payment_ars || ""}
          />

          <FormField
            type="text"
            name="balancepayment_ars"
            label="Pago saldo ARS"
            placeholder="0.00"
            defaultValue={booking.balance_payment_ars || ""}
          />
        </>
      ) : (
        <>
          <FormField
            type="text"
            name="prepayment_usd"
            label="Pago anticipado USD"
            placeholder="0.00"
            defaultValue={booking.deposit_amount_usd || ""}
          />

          <FormField
            type="text"
            name="balancepayment_usd"
            label="Pago saldo USD"
            placeholder="0.00"
            defaultValue={booking.balance_amount_usd || ""}
          />
        </>
      )}
      {booking.guest_phone && (
        <FormField
          type="phone"
          name="guest_phone"
          label="Telefono"
          defaultValue={booking.guest_phone || ""}
          defaultCountry="AR"
        />
      )}

      <FormField
        type="checkbox"
        name="noon"
        label="Medio Día"
        defaultChecked={Boolean(booking.noon)}
      />
    </ReusableForm>
  );
}
