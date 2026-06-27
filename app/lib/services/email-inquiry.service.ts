import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { VisitorInquiry, BookingInquiry, AirbnbInquiry } from "./inquiry.types";

export type { VisitorInquiry, BookingInquiry, AirbnbInquiry } from "./inquiry.types";

// ── Helpers ────────────────────────────────────────────────────────────────

function extractField(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}:\\s*(.+)`));
  return match?.[1]?.trim() ?? "";
}

function parseLocalDate(str: string): Date | null {
  if (!str) return null;
  const datePart = str.split(" ")[0];
  const parts = datePart.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const d = new Date(
    `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
  );
  return isNaN(d.getTime()) ? null : d;
}

export { toWhatsAppUrl } from "./inquiry.types";

// ── Parser ─────────────────────────────────────────────────────────────────

function parseInquiryBody(text: string): Omit<VisitorInquiry, "uid"> | null {
  if (!text.includes("Consulta de visitante")) return null;

  const consultaMatch = text.match(/Consulta:\s*([\s\S]+)$/);

  const fechaConsultaRaw = extractField(text, "Fecha de la consulta");
  const fechaConsulta = parseLocalDate(fechaConsultaRaw) ?? new Date();

  return {
    para: extractField(text, "Para"),
    fechaConsulta,
    nombre: extractField(text, "Nombre"),
    email: extractField(text, "Email"),
    telefono: extractField(text, "Tel / Whatsapp"),
    fechaIngreso: parseLocalDate(extractField(text, "Fecha de Ingreso")),
    fechaSalida: parseLocalDate(extractField(text, "Fecha de Salida")),
    adultos: parseInt(extractField(text, "Adultos"), 10) || 0,
    menores: parseInt(extractField(text, "Menores hasta 14 años"), 10) || 0,
    consulta: consultaMatch?.[1]?.trim() ?? "",
  };
}

// ── Diagnostic (dev only) ─────────────────────────────────────────────────

export async function listRecentSubjects(limit = 10): Promise<void> {
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  const host = process.env.IMAP_HOST ?? "imap.gmail.com";

  if (!user || !pass) {
    console.warn("[email-inquiry:diag] Credentials not set");
    return;
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    const status = await client.status("INBOX", { messages: true });
    const total = status.messages ?? 0;

    if (total === 0) return;

    // Fetch the last `limit` messages by sequence range
    const from = Math.max(1, total - limit + 1);
    const range = `${from}:${total}`;

    for await (const msg of client.fetch(range, { envelope: true })) {
      if (!msg.envelope) continue;
    }
  } finally {
    lock.release();
    await client.logout();
  }
}

// ── IMAP Fetch ─────────────────────────────────────────────────────────────

