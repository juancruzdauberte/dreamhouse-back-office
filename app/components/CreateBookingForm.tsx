import { DIContainer } from "../core/DiContainer";
import { CreateBookingFormClient } from "./CreateBookingFormClient";

export default async function CreateBookingForm() {
  const channels = await DIContainer.getBookingRepository().getChannels();
  const datesUnavailable =
    await DIContainer.getBookingRepository().getBookingsDate();

  return (
    <CreateBookingFormClient
      channels={channels}
      datesUnavailable={datesUnavailable}
    />
  );
}
