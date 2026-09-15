import { DIContainer } from "../core/DiContainer";
import { CreateBookingFormClient } from "./CreateBookingFormClient";

export default async function CreateBookingForm() {
  const bookingRepository = DIContainer.getBookingRepository();
  const datesUnavailable = await bookingRepository.getBookingsDate();

  return <CreateBookingFormClient datesUnavailable={datesUnavailable} />;
}
