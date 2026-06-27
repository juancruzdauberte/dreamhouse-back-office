import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;
  const host = process.env.IMAP_HOST ?? "imap.gmail.com";

  if (!user || !pass) {
    return NextResponse.json({ error: "IMAP credentials not set" }, { status: 500 });
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
    const uids = (await client.search(
      { from: "automated@airbnb.com" },
      { uid: true },
    )) as number[];

    if (uids.length === 0) {
      return NextResponse.json({ found: 0, message: "No Airbnb emails" });
    }

    // Inspect last 10 emails, show ALL of them
    const sample = uids.slice(-10);
    const results: object[] = [];

    for await (const msg of client.fetch(
      sample,
      { source: true, envelope: true },
      { uid: true },
    )) {
      if (!msg.source) continue;

      const parsed = await simpleParser(msg.source);
      const text = parsed.text ?? "";
      const subject = typeof parsed.subject === "string" ? parsed.subject : "";
      const isRTB = text.toUpperCase().includes("RESPONDE A LA SOLICITUD DE");

      // Reproduce the two-pattern logic locally
      const rangePat =
        /(\d{1,2})\s*\u2013\s*(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[\s\u00A0]+(\d{4})/gi;
      const rm = rangePat.exec(subject + " " + text);
      const rangeResult = rm
        ? { raw: rm[0], d1: rm[1], d2: rm[2], mon: rm[3], year: rm[4], valid: parseInt(rm[1]) < parseInt(rm[2]) }
        : null;

      const combined = (subject + " " + text).replace(
        /[\u200B\u200C\u200D\u2009\u2013\u2014\uFEFF\u00AD]/g,
        " ",
      );
      const pat =
        /(\d{1,2})[\s\u00A0]+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?[\s\u00A0]+(\d{4})/gi;
      const datesFound: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = pat.exec(combined)) !== null) {
        datesFound.push(`"${m[0]}" → ${m[1]}/${m[2]}/${m[3]}`);
      }

      results.push({
        uid: msg.uid,
        subject: subject.slice(0, 100),
        isRTB,
        rangeResult,
        datesFound,
        // Only show body detail for RTB emails
        ...(isRTB && {
          subjectHex: Buffer.from(subject).toString("hex"),
          llegadaIdx: text.toLowerCase().indexOf("llegada"),
          bodySlice: text.slice(0, 500).replace(/\n/g, "↵"),
          combinedSlice: combined.slice(0, 300).replace(/\n/g, "↵"),
        }),
      });
    }

    return NextResponse.json({
      totalAirbnbEmails: uids.length,
      inspecting: sample.length,
      rtbCount: results.filter((r: any) => r.isRTB).length,
      results,
    });
  } finally {
    lock.release();
    await client.logout();
  }
}
