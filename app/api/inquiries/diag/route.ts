import { listRecentSubjects } from "../../../lib/services/email-inquiry.service";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    await listRecentSubjects(15);
    return NextResponse.json({
      ok: true,
      message: "Subjects logged to server console",
    });
  } catch (error) {
    console.error("[api/inquiries/diag]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
