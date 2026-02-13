"use client";

import { FileDown, Eye, FileInput } from "lucide-react";
import Link from "next/link";

interface Props {
  bookingId: number;
  text?: string;
  littleIcon?: boolean;
}

export default function ViewPDFBookingButton({
  bookingId,
  text,
  littleIcon,
}: Props) {
  return (
    <>
      <Link
        href={`/api/booking?id=${bookingId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 transition-colors rounded-lg font-medium ${
          littleIcon
            ? "w-8 h-8 bg-rose-100 text-rose-600 hover:bg-rose-200"
            : "w-full px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
        }`}
        title="Ver PDF"
      >
        <FileInput className={littleIcon ? "w-4 h-4" : "w-5 h-5"} />
        {text}
      </Link>
    </>
  );
}
