import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { VisitorInquiry } from "./inquiry.types";

export type { VisitorInquiry } from "./inquiry.types";

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
