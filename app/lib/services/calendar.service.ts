import { google } from "googleapis";

/* ── Feature flag ───────────────────────────────────────────────── */

function isCalendarEnabled(): boolean {
  return process.env.CALENDAR_ENABLED === "true";
}

/* ── Auth helper ─────────────────────────────────────────────────── */

function createAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

/* ── Color mapping ───────────────────────────────────────────────── */

const STATUS_COLOR: Record<string, string> = {
  Confirmada: "2",  // Sage     🟢
  Pendiente:  "5",  // Banana   🟡
  Realizada:  "8",  // Graphite ⚫
  Cancelada:  "11", // Tomato   🔴
};

function getColorId(estado: string): string {
  return STATUS_COLOR[estado] ?? "2";
}

/* ── Description builder ─────────────────────────────────────────── */

interface DescriptionParams {
  total: number;
  pago: number;
  faltaPagar: number;
  currency: "USD" | "ARS";
  huespedes: number;
  estado: string;
  observations?: string | null;
  medioDia: boolean;
}

function buildDescription({
  total,
  pago,
  faltaPagar,
  currency,
  huespedes,
  estado,
  observations,
  medioDia,
}: DescriptionParams): string {
  const fmt = (n: number) => `$${n.toLocaleString("es-AR")} ${currency}`;
  const lines = [
    `<b>TOTAL:</b>        ${fmt(total)}`,
    `<b>PAGÓ:</b>         ${fmt(pago)}`,
    `<b>FALTA PAGAR:</b>  ${fmt(faltaPagar)}`,
    `<b>HUÉSPEDES:</b>    ${huespedes} ${huespedes === 1 ? "persona" : "personas"}`,
    `<b>ESTADO:</b>       ${estado}`,
  ];
  if (observations) lines.push(`<b>OBS:</b>          ${observations}`);
  if (medioDia)     lines.push(`<b>MEDIO DÍA:</b>    Sí`);
  return lines.join("\n");
}

/* ── Types ───────────────────────────────────────────────────────── */

export interface CalendarEventParams {
  nombreCliente: string;
  emailCliente?: string;
  fechaCheckIn: string;
  fechaCheckOut: string;
  total: number;
  pago: number;
  faltaPagar: number;
  huespedes: number;
  estado: string;
  medioDia: boolean;
  currency: "USD" | "ARS";
  idBooking?: number;
  observations?: string | null;
  googleEventId?: string | null; // NEW: stored Google Calendar event ID
}

/* ── Create ──────────────────────────────────────────────────────── */

export async function createGoogleCalendarEvent(
  params: CalendarEventParams,
): Promise<{ success: boolean; link?: string | null; eventId?: string | null | undefined }> {
  if (!isCalendarEnabled()) {
    console.log("[Calendar] disabled in this environment — skipping createGoogleCalendarEvent");
    return { success: true };
  }

  const {
    nombreCliente,
    emailCliente,
    fechaCheckIn,
    fechaCheckOut,
    medioDia,
    idBooking,
    estado,
  } = params;

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID no definido");

    const calendar = google.calendar({ version: "v3", auth: createAuth() });

    const event = {
      summary: `${nombreCliente}-${idBooking}`,
      description: buildDescription(params),
      colorId: getColorId(estado),
      start: {
        dateTime: `${fechaCheckIn}T12:00:00`,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: medioDia
          ? `${fechaCheckOut}T18:00:00`
          : `${fechaCheckOut}T10:00:00`,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      attendees: emailCliente ? [{ email: emailCliente }] : undefined,
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return { success: true, link: response.data.htmlLink, eventId: response.data.id };
  } catch (error: unknown) {
    const err = error as { code?: number; response?: { status?: number }; message?: string };
    console.error("Error creando evento en Google Calendar:", error);

    // Debug: lista calendarios accesibles si el calendario no se encuentra
    if (err.code === 404 || err.response?.status === 404) {
      try {
        const cal = google.calendar({ version: "v3", auth: createAuth() });
        const list = await cal.calendarList.list();
        console.log(
          "DEBUG calendarios accesibles:",
          list.data.items?.map((c) => c.id),
        );
      } catch (listError) {
        console.error("Error listando calendarios:", listError);
      }
    }

    throw new Error(err.message ?? "Error creando evento");
  }
}

/* ── Update ──────────────────────────────────────────────────────── */

export async function updateGoogleCalendarEvent(
  params: CalendarEventParams,
): Promise<{ success: boolean; link?: string | null; message?: string }> {
  if (!isCalendarEnabled()) {
    console.log("[Calendar] disabled in this environment — skipping updateGoogleCalendarEvent");
    return { success: true };
  }

  const {
    nombreCliente,
    emailCliente,
    fechaCheckIn,
    fechaCheckOut,
    medioDia,
    idBooking,
    estado,
    googleEventId,
  } = params;

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID no definido");

    const calendar = google.calendar({ version: "v3", auth: createAuth() });

    let eventId = googleEventId;

    // If googleEventId is not provided, fall back to list search (backward compatibility)
    if (!eventId) {
      console.log(`[Calendar] No googleEventId provided for booking #${idBooking}, falling back to list search`);
      const listResponse = await calendar.events.list({
        calendarId,
        q: idBooking?.toString(),
      });

      const eventToUpdate = (listResponse.data.items ?? []).find(
        (e) => e.summary?.endsWith(`-${idBooking}`),
      );

      eventId = eventToUpdate?.id;
    }

    if (!eventId) {
      console.warn(
        `No se encontró el evento de Google Calendar para la reserva #${idBooking}`,
      );
      return { success: false, message: "Evento no encontrado" };
    }

    const eventPatch = {
      summary: `${nombreCliente}-${idBooking}`,
      description: buildDescription(params),
      colorId: getColorId(estado),
      start: {
        dateTime: `${fechaCheckIn}T12:00:00`,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: medioDia
          ? `${fechaCheckOut}T18:00:00`
          : `${fechaCheckOut}T10:00:00`,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      attendees: emailCliente ? [{ email: emailCliente }] : undefined,
    };

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventPatch,
    });

    return { success: true, link: response.data.htmlLink };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error actualizando evento en Google Calendar:", error);
    return { success: false, message };
  }
}

/* ── Delete ──────────────────────────────────────────────────────── */

export async function deleteGoogleCalendarEvent(
  googleEventId: string,
): Promise<{ success: boolean; message?: string }> {
  if (!isCalendarEnabled()) {
    console.log(`[Calendar] disabled in this environment — skipping deleteGoogleCalendarEvent ${googleEventId}`);
    return { success: true };
  }

  if (!googleEventId) {
    console.warn("[Calendar] No googleEventId provided to deleteGoogleCalendarEvent");
    return { success: false, message: "google_event_id no disponible" };
  }

  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID no definido");

    const calendar = google.calendar({ version: "v3", auth: createAuth() });

    await calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error eliminando evento en Google Calendar:", error);
    return { success: false, message };
  }
}
