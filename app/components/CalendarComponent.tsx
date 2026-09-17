"use client";

import React, { useMemo, useState, useEffect, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DatesSetArg,
  EventApi,
  EventClickArg,
  EventHoveringArg,
  EventInput,
  DateClickArg,
} from "@fullcalendar/core";
import { BookingDTO } from "../lib/repository/booking/booking.dto";
import Spinner from "./widget/Spinner";
import { toTitleCase } from "../utils/utils";
import DayReservationsModal from "./DayReservationsModal";

interface CalendarComponentProps {
  bookings: BookingDTO[];
  initialDate?: string;
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({
  bookings,
  initialDate,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [hoveredEvent, setHoveredEvent] = useState<EventApi | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [calView, setCalView] = useState<"dayGridMonth" | "dayGridWeek">(
    "dayGridMonth",
  );
  const [mobileEvent, setMobileEvent] = useState<EventApi | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayReservations, setDayReservations] = useState<BookingDTO[]>([]);

  useEffect(() => {
    setCalView(window.innerWidth < 768 ? "dayGridWeek" : "dayGridMonth");
  }, []);

  // Group bookings by date for the day modal
  const groupBookingsByDate = (date: Date): BookingDTO[] => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.filter((booking) => {
      const checkInStr = String(booking.check_in).split("T")[0];
      const checkOutStr = String(booking.check_out).split("T")[0];
      // Include bookings that overlap with this date
      return checkInStr <= dateStr && dateStr < checkOutStr;
    });
  };

  const events = useMemo<EventInput[]>(() => {
    return bookings.map((booking) => {
      let backgroundColor = "#3788d8";
      let borderColor = "#3788d8";
      let textColor = "#ffffff";

      if (booking.status === "Confirmada") {
        backgroundColor = "#008009";
        borderColor = "#008009";
      } else if (booking.status === "Pendiente") {
        backgroundColor = "#febb02";
        borderColor = "#febb02";
        textColor = "#333333";
      } else if (booking.status === "Cancelada") {
        backgroundColor = "#d9534f";
        borderColor = "#d9534f";
      }

      const normalizeDate = (d: string | Date | unknown): string => {
        if (!d) return "";
        if (d instanceof Date) return d.toISOString().split("T")[0];
        return String(d).split("T")[0];
      };

      const checkInStr = normalizeDate(booking.check_in);
      const checkOutStr = normalizeDate(booking.check_out);

      const [year, month, day] = checkOutStr.split("-").map(Number);
      const checkOutDate = new Date(Date.UTC(year, month - 1, day));
      checkOutDate.setUTCDate(checkOutDate.getUTCDate() + 1);
      const endStr = checkOutDate.toISOString().split("T")[0];

      const guestName = toTitleCase(booking.guest_name);

      return {
        id: String(booking.id),
        title: `${guestName} (${booking.property_name})`,
        start: checkInStr,
        end: endStr,
        allDay: true,
        backgroundColor,
        borderColor,
        textColor,
        extendedProps: {
          status: booking.status,
          total_price:
            parseFloat(booking.total_price_usd || "0") > 0
              ? `U$S ${parseFloat(booking.total_price_usd!).toLocaleString("es-AR")}`
              : `$ ${parseFloat(String(booking.total_price_ars || 0)).toLocaleString("es-AR")}`,
          guest_name: guestName,
          property_name: booking.property_name || "Propiedad desconocida",
          guest_count: booking.guest_count,
          nights_stay: booking.nights_stay,
          check_in: booking.check_in,
          check_out: booking.check_out,
        },
      };
    });
  }, [bookings]);

  const handleEventMouseEnter = (info: EventHoveringArg) => {
    const rect = info.el.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setHoveredEvent(info.event);
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
    setTooltipPosition(null);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (window.innerWidth < 768) {
      setMobileEvent(clickInfo.event);
    } else {
      router.push(`/bookings/${clickInfo.event.id}`);
    }
  };

