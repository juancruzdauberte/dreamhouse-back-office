import { DIContainer } from "../core/DiContainer";
import { BookingFormClient } from "./BookingFormClient";

export default async function CreateBookingForm() {
  const channels = await DIContainer.getBookingRepository().getChannels();
  const datesUnavailable =
    await DIContainer.getBookingRepository().getBookingsDate();

  return (
    <BookingFormClient
      channels={channels}
      datesUnavailable={datesUnavailable}
    />
  );
}
