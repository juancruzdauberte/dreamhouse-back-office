import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    // List all calendars the service account has access to
    const response = await calendar.calendarList.list();

    return NextResponse.json({
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL,
      targetCalendarId: process.env.GOOGLE_CALENDAR_ID,
      accessibleCalendars:
        response.data.items?.map((c) => ({
          id: c.id,
          summary: c.summary,
          accessRole: c.accessRole,
        })) || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
