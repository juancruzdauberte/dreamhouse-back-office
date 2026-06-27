"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import type { VisitorInquiry } from "../../lib/services/inquiry.types";
import InquiryCard from "./InquiryCard";

const LS_KEY = "inquiry_seen_uids";

function getSeenUids(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeenUids(uids: number[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(uids));
  } catch {
    // localStorage no disponible
  }
}

type FetchState = "idle" | "loading" | "loaded" | "error";

// JSON serializa Date → string; este tipo refleja lo que llega del API
type RawInquiry = Omit<VisitorInquiry, "fechaConsulta" | "fechaIngreso" | "fechaSalida"> & {
  fechaConsulta: string;
  fechaIngreso: string | null;
  fechaSalida: string | null;
};

function deserializeInquiry(raw: RawInquiry): VisitorInquiry {
  return {
    ...raw,
    fechaConsulta: new Date(raw.fechaConsulta),
    fechaIngreso: raw.fechaIngreso ? new Date(raw.fechaIngreso) : null,
    fechaSalida: raw.fechaSalida ? new Date(raw.fechaSalida) : null,
  };
}

export default function InquiryDashboard() {
  const [state, setState] = useState<FetchState>("idle");
  const [inquiries, setInquiries] = useState<VisitorInquiry[]>([]);
  const [newUids, setNewUids] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSync() {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/inquiries");
      const data = (await res.json()) as {
        inquiries?: RawInquiry[];
        error?: string;
      };

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? "Error desconocido al sincronizar.");
        setState("error");
        return;
      }

      const deserialized = (data.inquiries ?? []).map(deserializeInquiry);

      // Detectar cuáles son nuevos respecto a la última sync
      const seen = getSeenUids();
      const fresh = new Set(deserialized.filter((i) => !seen.has(i.uid)).map((i) => i.uid));
      setNewUids(fresh);

      // Guardar todos los UIDs actuales como vistos
      saveSeenUids(deserialized.map((i) => i.uid));

      setInquiries(deserialized);
      setState("loaded");
    } catch {
      setErrorMsg("No se pudo conectar con el servidor.");
      setState("error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mensajes de visitantes recibidos por email
          </p>
        </div>

        <div className="flex items-center gap-3">
          {state === "loaded" && newUids.size > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <Sparkles size={12} aria-hidden="true" />
              {newUids.size} nuevo{newUids.size !== 1 ? "s" : ""}
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

      {state === "loaded" && inquiries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p className="text-sm">
            No se encontraron consultas de visitantes en tu bandeja.
          </p>
        </div>
      )}

      {state === "loaded" && inquiries.length > 0 && (
        <div className="flex flex-col gap-2">
          {inquiries.map((inquiry, i) => (
            <InquiryCard key={i} inquiry={inquiry} isNew={newUids.has(inquiry.uid)} />
          ))}
        </div>
      )}
    </div>
  );
}
