import { google } from "googleapis";

interface CreateEventParams {
  nombreCliente: string;
  emailCliente?: string;
  fechaCheckIn: string;
  fechaCheckOut: string;
  total: number;
  pago: number;
  faltaPagar: number;
  medioDia: boolean;
  currency: "USD" | "ARS";
  idBooking?: number;
}

export async function createGoogleCalendarEvent({
  nombreCliente,
  emailCliente,
  fechaCheckIn,
  fechaCheckOut,
  total,
  pago,
  faltaPagar,
  medioDia,
  currency,
  idBooking,
}: CreateEventParams) {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error(
        "GOOGLE_CALENDAR_ID is not defined in environment variables",
      );
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!clientEmail) {
      throw new Error(
        "GOOGLE_CLIENT_EMAIL is not defined in environment variables",
      );
    }

    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = `${fechaCheckIn}T12:00:00`;
    const endDateTime = medioDia
      ? `${fechaCheckOut}T18:00:00`
      : `${fechaCheckOut}T10:00:00`;

    const description = `<b>TOTAL</b>: $${total.toLocaleString(
      "es-AR",
    )} ${currency}\n<b>PAGÓ</b>: $${pago.toLocaleString(
      "es-AR",
    )} ${currency}\n<b>FALTA PAGAR</b>: $${faltaPagar.toLocaleString(
      "es-AR",
    )} ${currency}${medioDia ? "\n <b>OBS</b>: Pagó medio día" : ""}`;

    const event = {
      summary: `${nombreCliente}-${idBooking}`,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      attendees: emailCliente ? [{ email: emailCliente }] : undefined,
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    return { success: true, link: response.data.htmlLink };
  } catch (error: any) {
    console.error("Error creando evento en Google Calendar:", error);

    if (error.code === 404 || error.response?.status === 404) {
      try {
        const debugAuth = new google.auth.JWT({
          email: process.env.GOOGLE_CLIENT_EMAIL,
          key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          scopes: ["https://www.googleapis.com/auth/calendar"],
        });
        const calendar = google.calendar({ version: "v3", auth: debugAuth });
        const list = await calendar.calendarList.list();
        console.log(
          "DEBUG: Service Account has access to these calendars:",
          list.data.items?.map((c) => c.id),
        );
        console.log(
          "If your target calendar ID is not in this list, the Service Account cannot see it.",
        );
      } catch (listError) {
        console.error("Error trying to list calendars for debug:", listError);
      }
    }

    throw new Error(error.message || "Error creando evento");
  }
}

interface UpdateEventParams {
  oldBooking: {
    nombreCliente: string;
    fechaCheckIn: string | Date;
  };
  newBooking: CreateEventParams;
}

export async function updateGoogleCalendarEvent({
  newBooking,
}: UpdateEventParams) {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID missing");

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const listResponse = await calendar.events.list({
      calendarId,
      q: newBooking.idBooking?.toString(),
    });

    const events = listResponse.data.items || [];
    const eventToUpdate = events.find(
      (e) => e.summary && e.summary.endsWith(`-${newBooking.idBooking}`),
    );

    if (!eventToUpdate || !eventToUpdate.id) {
      return { success: false, message: "Event not found" };
    }

    const startDateTime = `${newBooking.fechaCheckIn}T12:00:00`;
    const endDateTime = newBooking.medioDia
      ? `${newBooking.fechaCheckOut}T18:00:00`
      : `${newBooking.fechaCheckOut}T10:00:00`;

    const description = `<b>TOTAL</b>: $${newBooking.total.toLocaleString(
      "es-AR",
    )} ${newBooking.currency}\n<b>PAGÓ</b>: $${newBooking.pago.toLocaleString(
      "es-AR",
    )} ${
      newBooking.currency
    }\n<b>FALTA PAGAR</b>: $${newBooking.faltaPagar.toLocaleString("es-AR")}${
      newBooking.currency
    }${newBooking.medioDia ? "\n<b>OBS</b>: Pagó medio día" : ""}`;

    const eventPatch = {
      summary: newBooking.nombreCliente,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      attendees: newBooking.emailCliente
        ? [{ email: newBooking.emailCliente }]
        : undefined,
    };

    const updateResponse = await calendar.events.patch({
      calendarId,
      eventId: eventToUpdate.id,
      requestBody: eventPatch,
    });

    return { success: true, link: updateResponse.data.htmlLink };
  } catch (error: any) {
    console.error("Error updating Google Calendar event:", error);
    return { success: false, error: error.message };
  }
}
