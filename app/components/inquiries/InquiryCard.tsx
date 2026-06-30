"use client";

import { useState } from "react";
import {
  Mail,
  Calendar,
  Users,
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  Phone,
} from "lucide-react";
import type { VisitorInquiry } from "../../lib/services/inquiry.types";
import { toWhatsAppUrl, normalizeArgPhone } from "../../lib/services/inquiry.types";

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

interface InquiryCardProps {
  inquiry: VisitorInquiry;
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

export default function InquiryCard({
  inquiry,
  isNew = false,
}: InquiryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const phone = normalizeArgPhone(inquiry.telefono);

  // WhatsApp pre-filled message
  const primerNombre = inquiry.nombre.split(" ")[0];
  const fmtDate = (d: Date | null): string => {
    if (!d) return "?";
    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };
  const wppMsg =
    `Hola ${primerNombre}! Te habla Juan el chico que maneja las consultas de ` +
    `Dreamhouse Baradero. Recibimos tu consulta del ${fmtDate(inquiry.fechaIngreso)} ` +
    `al ${fmtDate(inquiry.fechaSalida)}. El valor de la estadía sería de $[PRECIO] USD. ` +
    `Para la reserva se abona el 30% de la estadía. ` +
    `Check in a partir de las 12:00 del mediodía. Check out a las 10:00 de la mañana.`;
  const whatsappUrl = `${toWhatsAppUrl(inquiry.telefono)}?text=${encodeURIComponent(wppMsg)}`;
  const mailtoUrl = `mailto:${inquiry.email}`;

  const nights =
    inquiry.fechaIngreso && inquiry.fechaSalida
      ? Math.ceil(
          (inquiry.fechaSalida.getTime() - inquiry.fechaIngreso.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

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
          {/* Name + badge + date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white leading-none tracking-wide">
              CABAÑAS.COM
            </span>
            <h2 className="font-semibold text-sm">{inquiry.nombre}</h2>
            {isNew && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white leading-none tracking-wide">
                NUEVO
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(inquiry.fechaConsulta)}
            </span>
          </div>

          {/* Stay + guests */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar size={11} aria-hidden="true" />
              {formatDate(inquiry.fechaIngreso)} →{" "}
              {formatDate(inquiry.fechaSalida)}
              {nights !== null && (
                <span className="px-1.5 py-0.5 rounded bg-muted font-medium">
                  {nights}n
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={11} aria-hidden="true" />
              {inquiry.adultos} adulto{inquiry.adultos !== 1 ? "s" : ""}
              {inquiry.menores > 0 &&
                ` · ${inquiry.menores} menor${inquiry.menores !== 1 ? "es" : ""}`}
            </span>
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {phone.valid ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp a ${inquiry.nombre}`}
              title={phone.display}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:opacity-85 transition-opacity"
            >
              <WhatsAppIcon size={14} />
              <span className="hidden sm:inline">{phone.display}</span>
            </a>
          ) : (
            <div
              title={`Teléfono no reconocido: ${inquiry.telefono}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium cursor-default"
            >
              <AlertTriangle size={13} aria-hidden="true" />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {inquiry.telefono || "Sin teléfono"}
              </span>
              <Phone size={12} aria-hidden="true" className="sm:hidden" />
            </div>
          )}
          <a
            href={mailtoUrl}
            aria-label={`Email a ${inquiry.nombre}`}
            title={inquiry.email}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent/60 transition-colors max-w-[180px] truncate"
          >
            <Mail size={13} aria-hidden="true" />
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
      {expanded && inquiry.consulta && (
        <div
          className="px-5 pb-5 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 py-3 text-xs font-medium text-muted-foreground">
            <MessageSquare size={12} aria-hidden="true" />
            Mensaje de consulta
          </div>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {inquiry.consulta}
          </p>
        </div>
      )}
    </article>
  );
}
