"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  ChevronDown,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import type { BookingInquiry } from "../../lib/services/inquiry.types";

interface BookingInquiryCardProps {
  inquiry: BookingInquiry;
  isNew?: boolean;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BookingInquiryCard({
  inquiry,
  isNew = false,
}: BookingInquiryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      onClick={() => setExpanded((v) => !v)}
      className={`border bg-card rounded-lg overflow-hidden cursor-pointer transition-shadow hover:shadow-md select-none ${
        isNew ? "border-emerald-400 ring-1 ring-emerald-300" : "border-border"
      }`}
    >
      {/* ── Main row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Source badge + new badge + date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#003580] text-white leading-none tracking-wide">
              BOOKING.COM
            </span>
            {isNew && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white leading-none tracking-wide">
                NUEVO
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(inquiry.fechaRecibido)}
            </span>
          </div>

          {/* Dates + guests + price */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} aria-hidden="true" />
              {formatDate(inquiry.fechaIngreso)} →{" "}
              {formatDate(inquiry.fechaSalida)}
              {inquiry.noches > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-muted font-medium">
                  {inquiry.noches}n
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} aria-hidden="true" />
              {inquiry.adultos} adulto{inquiry.adultos !== 1 ? "s" : ""}
            </span>
            {inquiry.precio && (
              <span className="font-medium text-foreground/80">
                {inquiry.precio}
              </span>
            )}
          </div>

          {/* Deadline warning */}
          {inquiry.fechaLimite && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              ⏱ Responder antes de las {inquiry.fechaLimite}
            </p>
          )}
        </div>

        {/* ── Action ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={inquiry.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver consulta en Booking.com"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#003580] text-white text-xs font-medium hover:opacity-85 transition-opacity"
          >
            <ExternalLink size={13} aria-hidden="true" />
            Ver en Booking
          </a>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* ── Expandable message ─────────────────────────────────── */}
      {expanded && inquiry.mensajeHuesped && (
        <div
          className="px-5 pb-5 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 py-3 text-xs font-medium text-muted-foreground">
            <MessageSquare size={12} aria-hidden="true" />
            Mensaje del huésped
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {inquiry.mensajeHuesped}
          </p>
        </div>
      )}
    </article>
  );
}
