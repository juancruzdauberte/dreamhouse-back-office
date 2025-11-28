import { DIContainer } from "../core/DiContainer";
import UpdateBookingFormClient from "./UpdateBookingFormClient";
import { notFound } from "next/navigation";

type UpdateBookingFormProps = {
  bookingId: number;
};

export default async function UpdateBookingForm({
  bookingId,
}: UpdateBookingFormProps) {
  const channels = await DIContainer.getBookingRepository().getChannels();
  const datesUnavailable =
    await DIContainer.getBookingRepository().getBookingsDate();
  const booking = await DIContainer.getBookingRepository().getBooking(
    bookingId
  );

  if (!booking) {
    notFound();
  }

  return (
    <UpdateBookingFormClient
      channels={channels}
      datesUnavailable={datesUnavailable}
      booking={booking}
    />
  );
}
