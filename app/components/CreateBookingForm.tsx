import { DIContainer } from "../core/DiContainer";
import { CreateBookingFormClient } from "./CreateBookingFormClient";

export default async function CreateBookingForm() {
  const bookingRepository = DIContainer.getBookingRepository();
  const [channels, datesUnavailable] = await Promise.all([
    bookingRepository.getChannels(),
    bookingRepository.getBookingsDate(),
  ]);

  return (
    <CreateBookingFormClient
      channels={channels}
      datesUnavailable={datesUnavailable}
    />
  );
}
