"use client";

import { BookingDTO } from "../lib/repository/booking/booking.dto";
import { X, Calendar, Users, DollarSign, Eye } from "lucide-react";
import Link from "next/link";
import { toTitleCase } from "../utils/utils";

interface DayReservationsModalProps {
  date: Date | null;
  bookings: BookingDTO[];
  isOpen: boolean;
  onClose: () => void;
}

export default function DayReservationsModal({
  date,
  bookings,
  isOpen,
  onClose,
}: DayReservationsModalProps) {
  if (!isOpen || !date || bookings.length === 0) return null;

  const formattedDate = date.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmada":
        return "bg-green-50 border-green-200";
      case "Pendiente":
        return "bg-yellow-50 border-yellow-200";
      case "Cancelada":
        return "bg-red-50 border-red-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Confirmada":
        return "bg-green-100 text-green-800";
      case "Pendiente":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getPriceDisplay = (booking: BookingDTO) => {
    if (parseFloat(booking.total_price_usd || "0") > 0) {
      return `U$S ${parseFloat(booking.total_price_usd!).toLocaleString("es-AR")}`;
    }
    return `$ ${parseFloat(String(booking.total_price_ars || 0)).toLocaleString("es-AR")}`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - Full screen en mobile, centrado en desktop */}
      <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 z-50 md:-translate-y-1/2 md:-translate-x-1/2 md:w-[90vw] md:max-w-2xl flex items-end md:items-center justify-center p-4 md:p-0">
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden w-full max-h-[95vh] md:max-h-[85vh] flex flex-col">
          {/* Header - Sticky */}
          <div className="bg-linear-to-r from-amber-800 to-amber-700 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between sticky top-0 z-10">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white capitalize line-clamp-1">
                {formattedDate}
              </h2>
              <p className="text-blue-100 text-xs md:text-sm mt-0.5 md:mt-1">
                {bookings.length}{" "}
                {bookings.length === 1 ? "reserva" : "reservas"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 p-2 ml-2 cursor-pointer text-white hover:bg-amber-500/30 rounded-lg transition-colors"
            >
              <X className="w-5 md:w-6 h-5 md:h-6" />
            </button>
          </div>

          {/* Content - Scrolleable */}
          <div className="overflow-y-auto flex-1">
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`rounded-lg md:rounded-xl border-2 p-3 md:p-5 transition-all hover:shadow-md ${getStatusColor(booking.status)}`}
                >
                  {/* Top row: Guest name and status */}
                  <div className="flex items-start justify-between gap-2 mb-3 md:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-bold text-slate-800 truncate">
                        {toTitleCase(booking.guest_name)}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-600 mt-0.5 md:mt-1 truncate">
                        {booking.property_name}
                      </p>
                    </div>
                    <span
                      className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${getStatusBadgeColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Details grid - 2 columns */}
                  <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 md:w-4 h-3 md:h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-600">Estadía</p>
                        <p className="font-semibold text-slate-800">
                          {booking.nights_stay}n
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 md:w-4 h-3 md:h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-slate-600">Huéspedes</p>
                        <p className="font-semibold text-slate-800">
                          {booking.guest_count}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price and action */}
                  <div className="border-t border-current/10 pt-3 md:pt-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-2 mb-3 md:mb-0">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 md:w-4 h-3 md:h-4 text-slate-500 shrink-0" />
                        <div>
                          <p className="text-slate-600 text-xs">Total</p>
                          <p className="font-bold text-slate-800 text-sm md:text-base">
                            {getPriceDisplay(booking)}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/bookings/${booking.id}/edit`}
                        className="inline-flex items-center gap-1 md:gap-2 px-3 py-2 bg-amber-600 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors active:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 w-full md:w-auto justify-center"
                      >
                        <Eye className="w-3 md:w-4 h-3 md:h-4" />
                        <span>Ver detalles</span>
                      </Link>
                    </div>
                  </div>

                  {/* Check-in/out dates */}
                  <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-current/10 text-xs text-slate-600 space-y-0.5 md:space-y-1">
                    <p className="line-clamp-1">
                      <span className="font-semibold">Check-in:</span>{" "}
                      {new Date(booking.check_in).toLocaleDateString("es-AR", {
                        timeZone: "UTC",
                      })}
                    </p>
                    <p className="line-clamp-1">
                      <span className="font-semibold">Check-out:</span>{" "}
                      {new Date(booking.check_out).toLocaleDateString("es-AR", {
                        timeZone: "UTC",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 md:px-6 py-3 md:py-4 flex justify-end sticky bottom-0 z-10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm md:text-base text-slate-700 font-medium cursor-pointer hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
