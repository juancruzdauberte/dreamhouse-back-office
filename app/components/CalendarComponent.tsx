"use client";

import React, { useState, useEffect, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { useRouter, useSearchParams } from "next/navigation";
import { DatesSetArg } from "@fullcalendar/core";
import { BookingDTO } from "../lib/repository/booking/booking.dto";
import Spinner from "./widget/Spinner";
import { toTitleCase } from "../utils/utils";

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
  const [events, setEvents] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hoveredEvent, setHoveredEvent] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const formattedEvents = bookings.map((booking) => {
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
        backgroundColor = "#d9534f"; // Red
        borderColor = "#d9534f";
      }

      const checkInStr = booking.check_in.split("T")[0];
      const checkOutStr = booking.check_out.split("T")[0];

      const [year, month, day] = checkOutStr.split("-").map(Number);
      const checkOutDate = new Date(Date.UTC(year, month - 1, day));
      checkOutDate.setUTCDate(checkOutDate.getUTCDate() + 1);
      const endStr = checkOutDate.toISOString().split("T")[0];

      const guestName = toTitleCase(booking.guest_name);

      return {
        id: String(booking.id),
        title: `${guestName} (${booking.channel_name})`,
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
          channel_name: booking.channel_name,
          guest_count: booking.guest_count,
          nights_stay: booking.nights_stay,
          check_in: booking.check_in,
          check_out: booking.check_out,
        },
      };
    });
    setEvents(formattedEvents);
  }, [bookings]);

  const handleEventMouseEnter = (info: any) => {
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

  const handleEventClick = (clickInfo: any) => {
    router.push(`/bookings/${clickInfo.event.id}`);
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
              <span>Canal:</span>
              <span className="font-medium">
                {hoveredEvent.extendedProps.channel_name}
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
        .fc-day-today {
          background-color: #f3f9ff !important;
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
      `}</style>
      <div className="calendar-container relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-lg transition-all duration-300">
            <Spinner size={50} text="Cargando reservas..." />
          </div>
        )}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          locale={esLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
          height="auto"
          contentHeight="auto"
          aspectRatio={1.8}
          fixedWeekCount={false}
          showNonCurrentDates={false}
          dayMaxEvents={3}
          displayEventTime={false}
        />
      </div>
    </div>
  );
};

export default CalendarComponent;
