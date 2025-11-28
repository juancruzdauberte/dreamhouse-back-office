"use client";
import { useBookingStore } from "../store/bookings.store";
import { useEffect } from "react";
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
  const {
    setChannels,
    setDatesUnavailable,
    setSelectedChannel,
    selectedChannel,
  } = useBookingStore();

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
  };

  const formatDateForInput = (dateString: string | Date) => {
    if (typeof dateString === "string") {
      const [year, month, day] = dateString.split("T")[0].split("-");
      return `${year}-${month}-${day}`;
    } else {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  };

  // Add one day to a date
  const addOneDay = (dateString: string | Date): string => {
    const date =
      typeof dateString === "string"
        ? new Date(dateString + "T00:00:00") // Parse as local time
        : new Date(dateString);
    date.setDate(date.getDate() + 1);
    return formatDateForInput(date);
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
        type="text"
        name="booking_total_price_usd"
        label="Precio total USD"
        defaultValue={booking.total_price_usd}
        required
      />

      <FormField
        type="date"
        name="check_in"
        label="Check in"
        defaultValue={formatDateForInput(addOneDay(booking.check_in))}
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
        defaultValue={formatDateForInput(addOneDay(booking.check_out))}
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
    </ReusableForm>
  );
}
