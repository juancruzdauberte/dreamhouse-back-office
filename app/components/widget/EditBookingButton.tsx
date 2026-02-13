import { Pencil } from "lucide-react";
import Link from "next/link";

type Props = {
  bookingId: number;
  text?: string;
  littleIcon?: boolean;
};
export default function EditBookingButton({
  bookingId,
  text,
  littleIcon,
}: Props) {
  return (
    <Link
      href={`/bookings/${bookingId}/edit`}
      className={`inline-flex items-center justify-center gap-2 transition-colors rounded-lg font-medium ${
        littleIcon
          ? "w-8 h-8 bg-amber-100 text-amber-600 hover:bg-amber-200"
          : "w-full px-4 py-2.5 bg-blue-600 text-white text-sm hover:bg-blue-700"
      }`}
    >
      <Pencil className={littleIcon ? "w-4 h-4" : "w-5 h-5"} />
      {text}
    </Link>
  );
}
