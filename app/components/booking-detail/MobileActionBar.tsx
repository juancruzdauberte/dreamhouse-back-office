"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import WhatsAppDropdownButton from "../../components/widget/WhatsAppDropdownButton";

interface Props {
  bookingId: number;
  guestPhone?: string | null;
}

export default function MobileActionBar({ bookingId, guestPhone }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 bg-white/95 backdrop-blur border-t border-border
                 px-4 pt-3 flex gap-3
                 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
    >
      <Link
        href={`/bookings/${bookingId}/edit`}
        className="flex-1 inline-flex items-center justify-center gap-2
                    bg-blue-600 text-white text-sm font-medium
                   rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Pencil className="w-4 h-4" aria-hidden="true" />
        Editar
      </Link>

      {guestPhone && (
        <div
          className="flex-1 inline-flex items-center justify-center gap-2
                      bg-[#25D366] text-white text-sm font-medium
                     rounded-xl hover:bg-[#20ba5a] transition-colors"
        >
          <WhatsAppDropdownButton phone={guestPhone} bookingId={bookingId} />
        </div>
      )}
    </div>
  );
}
