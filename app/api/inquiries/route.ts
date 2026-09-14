import {
  fetchEmailInquiries,
  fetchBookingInquiries,
  fetchAirbnbInquiries,
} from "../../lib/services/email-inquiry.service";
import type {
  VisitorInquiry,
  BookingInquiry,
  AirbnbInquiry,
} from "../../lib/services/inquiry.types";
import { NextResponse } from "next/server";

// ── In-memory cache ────────────────────────────────────────────────────────

interface CacheEntry {
  visitorInquiries: VisitorInquiry[];
  bookingInquiries: BookingInquiry[];
  airbnbInquiries: AirbnbInquiry[];
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let inquiriesCache: CacheEntry | null = null;

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";

  if (!force && inquiriesCache && Date.now() < inquiriesCache.expiresAt) {
    const { visitorInquiries, bookingInquiries, airbnbInquiries } = inquiriesCache;
    return NextResponse.json({
      visitorInquiries,
      bookingInquiries,
      airbnbInquiries,
      count: visitorInquiries.length + bookingInquiries.length + airbnbInquiries.length,
    });
  }

  try {
    const [visitorInquiries, bookingInquiries, airbnbInquiries] =
      await Promise.all([
        fetchEmailInquiries(),
        fetchBookingInquiries(),
        fetchAirbnbInquiries(),
      ]);

    inquiriesCache = {
      visitorInquiries,
      bookingInquiries,
      airbnbInquiries,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json({
      visitorInquiries,
      bookingInquiries,
      airbnbInquiries,
      count:
        visitorInquiries.length +
        bookingInquiries.length +
        airbnbInquiries.length,
    });
  } catch (error) {
    console.error("[api/inquiries] IMAP error:", error);
    return NextResponse.json(
      {
        error:
          "No se pudo conectar al servidor de correo. Verificá las credenciales IMAP.",
      },
      { status: 500 },
    );
  }
}
