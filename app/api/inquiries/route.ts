import {
  fetchEmailInquiries,
  fetchBookingInquiries,
  fetchAirbnbInquiries,
} from "../../lib/services/email-inquiry.service";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    const visitorInquiries = await fetchEmailInquiries();
    const bookingInquiries = await fetchBookingInquiries();
    const airbnbInquiries = await fetchAirbnbInquiries();

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
