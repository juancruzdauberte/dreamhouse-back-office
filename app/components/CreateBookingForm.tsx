import { DIContainer } from "../core/DiContainer";
import { CreateBookingFormClient } from "./CreateBookingFormClient";

export default async function CreateBookingForm() {
  const datesUnavailable =
    await DIContainer.getBookingRepository().getBookingsDate();
  const properties = await DIContainer.getPropertyRepository().getProperties();

  return (
    <CreateBookingFormClient
      datesUnavailable={datesUnavailable}
      properties={properties}
    />
  );
}
