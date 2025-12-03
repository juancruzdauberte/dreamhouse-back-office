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
        "GOOGLE_CALENDAR_ID is not defined in environment variables"
      );
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!clientEmail) {
      throw new Error(
        "GOOGLE_CLIENT_EMAIL is not defined in environment variables"
      );
    }

    const calendar = google.calendar({ version: "v3", auth });

    const startDate = new Date(`${fechaCheckIn}T12:00:00`);
    const endDate = medioDia
      ? new Date(`${fechaCheckOut}T18:00:00`)
      : new Date(`${fechaCheckOut}T10:00:00`);

    const description = `<b>TOTAL</b>: $${total.toLocaleString(
      "es-AR"
    )} ${currency}\n<b>PAGÓ</b>: $${pago.toLocaleString(
      "es-AR"
    )} ${currency}\n<b>FALTA PAGAR</b>: $${faltaPagar.toLocaleString(
      "es-AR"
    )} ${currency}${medioDia && "\n <b>OBS</b>: Pagó medio día"}`;

    const event = {
      summary: `${nombreCliente}`,
      description: description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDate.toISOString(),
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
          list.data.items?.map((c) => c.id)
        );
        console.log(
          "If your target calendar ID is not in this list, the Service Account cannot see it."
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
  oldBooking,
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

    // 1. Search for the existing event
    // We search by date range (the original check-in date)
    let checkInDateStr: string;
    if (oldBooking.fechaCheckIn instanceof Date) {
      checkInDateStr = oldBooking.fechaCheckIn.toISOString().split("T")[0];
    } else {
      // Assuming it's a string, take the first part if it has T, or use as is
      checkInDateStr = String(oldBooking.fechaCheckIn).split("T")[0];
    }

    const timeMin = new Date(`${checkInDateStr}T00:00:00`).toISOString();
    const timeMax = new Date(`${checkInDateStr}T23:59:59`).toISOString();

    const listResponse = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
    });

    const events = listResponse.data.items || [];
    const eventToUpdate = events.find(
      (e) => e.summary === oldBooking.nombreCliente
    );

    if (!eventToUpdate || !eventToUpdate.id) {
      return { success: false, message: "Event not found" };
    }

    const startDate = new Date(`${newBooking.fechaCheckIn}T12:00:00`);
    const endDate = newBooking.medioDia
      ? new Date(`${newBooking.fechaCheckOut}T18:00:00`)
      : new Date(`${newBooking.fechaCheckOut}T10:00:00`);

    const description = `<b>TOTAL</b>: $${newBooking.total.toLocaleString(
      "es-AR"
    )} ${newBooking.currency}\n<b>PAGÓ</b>: $${newBooking.pago.toLocaleString(
      "es-AR"
    )} ${
      newBooking.currency
    }\n<b>FALTA PAGAR</b>: $${newBooking.faltaPagar.toLocaleString("es-AR")}${
      newBooking.currency
    }${newBooking.medioDia ? "\n<b>OBS</b>: Pagó medio día" : ""}${
      newBooking.emailCliente ? `\n\nEmail: ${newBooking.emailCliente}` : ""
    }`;

    const eventPatch = {
      summary: newBooking.nombreCliente,
      description: description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      attendees: newBooking.emailCliente
        ? [{ email: newBooking.emailCliente }]
        : undefined,
    };

    // 3. Update the event
    const updateResponse = await calendar.events.patch({
      calendarId,
      eventId: eventToUpdate.id,
      requestBody: eventPatch,
    });

    return { success: true, link: updateResponse.data.htmlLink };
  } catch (error: any) {
    console.error("Error updating Google Calendar event:", error);
    // Don't throw, just return success: false so we don't break the booking update
    return { success: false, error: error.message };
  }
}
