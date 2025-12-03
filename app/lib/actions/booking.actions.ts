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
} from "../services/calendar.service";

export async function createBooking(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;

    const comissionValue = formData.get("comission");

    const booking = CreateBookingSchema.parse({
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_total_price_ars: formData.get("booking_total_price_ars"),
      prepayment_usd: formData.get("prepayment_usd"),
      booking_state: "Confirmada",
      comission: comissionValue === null ? "" : comissionValue,
      prepayment_ars: formData.get("prepayment_ars"),
      guest_phone: formData.get("guest_phone"),
      noon: formData.get("noon") === "on",
    });

    await DIContainer.getBookingRepository().createBooking(booking);

    try {
      const isUSD = !!booking.booking_total_price_usd;
      const total = isUSD
        ? booking.booking_total_price_usd!
        : booking.booking_total_price_ars!;
      const pago = isUSD
        ? booking.prepayment_usd || 0
        : booking.prepayment_ars || 0;
      const faltaPagar = total - pago;

      await createGoogleCalendarEvent({
        nombreCliente: booking.tenant_name,
        fechaCheckIn: booking.check_in,
        fechaCheckOut: booking.check_out,
        total,
        pago,
        faltaPagar,
        medioDia: booking.noon!,
        currency: isUSD ? "USD" : "ARS",
      });
    } catch (calendarError) {
      console.error(
        "Error creating calendar event (booking created successfully):",
        calendarError
      );
    }

    revalidatePath("/");
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
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;
    const bookingId = Number(formData.get("id"));

    const oldBooking = await DIContainer.getBookingRepository().getBooking(
      bookingId
    );

    const comissionValue = formData.get("comission");
    const balancepaymentValue = formData.get("balancepayment_ars");

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
      comission: comissionValue === null ? "" : comissionValue,
      prepayment_ars: formData.get("prepayment_ars"),
      prepayment_usd: formData.get("prepayment_usd"),
      balancepayment_ars:
        balancepaymentValue === null ? "" : balancepaymentValue,
      balancepayment_usd: formData.get("balancepayment_usd"),
      guest_phone: formData.get("guest_phone"),
      noon: formData.get("noon") === "on",
    });

    await DIContainer.getBookingRepository().updateBooking(booking);

    if (oldBooking) {
      try {
        const isUSD = !!booking.booking_total_price_usd;
        const total = isUSD
          ? booking.booking_total_price_usd!
          : booking.booking_total_price_ars!;
        const pago = isUSD
          ? booking.prepayment_usd || 0
          : booking.prepayment_ars || 0;
        const faltaPagar = total - pago;

        await updateGoogleCalendarEvent({
          oldBooking: {
            nombreCliente: oldBooking.guest_name,
            fechaCheckIn: oldBooking.check_in,
          },
          newBooking: {
            nombreCliente: booking.tenant_name || oldBooking.guest_name,
            fechaCheckIn: booking.check_in || oldBooking.check_in,
            fechaCheckOut: booking.check_out || oldBooking.check_out,
            total,
            pago,
            faltaPagar,
            medioDia: booking.noon!,
            currency: isUSD ? "USD" : "ARS",
          },
        });
      } catch (calendarError) {
        console.error(
          "Error updating calendar event (booking updated successfully):",
          calendarError
        );
      }
    }

    revalidatePath("/");
    return { success: true, message: "Reserva actualizada exitosamente" };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al crear la reserva",
    };
  }
}

export async function deleteBooking(
  bookingId: number
): Promise<{ success: boolean; message: string }> {
  try {
    await DIContainer.getBookingRepository().deleteBooking(bookingId);
    revalidatePath("/");

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
