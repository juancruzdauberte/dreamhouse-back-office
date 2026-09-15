import { DIContainer } from "../core/DiContainer";
import UpdateBookingFormClient from "./UpdateBookingFormClient";
import { notFound } from "next/navigation";

type UpdateBookingFormProps = {
  bookingId: number;
};

export default async function UpdateBookingForm({
  bookingId,
}: UpdateBookingFormProps) {
  const bookingRepository = DIContainer.getBookingRepository();
  const [datesUnavailable, booking] = await Promise.all([
    bookingRepository.getBookingsDate(),
    bookingRepository.getBooking(bookingId),
  ]);

  if (!booking) {
    notFound();
  }
  return (
    <UpdateBookingFormClient
      datesUnavailable={datesUnavailable}
      booking={booking}
    />
  );
}
