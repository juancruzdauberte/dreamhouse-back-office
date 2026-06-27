"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  ChevronDown,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import type { AirbnbInquiry } from "../../lib/services/inquiry.types";

interface AirbnbInquiryCardProps {
  inquiry: AirbnbInquiry;
  isNew?: boolean;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function calcNights(a: Date | null, b: Date | null): number | null {
  if (!a || !b) return null;
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export default function AirbnbInquiryCard({
  inquiry,
  isNew = false,
}: AirbnbInquiryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const noches = calcNights(inquiry.fechaIngreso, inquiry.fechaSalida);

  const travelersLabel = [
    `${inquiry.adultos} adulto${inquiry.adultos !== 1 ? "s" : ""}`,
    inquiry.menores > 0
      ? `${inquiry.menores} niño${inquiry.menores !== 1 ? "s" : ""}`
      : null,
    inquiry.mascotas > 0
      ? `${inquiry.mascotas} mascota${inquiry.mascotas !== 1 ? "s" : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
          {/* Source badge + name + new + date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF385C] text-white leading-none tracking-wide">
              AIRBNB
            </span>
            <span className="font-semibold text-sm">{inquiry.nombreHuesped}</span>
            {isNew && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white leading-none tracking-wide">
                NUEVO
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(inquiry.fechaRecibido)}
            </span>
          </div>

          {/* Dates + travelers + earnings */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} aria-hidden="true" />
              {formatDate(inquiry.fechaIngreso)} →{" "}
              {formatDate(inquiry.fechaSalida)}
              {noches !== null && (
                <span className="px-1.5 py-0.5 rounded bg-muted font-medium">
                  {noches}n
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} aria-hidden="true" />
              {travelersLabel}
            </span>
            {inquiry.ingresos && (
              <span className="font-medium text-foreground/80">
                {inquiry.ingresos}
              </span>
            )}
          </div>

          {/* 24h deadline warning */}
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            ⏱ Tenés 24hs para responder esta solicitud
          </p>
        </div>

        {/* ── Action ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={inquiry.airbnbUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver solicitud de ${inquiry.nombreHuesped} en Airbnb`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF385C] text-white text-xs font-medium hover:opacity-85 transition-opacity"
          >
            <ExternalLink size={13} aria-hidden="true" />
            Ver en Airbnb
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
      {expanded && inquiry.mensaje && (
        <div
          className="px-5 pb-5 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 py-3 text-xs font-medium text-muted-foreground">
            <MessageSquare size={12} aria-hidden="true" />
            Mensaje del huésped
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {inquiry.mensaje}
          </p>
        </div>
      )}
    </article>
  );
}
