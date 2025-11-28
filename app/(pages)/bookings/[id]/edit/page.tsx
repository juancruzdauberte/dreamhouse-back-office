import UpdateBookingForm from "../../../../components/UpdateBookingForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookingEditPage({ params }: Props) {
  const { id } = await params;

  return <UpdateBookingForm bookingId={Number(id)} />;
}
