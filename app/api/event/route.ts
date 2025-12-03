import { createGoogleCalendarEvent } from "../../lib/services/calendar.service";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fechaCheckIn,
      fechaCheckOut,
      nombreCliente,
      emailCliente,
      total,
      pago,
      faltaPagar,
      medioDia,
      currency,
    } = body;

    const result = await createGoogleCalendarEvent({
      nombreCliente,
      emailCliente,
      fechaCheckIn,
      fechaCheckOut,
      total,
      pago,
      faltaPagar,
      medioDia,
      currency,
    });
    console.log(result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error creando evento:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
