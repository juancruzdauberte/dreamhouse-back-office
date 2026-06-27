"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import type {
  VisitorInquiry,
  BookingInquiry,
  AirbnbInquiry,
} from "../../lib/services/inquiry.types";
import InquiryCard from "./InquiryCard";
import BookingInquiryCard from "./BookingInquiryCard";
import AirbnbInquiryCard from "./AirbnbInquiryCard";

// ── localStorage helpers ───────────────────────────────────────────────────

const LS_VISITOR_KEY = "inquiry_seen_uids";
const LS_BOOKING_KEY = "booking_inquiry_seen_uids";
const LS_AIRBNB_KEY = "airbnb_inquiry_seen_uids";

function getSeenUids(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeenUids(key: string, uids: number[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(uids));
  } catch {
    // localStorage unavailable
  }
}

// ── Serialization types (JSON turns Date → string) ────────────────────────

type RawVisitorInquiry = Omit<
  VisitorInquiry,
  "fechaConsulta" | "fechaIngreso" | "fechaSalida"
> & {
  fechaConsulta: string;
  fechaIngreso: string | null;
  fechaSalida: string | null;
};

type RawBookingInquiry = Omit<
  BookingInquiry,
  "fechaRecibido" | "fechaIngreso" | "fechaSalida"
> & {
  fechaRecibido: string;
  fechaIngreso: string | null;
  fechaSalida: string | null;
};

type RawAirbnbInquiry = Omit<
  AirbnbInquiry,
  "fechaRecibido" | "fechaIngreso" | "fechaSalida"
> & {
  fechaRecibido: string;
  fechaIngreso: string | null;
  fechaSalida: string | null;
};

function deserializeVisitor(raw: RawVisitorInquiry): VisitorInquiry {
  return {
    ...raw,
    fechaConsulta: new Date(raw.fechaConsulta),
    fechaIngreso: raw.fechaIngreso ? new Date(raw.fechaIngreso) : null,
    fechaSalida: raw.fechaSalida ? new Date(raw.fechaSalida) : null,
  };
}

function deserializeBooking(raw: RawBookingInquiry): BookingInquiry {
  return {
    ...raw,
    fechaRecibido: new Date(raw.fechaRecibido),
    fechaIngreso: raw.fechaIngreso ? new Date(raw.fechaIngreso) : null,
    fechaSalida: raw.fechaSalida ? new Date(raw.fechaSalida) : null,
  };
}

function deserializeAirbnb(raw: RawAirbnbInquiry): AirbnbInquiry {
  return {
    ...raw,
    fechaRecibido: new Date(raw.fechaRecibido),
    fechaIngreso: raw.fechaIngreso ? new Date(raw.fechaIngreso) : null,
    fechaSalida: raw.fechaSalida ? new Date(raw.fechaSalida) : null,
  };
}

// ── Unified list item ──────────────────────────────────────────────────────

type AnyInquiry =
  | { kind: "visitor"; data: VisitorInquiry }
  | { kind: "booking"; data: BookingInquiry }
  | { kind: "airbnb"; data: AirbnbInquiry };

function inquiryDate(item: AnyInquiry): number {
  switch (item.kind) {
    case "visitor":
      return item.data.fechaConsulta.getTime();
    case "booking":
      return item.data.fechaRecibido.getTime();
    case "airbnb":
      return item.data.fechaRecibido.getTime();
  }
}

// ── State ──────────────────────────────────────────────────────────────────

type FetchState = "idle" | "loading" | "loaded" | "error";

type NewUids = {
  visitor: Set<number>;
  booking: Set<number>;
  airbnb: Set<number>;
};

export default function InquiryDashboard() {
  const [state, setState] = useState<FetchState>("idle");
  const [items, setItems] = useState<AnyInquiry[]>([]);
  const [newUids, setNewUids] = useState<NewUids>({
    visitor: new Set(),
    booking: new Set(),
    airbnb: new Set(),
  });
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSync() {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/inquiries");
      const data = (await res.json()) as {
        visitorInquiries?: RawVisitorInquiry[];
        bookingInquiries?: RawBookingInquiry[];
        airbnbInquiries?: RawAirbnbInquiry[];
        error?: string;
      };

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Error desconocido al sincronizar.");
        setState("error");
        return;
      }

      const visitors = (data.visitorInquiries ?? []).map(deserializeVisitor);
      const bookings = (data.bookingInquiries ?? []).map(deserializeBooking);
      const airbnbs = (data.airbnbInquiries ?? []).map(deserializeAirbnb);

      // Detect new items per source
      const seenVisitor = getSeenUids(LS_VISITOR_KEY);
      const seenBooking = getSeenUids(LS_BOOKING_KEY);
      const seenAirbnb = getSeenUids(LS_AIRBNB_KEY);

      const freshVisitor = new Set(
        visitors.filter((i) => !seenVisitor.has(i.uid)).map((i) => i.uid),
      );
      const freshBooking = new Set(
        bookings.filter((i) => !seenBooking.has(i.uid)).map((i) => i.uid),
      );
      const freshAirbnb = new Set(
        airbnbs.filter((i) => !seenAirbnb.has(i.uid)).map((i) => i.uid),
      );

      // Mark all as seen
      saveSeenUids(LS_VISITOR_KEY, visitors.map((i) => i.uid));
      saveSeenUids(LS_BOOKING_KEY, bookings.map((i) => i.uid));
      saveSeenUids(LS_AIRBNB_KEY, airbnbs.map((i) => i.uid));

      setNewUids({
        visitor: freshVisitor,
        booking: freshBooking,
        airbnb: freshAirbnb,
      });

      // Merge and sort by date descending
      const merged: AnyInquiry[] = [
        ...visitors.map((data): AnyInquiry => ({ kind: "visitor", data })),
        ...bookings.map((data): AnyInquiry => ({ kind: "booking", data })),
        ...airbnbs.map((data): AnyInquiry => ({ kind: "airbnb", data })),
      ].sort((a, b) => inquiryDate(b) - inquiryDate(a));

      setItems(merged);
      setState("loaded");
    } catch {
      setErrorMsg("No se pudo conectar con el servidor.");
      setState("error");
    }
  }

  const totalNew =
    newUids.visitor.size + newUids.booking.size + newUids.airbnb.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cabañas.com, Booking.com y Airbnb — en un solo lugar
          </p>
        </div>

        <div className="flex items-center gap-3">
          {state === "loaded" && totalNew > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <Sparkles size={12} aria-hidden="true" />
              {totalNew} nuevo{totalNew !== 1 ? "s" : ""}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={state === "loading"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              size={16}
              className={state === "loading" ? "animate-spin" : ""}
              aria-hidden="true"
            />
            {state === "loading" ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </div>

      {/* States */}
      {state === "idle" && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <RefreshCw size={40} className="mb-4 opacity-30" />
          <p className="text-sm">
            Presioná Sincronizar para traer las consultas
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {state === "loaded" && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p className="text-sm">No se encontraron consultas en tu bandeja.</p>
        </div>
      )}

      {state === "loaded" && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) =>
            item.kind === "visitor" ? (
              <InquiryCard
                key={`v-${item.data.uid}`}
                inquiry={item.data}
                isNew={newUids.visitor.has(item.data.uid)}
              />
            ) : item.kind === "booking" ? (
              <BookingInquiryCard
                key={`b-${item.data.uid}`}
                inquiry={item.data}
                isNew={newUids.booking.has(item.data.uid)}
              />
            ) : (
              <AirbnbInquiryCard
                key={`a-${item.data.uid}`}
                inquiry={item.data}
                isNew={newUids.airbnb.has(item.data.uid)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
