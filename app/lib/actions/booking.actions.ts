"use server";
import {
  CreateBookingSchema,
  UpdateBookingSchema,
} from "../schema/booking.schema";
import { DIContainer } from "../../core/DiContainer";

const { revalidatePath } = await import("next/cache");

import type { CalendarEventParams } from "../services/calendar.service";
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "../services/calendar.service";

export async function createBooking(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;

    // NOTE: Comission, prepayment amounts, etc. are NO LONGER extracted here.
    // The database triggers calculate them from the base fields (precio_total, channel).
    // Only raw data is passed to the schema.
    const booking = CreateBookingSchema.parse({
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_total_price_ars: formData.get("booking_total_price_ars"),
      guest_phone: formData.get("guest_phone"),
      noon: formData.get("noon") === "on",
      observations: formData.get("observations"),
    });

    const bookingId =
      await DIContainer.getBookingRepository().createBooking(booking);

    // CALENDAR INTEGRATION: Calculate derived values for the calendar event only.
    // These are NOT passed to the database; they are calculated by triggers.
    try {
      const isUSD = !!booking.booking_total_price_usd;
      const total = isUSD
        ? booking.booking_total_price_usd!
        : booking.booking_total_price_ars!;
      const pago = total * 0.30; // 30% deposit
      const faltaPagar = total - pago;

      const result = await createGoogleCalendarEvent({
        nombreCliente: booking.tenant_name,
        fechaCheckIn: booking.check_in,
        fechaCheckOut: booking.check_out,
        total,
        pago,
        faltaPagar,
        huespedes: booking.tenant_quantity,
        estado: "Confirmada",
        observations: booking.observations ?? null,
        medioDia: booking.noon!,
        currency: isUSD ? "USD" : "ARS",
        idBooking: bookingId,
      });

      // Persist eventId to DB
      if (result.eventId && bookingId) {
        await DIContainer.getBookingRepository().updateGoogleEventId(
          bookingId,
          result.eventId,
        );
      }
    } catch (calendarError) {
      console.error(
        "Error creating calendar event (booking created successfully):",
        calendarError,
      );
    }

    revalidatePath("/bookings/create");
    return { success: true, message: "Reserva creada exitosamente" };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al crear la reserva",
    };
  }
}

export async function updateBooking(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;
    const bookingId = Number(formData.get("id"));

    const oldBooking =
      await DIContainer.getBookingRepository().getBooking(bookingId);

    // NOTE: Comission, prepayment amounts, balance amounts are NO LONGER extracted.
    // The database triggers calculate them. Only raw data is passed to the schema.
    const booking = UpdateBookingSchema.parse({
      id: formData.get("id"),
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_total_price_ars: formData.get("booking_total_price_ars"),
      booking_state: formData.get("booking_state"),
      guest_phone: formData.get("guest_phone"),
      noon: formData.get("noon") === "on",
      observations: formData.get("observations"),
    });

    await DIContainer.getBookingRepository().updateBooking(booking);

    // CALENDAR INTEGRATION: Calculate derived values for the calendar event only.
    // These are NOT passed to the database; they are calculated by triggers.
    if (oldBooking) {
      try {
        const isUSD = !!booking.booking_total_price_usd;
        const total = isUSD
          ? booking.booking_total_price_usd!
          : booking.booking_total_price_ars!;
        const pago = total * 0.30; // 30% deposit
        const faltaPagar = total - pago;

        const calendarParams: CalendarEventParams = {
          nombreCliente: booking.tenant_name ?? oldBooking.guest_name,
          fechaCheckIn: booking.check_in ?? oldBooking.check_in,
          fechaCheckOut: booking.check_out ?? oldBooking.check_out,
          total,
          pago,
          faltaPagar,
          huespedes: booking.tenant_quantity ?? oldBooking.guest_count,
          estado: booking.booking_state ?? oldBooking.status,
          observations: booking.observations ?? null,
          medioDia: booking.noon ?? false,
          currency: isUSD ? "USD" : "ARS",
          idBooking: bookingId,
          googleEventId: oldBooking?.google_event_id,
        };

        await updateGoogleCalendarEvent(calendarParams);
      } catch (calendarError) {
        console.error(
          "Error al gestionar el evento de calendario (booking actualizado correctamente):",
          calendarError,
        );
      }
    }
    revalidatePath("/bookings/create");
    revalidatePath(`/bookings/${bookingId}/edit`);
    return { success: true, message: "Reserva actualizada exitosamente" };
  } catch (error) {
    console.error("Error updating booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al actualizar la reserva",
    };
  }
}

export async function deleteBooking(
  bookingId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the booking to retrieve google_event_id
    const booking = await DIContainer.getBookingRepository().getBooking(
      bookingId,
    );

    // Delete the Google Calendar event before deleting the booking
    try {
      if (booking?.google_event_id) {
        await deleteGoogleCalendarEvent(booking.google_event_id);
      }
    } catch (calendarError) {
      console.error(
        "Error eliminando evento de calendario (la reserva se eliminará igualmente):",
        calendarError,
      );
    }

    await DIContainer.getBookingRepository().deleteBooking(bookingId);
    revalidatePath("/bookings/create");

    return { success: true, message: "Reserva eliminada exitosamente" };
  } catch (error) {
    console.error("Error deleting booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al eliminar la reserva",
    };
  }
}