export async function fetchEmailInquiries(): Promise<VisitorInquiry[]> {
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  const host = process.env.IMAP_HOST ?? "imap.gmail.com";

  if (!user || !pass) {
    console.warn(
      "[email-inquiry] IMAP_USER or IMAP_PASSWORD not set — returning empty",
    );
    return [];
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  const inquiries: VisitorInquiry[] = [];

  try {
    const uids = (await client.search(
      { from: "consultas@cabanias.com.ar" },
      { uid: true },
    )) as number[];

    if (uids.length === 0) {
      console.log("[email-inquiry] No matching emails — done");
      return [];
    }

    const recentUids = uids.slice(-50);

    let fetched = 0;
    let parsed_ok = 0;
    let skipped = 0;

    for await (const msg of client.fetch(
      recentUids,
      { source: true },
      { uid: true },
    )) {
      fetched++;
      if (!msg.source) {
        console.warn(
          `[email-inquiry] UID ${msg.uid} — source undefined, skipping`,
        );
        skipped++;
        continue;
      }

      const parsed = await simpleParser(msg.source);
      const text = parsed.text ?? "";

      // Mostramos el body completo del primer mail para verificar el formato
      if (inquiries.length === 0) {
        console.log(
          `[email-inquiry] UID ${msg.uid} — BODY COMPLETO:\n${text}\n--- FIN BODY ---`,
        );
      }

      const inquiry = parseInquiryBody(text);

      if (!inquiry) {
        console.warn(
          `[email-inquiry] UID ${msg.uid} — body did not match expected format, skipping`,
        );
        console.warn(
          `[email-inquiry] UID ${msg.uid} — first 200 chars: ${text.slice(0, 200)}`,
        );
        skipped++;
        continue;
      }

      console.log(
        `[email-inquiry] UID ${msg.uid} — parsed OK → nombre="${inquiry.nombre}" email="${inquiry.email}" tel="${inquiry.telefono}"`,
      );
      parsed_ok++;
      inquiries.push({ ...inquiry, uid: msg.uid });
    }

    console.log(
      `[email-inquiry] ── DONE: fetched=${fetched} parsed=${parsed_ok} skipped=${skipped}`,
    );
  } finally {
    lock.release();
    await client.logout();
    console.log("[email-inquiry] Disconnected ✓");
  }

  return inquiries.reverse();
}

// ── Booking.com inquiry parser ──────────────────────────────────────────────

const MESES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function parseSpanishDate(str: string): Date | null {
  const m = str.match(/(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!m) return null;
  const month = MESES[m[2].toLowerCase()];
  if (month === undefined) return null;
  const d = new Date(parseInt(m[3], 10), month, parseInt(m[1], 10));
  return isNaN(d.getTime()) ? null : d;
}

const BOOKING_ADMIN_URL =
  "https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/home.html?ses=397a4311b689a30e72a1b16bcf7fad2f&hotel_account_id=23074991&lang=es&hotel_id=13810064";

function extractBookingViewUrl(_html: string): string {
  return BOOKING_ADMIN_URL;
}

function parseBookingInquiryBody(
  text: string,
  html: string,
  uid: number,
  receivedDate: Date,
): BookingInquiry | null {
  const textLower = text.toLowerCase();
  if (!textLower.includes("nueva consulta")) return null;
  if (!textLower.includes("mensaje del hu")) return null;

  // Guest message: between "Mensaje del huésped" and "Preaprobar"
  const mensajeMatch = text.match(
    /Mensaje del hu[eé]sped\s+([\s\S]+?)(?=\s*Preaprobar)/i,
  );
  const mensajeHuesped = mensajeMatch
    ? mensajeMatch[1]
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n")
    : "";

  // Check-in / Check-out ("18 de julio de 2026")
  const checkinMatch = text.match(/Check-in\s+(\d+\s+de\s+\w+\s+de\s+\d{4})/i);
  const fechaIngreso = checkinMatch ? parseSpanishDate(checkinMatch[1]) : null;

  const checkoutMatch = text.match(
    /Check-out\s+(\d+\s+de\s+\w+\s+de\s+\d{4})/i,
  );
  const fechaSalida = checkoutMatch ? parseSpanishDate(checkoutMatch[1]) : null;

  // Nights / Adults
  const nochesMatch = text.match(/(\d+)\s+noche/i);
  const noches = parseInt(nochesMatch?.[1] ?? "1", 10);

  const adultosMatch = text.match(/(\d+)\s+adultos?/i);
  const adultos = parseInt(adultosMatch?.[1] ?? "0", 10);

  // Price (after "Precio total")
  const precioMatch = text.match(/Precio total\s+US\$([\d.,]+)/i);
  const precio = precioMatch ? `US$${precioMatch[1]}` : "";

  // Deadline
  const limiteMatch = text.match(
    /antes de las\s+([\d:]+\s*(?:AM|PM))\s+del\s+(\d+\s+de\s+\w+\s+de\s+\d+)/i,
  );
  const fechaLimite = limiteMatch
    ? `${limiteMatch[1].trim()} del ${limiteMatch[2].trim()}`
    : "";

  const bookingUrl = extractBookingViewUrl(html);

  console.log(
    `[booking-inquiry] UID ${uid} — parsed OK → fechaIngreso="${checkinMatch?.[1]}" adultos=${adultos} precio="${precio}"`,
  );

  return {
    uid,
    fechaRecibido: receivedDate,
    fechaLimite,
    fechaIngreso,
    fechaSalida,
    noches,
    adultos,
    precio,
    mensajeHuesped,
    bookingUrl,
  };
}

// ── Booking.com IMAP fetch ───────────────────────────────────────────────

export async function fetchBookingInquiries(): Promise<BookingInquiry[]> {
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  const host = process.env.IMAP_HOST ?? "imap.gmail.com";

  if (!user || !pass) {
    console.warn(
      "[booking-inquiry] IMAP_USER or IMAP_PASSWORD not set — returning empty",
    );
    return [];
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  const inquiries: BookingInquiry[] = [];

  try {
    const uids = (await client.search(
      { from: "noreply@booking.com" },
      { uid: true },
    )) as number[];

    if (uids.length === 0) {
      console.log("[booking-inquiry] No matching emails — done");
      return [];
    }

    const recentUids = uids.slice(-20);
    let skipped = 0;

    for await (const msg of client.fetch(
      recentUids,
      { source: true, envelope: true },
      { uid: true },
    )) {
      if (!msg.source) {
        skipped++;
        continue;
      }

      const parsed = await simpleParser(msg.source);
      const text = parsed.text ?? "";
      const html = typeof parsed.html === "string" ? parsed.html : "";
      const receivedDate = msg.envelope?.date ?? parsed.date ?? new Date();

      const inquiry = parseBookingInquiryBody(text, html, msg.uid, receivedDate);
      if (!inquiry) {
        skipped++;
        continue;
      }

      inquiries.push(inquiry);
    }

    console.log(
      `[booking-inquiry] ── DONE: parsed=${inquiries.length} skipped=${skipped}`,
    );
  } finally {
    lock.release();
    await client.logout();
    console.log("[booking-inquiry] Disconnected ✓");
  }

  return inquiries.reverse();
}

// ── Airbnb RTB parser ───────────────────────────────────────────────

const MESES_ABBR: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

/**
 * Extract the first two abbreviated-month dates found in `text`.
 * Returns [fechaIngreso, fechaSalida] — either can be null if not found.
 * Uses Date.UTC so the result is timezone-neutral.
 */
function extractAirbnbDates(text: string): [Date | null, Date | null] {
  const toDate = (day: string, mon: string, year: string): Date | null => {
    const month = MESES_ABBR[mon.toLowerCase()];
    if (month === undefined) return null;
    const ts = Date.UTC(parseInt(year, 10), month, parseInt(day, 10));
    return isNaN(ts) ? null : new Date(ts);
  };

  // Pattern A — same-month range: "D1–D2 MONTH YEAR" (e.g. "4–5 jul 2026", "11–12 jul 2026")
  // Uses the raw en-dash (U+2013) before any normalization.
  // Guard d1 < d2 prevents matching cross-month subjects like "26 dic 2026–2 ene 2027"
  // where the fragment "6–2 ene" would otherwise fire (d1=6 > d2=2 → rejected).
  const rangePat =
    /(\d{1,2})\s*\u2013\s*(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[\s\u00A0]+(\d{4})/gi;
  const rm = rangePat.exec(text);
  if (rm) {
    const d1 = parseInt(rm[1], 10);
    const d2 = parseInt(rm[2], 10);
    if (d1 > 0 && d1 < d2 && d2 <= 31) {
      const dateIn = toDate(rm[1], rm[3], rm[4]);
      const dateOut = toDate(rm[2], rm[3], rm[4]);
      if (dateIn && dateOut) return [dateIn, dateOut];
    }
  }

  // Pattern B — collect ALL "D MONTH YEAR" occurrences, sort chronologically
  const clean = text.replace(
    /[\u200B\u200C\u200D\u2009\u2013\u2014\uFEFF\u00AD]/g,
    " ",
  );
  const pat =
    /(\d{1,2})[\s\u00A0]+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[\s\u00A0]+(\d{4})/gi;
  const found: Date[] = [];
  let m: RegExpExecArray | null;
  while ((m = pat.exec(clean)) !== null) {
    const d = toDate(m[1], m[2], m[3]);
    if (d) found.push(d);
  }

  if (found.length === 0) return [null, null];
  if (found.length === 1) return [found[0], null];

  // Earliest = check-in, latest = check-out
  found.sort((a, b) => a.getTime() - b.getTime());
  return [found[0], found[found.length - 1]];
}

function parseAirbnbBody(
  rawText: string,
  subject: string,
  uid: number,
  receivedDate: Date,
): AirbnbInquiry | null {
  // Detect: only RTB-to-host emails have this exact header
  if (!rawText.toUpperCase().includes("RESPONDE A LA SOLICITUD DE")) return null;

  // Normalize non-breaking spaces
  const text = rawText.replace(/\u00A0/g, " ");

  // Guest name
  const nameMatch = text.match(/RESPONDE A LA SOLICITUD DE\s+([^\n\r]+)/i);
  const nombreRaw = nameMatch?.[1]?.trim() ?? "";
  const nombreHuesped = nombreRaw
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Dates — search subject AND body together; sort and pick earliest/latest
  const [fechaIngreso, fechaSalida] = extractAirbnbDates(subject + " " + text);
  console.log(
    `[airbnb-inquiry] UID ${uid} — in=${fechaIngreso?.toISOString() ?? "null"} out=${fechaSalida?.toISOString() ?? "null"} subject="${subject.slice(0, 80)}"`,
  );

  // Travelers
  const adultos = parseInt(text.match(/(\d+)\s*adultos?/i)?.[1] ?? "0", 10);
  const menores = parseInt(text.match(/(\d+)\s*ni[\u00f1n]o/i)?.[1] ?? "0", 10);
  const mascotas = parseInt(text.match(/(\d+)\s*mascota/i)?.[1] ?? "0", 10);

  // Guest message: between "Identidad verificada" and next URL or property block
  const msgMatch = text.match(
    /Identidad verificada\s+([\s\S]+?)(?=\nhttps?:\/\/|\nDREAMHOUSE|\nDreamHouse)/i,
  );
  const mensaje = msgMatch
    ? msgMatch[1]
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n")
    : "";

  // Potential earnings (after "reserva de")
  const ingresosMatch = text.match(/reserva de\s+([^\n.]+)/i);
  const ingresos = ingresosMatch?.[1]?.trim().replace(/\s+/g, " ") ?? "";

  // Reservation URL — extract code and build clean URL
  const codeMatch = text.match(
    /airbnb\.com(?:\.ar)?\S*reservations\/details\/([A-Z0-9]+)/i,
  );
  const airbnbUrl = "https://www.airbnb.com.ar/hosting";

  console.log(
    `[airbnb-inquiry] UID ${uid} — parsed OK → huesped="${nombreHuesped}" adultos=${adultos}`,
  );

  return {
    uid,
    fechaRecibido: receivedDate,
    nombreHuesped,
    fechaIngreso,
    fechaSalida,
    adultos,
    menores,
    mascotas,
    mensaje,
    ingresos,
    airbnbUrl,
  };
}

// ── Airbnb IMAP fetch ───────────────────────────────────────────────

export async function fetchAirbnbInquiries(): Promise<AirbnbInquiry[]> {
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  const host = process.env.IMAP_HOST ?? "imap.gmail.com";

  if (!user || !pass) {
    console.warn("[airbnb-inquiry] IMAP credentials not set — returning empty");
    return [];
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  const inquiries: AirbnbInquiry[] = [];

  try {
    const uids = (await client.search(
      { from: "automated@airbnb.com" },
      { uid: true },
    )) as number[];

    if (uids.length === 0) {
      console.log("[airbnb-inquiry] No matching emails — done");
      return [];
    }

    const recentUids = uids.slice(-20);
    let skipped = 0;

    for await (const msg of client.fetch(
      recentUids,
      { source: true, envelope: true },
      { uid: true },
    )) {
      if (!msg.source) { skipped++; continue; }

      const parsed = await simpleParser(msg.source);
      const text = parsed.text ?? "";
      const subject = typeof parsed.subject === "string" ? parsed.subject : "";
      const receivedDate = msg.envelope?.date ?? parsed.date ?? new Date();

      const inquiry = parseAirbnbBody(text, subject, msg.uid, receivedDate);
      if (!inquiry) { skipped++; continue; }

      inquiries.push(inquiry);
    }

    console.log(
      `[airbnb-inquiry] ── DONE: parsed=${inquiries.length} skipped=${skipped}`,
    );
  } finally {
    lock.release();
    await client.logout();
    console.log("[airbnb-inquiry] Disconnected ✓");
  }

  return inquiries.reverse();
}
