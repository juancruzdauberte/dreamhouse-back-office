"use client";

import { FileDown, Eye } from "lucide-react";

interface Props {
  bookingId: number;
}

export default function PrintPDFBookingDetail({ bookingId }: Props) {
  return (
    <>
      <a
        href={`/api/booking?id=${bookingId}&preview=true`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Eye className="w-4 h-4" />
        Vista Previa
      </a>
    </>
  );
}
