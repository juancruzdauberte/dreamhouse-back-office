"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { BookingDTO } from "../lib/repository/booking/booking.dto";

interface Props {
  allBookings: BookingDTO[];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 not-italic"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  Confirmada: "bg-green-100 text-green-800",
  Cancelada: "bg-red-100 text-red-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
};

export default function BookingSearchBar({ allBookings }: Props) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtered, setFiltered] = useState<BookingDTO[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Click-outside dismiss
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Debounced filter
  useEffect(() => {
    const hasQuery = query.trim().length > 0;
    const hasDateFilter = Boolean(dateFrom || dateTo);

    if (!hasQuery && !hasDateFilter) {
      setIsOpen(false);
      setFiltered([]);
      return;
    }

    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();

      const results = allBookings
        .filter((b) => {
          const matchText =
            !q ||
            b.guest_name.toLowerCase().includes(q) ||
            b.channel_name.toLowerCase().includes(q);

          const bookingDate = new Date(b.check_in);
          const matchFrom = !dateFrom || bookingDate >= new Date(dateFrom);
          const matchTo = !dateTo || bookingDate <= new Date(dateTo);

          return matchText && matchFrom && matchTo;
        })
        .slice(0, 20);

      setFiltered(results);
      setIsOpen(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dateFrom, dateTo, allBookings]);

  function clearAll() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setFiltered([]);
    setIsOpen(false);
  }

  const hasActiveFilter = query.trim() || dateFrom || dateTo;

  return (
    <div ref={containerRef} className="relative w-full lg:max-w-xl">
      {/* Search controls */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex flex-col gap-3">
        {/* Text input */}
        <div className="relative flex items-center">
          <Search
            className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por huésped o canal..."
            aria-label="Buscar reservas por huésped o canal"
            className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          {hasActiveFilter && (
            <button
              onClick={clearAll}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date pickers */}
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label
              htmlFor="search-date-from"
              className="text-xs font-medium text-muted-foreground"
            >
              Desde
            </label>
            <input
              id="search-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label
              htmlFor="search-date-to"
              className="text-xs font-medium text-muted-foreground"
            >
              Hasta
            </label>
            <input
              id="search-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden"
        >
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin resultados para tu búsqueda
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border">
              {filtered.map((booking) => (
                <li key={booking.id} role="option" aria-selected="false">
                  <Link
                    href={`/bookings/${booking.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {highlight(booking.guest_name, query)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {highlight(booking.channel_name, query)}
                        {" · "}
                        {formatDate(booking.check_in)} →{" "}
                        {formatDate(booking.check_out)}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[booking.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {booking.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
