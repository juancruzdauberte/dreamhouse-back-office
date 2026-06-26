import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UpdateBookingForm from "../../../../components/UpdateBookingForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BookingEditPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,oklch(0.98_0.02_70),transparent_55%),radial-gradient(circle_at_top_right,oklch(0.97_0.02_240),transparent_45%),oklch(0.995_0.003_80)] p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/bookings/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la reserva
        </Link>
        <UpdateBookingForm bookingId={Number(id)} />
      </div>
    </div>
  );
}
