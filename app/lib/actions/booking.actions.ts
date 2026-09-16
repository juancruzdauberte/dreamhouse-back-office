"use server";
import {
  CreateBookingSchema,
  UpdateBookingSchema,
} from "../schema/booking.schema";
import { DIContainer } from "../../core/DiContainer";

const { revalidatePath } = await import("next/cache");

import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "../services/calendar.service";
import { prepareCalendarEventParams } from "./booking.utils";

export async function createBooking(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;
    const booking = CreateBookingSchema.parse({
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_total_price_ars: formData.get("booking_total_price_ars"),
      deposit_amount_usd: formData.get("deposit_amount_usd"),
      deposit_amount_ars: formData.get("deposit_amount_ars"),
      guest_phone: formData.get("guest_phone"),
      noon: formData.get("noon") === "on",
      observations: formData.get("observations"),
      deposit_exchange_rate: formData.get("deposit_exchange_rate"),
    });

    const bookingId =
      await DIContainer.getBookingRepository().createBooking(booking);

    try {
      const calendarParams = prepareCalendarEventParams(booking, bookingId);
      const result = await createGoogleCalendarEvent(calendarParams);

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

    // NOTE: Deposit, balance, commission, etc. are calculated by database triggers.
    // We only send the input data.
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
      deposit_amount_usd: formData.get("deposit_amount_usd"),
      deposit_amount_ars: formData.get("deposit_amount_ars"),
      deposit_exchange_rate: formData.get("deposit_exchange_rate"),
      balance_exchange_rate: formData.get("balance_exchange_rate"),
      booking_state: formData.get("booking_state"),
      guest_phone: formData.get("guest_phone"),
      noon: formData.get("noon") === "on",
      observations: formData.get("observations"),
    });

    await DIContainer.getBookingRepository().updateBooking(booking);

    // CALENDAR INTEGRATION: Prepare event params using extracted utility function.
    // The calculation logic is shared with createBooking to avoid duplication.
    if (oldBooking) {
      try {
        const calendarParams = prepareCalendarEventParams(
          booking,
          bookingId,
          oldBooking,
        );
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
        error instanceof Error
          ? error.message
          : "Error al actualizar la reserva",
    };
  }
}

export async function deleteBooking(
  bookingId: number,
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the booking to retrieve google_event_id
    const booking =
      await DIContainer.getBookingRepository().getBooking(bookingId);

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
