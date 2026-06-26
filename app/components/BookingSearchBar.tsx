"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Loader2, Search, X } from "lucide-react";
import type { BookingSearchDTO } from "../lib/repository/booking/booking.dto";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
  return text.split(regex).map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-amber-100 text-amber-800 rounded-sm px-0.5 not-italic font-semibold"
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
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { classes: string }> = {
  Confirmada: {
    classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  },
  Cancelada: {
    classes: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80",
  },
  Pendiente: {
    classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  },
};

export default function BookingSearchBar() {
  const [allBookings, setAllBookings] = useState<BookingSearchDTO[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtered, setFiltered] = useState<BookingSearchDTO[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

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
      setFiltered([]);
      return;
    }

    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();

      const results = allBookings
        .filter((b) => {
          const matchText =
            !q ||
            (b.guest_name ?? "").toLowerCase().includes(q) ||
            b.channel_name.toLowerCase().includes(q);

          const checkIn = new Date(b.check_in);
          const checkOut = new Date(b.check_out);
          const matchFrom = !dateFrom || checkOut >= new Date(dateFrom);
          const matchTo = !dateTo || checkIn <= new Date(dateTo);

          return matchText && matchFrom && matchTo;
        })
        .slice(0, 20);

      setFiltered(results);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, dateFrom, dateTo, allBookings]);

  async function fetchBookings() {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoadingData(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/booking/search");
      if (!res.ok) throw new Error("fetch failed");
      const data: BookingSearchDTO[] = await res.json();
      setAllBookings(data);
    } catch {
      setFetchError(true);
      hasFetchedRef.current = false; // allow retry on next focus
    } finally {
      setLoadingData(false);
    }
  }

  function handleFocus() {
    setIsOpen(true);
    fetchBookings();
  }

  function clearAll() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setFiltered([]);
    setIsOpen(false);
  }

  function clearDates() {
    setDateFrom("");
    setDateTo("");
  }

  const hasActiveFilter = Boolean(query.trim() || dateFrom || dateTo);

  return (
    <div ref={containerRef} className="relative w-full lg:max-w-xl">
      {/* ── Search input ── */}
      <div className="relative flex items-center">
        <Search
          className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Buscar reservas por huésped o canal..."
          aria-label="Buscar reservas"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="w-full pl-10 pr-10 py-3 text-sm rounded-2xl border border-border bg-white shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200"
        />
        {hasActiveFilter && (
          <button
            onClick={clearAll}
            aria-label="Limpiar búsqueda"
            className="absolute right-3.5 flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground transition-colors duration-150"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── Dropdown panel ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Filtros y resultados de búsqueda"
          className="absolute z-50 mt-2 w-full bg-white border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200"
        >
          {/* Date filter section */}
          <div className="px-4 pt-3 pb-3 border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Calendar className="h-3 w-3 text-primary" aria-hidden="true" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Rango de fechas
              </span>
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearDates}
                  className="ml-auto text-[10px] font-medium text-primary hover:underline"
                >
                  Limpiar fechas
                </button>
              )}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor="dd-date-from"
                  className="block text-[10px] font-medium text-muted-foreground mb-1"
                >
                  Desde
                </label>
                <input
                  id="dd-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition duration-150"
                />
              </div>
              <ArrowRight
                className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mb-2"
                aria-hidden="true"
              />
              <div className="flex-1">
                <label
                  htmlFor="dd-date-to"
                  className="block text-[10px] font-medium text-muted-foreground mb-1"
                >
                  Hasta
                </label>
                <input
                  id="dd-date-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition duration-150"
                />
              </div>
            </div>
          </div>

          {/* ── Results area ── */}
          {loadingData ? (
            /* Loading state */
            <div className="py-9 flex flex-col items-center gap-2">
              <Loader2
                className="h-5 w-5 text-primary animate-spin"
                aria-hidden="true"
              />
              <p className="text-xs text-muted-foreground">
                Cargando reservas...
              </p>
            </div>
          ) : fetchError ? (
            /* Error state */
            <div className="py-9 flex flex-col items-center gap-1.5">
              <p className="text-sm font-semibold text-destructive">
                No se pudo cargar
              </p>
              <button
                onClick={() => {
                  hasFetchedRef.current = false;
                  fetchBookings();
                }}
                className="text-xs text-primary hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : !hasActiveFilter ? (
            /* Idle state */
            <div className="py-9 flex flex-col items-center gap-1.5">
              <Search
                className="h-8 w-8 text-muted-foreground/20"
                aria-hidden="true"
              />
              <p className="text-sm text-muted-foreground/70">
                Escribí para buscar reservas
              </p>
              <p className="text-xs text-muted-foreground/45">
                por nombre, canal o usá el rango de fechas
              </p>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="py-9 flex flex-col items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">
                Sin resultados
              </p>
              <p className="text-xs text-muted-foreground">
                Probá con otro huésped o rango de fechas
              </p>
            </div>
          ) : (
            /* Results list */
            <>
              <div className="px-4 py-2 border-b border-border/30">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "resultado" : "resultados"}
                </span>
              </div>

              <ul
                role="listbox"
                aria-label="Reservas encontradas"
                className="max-h-72 overflow-y-auto"
              >
                {filtered.map((booking, i) => {
                  const statusCfg = STATUS_CONFIG[booking.status] ?? {
                    classes:
                      "bg-gray-50 text-gray-600 ring-1 ring-gray-200/80",
                  };

                  return (
                    <li
                      key={booking.id}
                      role="option"
                      aria-selected="false"
                      className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 [animation-fill-mode:both]"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <Link
                        href={`/bookings/${booking.id}`}
                        onClick={() => setIsOpen(false)}
                        className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60 transition-colors duration-150 border-b border-border/30 last:border-0"
                      >
                        {/* Avatar initial */}
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-150">
                          <span className="text-sm font-bold text-primary leading-none select-none">
                            {(booking.guest_name ?? "?")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {highlight(booking.guest_name ?? "—", query)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                            <span>
                              {highlight(booking.channel_name, query)}
                            </span>
                            <span className="text-muted-foreground/35">·</span>
                            <span className="whitespace-nowrap">
                              {formatDate(booking.check_in)} →{" "}
                              {formatDate(booking.check_out)}
                            </span>
                          </p>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.classes}`}
                        >
                          {booking.status}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
