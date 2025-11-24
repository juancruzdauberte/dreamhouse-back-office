import { createBooking } from "../lib/actions/booking.actions";
import { FormField } from "./FormField";
import { ReusableForm } from "./ReusableForm";
import { DIContainer } from "../core/DiContainer";

export default async function CreateBookingForm() {
  const channels = await DIContainer.getBookingRepository().getChannels();
  const datesUnavailable =
    await DIContainer.getBookingRepository().getBookingsDate();
  return (
    <ReusableForm
      action={createBooking}
      title="Crear Rerserva"
      submitText="Crear Reserva"
      gridCols={2}
      centered
    >
      <FormField
        type="text"
        name="tenant_name"
        label="Nombre"
        placeholder="Juan"
        required
      />

      <FormField
        type="text"
        name="booking_total_price_usd"
        label="Precio total USD"
        required
      />

      <FormField
        type="date"
        name="check_in"
        label="Check in"
        disablePastDates={true}
        required
        disabledRanges={datesUnavailable.map((d) => {
          const end = new Date(d.check_out);
          end.setDate(end.getDate() - 1);
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
        disablePastDates={true}
        required
        disabledRanges={datesUnavailable.map((d) => {
          const end = new Date(d.check_out);
          end.setDate(end.getDate() - 1);
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
        options={[
          { value: "", label: "Seleccionar" },
          ...(channels?.map((ch) => ({
            value: ch.id,
            label: ch.channel_name,
          })) || []),
        ]}
        required
      />
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
    </ReusableForm>
  );
}
