import { fetchEmailInquiries } from "../../lib/services/email-inquiry.service";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    const inquiries = await fetchEmailInquiries();
    return NextResponse.json({ inquiries, count: inquiries.length });
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