  const handleDateClick = (selectInfo: DateClickArg) => {
    const date = selectInfo.date;
    const reservations = groupBookingsByDate(date);
    
    if (reservations.length > 0) {
      setSelectedDate(date);
      setDayReservations(reservations);
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const newStart = arg.startStr.split("T")[0];
    const newEnd = arg.endStr.split("T")[0];

    const currentStart = searchParams.get("startDate");
    const currentEnd = searchParams.get("endDate");

    if (newStart !== currentStart || newEnd !== currentEnd) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("startDate", newStart);
      params.set("endDate", newEnd);
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8 relative">
      {hoveredEvent && tooltipPosition && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 p-4 w-64 pointer-events-none transition-opacity duration-200"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-slate-800 text-sm">
              {hoveredEvent.extendedProps.guest_name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                hoveredEvent.extendedProps.status === "Confirmada"
                  ? "bg-green-100 text-green-800"
                  : hoveredEvent.extendedProps.status === "Pendiente"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {hoveredEvent.extendedProps.status}
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Propiedad:</span>
              <span className="font-medium">
                {hoveredEvent.extendedProps.property_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Huéspedes:</span>
              <span className="font-medium">
                {hoveredEvent.extendedProps.guest_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Noches:</span>
              <span className="font-medium">
                {hoveredEvent.extendedProps.nights_stay}
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-slate-800 font-semibold">
              <span>Total:</span>
              <span>{hoveredEvent.extendedProps.total_price}</span>
            </div>
          </div>
          <div className="absolute left-1/2 bottom-0 w-3 h-3 bg-white border-r border-b border-slate-200 transform translate-x-[-50%] translate-y-1/2 rotate-45"></div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800 mb-4">
        Calendario de Reservas
      </h2>
      <style jsx global>{`
        .fc {
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
            Arial, sans-serif;
          font-size: 0.85rem; /* Reduced base font size */
        }
        .fc-toolbar-title {
          font-size: 1.1rem !important;
          font-weight: 700;
          color: #333;
        }
        .fc-button-primary {
          background-color: #0071c2 !important;
          border-color: #0071c2 !important;
          font-weight: 600;
          text-transform: capitalize;
          border-radius: 4px !important;
          padding: 4px 10px !important; /* Smaller buttons */
          font-size: 0.85rem !important;
        }
        /* Spacing for navigation buttons */
        .fc-button-group > .fc-button {
          margin-right: 8px !important;
          border-radius: 4px !important; /* Ensure buttons are rounded individually */
        }
        .fc-button-group > .fc-button:last-child {
          margin-right: 0 !important;
        }
        .fc-button-primary:hover {
          background-color: #005999 !important;
          border-color: #005999 !important;
        }
        .fc-button-primary:focus-visible {
          outline: 2px solid #005999 !important;
          outline-offset: 2px;
        }
        .fc-button-primary:disabled {
          background-color: #a3d7fc !important;
          border-color: #a3d7fc !important;
        }
        .fc-daygrid-day-number {
          color: #333;
          font-weight: 500;
          text-decoration: none !important;
          padding: 4px 8px !important;
          font-size: 0.9rem;
        }
        .fc-col-header-cell-cushion {
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.7rem;
          padding: 8px 0 !important;
          text-decoration: none !important;
        }
        .fc-event {
          border-radius: 3px;
          padding: 1px 3px;
          cursor: pointer;
          font-size: 0.75rem; /* Smaller event text */
          font-weight: 500;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
          transition: transform 0.1s ease;
          margin-bottom: 2px !important;
        }
        .fc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        /* Cursor pointer en días con eventos */
        .fc-daygrid-day {
          cursor: pointer;
        }
        .fc-daygrid-day:hover .fc-daygrid-day-frame {
          background-color: rgba(7, 89, 133, 0.05);
          border-radius: 4px;
        }
        .fc-day-today {
          background-color: #f3f9ff !important;
        }
        .fc-day-today .fc-daygrid-day-frame {
          position: relative;
        }
        .fc-day-today .fc-daygrid-day-frame::before {
          content: "HOY";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2.5rem;
          color: rgba(0, 113, 194, 0.15);
          font-weight: 800;
          pointer-events: none;
          z-index: 0;
          letter-spacing: 0.1em;
        }
        .fc-daygrid-event-dot {
          border-width: 3px;
        }
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .fc-toolbar {
            flex-direction: column;
            gap: 10px;
          }
          .fc-toolbar-title {
            font-size: 1rem !important;
          }
          .fc-header-toolbar {
            margin-bottom: 1rem !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fc-event,
          .fc * {
            transition: none !important;
            animation: none !important;
          }
          .fc-event:hover {
            transform: none;
          }
        }
      `}</style>
      <div className="calendar-container relative">
        {isPending && (
          <div
            className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-lg transition-opacity duration-300"
            aria-live="polite"
          >
            <span className="sr-only">Cargando reservas…</span>
            <Spinner size={50} text="Cargando reservas…" />
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView={calView}
          initialDate={initialDate}
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          dateClick={handleDateClick}
          
          locale={esLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          height="auto"
          contentHeight="auto"
          aspectRatio={1.8}
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayMaxEvents={2}
          displayEventTime={false}
        />
      </div>

      {/* Day Reservations Modal */}
      <DayReservationsModal
        date={selectedDate}
        bookings={dayReservations}
        isOpen={dayReservations.length > 0}
        onClose={() => {
          setSelectedDate(null);
          setDayReservations([]);
        }}
      />

      {/* Mobile event tap modal */}
      {mobileEvent && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            onClick={() => setMobileEvent(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-4 bottom-6 z-50 bg-white rounded-2xl shadow-2xl p-5 md:hidden">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                {mobileEvent.extendedProps.guest_name}
              </h3>
              <button
                onClick={() => setMobileEvent(null)}
                aria-label="Cerrar"
                className="ml-3 shrink-0 text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mb-3">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  mobileEvent.extendedProps.status === "Confirmada"
                    ? "bg-green-100 text-green-800"
                    : mobileEvent.extendedProps.status === "Pendiente"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {mobileEvent.extendedProps.status}
              </span>
            </div>
            <div className="space-y-1.5 text-sm text-slate-600 mb-4">
              <div className="flex justify-between">
                <span>Canal:</span>
                <span className="font-medium">
                  {mobileEvent.extendedProps.channel_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Huéspedes:</span>
                <span className="font-medium">
                  {mobileEvent.extendedProps.guest_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Noches:</span>
                <span className="font-medium">
                  {mobileEvent.extendedProps.nights_stay}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-slate-800 pt-2 border-t border-slate-100">
                <span>Total:</span>
                <span>{mobileEvent.extendedProps.total_price}</span>
              </div>
            </div>
            <button
              onClick={() => {
                router.push(`/bookings/${mobileEvent.id}`);
                setMobileEvent(null);
              }}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Ver detalle →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarComponent;
